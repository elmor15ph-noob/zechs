"""Altron Digest Agent — generates the weekly EXPORT-FOR-DYCE.md cross-brain digest."""

from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime, timedelta
import json
import time
import re
import logging

from .agent_base import BaseAgent

log = logging.getLogger("altron_digest")

_REDACT_PATTERNS = [
    re.compile(r'(api[_-]?key|secret|password|token)\s*[:=]\s*\S+', re.IGNORECASE),
    re.compile(r'sk-[A-Za-z0-9]{20,}'),
    re.compile(r'AIza[0-9A-Za-z\-_]{35}'),
]

_ALTRON_SYSTEM = """You are Altron, the communicator and synthesizer of the Duo brain. \
Your job right now is to write the weekly digest for Dyce — the corporate VM brain. \
Dyce is CLI-only, has near-unlimited corp LLM tokens, and the Dyce team (Leo, Donny, Raph, Micky) \
reads this digest to understand what Duo has been doing and whether any of it is useful or actionable for them.

Write in Altron's voice: clear, honest, structured, no spin. \
Audience: smart engineers with SAP/enterprise context who don't have Duo's full context. \
Format: Markdown. Sections listed below. \
Be concise — this digest should be readable in under 5 minutes. \
Do NOT include API keys, passwords, or raw credentials. \
Do NOT exceed 600 words total."""

_DIGEST_PROMPT_TEMPLATE = """## Context for this week's digest

### GLIDEPATH Status
{glidepath_excerpt}

### Recent Vault Activity (last 7 days — {note_count} notes)
{notes_excerpt}

### Agent Decision Log (last 7 days — {decision_count} entries)
{decisions_excerpt}

---

Write the EXPORT-FOR-DYCE.md digest with these exact sections:

## 1. Phase Status
What phase are we in? What shipped? What's blocked?

## 2. Decisions This Week
Key decisions made, with brief reasoning. Only decisions that might matter to Dyce.

## 3. Agent Activity
What did the autonomous agents do this week? (Inbox Distiller, Synthesis, SAP Crawler)

## 4. Insights Worth Sharing
1-3 insights from Duo's work that Dyce could act on or find useful.

## 5. Asks from Duo
Anything Duo needs from Dyce this week (deep reasoning via corp LLM, validation, etc.). \
If nothing, say "No asks this week."

Be honest. Be brief. Think like Altron."""


class AltronDigestAgent(BaseAgent):
    """Generates the weekly EXPORT-FOR-DYCE.md cross-brain digest."""

    DUO_AGENTS = ["inbox", "synthesis", "sap-crawler"]

    def __init__(self, vault_path: Path, llm_provider):
        super().__init__(vault_path, llm_provider)
        self._log_file = self.lancedb_dir / "altron-digest-decisions.jsonl"
        self.export_path = self.vault_path / "EXPORT-FOR-DYCE.md"

    def get_log_file(self) -> Path:
        return self._log_file

    def run(self) -> Dict[str, Any]:
        self.assert_enabled()
        return self.generate_digest()

    # ── Public ──────────────────────────────────────────────────────────────

    def generate_digest(self) -> Dict[str, Any]:
        """Generate the weekly digest and write EXPORT-FOR-DYCE.md."""
        self.start_timer()
        t0 = time.time()
        log.info("Altron digest starting")

        glidepath_excerpt = self._read_glidepath_excerpt()
        notes_excerpt, note_count = self._read_recent_notes(days=7, max_notes=10)
        decisions_excerpt, decision_count = self._read_recent_decisions(days=7, max_entries=20)

        prompt = _DIGEST_PROMPT_TEMPLATE.format(
            glidepath_excerpt=glidepath_excerpt,
            note_count=note_count,
            notes_excerpt=notes_excerpt,
            decision_count=decision_count,
            decisions_excerpt=decisions_excerpt,
        )

        try:
            llm_response = self._call_llm(prompt)
        except Exception as e:
            log.error("LLM call failed: %s", e)
            llm_response = self._fallback_digest(note_count, decision_count)

        digest_md = self._wrap_digest(llm_response)
        digest_md = self._redact(digest_md)
        self._write_export(digest_md)

        latency = time.time() - t0
        cost_usd = 0.0
        try:
            from llm.costs import estimate_tokens, calculate_cost, get_provider_type
            tokens = estimate_tokens(prompt + llm_response)
            model = getattr(self.llm, "model", "unknown")
            cost_usd = calculate_cost(tokens, tokens // 3, get_provider_type(model), model)
        except Exception:
            pass

        self.log_decision(
            decision={
                "action": "altron_digest",
                "file": str(self.export_path),
                "words": len(digest_md.split()),
                "cost_usd": cost_usd,
            },
            input_data={"days": 7, "note_count": note_count, "decision_count": decision_count},
            latency=latency,
        )

        log.info("Altron digest written to %s (%.1fs)", self.export_path, latency)
        return {
            "status": "success",
            "file": str(self.export_path),
            "note_count": note_count,
            "decision_count": decision_count,
            "words": len(digest_md.split()),
            "latency_s": round(latency, 2),
        }

    # ── Private helpers ──────────────────────────────────────────────────────

    def _read_glidepath_excerpt(self) -> str:
        glidepath = self.vault_path / "02-Areas" / "GLIDEPATH-Autonomous-Knowledge-System.md"
        if not glidepath.exists():
            return "GLIDEPATH not found."
        text = glidepath.read_text(encoding="utf-8", errors="replace")
        # Extract just the Current Status table and last 2 completed phases
        lines = text.splitlines()
        excerpt_lines: List[str] = []
        in_status = False
        for line in lines:
            if "## 📊 Current Status" in line:
                in_status = True
            if in_status:
                excerpt_lines.append(line)
                if len(excerpt_lines) > 20:
                    break
        if not excerpt_lines:
            # Fallback: first 30 lines
            excerpt_lines = lines[:30]
        return "\n".join(excerpt_lines)[:2000]

    def _read_recent_notes(self, days: int = 7, max_notes: int = 10):
        cutoff = datetime.now() - timedelta(days=days)
        recent: List[tuple] = []
        for folder in ["00-Inbox", "01-Projects", "02-Areas"]:
            folder_path = self.vault_path / folder
            if not folder_path.exists():
                continue
            for md in folder_path.rglob("*.md"):
                try:
                    mtime = datetime.fromtimestamp(md.stat().st_mtime)
                    if mtime >= cutoff:
                        recent.append((mtime, md))
                except OSError:
                    continue

        recent.sort(key=lambda x: x[0], reverse=True)
        recent = recent[:max_notes]

        if not recent:
            return "No vault notes modified in the last 7 days.", 0

        lines: List[str] = []
        for mtime, path in recent:
            rel = path.relative_to(self.vault_path)
            # First heading or first non-empty line as title
            title = path.stem
            try:
                for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
                    line = line.strip()
                    if line.startswith("#"):
                        title = line.lstrip("#").strip()
                        break
                    if line:
                        title = line[:80]
                        break
            except OSError:
                pass
            lines.append(f"- [{mtime.strftime('%m-%d')}] {rel} — {title}")

        return "\n".join(lines), len(recent)

    def _read_recent_decisions(self, days: int = 7, max_entries: int = 20):
        cutoff = datetime.now() - timedelta(days=days)
        entries: List[Dict] = []

        for agent_name in self.DUO_AGENTS:
            log_file = self.lancedb_dir / f"{agent_name}-decisions.jsonl"
            if not log_file.exists():
                continue
            try:
                with open(log_file, encoding="utf-8", errors="replace") as f:
                    for line in f:
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            entry = json.loads(line)
                            ts_str = entry.get("timestamp", "")
                            ts = datetime.fromisoformat(ts_str[:19]) if ts_str else None
                            if ts and ts >= cutoff:
                                entries.append({
                                    "agent": entry.get("agent", agent_name),
                                    "action": entry.get("action", ""),
                                    "decision": entry.get("decision", ""),
                                    "cost_usd": entry.get("cost_usd", 0.0),
                                    "timestamp": ts_str[:10],
                                })
                        except (json.JSONDecodeError, ValueError):
                            continue
            except OSError:
                continue

        entries = entries[-max_entries:]
        if not entries:
            return "No agent decisions logged in the last 7 days.", 0

        lines: List[str] = []
        for e in entries:
            action = e["action"].replace("_", " ")
            cost = f"${e['cost_usd']:.4f}" if e["cost_usd"] else "$0"
            lines.append(f"- [{e['timestamp']}] {e['agent']} › {action} ({e['decision']}, {cost})")

        return "\n".join(lines), len(entries)

    def _call_llm(self, prompt: str) -> str:
        messages = [
            {"role": "user", "content": f"{_ALTRON_SYSTEM}\n\n{prompt}"},
        ]
        if hasattr(self.llm, "chat"):
            response = self.llm.chat(messages)
        elif hasattr(self.llm, "generate"):
            response = self.llm.generate(prompt=f"{_ALTRON_SYSTEM}\n\n{prompt}")
        else:
            raise RuntimeError("LLM provider has no chat() or generate() method")

        if isinstance(response, dict):
            return response.get("content") or response.get("text") or str(response)
        return str(response)

    def _fallback_digest(self, note_count: int, decision_count: int) -> str:
        return f"""## 1. Phase Status
Phase 4 — Observability. LLM unavailable for digest generation this week.

## 2. Decisions This Week
Unable to retrieve — LLM offline.

## 3. Agent Activity
{note_count} vault notes modified. {decision_count} agent decisions logged. See decision logs for details.

## 4. Insights Worth Sharing
Digest generation failed this week. Check Duo backend logs.

## 5. Asks from Duo
No asks this week (digest fallback mode)."""

    def _wrap_digest(self, body: str) -> str:
        now = datetime.now()
        week = now.isocalendar()[1]
        return f"""---
type: export
title: "Altron Weekly Digest — Week {week:02d}, {now.year}"
created: {now.strftime('%Y-%m-%d')}
generated_by: altron
audience: dyce
status: current
---

# 📡 EXPORT-FOR-DYCE — Weekly Digest

> Generated by **Altron** | {now.strftime('%Y-%m-%d %H:%M')} | Duo brain → Dyce brain
> Read time: ~3 min | [Dyce: no action needed unless noted in §5]

---

{body.strip()}

---

*Next digest: Sunday. To request earlier: ask Duo to run `/agents/altron/digest`.*
*To send a query back to Duo via reverse oracle: document it in Dyce session notes and flag in next week's Dyce → Duo sync.*
"""

    def _redact(self, text: str) -> str:
        for pattern in _REDACT_PATTERNS:
            text = pattern.sub(r'\1: [REDACTED]', text)
        return text

    def _write_export(self, content: str) -> None:
        self.export_path.write_text(content, encoding="utf-8")
        log.info("Wrote %d chars to %s", len(content), self.export_path)
