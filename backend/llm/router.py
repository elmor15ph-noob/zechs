"""LLM Cost Router - 5-tier pricing strategy for multi-brain system."""

import random
from enum import Enum
from typing import Literal
from datetime import datetime
from pathlib import Path


class LLMTier(Enum):
    """LLM pricing tiers from cheapest to most expensive."""
    TIER_0 = "ollama"              # Free local, quality varies
    TIER_1_HAIKU = "haiku"         # $0.20/1M tokens, cheap routine work
    TIER_1_GEMINI = "gemini-flash" # $0.075/1M tokens, cheap + fast
    TIER_2_SONNET = "sonnet"       # $3/1M tokens, important tasks
    TIER_2_OPUS = "opus"           # $15/1M tokens, critical tasks only
    TIER_3 = "dyce-oracle"         # Corporate fallback, unlimited


class RoutingReason(Enum):
    """Why a particular tier was chosen."""
    COST_OPTIMIZED = "under budget, using cheapest available"
    FALLBACK = "primary failed, using fallback"
    ESCALATED = "complex task, escalated to better model"
    BUDGET_EXCEEDED = "daily budget exceeded, using oracle"
    QUALITY_REQUIREMENT = "task requires high quality output"


class CostRouter:
    """Route requests to LLM tier based on cost, complexity, and availability."""

    def __init__(self, daily_budget: float = None, vault_path: Path = None):
        """
        Initialize LLM tier router.

        Args:
            daily_budget: Daily spend limit in USD (None = unlimited, team plan mode)
            vault_path: Path to vault for cost logging
        """
        self.daily_budget = daily_budget  # None = team plan (unlimited)
        self.vault_path = vault_path or Path.home() / "Documents" / "SecondBrain"
        self.cost_log = self.vault_path / ".lancedb" / "llm-costs.jsonl"
        self.cost_log.parent.mkdir(parents=True, exist_ok=True)

        # Session-level tracking
        self.session_cost = 0.0
        self.session_calls = 0

    def get_tier(
        self,
        complexity: Literal["low", "medium", "high"] = "medium",
        task: str = "",
        force_tier: str = None,
    ) -> tuple[LLMTier, RoutingReason]:
        """
        Route to appropriate LLM tier.

        Args:
            complexity: Task complexity (low=simple, high=complex)
            task: Task description for logging
            force_tier: Override routing and use specific tier

        Returns:
            (LLMTier, RoutingReason)
        """
        if force_tier:
            tier = LLMTier[f"TIER_{self._tier_name_to_num(force_tier)}"]
            return tier, RoutingReason.QUALITY_REQUIREMENT

        # If on team plan (daily_budget is None), skip budget checks
        if self.daily_budget is None:
            return self._route_by_complexity_only(complexity, task)

        # Check if we've exceeded daily budget
        daily_cost = self._get_today_cost()
        if daily_cost >= self.daily_budget:
            return LLMTier.TIER_3, RoutingReason.BUDGET_EXCEEDED

        # Route by complexity + budget remaining
        remaining_budget = self.daily_budget - daily_cost

        if complexity == "low":
            # Low complexity: Ollama > T1 (cheap) > T2 (if needed) > oracle
            if self._is_ollama_available():
                return LLMTier.TIER_0, RoutingReason.COST_OPTIMIZED
            elif remaining_budget > 0.10:
                # Choose cheaper T1: Gemini Flash ($0.075) > Haiku ($0.20)
                return LLMTier.TIER_1_GEMINI, RoutingReason.COST_OPTIMIZED
            elif remaining_budget > 0.25:
                return LLMTier.TIER_1_HAIKU, RoutingReason.FALLBACK
            elif remaining_budget > 3.00:
                return LLMTier.TIER_2_SONNET, RoutingReason.FALLBACK
            else:
                return LLMTier.TIER_3, RoutingReason.BUDGET_EXCEEDED

        elif complexity == "medium":
            # Medium: Haiku primary, Gemini Flash backup, Sonnet if needed
            if remaining_budget > 0.25:
                return LLMTier.TIER_1_HAIKU, RoutingReason.COST_OPTIMIZED
            elif remaining_budget > 0.10:
                return LLMTier.TIER_1_GEMINI, RoutingReason.FALLBACK
            elif remaining_budget > 3.00:
                return LLMTier.TIER_2_SONNET, RoutingReason.ESCALATED
            else:
                return LLMTier.TIER_3, RoutingReason.BUDGET_EXCEEDED

        else:  # high complexity / important
            # High complexity: T2 Sonnet primary, escalate to Opus if truly critical
            if remaining_budget > 15.00:
                # Check if task is marked critical (very important)
                if "critical" in task.lower() or "urgent" in task.lower():
                    return LLMTier.TIER_2_OPUS, RoutingReason.QUALITY_REQUIREMENT
                else:
                    return LLMTier.TIER_2_SONNET, RoutingReason.QUALITY_REQUIREMENT
            elif remaining_budget > 3.00:
                return LLMTier.TIER_2_SONNET, RoutingReason.QUALITY_REQUIREMENT
            else:
                return LLMTier.TIER_3, RoutingReason.BUDGET_EXCEEDED

    def _route_by_complexity_only(self, complexity: str, task: str) -> tuple:
        """Route by quality/speed without budget constraints (team plan mode)."""
        if complexity == "low":
            # Low: Ollama > Gemini Flash (fast + capable)
            if self._is_ollama_available():
                return LLMTier.TIER_0, RoutingReason.COST_OPTIMIZED
            else:
                return LLMTier.TIER_1_GEMINI, RoutingReason.COST_OPTIMIZED

        elif complexity == "medium":
            # Medium: Haiku primary, Gemini Flash as backup, Sonnet if critical
            if "critical" in task.lower() or "urgent" in task.lower():
                return LLMTier.TIER_2_SONNET, RoutingReason.QUALITY_REQUIREMENT
            elif "high" in task.lower() or "quality" in task.lower():
                return LLMTier.TIER_1_GEMINI, RoutingReason.FALLBACK
            else:
                return LLMTier.TIER_1_HAIKU, RoutingReason.COST_OPTIMIZED

        else:  # high complexity
            # High: Sonnet default, Opus only if critical
            if "critical" in task.lower() or "urgent" in task.lower():
                return LLMTier.TIER_2_OPUS, RoutingReason.QUALITY_REQUIREMENT
            else:
                return LLMTier.TIER_2_SONNET, RoutingReason.QUALITY_REQUIREMENT

    def _is_ollama_available(self) -> bool:
        """Check if Ollama service is running locally."""
        try:
            import requests
            resp = requests.get("http://localhost:11434/api/tags", timeout=1)
            return resp.status_code == 200
        except:
            return False

    def _get_today_cost(self) -> float:
        """Get total cost logged for today."""
        import json
        from datetime import datetime, timedelta

        if not self.cost_log.exists():
            return 0.0

        today = datetime.now().date().isoformat()
        total = 0.0

        with open(self.cost_log) as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    entry = json.loads(line)
                    if entry.get("date") == today:
                        total += entry.get("cost_usd", 0.0)
                except:
                    pass

        return total

    def _tier_name_to_num(self, name: str) -> int:
        """Convert tier name to numeric tier."""
        mapping = {
            "ollama": 0,
            "gemini": 1,
            "gemini-flash": 1,
            "haiku": 1,
            "sonnet": 2,
            "opus": 2,
            "dyce": 3,
            "oracle": 3,
        }
        return mapping.get(name.lower(), 1)

    def log_call(
        self,
        tier: LLMTier,
        input_tokens: int,
        output_tokens: int,
        task: str = "",
    ) -> dict:
        """
        Log an LLM call for cost tracking.

        Returns:
            {cost_usd, tier, task, timestamp}
        """
        import json
        from datetime import datetime

        # Cost per 1M tokens (public pricing)
        cost_per_1m = {
            LLMTier.TIER_0: 0.0,           # Ollama local = free
            LLMTier.TIER_1_HAIKU: 0.20,    # Claude Haiku: $0.20/1M input, $1.0/1M output
            LLMTier.TIER_1_GEMINI: 0.075,  # Gemini Flash: $0.075/1M input, $0.3/1M output
            LLMTier.TIER_2_SONNET: 3.0,    # Claude Sonnet: $3/1M input, $15/1M output
            LLMTier.TIER_2_OPUS: 15.0,     # Claude Opus: $15/1M input, $75/1M output (premium)
            LLMTier.TIER_3: 0.0,           # Dyce Oracle: corporate, tracked elsewhere
        }

        rate = cost_per_1m.get(tier, 0.0)
        total_tokens = input_tokens + output_tokens
        cost = (total_tokens / 1_000_000) * rate

        entry = {
            "timestamp": datetime.now().isoformat(),
            "date": datetime.now().date().isoformat(),
            "tier": tier.value,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost_usd": round(cost, 4),
            "task": task,
        }

        # Append to log
        with open(self.cost_log, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")

        self.session_cost += cost
        self.session_calls += 1

        return entry

    def get_session_stats(self) -> dict:
        """Get cost/call stats for current session."""
        avg_cost = self.session_cost / max(self.session_calls, 1)
        return {
            "session_cost": round(self.session_cost, 4),
            "session_calls": self.session_calls,
            "avg_cost_per_call": round(avg_cost, 4),
            "daily_budget": self.daily_budget,
            "daily_used": round(self._get_today_cost(), 4),
        }


def get_cost_router(vault_path: Path = None) -> CostRouter:
    """Singleton cost router instance (team plan mode = unlimited budget)."""
    global _router
    if "_router" not in globals():
        # Team plan mode: no daily budget limit
        _router = CostRouter(daily_budget=None, vault_path=vault_path)
    return _router
