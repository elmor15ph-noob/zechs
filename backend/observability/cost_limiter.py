"""Cost cap enforcement - Phase 4 Observability"""

from pathlib import Path
from typing import Dict, Tuple
from datetime import datetime, timedelta
import json


class CostLimiter:
    """Enforces per-agent cost caps (daily and weekly)."""

    DEFAULT_LIMITS = {
        "Inbox Distiller": {"daily": 1.0, "weekly": 5.0},
        "Weekly Synthesis": {"daily": 2.0, "weekly": 5.0},
    }

    def __init__(self, vault_path: Path, limits: Dict = None):
        self.vault_path = Path(vault_path)
        self.log_dir = self.vault_path / ".lancedb"
        self.limits = limits or self.DEFAULT_LIMITS
        self.inbox_log = self.log_dir / "inbox-agent-decisions.jsonl"
        self.synthesis_log = self.log_dir / "synthesis-decisions.jsonl"

    def check_cost_limit(self, agent_name: str) -> Tuple[bool, Dict]:
        """
        Check if agent can proceed with next decision.

        Returns: (can_proceed, status_dict)
        """
        if agent_name not in self.limits:
            return True, {"status": "unknown_agent", "agent": agent_name}

        limits = self.limits[agent_name]
        costs = self._get_agent_costs(agent_name)

        daily_cost = costs.get("daily", 0.0)
        weekly_cost = costs.get("weekly", 0.0)

        daily_limit = limits["daily"]
        weekly_limit = limits["weekly"]

        if daily_cost >= daily_limit:
            return False, {
                "status": "daily_limit_exceeded",
                "agent": agent_name,
                "daily_spent": round(daily_cost, 4),
                "daily_limit": daily_limit,
                "message": f"Daily cost cap of ${daily_limit} reached"
            }

        if weekly_cost >= weekly_limit:
            return False, {
                "status": "weekly_limit_exceeded",
                "agent": agent_name,
                "weekly_spent": round(weekly_cost, 4),
                "weekly_limit": weekly_limit,
                "message": f"Weekly cost cap of ${weekly_limit} reached"
            }

        return True, {
            "status": "ok",
            "agent": agent_name,
            "daily_spent": round(daily_cost, 4),
            "daily_remaining": round(daily_limit - daily_cost, 4),
            "weekly_spent": round(weekly_cost, 4),
            "weekly_remaining": round(weekly_limit - weekly_cost, 4)
        }

    def _get_agent_costs(self, agent_name: str) -> Dict[str, float]:
        """Get daily and weekly costs for an agent."""
        now = datetime.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = now - timedelta(days=now.weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)

        daily_cost = 0.0
        weekly_cost = 0.0

        log_file = self._get_log_file(agent_name)
        if not log_file.exists():
            return {"daily": daily_cost, "weekly": weekly_cost}

        with open(log_file) as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    entry = json.loads(line)
                    if entry.get("agent") != agent_name:
                        continue

                    entry_date = datetime.fromisoformat(entry["timestamp"])
                    cost = entry.get("cost_usd", 0.0)

                    if entry_date >= today_start:
                        daily_cost += cost
                    if entry_date >= week_start:
                        weekly_cost += cost
                except (json.JSONDecodeError, KeyError, ValueError):
                    continue

        return {"daily": daily_cost, "weekly": weekly_cost}

    def _get_log_file(self, agent_name: str) -> Path:
        """Get log file path for agent."""
        if "Inbox" in agent_name:
            return self.inbox_log
        elif "Synthesis" in agent_name:
            return self.synthesis_log
        return self.log_dir / f"{agent_name.lower()}-decisions.jsonl"
