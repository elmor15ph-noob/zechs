"""Agent Health Monitoring for Phase 4 Observability."""

from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime, timedelta
import json
from collections import defaultdict


class AgentHealthMonitor:
    """Monitor agent health using decision logs."""

    def __init__(self, vault_path: Path):
        """
        Initialize health monitor.

        Args:
            vault_path: Path to vault directory (contains .lancedb/)
        """
        self.vault_path = Path(vault_path)
        self.lancedb_dir = self.vault_path / ".lancedb"

    def get_agent_health(self, agent_name: str, days_back: int = 7) -> Dict[str, Any]:
        """
        Get health status for a specific agent.

        Args:
            agent_name: Name of agent (e.g., "InboxDistiller", "WeeklySynthesisAgent")
            days_back: Number of days to analyze

        Returns:
            Health status dict with metrics and alerts
        """
        log_file = self._get_log_file_for_agent(agent_name)
        decisions = self._load_decisions(log_file, days_back)

        if not decisions:
            return {
                "agent": agent_name,
                "status": "unknown",
                "message": "No recent decisions found",
                "metrics": {},
                "alerts": [],
            }

        # Calculate metrics
        metrics = self._calculate_metrics(decisions)
        status = self._determine_status(metrics)
        alerts = self._generate_alerts(metrics, decisions)

        return {
            "agent": agent_name,
            "status": status,
            "metrics": metrics,
            "alerts": alerts,
            "samples": len(decisions),
            "period_days": days_back,
        }

    def get_all_agent_health(self, days_back: int = 7) -> Dict[str, Any]:
        """
        Get health status for all agents.

        Args:
            days_back: Number of days to analyze

        Returns:
            Dict with health status for each agent
        """
        agents = ["InboxDistiller", "WeeklySynthesisAgent"]
        health_report = {
            "timestamp": datetime.now().isoformat(),
            "period_days": days_back,
            "agents": {},
        }

        for agent_name in agents:
            health_report["agents"][agent_name] = self.get_agent_health(
                agent_name, days_back
            )

        return health_report

    def _get_log_file_for_agent(self, agent_name: str) -> Path:
        """Get log file path for agent."""
        log_name_map = {
            "InboxDistiller": "inbox-agent-decisions.jsonl",
            "WeeklySynthesisAgent": "synthesis-decisions.jsonl",
        }
        log_file = self.lancedb_dir / log_name_map.get(
            agent_name, f"{agent_name.lower()}-decisions.jsonl"
        )
        return log_file

    def _load_decisions(self, log_file: Path, days_back: int) -> List[Dict[str, Any]]:
        """Load decisions from log file within time window."""
        if not log_file.exists():
            return []

        cutoff_time = datetime.now() - timedelta(days=days_back)
        decisions = []

        try:
            with open(log_file, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        decision = json.loads(line)
                        timestamp = datetime.fromisoformat(
                            decision.get("timestamp", "")
                        )
                        if timestamp >= cutoff_time:
                            decisions.append(decision)
        except Exception as e:
            print(f"[AgentHealthMonitor] Error loading decisions: {e}")

        return decisions

    def _calculate_metrics(self, decisions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate health metrics from decisions."""
        if not decisions:
            return {}

        # Error rate
        errors = sum(
            1
            for d in decisions
            if d.get("error") or d.get("output", {}).get("parse_error", False)
        )
        error_rate = errors / len(decisions) if decisions else 0.0

        # Latency stats
        latencies = [d.get("latency_seconds", 0) for d in decisions if d.get("latency_seconds")]
        avg_latency = sum(latencies) / len(latencies) if latencies else 0.0
        max_latency = max(latencies) if latencies else 0.0

        # Cost stats
        costs = [d.get("cost_usd", 0.0) for d in decisions]
        total_cost = sum(costs)
        avg_cost = total_cost / len(decisions) if decisions else 0.0

        # Feedback (acceptance rate if available)
        has_feedback = sum(
            1
            for d in decisions
            if d.get("feedback", {}).get("user_decision") is not None
        )
        acceptance_rate = 0.0
        if has_feedback > 0:
            accepted = sum(
                1
                for d in decisions
                if d.get("feedback", {}).get("user_decision") == "accept"
            )
            acceptance_rate = accepted / has_feedback if has_feedback else 0.0

        return {
            "error_rate": round(error_rate, 3),
            "avg_latency_seconds": round(avg_latency, 2),
            "max_latency_seconds": round(max_latency, 2),
            "total_cost_usd": round(total_cost, 4),
            "avg_cost_usd": round(avg_cost, 6),
            "acceptance_rate": round(acceptance_rate, 2) if acceptance_rate > 0 else None,
            "total_decisions": len(decisions),
        }

    def _determine_status(self, metrics: Dict[str, Any]) -> str:
        """Determine health status from metrics."""
        error_rate = metrics.get("error_rate", 0)
        acceptance_rate = metrics.get("acceptance_rate")

        # Broken: high errors or very low acceptance
        if error_rate > 0.2 or (acceptance_rate is not None and acceptance_rate < 0.5):
            return "broken"

        # Degrading: moderate errors or low acceptance
        if error_rate > 0.1 or (acceptance_rate is not None and acceptance_rate < 0.7):
            return "degrading"

        # Healthy
        return "healthy"

    def _generate_alerts(
        self, metrics: Dict[str, Any], decisions: List[Dict[str, Any]]
    ) -> List[str]:
        """Generate alerts based on metrics."""
        alerts = []

        error_rate = metrics.get("error_rate", 0)
        if error_rate > 0.1:
            alerts.append(f"High error rate: {error_rate*100:.1f}%")

        acceptance_rate = metrics.get("acceptance_rate")
        if acceptance_rate is not None and acceptance_rate < 0.7:
            alerts.append(f"Low acceptance rate: {acceptance_rate*100:.0f}%")

        avg_latency = metrics.get("avg_latency_seconds", 0)
        if avg_latency > 5:
            alerts.append(f"High latency: {avg_latency:.1f}s avg")

        avg_cost = metrics.get("avg_cost_usd", 0)
        if avg_cost > 0.01:
            alerts.append(f"High cost per decision: ${avg_cost:.4f}")

        return alerts
