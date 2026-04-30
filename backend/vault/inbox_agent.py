"""Inbox Distiller Agent - autonomously processes inbox items into proposals."""

from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import re
import time
from llm.costs import estimate_tokens, calculate_cost, get_provider_from_model, get_provider_type
from .agent_base import BaseAgent


class InboxDistiller(BaseAgent):
    """Distills inbox items into organized proposals using hybrid search + LLM."""

    def __init__(self, vault_path: Path, llm_provider, indexer):
        """
        Initialize Inbox Distiller.

        Args:
            vault_path: Path to vault directory
            llm_provider: LLM provider (e.g., from get_llm_provider())
            indexer: VaultIndexer instance for hybrid search
        """
        super().__init__(vault_path, llm_provider)
        self.indexer = indexer
        self._log_file = self.lancedb_dir / "inbox-agent-decisions.jsonl"

    def get_log_file(self) -> Path:
        """Get the path to the inbox distiller log file."""
        return self._log_file

    def run(self) -> Dict[str, Any]:
        self.assert_enabled()
        """Run the inbox distiller (alias for distill_items)."""
        return self.distill_items()

    def distill_items(self, max_items: int = 10, auto_accept: bool = True) -> Dict[str, Any]:
        """
        Read inbox items, analyze with LLM, auto-accept and move to folders.

        Args:
            max_items: Maximum number of inbox items to process
            auto_accept: If True, move files to suggested folders. If False, write proposals.

        Returns:
            Dict with status, count of processed items, and results
        """
        self.start_timer()  # Start latency tracking

        # 1. Read inbox items
        inbox_items = self._read_inbox_items(max_items)

        if not inbox_items:
            return {
                "status": "success",
                "message": "No inbox items to distill",
                "processed": 0,
                "distilled": [],
                "accepted": 0
            }

        # 2. For each item, distill
        distilled = []
        accepted_count = 0
        total_cost = 0.0

        for item in inbox_items:
            item_start_time = time.time()  # Track per-item latency
            result = self._distill_single_item(item)
            item_latency = time.time() - item_start_time
            distilled.append(result)

            if auto_accept:
                # Auto-accept: move file to suggested folder
                moved = self._accept_and_move(item, result)
                if moved:
                    accepted_count += 1
            else:
                # Manual review: write proposal
                self._write_proposal(item, result)

            # Estimate cost
            item_cost = result.get("cost_usd", 0.0)
            total_cost += item_cost

            # Log decision with enhanced schema via BaseAgent
            print(f"[InboxDistiller] Calling BaseAgent.log_decision for {item['filename']}")
            self.log_decision(
                decision=result,
                input_data={
                    "filename": item["filename"],
                    "body_length": len(item.get("body", "")),
                    "word_count": len(item.get("body", "").split())
                },
                latency=item_latency,
                error=None if not result.get("parse_error") else result.get("error_reason")
            )

        return {
            "status": "success",
            "processed": len(distilled),
            "accepted": accepted_count if auto_accept else 0,
            "distilled": distilled
        }

    def _read_inbox_items(self, max_items: int) -> List[Dict[str, str]]:
        """
        Read items from 00-Inbox/ (excluding _proposed/ folder).

        Args:
            max_items: Max number of items to read

        Returns:
            List of note dicts with path, filename, body
        """
        inbox_dir = self.vault_path / "00-Inbox"

        if not inbox_dir.exists():
            return []

        items = []

        # Scan all markdown files in 00-Inbox
        for md_file in inbox_dir.rglob("*.md"):
            # Skip _proposed folder
            if "_proposed" in str(md_file):
                continue

            # Skip hidden files
            if md_file.name.startswith("."):
                continue

            try:
                with open(md_file, "r", encoding="utf-8") as f:
                    content = f.read()

                items.append({
                    "path": str(md_file.relative_to(self.vault_path)),
                    "filename": md_file.stem,
                    "body": content
                })
            except Exception as e:
                print(f"[InboxDistiller] Error reading {md_file}: {e}")

        return items[:max_items]

    def _distill_single_item(self, item: Dict[str, str]) -> Dict[str, Any]:
        """
        Analyze one item with LLM, get routing + summary.

        Args:
            item: Dict with filename, body, path

        Returns:
            Dict with summary, folder, reason, tags, actions, related_notes, priority
        """
        # 1. Hybrid search for context (top 3 relevant notes)
        query_text = item["body"][:200]  # First 200 chars as query

        try:
            context_notes = self.indexer.search_hybrid(query_text, limit=3)
        except Exception as e:
            print(f"[InboxDistiller] Hybrid search failed for {item['filename']}: {e}")
            context_notes = []

        context_text = ""
        if context_notes:
            context_parts = []
            for note in context_notes:
                preview = note.get("preview", note.get("body", ""))[:300]
                context_parts.append(f"## {note.get('filename', 'Unknown')}\n{preview}")
            context_text = "\n---\n".join(context_parts)

        # 2. Build prompt with Phase 5 few-shot examples
        prompt = f"""You are an expert knowledge organizer using PARA methodology (Projects, Areas, Resources, Archives).

## CRITICAL RULES
1. Return ONLY valid JSON — no markdown, no explanation
2. DECIDE: Is this ACTIVE PROJECT (deadline/scope) → 01-Projects, or ONGOING AREA → 02-Areas?
3. Use 2+ domain tags: sap, o2c, architecture, synthesis, phase-X, decision, pattern, practice

## EXAMPLES OF CORRECT DISTILLATIONS
✅ Item about "DUO Phase 5 implementation" → folder: 01-Projects, tags: ["phase-5", "learning"], priority: HIGH
✅ Item about "SAP O2C patterns" → folder: 02-Areas, tags: ["sap", "o2c-practice"], priority: MEDIUM
❌ Item about "Project X" routed to 02-Areas → WRONG (should be 01-Projects)

Related vault context:
{context_text if context_text else "(No related notes found)"}

Inbox item to distill:
Title: {item['filename']}
Content: {item['body'][:500]}

Analyze and return ONLY valid JSON:
{{
  "summary": "actionable summary (1-2 sentences)",
  "folder": "01-Projects|02-Areas|03-Resources|04-Archive",
  "reason": "why this folder (e.g. 'active project with deadline' or 'ongoing area of responsibility')",
  "tags": ["tag1", "tag2"],
  "action_items": ["action1", "action2"],
  "related_notes": ["filename1", "filename2"],
  "priority": "HIGH|MEDIUM|LOW"
}}"""

        # 3. Call LLM (deterministic, low temp)
        response = ""
        input_tokens = 0
        output_tokens = 0

        try:
            # Estimate input tokens
            system = "You are a PARA knowledge organizer. Return ONLY valid JSON, no markdown or explanation."
            input_tokens = estimate_tokens(prompt + system)

            response = self.llm.query(
                prompt,
                system=system,
                temperature=0.5,
                max_tokens=1000
            )

            # DEBUG: Log the response
            print(f"[InboxDistiller] LLM Response for {item['filename']}: {response[:200] if response else 'EMPTY'}")
            print(f"[InboxDistiller] LLM Provider: {self.llm.get_model_name()}")

            # Estimate output tokens
            output_tokens = estimate_tokens(response)
        except Exception as e:
            print(f"[InboxDistiller] LLM call failed for {item['filename']}: {e}")
            import traceback
            traceback.print_exc()
            response = ""

        # 4. Parse response
        result = self._parse_llm_response(response)

        # 5. Calculate cost
        model_name = self.llm.get_model_name()
        cost = calculate_cost(model_name, input_tokens, output_tokens)
        result["cost_usd"] = cost
        result["tokens"] = {"input": input_tokens, "output": output_tokens}

        return result

    def _parse_llm_response(self, response: str) -> Dict[str, Any]:
        """
        Parse LLM JSON response, fallback gracefully on parse errors.

        Args:
            response: Raw LLM response text

        Returns:
            Parsed JSON dict or fallback dict
        """
        if not response:
            return self._fallback_result("LLM returned empty response")

        # Try to extract JSON from response (in case it has markdown wrapping)
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
        else:
            json_str = response

        try:
            result = json.loads(json_str)
            # Validate required fields
            required = ["summary", "folder", "reason", "tags", "action_items", "related_notes", "priority"]
            if not all(k in result for k in required):
                return self._fallback_result("Missing required fields in LLM response")
            return result
        except json.JSONDecodeError as e:
            print(f"[InboxDistiller] JSON parse error: {e}")
            return self._fallback_result(f"JSON parse failed: {str(e)}")

    def _fallback_result(self, error_reason: str) -> Dict[str, Any]:
        """Return a safe default result when LLM parsing fails."""
        return {
            "summary": "Requires manual review - parsing failed",
            "folder": "02-Areas",
            "reason": "Default to Areas for review",
            "tags": ["inbox", "review-required"],
            "action_items": ["Review this item manually"],
            "related_notes": [],
            "priority": "MEDIUM",
            "parse_error": True,
            "error_reason": error_reason
        }

    def _write_proposal(self, item: Dict[str, str], result: Dict[str, Any]) -> None:
        """
        Write distilled proposal to 00-Inbox/_proposed/.

        Args:
            item: Original inbox item
            result: Distilled analysis result
        """
        proposed_dir = self.vault_path / "00-Inbox" / "_proposed"
        proposed_dir.mkdir(parents=True, exist_ok=True)

        # Create filename from summary (slugified)
        slug = result["summary"][:50].lower().replace(" ", "-").replace("/", "-")
        slug = re.sub(r'[^a-z0-9\-]', '', slug)
        filename = f"{slug}.md"
        filepath = proposed_dir / filename

        # Format tags and action items for YAML
        tags_str = str(result.get("tags", []))
        action_items_str = str(result.get("action_items", []))
        related_notes_str = str(result.get("related_notes", []))

        # Build markdown with frontmatter
        actions_list = "\n".join(f"- {action}" for action in result.get("action_items", []))
        related_list = "\n".join(f"- [[{note}]]" for note in result.get("related_notes", []))

        content = f"""---
type: distilled-inbox
source: {item['filename']}
folder: {result['folder']}
reason: {result['reason']}
priority: {result['priority']}
tags: {tags_str}
related_notes: {related_notes_str}
action_items: {action_items_str}
created: {datetime.now().strftime('%Y-%m-%d')}
---

# {result['summary']}

## Source
[[{item['filename']}]]

## Suggested Folder
`{result['folder']}`

**Why:** {result['reason']}

## Priority
**{result['priority']}**

## Action Items
{actions_list if actions_list else "- Review and prioritize"}

## Related Vault Notes
{related_list if related_list else "- (no related notes found)"}

## Original Content
{item['body']}
"""

        try:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"[InboxDistiller] Proposal written: {filepath.name}")
        except Exception as e:
            print(f"[InboxDistiller] Failed to write proposal: {e}")

    def _accept_and_move(self, item: Dict[str, str], result: Dict[str, Any]) -> bool:
        """
        Auto-accept proposal: move item to suggested folder.

        Args:
            item: Original inbox item
            result: Distilled analysis result

        Returns:
            True if move successful, False otherwise
        """
        try:
            # Parse folder suggestion (e.g., "01-Projects" or "02-Areas")
            folder = result.get("folder", "02-Areas")

            # Map folder code to actual path
            folder_map = {
                "01-Projects": "01-Projects",
                "02-Areas": "02-Areas",
                "03-Resources": "03-Resources",
                "04-Archive": "04-Archive"
            }

            folder_name = folder_map.get(folder, "02-Areas")
            target_dir = self.vault_path / folder_name
            target_dir.mkdir(exist_ok=True)

            # Get source file path
            source_path = Path(item["path"])
            if not source_path.is_absolute():
                source_path = self.vault_path / item["path"]

            # Create target path (preserve filename)
            target_path = target_dir / source_path.name

            # Move file
            if source_path.exists():
                source_path.rename(target_path)
                print(f"[InboxDistiller] Moved: {source_path.name} → {folder_name}/")
                return True
            else:
                print(f"[InboxDistiller] Source not found: {source_path}")
                return False

        except Exception as e:
            print(f"[InboxDistiller] Failed to move file: {e}")
            return False

