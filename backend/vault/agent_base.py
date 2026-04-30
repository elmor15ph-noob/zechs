"""Base class for autonomous agents with standardized logging and observability."""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime
import json
import logging
import time
import uuid

log = logging.getLogger("agent_base")

# Retry defaults (can be overridden per agent)
_DEFAULT_MAX_RETRIES = 3
_DEFAULT_BASE_DELAY  = 1.0   # seconds — doubled each attempt


class AgentDisabledError(RuntimeError):
    """Raised when an agent's kill switch is OFF."""
    pass


class BaseAgent(ABC):
    """Abstract base class for agents with standardized decision logging."""

    def __init__(self, vault_path: Path, llm_provider, **kwargs):
        """
        Initialize base agent.

        Args:
            vault_path: Path to vault directory
            llm_provider: LLM provider instance
            **kwargs: Subclass-specific arguments
        """
        self.vault_path = Path(vault_path)
        self.llm = llm_provider
        self.run_id = str(uuid.uuid4())
        self.lancedb_dir = self.vault_path / ".lancedb"
        self.lancedb_dir.mkdir(exist_ok=True)

        # Track timing for latency measurement
        self.start_time = None

        # Lazy few-shot store (only loaded when inject_few_shot is called)
        self._few_shot_store = None

    def start_timer(self) -> None:
        """Start timing the agent run."""
        self.start_time = time.time()

    def get_latency(self) -> float:
        """Get elapsed time since start_timer() was called."""
        if self.start_time is None:
            return 0.0
        return time.time() - self.start_time

    # ── Kill switch ──────────────────────────────────────────────────────────

    def is_enabled(self) -> bool:
        """Return True if this agent's kill switch is ON (default: True)."""
        try:
            from config import is_agent_enabled
            return is_agent_enabled(self.get_agent_name())
        except Exception:
            return True  # fail-open: never silently block if config breaks

    def assert_enabled(self) -> None:
        """Raise AgentDisabledError if the kill switch is OFF.

        Call at the top of every agent's run() implementation.
        Example::

            def run(self):
                self.assert_enabled()
                ...
        """
        if not self.is_enabled():
            name = self.get_agent_name()
            msg = (
                f"[KillSwitch] {name} is disabled. "
                f"Set AGENT_{name.upper()}_ENABLED=true in .env to re-enable."
            )
            log.warning(msg)
            raise AgentDisabledError(msg)

    # ── Retry with exponential backoff ───────────────────────────────────────

    def _call_with_retry(
        self,
        fn,
        *args,
        max_retries: int = _DEFAULT_MAX_RETRIES,
        base_delay: float = _DEFAULT_BASE_DELAY,
        retryable_exceptions: tuple = (Exception,),
        **kwargs,
    ):
        """Call *fn* with exponential backoff on failure.

        Retries only on ``retryable_exceptions`` (default: all exceptions).
        Raises the last exception if all attempts are exhausted.

        Args:
            fn: Callable to invoke.
            *args: Positional args for fn.
            max_retries: Maximum number of retry attempts after the first try.
            base_delay: Initial sleep before retry 1 (doubles each time).
            retryable_exceptions: Tuple of exception types that trigger retry.
            **kwargs: Keyword args for fn.

        Returns:
            Return value of fn.

        Example::

            result = self._call_with_retry(
                self.llm.call, prompt, max_retries=2, base_delay=2.0
            )
        """
        last_exc: Optional[Exception] = None
        delay = base_delay
        agent = self.get_agent_name()

        for attempt in range(max_retries + 1):
            try:
                return fn(*args, **kwargs)
            except retryable_exceptions as exc:
                last_exc = exc
                if attempt == max_retries:
                    log.error(
                        "[%s] All %d attempts failed. Last error: %s",
                        agent, max_retries + 1, exc,
                    )
                    break
                log.warning(
                    "[%s] Attempt %d/%d failed: %s — retrying in %.1fs",
                    agent, attempt + 1, max_retries + 1, exc, delay,
                )
                time.sleep(delay)
                delay *= 2  # exponential backoff

        raise last_exc  # type: ignore[misc]

    @abstractmethod
    def run(self) -> Dict[str, Any]:
        """
        Run the agent.

        Returns:
            Result dictionary with status, processed count, details
        """
        pass

    @abstractmethod
    def get_log_file(self) -> Path:
        """Get the path to this agent's decision log file."""
        pass

    def log_decision(
        self,
        decision: Dict[str, Any],
        input_data: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
        latency: Optional[float] = None,
    ) -> None:
        """
        Log a decision with enhanced schema for Phase 4 observability.

        Args:
            decision: Decision result (output of agent analysis)
            input_data: Input that led to this decision
            error: Any error that occurred
            latency: Latency in seconds (if None, uses get_latency())
        """
        if latency is None:
            latency = self.get_latency()

        # Get LLM provider info
        model_name = self.llm.get_model_name()
        from llm.costs import get_provider_from_model, get_provider_type

        provider_name = get_provider_from_model(model_name)
        provider_type = get_provider_type(model_name)

        # Build enhanced decision log entry
        entry = {
            "timestamp": datetime.now().isoformat(),
            "run_id": self.run_id,
            "agent": self.get_agent_name(),
            "latency_seconds": round(latency, 2),
            "input": input_data or {},
            "output": decision,
            "cost_usd": decision.get("cost_usd", 0.0),
            "tokens": decision.get("tokens", {}),
            "llm": {
                "model": model_name,
                "provider": provider_name,
                "type": provider_type,
            },
            "error": error,
            "feedback": {
                "status": "pending",
                "user_decision": None,
                "comment": None,
                "timestamp": None,
            },
        }

        # Write to log file
        try:
            log_file = self.get_log_file()
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry) + "\n")
        except Exception as e:
            print(f"[BaseAgent] Failed to log decision for {self.get_agent_name()}: {e}")

    def get_agent_name(self) -> str:
        """Get the agent's name for logging."""
        return self.__class__.__name__

    def inject_few_shot(self, prompt: str, agent_key: Optional[str] = None) -> str:
        """Prepend few-shot accept/reject examples to a prompt.

        Call this before any LLM call to improve outputs based on user feedback.
        Returns the enriched prompt (unchanged if no examples exist yet).
        """
        try:
            if self._few_shot_store is None:
                from vault.few_shot_store import FewShotStore
                self._few_shot_store = FewShotStore(self.vault_path)
            key = agent_key or self.get_agent_name().lower()
            block = self._few_shot_store.build_prompt_block(key)
            if block:
                log.debug("Injecting few-shot block (%d chars) for %s", len(block), key)
                return block + prompt
        except Exception as e:
            log.warning("Few-shot injection failed (non-fatal): %s", e)
        return prompt
