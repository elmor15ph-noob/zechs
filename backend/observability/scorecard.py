"""Weekly Agent Scorecard Generator - Phase 4 Observability"""

from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime, timedelta
import json
from collections import defaultdict


class ScorecardGenerator:
    """Generates weekly agent performance scorecards from decision logs."""

    def __init__(self, vault_path: Path):
        self.vault_path = Path(vault_path)
        self.log_dir = self.vault_path / ".lancedb"
        self.inbox_log = self.log_dir / "inbox-agent-decisions.jsonl"
        self.synthesis_log = self.log_dir / "synthesis-decisions.jsonl"
        self.feedback_log = self.log_dir / "agent-feedback.jsonl"

    def generate_scorecard(self, weeks_back: int = 1) -> Dict[str, Any]:
        """Generate scorecard for the past N weeks."""
        cutoff_date = datetime.now() - timedelta(weeks=weeks_back)

        inbox_decisions = self._load_decisions(self.inbox_log, cutoff_date)
        synthesis_decisions = self._load_decisions(self.synthesis_log, cutoff_date)
        feedback = self._load_feedback(cutoff_date)

        inbox_scorecard = self._score_agent(
            "Inbox Distiller",
            inbox_decisions,
            feedback
        )
        synthesis_scorecard = self._score_agent(
            "Weekly Synthesis",
            synthesis_decisions,
            feedback
        )

        return {
            "generated": datetime.now().isoformat(),
            "period": f"Last {weeks_back} week(s)",
            "agents": [inbox_scorecard, synthesis_scorecard],
            "summary": self._generate_summary(inbox_scorecard, synthesis_scorecard)
        }

    def _load_decisions(self, log_path: Path, cutoff_date: datetime) -> List[Dict]:
        """Load decisions from JSONL after cutoff date."""
        decisions = []
        if not log_path.exists():
            return decisions

        with open(log_path) as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    entry = json.loads(line)
                    entry_date = datetime.fromisoformat(entry["timestamp"])
                    if entry_date >= cutoff_date:
                        decisions.append(entry)
                except (json.JSONDecodeError, KeyError):
                    continue

        return decisions

    def _load_feedback(self, cutoff_date: datetime) -> Dict[str, List[str]]:
        """Load feedback (accept/reject) from log."""
        feedback = defaultdict(list)
        if not self.feedback_log.exists():
            return feedback

        with open(self.feedback_log) as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    entry = json.loads(line)
                    entry_date = datetime.fromisoformat(entry["timestamp"])
                    if entry_date >= cutoff_date:
                        agent = entry.get("agent", "unknown")
                        decision = entry.get("decision", "pending")
                        feedback[agent].append(decision)
                except (json.JSONDecodeError, KeyError):
                    continue

        return feedback

    def _score_agent(
        self,
        agent_name: str,
        decisions: List[Dict],
        feedback: Dict[str, List[str]]
    ) -> Dict[str, Any]:
        """Calculate metrics for a single agent."""
        if not decisions:
            return {
                "name": agent_name,
                "decisions_count": 0,
                "acceptance_rate": 0,
                "avg_cost": 0.0,
                "total_cost": 0.0,
                "total_tokens": 0,
                "status": "no_data"
            }

        agent_feedback = feedback.get(agent_name, [])
        accepts = sum(1 for f in agent_feedback if f == "accept")
        accepts_rate = (accepts / len(agent_feedback) * 100) if agent_feedback else 0

        total_cost = sum(d.get("cost_usd", 0.0) for d in decisions)
        total_tokens = sum(
            d.get("tokens", {}).get("input", 0) + d.get("tokens", {}).get("output", 0)
            for d in decisions
        )
        avg_cost = total_cost / len(decisions) if decisions else 0

        # Provider usage
        providers = defaultdict(int)
        for d in decisions:
            llm = d.get("llm", {})
            provider = llm.get("provider", "unknown")
            ptype = llm.get("type", "unknown")
            providers[f"{provider} ({ptype})"] += 1

        return {
            "name": agent_name,
            "decisions_count": len(decisions),
            "feedback_count": len(agent_feedback),
            "acceptance_rate": round(accepts_rate, 1),
            "avg_cost": round(avg_cost, 6),
            "total_cost": round(total_cost, 4),
            "total_tokens": total_tokens,
            "providers_used": dict(providers),
            "status": "ok" if accepts_rate >= 60 else "review_needed"
        }

    def _generate_summary(self, inbox: Dict, synthesis: Dict) -> str:
        """Generate executive summary."""
        lines = []

        if inbox["decisions_count"] == 0 and synthesis["decisions_count"] == 0:
            return "No agent activity this week."

        total_decisions = inbox["decisions_count"] + synthesis["decisions_count"]
        total_cost = inbox["total_cost"] + synthesis["total_cost"]
        avg_acceptance = (inbox["acceptance_rate"] + synthesis["acceptance_rate"]) / 2

        lines.append(f"**Total decisions:** {total_decisions}")
        lines.append(f"**Total cost:** ${total_cost:.4f}")
        lines.append(f"**Avg acceptance rate:** {avg_acceptance:.1f}%")

        if inbox["acceptance_rate"] < 60:
            lines.append(f"⚠️ Inbox Distiller acceptance low ({inbox['acceptance_rate']:.1f}%) — review recent rejects")
        if synthesis["acceptance_rate"] < 60:
            lines.append(f"⚠️ Weekly Synthesis acceptance low ({synthesis['acceptance_rate']:.1f}%) — refine prompts")

        return " | ".join(lines)

    def generate_scorecard_note(self, weeks_back: int = 1) -> Path:
        """Generate weekly scorecard as a markdown note and write to vault."""
        scorecard = self.generate_scorecard(weeks_back=weeks_back)

        # Create synthesis directory
        synthesis_dir = self.vault_path / "02-Areas" / "Synthesis"
        synthesis_dir.mkdir(parents=True, exist_ok=True)

        # Get week number for filename
        week_num = datetime.now().isocalendar()[1]
        year = datetime.now().year
        filename = f"Agent-Scorecard-{year}-W{week_num:02d}.md"
        filepath = synthesis_dir / filename

        # Extract agent data
        inbox_data = next((a for a in scorecard.get("agents", []) if a["name"] == "Inbox Distiller"), {})
        synthesis_data = next((a for a in scorecard.get("agents", []) if a["name"] == "Weekly Synthesis"), {})

        # Build markdown content
        content = f"""---
type: agent-scorecard
period: {year}-W{week_num:02d}
generated: {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}
status: active
---

# Agent Scorecard — Week {week_num}

## Summary

{scorecard.get("summary", "No activity this week.")}

---

## Inbox Distiller

### Metrics
- **Decisions:** {inbox_data.get("decisions_count", 0)} items processed
- **Feedback Received:** {inbox_data.get("feedback_count", 0)} accept/reject decisions
- **Acceptance Rate:** {inbox_data.get("acceptance_rate", 0):.1f}%
- **Avg Cost:** ${inbox_data.get("avg_cost", 0.0):.6f} per decision
- **Total Cost:** ${inbox_data.get("total_cost", 0.0):.4f}
- **Total Tokens:** {inbox_data.get("total_tokens", 0):,}
- **Status:** {"🟢 Healthy" if inbox_data.get("acceptance_rate", 0) >= 70 else "🟡 Review Needed"}

### LLM Providers Used
"""
        for provider, count in inbox_data.get("providers_used", {}).items():
            content += f"- {provider}: {count} decisions\n"

        content += f"""
---

## Weekly Synthesis

### Metrics
- **Synthesis Runs:** {synthesis_data.get("decisions_count", 0)}
- **Feedback Received:** {synthesis_data.get("feedback_count", 0)}
- **Acceptance Rate:** {synthesis_data.get("acceptance_rate", 0):.1f}%
- **Avg Cost:** ${synthesis_data.get("avg_cost", 0.0):.6f} per run
- **Total Cost:** ${synthesis_data.get("total_cost", 0.0):.4f}
- **Total Tokens:** {synthesis_data.get("total_tokens", 0):,}
- **Status:** {"🟢 Healthy" if synthesis_data.get("acceptance_rate", 0) >= 70 else "🟡 Review Needed"}

### LLM Providers Used
"""
        for provider, count in synthesis_data.get("providers_used", {}).items():
            content += f"- {provider}: {count} runs\n"

        # Cost summary table
        total_cost = inbox_data.get("total_cost", 0.0) + synthesis_data.get("total_cost", 0.0)
        total_decisions = inbox_data.get("decisions_count", 0) + synthesis_data.get("decisions_count", 0)
        inbox_percent = int((inbox_data.get("total_cost", 0.0) / 1.0 * 100)) if inbox_data.get("total_cost", 0) > 0 else 0
        synthesis_percent = int((synthesis_data.get("total_cost", 0.0) / 2.0 * 100)) if synthesis_data.get("total_cost", 0) > 0 else 0

        content += f"""
---

## Cost Analysis

| Agent | Spent | Cap (Daily) | % Used | Status |
|-------|-------|-------------|--------|--------|
| Inbox Distiller | ${inbox_data.get("total_cost", 0.0):.4f} | $1.00 | {inbox_percent}% | {"✅" if inbox_percent < 100 else "❌"} |
| Weekly Synthesis | ${synthesis_data.get("total_cost", 0.0):.4f} | $2.00 | {synthesis_percent}% | {"✅" if synthesis_percent < 100 else "❌"} |
| **TOTAL** | **${total_cost:.4f}** | **$3.00** | **{int((total_cost / 3.0 * 100))}%** | **{"✅" if total_cost < 3.0 else "❌"}** |

---

## Recommendations

"""

        # Generate recommendations based on metrics
        recommendations = []

        inbox_acceptance = inbox_data.get("acceptance_rate", 0)
        if inbox_acceptance < 60:
            recommendations.append("🔴 **Inbox Distiller:** Acceptance rate critically low. Review recent rejections and update few-shot examples.")
        elif inbox_acceptance < 70:
            recommendations.append("🟡 **Inbox Distiller:** Acceptance rate below target (70%). Consider refining routing logic.")

        synthesis_acceptance = synthesis_data.get("acceptance_rate", 0)
        if synthesis_acceptance < 60:
            recommendations.append("🔴 **Weekly Synthesis:** Acceptance rate critically low. Review pattern detection and insights.")
        elif synthesis_acceptance < 70:
            recommendations.append("🟡 **Weekly Synthesis:** Acceptance rate below target. Consider different bridge nodes or confidence thresholds.")

        inbox_cost = inbox_data.get("total_cost", 0.0)
        if inbox_cost > 0.8:
            recommendations.append(f"⚠️ **Cost Warning:** Inbox Distiller cost approaching daily cap ($1.00). Currently at ${inbox_cost:.4f}.")

        synthesis_cost = synthesis_data.get("total_cost", 0.0)
        if synthesis_cost > 1.6:
            recommendations.append(f"⚠️ **Cost Warning:** Weekly Synthesis cost approaching daily cap ($2.00). Currently at ${synthesis_cost:.4f}.")

        if not recommendations:
            content += "✅ **All systems normal.** No action items this week.\n"
        else:
            for rec in recommendations:
                content += f"- {rec}\n"

        content += f"""
---

## Raw Metrics Summary

- **Period:** Last {weeks_back} week(s)
- **Total Decisions:** {total_decisions}
- **Total Cost:** ${total_cost:.4f}
- **Avg Acceptance Rate:** {(inbox_acceptance + synthesis_acceptance) / 2:.1f}%

*Generated by Phase 4 Observability System*
*{datetime.now().isoformat()}*
"""

        # Write to file
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"[ScorecardGenerator] Scorecard written: {filepath.name}")
            return filepath
        except Exception as e:
            print(f"[ScorecardGenerator] Failed to write scorecard: {e}")
            raise
