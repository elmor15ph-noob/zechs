"""Weekly Synthesis Agent — discovers cross-domain patterns in vault."""

from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import re
import time
from llm.costs import estimate_tokens, calculate_cost, get_provider_from_model, get_provider_type
from .agent_base import BaseAgent


class WeeklySynthesisAgent(BaseAgent):
    """Synthesizes vault patterns into weekly insights."""

    def __init__(self, vault_path: Path, llm_provider, graph_path: Path):
        """
        Initialize synthesis agent.

        Args:
            vault_path: Path to vault directory
            llm_provider: LLM provider instance
            graph_path: Path to graph.json
        """
        super().__init__(vault_path, llm_provider)
        self.graph_path = Path(graph_path)
        self.graph = self._load_graph()
        self._log_file = self.lancedb_dir / "synthesis-decisions.jsonl"

    def get_log_file(self) -> Path:
        """Get the path to the synthesis agent log file."""
        return self._log_file

    def run(self) -> Dict[str, Any]:
        self.assert_enabled()
        """Run the synthesis agent (alias for synthesize_weekly)."""
        return self.synthesize_weekly()

    def synthesize_weekly(self) -> Dict[str, Any]:
        """
        Generate weekly synthesis from graph patterns.

        Returns:
            Dict with status, week, patterns_found, and file_written flag
        """
        self.start_timer()  # Start latency tracking
        synthesis_start = time.time()

        if not self.graph:
            return {
                "status": "error",
                "message": "Graph not loaded",
                "processed": 0
            }

        # 1. Analyze graph for cross-domain patterns
        patterns = self._find_cross_domain_patterns()

        if not patterns:
            return {
                "status": "success",
                "message": "No cross-domain patterns found",
                "patterns_found": 0
            }

        # 2. Load previous synthesis for context
        prev_synthesis = self._load_previous_synthesis()

        # 3. Call LLM to synthesize patterns
        synthesis = self._generate_synthesis(patterns, prev_synthesis)

        # 4. Write synthesis note
        try:
            file_path = self._write_synthesis_note(synthesis)
        except Exception as e:
            print(f"[Synthesis] Failed to write note: {e}")
            file_path = None

        # 5. Log decision with enhanced schema via BaseAgent
        synthesis_latency = time.time() - synthesis_start
        input_data = {
            "node_count": len(self.graph.get("nodes", [])),
            "edge_count": len(self.graph.get("edges", [])),
            "patterns_analyzed": len(patterns)
        }
        self.log_decision(
            decision=synthesis,
            input_data=input_data,
            latency=synthesis_latency,
            error=None if file_path else "Failed to write synthesis note"
        )

        return {
            "status": "success",
            "week": synthesis.get("synthesis_date"),
            "patterns_found": len(synthesis.get("patterns", [])),
            "file_written": file_path is not None,
            "synthesis": synthesis
        }

    def _load_graph(self) -> Optional[Dict[str, Any]]:
        """Load and parse graph.json."""
        if not self.graph_path.exists():
            print(f"[Synthesis] Graph not found: {self.graph_path}")
            return None

        try:
            with open(self.graph_path, "r", encoding="utf-8") as f:
                raw_graph = json.load(f)

            # Compute basic metrics
            nodes = raw_graph.get("nodes", [])
            edges = raw_graph.get("edges", [])
            raw_communities = raw_graph.get("communities", [])

            # Build degree map (simple centrality)
            degree_map = {}
            for edge in edges:
                src = edge.get("source")
                tgt = edge.get("target")
                degree_map[src] = degree_map.get(src, 0) + 1
                degree_map[tgt] = degree_map.get(tgt, 0) + 1

            # Build node->communities map
            node_communities = {}
            for community in raw_communities:
                comm_id = community.get("id")
                for node_id in community.get("nodes", []):
                    if node_id not in node_communities:
                        node_communities[node_id] = []
                    node_communities[node_id].append(comm_id)

            # Sort by degree
            top_nodes = sorted(degree_map.items(), key=lambda x: x[1], reverse=True)[:10]

            return {
                "nodes": nodes,
                "edges": edges,
                "node_count": len(nodes),
                "edge_count": len(edges),
                "degree_map": degree_map,
                "top_nodes": top_nodes,
                "communities": raw_communities,
                "node_communities": node_communities
            }
        except Exception as e:
            print(f"[Synthesis] Error loading graph: {e}")
            return None

    def _find_cross_domain_patterns(self) -> List[Dict[str, Any]]:
        """
        Identify cross-domain connections via bridge nodes.

        Returns:
            List of pattern dicts with bridge_node, degree, connected_communities
        """
        if not self.graph:
            return []

        patterns = []
        degree_map = self.graph.get("degree_map", {})
        top_nodes = self.graph.get("top_nodes", [])
        node_communities = self.graph.get("node_communities", {})

        # Top nodes = likely bridges
        for node_id, degree in top_nodes:
            # Find communities this node belongs to
            communities = node_communities.get(node_id, [])

            # Bridge nodes span multiple communities OR have high degree (hub nodes)
            if len(communities) > 1 or degree > 40:
                patterns.append({
                    "bridge_node": node_id,
                    "degree": degree,
                    "connected_communities": communities if communities else ["primary"],
                    "importance": "high" if degree > 50 else "medium"
                })

        return patterns[:5]  # Top 5 patterns

    def _generate_synthesis(
        self,
        patterns: List[Dict[str, Any]],
        prev_synthesis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Call LLM to synthesize patterns into insights.

        Args:
            patterns: List of cross-domain patterns found
            prev_synthesis: Previous week's synthesis for context

        Returns:
            Synthesis dict with patterns and key_learning
        """
        # Build graph summary for LLM
        graph_summary = f"""Vault Graph Summary:
- {self.graph.get('node_count', 0)} notes
- {self.graph.get('edge_count', 0)} connections
- {len(self.graph.get('communities', []))} domains

Top Bridge Nodes (connecting multiple domains):
"""

        for p in patterns:
            communities_str = ', '.join(str(c) for c in p['connected_communities'])
            graph_summary += f"\n- {p['bridge_node']} (degree: {p['degree']}, communities: {communities_str})"

        # Build prompt
        prompt = f"""You are a knowledge synthesis expert analyzing vault patterns.

{graph_summary}

Previous week's key insight:
{prev_synthesis.get('key_learning', 'No prior synthesis. This is the first week.')}

Your task:
1. Identify 3 surprising cross-domain connections from the bridge nodes above
2. For each connection:
   - Name it (1-2 words)
   - Explain why it matters (1-2 sentences)
   - Guess which notes are involved (2-3 note names)
   - Rate confidence: HIGH, MED, or LOW
   - Suggest what to do with this insight

Format: Return ONLY valid JSON (no markdown, no explanation):
{{
  "synthesis_date": "2026-W{datetime.now().isocalendar()[1]:02d}",
  "patterns": [
    {{
      "title": "connection title",
      "description": "why this matters",
      "domains": ["domain1", "domain2"],
      "source_notes": ["note1", "note2"],
      "confidence": "HIGH|MED|LOW",
      "actionable_insight": "what to do"
    }}
  ],
  "key_learning": "one sentence: what changed this week"
}}"""

        input_tokens = 0
        output_tokens = 0
        cost = 0.0

        try:
            system = "You are a vault knowledge synthesizer. Return ONLY valid JSON."
            input_tokens = estimate_tokens(prompt + system)

            response = self.llm.query(
                prompt,
                system=system,
                temperature=0.6,
                max_tokens=2000
            )

            output_tokens = estimate_tokens(response)
            model_name = self.llm.get_model_name()
            cost = calculate_cost(model_name, input_tokens, output_tokens)

            # Extract and parse JSON
            result = self._parse_synthesis_response(response)
            result["cost_usd"] = cost
            result["tokens"] = {"input": input_tokens, "output": output_tokens}
            return result
        except Exception as e:
            print(f"[Synthesis] LLM call failed: {e}")
            result = self._fallback_synthesis(patterns)
            result["cost_usd"] = cost
            result["tokens"] = {"input": input_tokens, "output": output_tokens}
            return result

    def _parse_synthesis_response(self, response: str) -> Dict[str, Any]:
        """Parse LLM JSON response with fallback."""
        if not response:
            return {"synthesis_date": f"2026-W{datetime.now().isocalendar()[1]:02d}", "patterns": []}

        # Try to extract JSON
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
        else:
            json_str = response

        try:
            result = json.loads(json_str)
            # Validate required fields
            if "patterns" in result and "synthesis_date" in result:
                return result
        except json.JSONDecodeError:
            pass

        return self._fallback_synthesis([])

    def _fallback_synthesis(self, patterns: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Return safe default when LLM parsing fails."""
        week = f"2026-W{datetime.now().isocalendar()[1]:02d}"
        default_patterns = [
            {
                "title": f"Pattern {i+1}: {p['bridge_node']}",
                "description": f"Key node spanning {len(p['connected_communities'])} domains",
                "domains": p["connected_communities"],
                "source_notes": [p["bridge_node"]],
                "confidence": "MED",
                "actionable_insight": "Review connection manually"
            }
            for i, p in enumerate(patterns[:3])
        ]

        return {
            "synthesis_date": week,
            "patterns": default_patterns or [
                {
                    "title": "No patterns detected",
                    "description": "Graph analysis found no clear cross-domain connections this week",
                    "domains": [],
                    "source_notes": [],
                    "confidence": "LOW",
                    "actionable_insight": "Check vault for new content"
                }
            ],
            "key_learning": "Review vault graph for emerging patterns"
        }

    def _write_synthesis_note(self, synthesis: Dict[str, Any]) -> Optional[Path]:
        """
        Write synthesis to 02-Areas/Synthesis/Weekly-Synthesis-YYYY-WXX.md

        Args:
            synthesis: Synthesis dict from LLM

        Returns:
            Path to written file, or None on error
        """
        synthesis_dir = self.vault_path / "02-Areas" / "Synthesis"
        synthesis_dir.mkdir(parents=True, exist_ok=True)

        week = synthesis.get("synthesis_date", f"2026-W{datetime.now().isocalendar()[1]:02d}")
        filename = f"Weekly-Synthesis-{week}.md"
        filepath = synthesis_dir / filename

        # Build patterns section
        patterns_md = ""
        for i, p in enumerate(synthesis.get("patterns", []), 1):
            domains = p.get('domains', [])
            domains_str = ', '.join(str(d) for d in domains) if domains else "N/A"

            patterns_md += f"""### {i}. {p.get('title', 'Pattern')}

{p.get('description', '')}

**Confidence:** {p.get('confidence', 'MED')}
**Domains:** {domains_str}

**Source Notes:**
"""
            for note in p.get("source_notes", []):
                patterns_md += f"- [[{note}]]\n"

            patterns_md += f"\n**Action:** {p.get('actionable_insight', 'Review manually')}\n\n"

        # Build content
        unique_domains = list(set(str(d) for p in synthesis.get('patterns', []) for d in p.get('domains', [])))
        content = f"""---
type: weekly-synthesis
week: {week}
created: {datetime.now().strftime('%Y-%m-%d')}
patterns_found: {len(synthesis.get('patterns', []))}
domains: {json.dumps(unique_domains)}
---

# Weekly Synthesis — {week}

## Key Insight

{synthesis.get('key_learning', 'No key insights this week.')}

## Cross-Domain Patterns Discovered

{patterns_md}

---

*Generated by WeeklySynthesisAgent*
*{datetime.now().isoformat()}*
"""

        try:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"[Synthesis] Wrote: {filename}")
            return filepath
        except Exception as e:
            print(f"[Synthesis] Failed to write synthesis: {e}")
            return None

    def _load_previous_synthesis(self) -> Dict[str, Any]:
        """Load last week's synthesis for continuity."""
        synthesis_dir = self.vault_path / "02-Areas" / "Synthesis"

        if not synthesis_dir.exists():
            return {}

        # Get most recent synthesis file
        files = sorted(synthesis_dir.glob("Weekly-Synthesis-*.md"), reverse=True)
        if not files:
            return {}

        try:
            with open(files[0], "r", encoding="utf-8") as f:
                content = f.read()
                # Extract key_learning section
                if "## Key Insight" in content:
                    parts = content.split("## Key Insight")[1].split("##")[0].strip()
                    return {"key_learning": parts[:300]}
        except Exception as e:
            print(f"[Synthesis] Failed to load previous synthesis: {e}")

        return {}

    def _log_synthesis(self, synthesis: Dict[str, Any], file_written: bool) -> None:
        """
        Log synthesis decision for Phase 4 observability.

        Args:
            synthesis: Synthesis result dict
            file_written: Whether the synthesis file was successfully written
        """
        patterns = synthesis.get("patterns", [])

        # Compute average confidence
        confidence_map = {"HIGH": 1.0, "MED": 0.5, "LOW": 0.2}
        confidences = [
            confidence_map.get(p.get("confidence", "MED"), 0.5)
            for p in patterns
        ]
        avg_confidence = sum(confidences) / max(1, len(confidences))

        model_name = self.llm.get_model_name()
        provider_name = get_provider_from_model(model_name)
        provider_type = get_provider_type(model_name)

        entry = {
            "timestamp": datetime.now().isoformat(),
            "agent": "weekly_synthesis",
            "week": synthesis.get("synthesis_date"),
            "action": "weekly_synthesis",
            "patterns_found": len(patterns),
            "cost_usd": synthesis.get("cost_usd", 0.0),
            "tokens": synthesis.get("tokens", {}),
            "llm": {
                "model": model_name,
                "provider": provider_name,
                "type": provider_type
            },
            "output": {
                "domains_covered": list(set(
                    d for p in patterns for d in p.get("domains", [])
                )),
                "avg_confidence": round(avg_confidence, 2),
                "file_written": file_written
            }
        }

        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry) + "\n")
        except Exception as e:
            print(f"[Synthesis] Failed to log decision: {e}")
