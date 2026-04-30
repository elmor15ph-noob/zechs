"""Few-Shot Example Store — poor-man's RLHF via accept/reject signals.

Flow:
  1. Agent runs → decision logged with run_id
  2. User accepts or rejects via /agents/{agent}/feedback?run_id=X
  3. FewShotStore appends (input, output, decision) to per-agent JSONL
  4. Before next LLM call, BaseAgent injects top-5 accepts + recent rejects
  5. Quarterly pruning removes examples older than max_age_days
"""

import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any

log = logging.getLogger("few_shot_store")

_STORE_DIR_NAME = "few-shot-examples"
_MAX_INJECT_ACCEPTS = 5
_MAX_INJECT_REJECTS = 3
_DEFAULT_PRUNE_DAYS = 90


class FewShotStore:
    """Manages per-agent few-shot example stores backed by JSONL files."""

    def __init__(self, vault_path: Path):
        self.store_dir = Path(vault_path) / ".lancedb" / _STORE_DIR_NAME
        self.store_dir.mkdir(parents=True, exist_ok=True)

    # ── Writing ──────────────────────────────────────────────────────────────

    def append(
        self,
        agent: str,
        decision: str,            # "accept" or "reject"
        input_summary: str,       # short description of what was fed in
        output_summary: str,      # short description / snippet of what the agent produced
        run_id: Optional[str] = None,
        comment: Optional[str] = None,
        metadata: Optional[Dict] = None,
    ) -> None:
        """Append one labelled example to the agent's store."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "agent": agent,
            "decision": decision,
            "input_summary": input_summary[:500],
            "output_summary": output_summary[:800],
            "run_id": run_id,
            "comment": comment,
            "metadata": metadata or {},
        }
        path = self._path(agent)
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
        log.debug("FewShot: appended %s example for %s (run_id=%s)", decision, agent, run_id)

    # ── Reading ───────────────────────────────────────────────────────────────

    def get_accepts(self, agent: str, n: int = _MAX_INJECT_ACCEPTS) -> List[Dict]:
        """Return the most recent N accepted examples for the agent."""
        return self._load_filtered(agent, decision="accept", n=n, newest_first=True)

    def get_rejects(self, agent: str, n: int = _MAX_INJECT_REJECTS) -> List[Dict]:
        """Return the most recent N rejected examples for the agent."""
        return self._load_filtered(agent, decision="reject", n=n, newest_first=True)

    def build_prompt_block(self, agent: str) -> str:
        """Build the few-shot injection block to prepend to the agent's prompt.

        Returns an empty string if no examples exist yet.
        """
        accepts = self.get_accepts(agent)
        rejects = self.get_rejects(agent)
        if not accepts and not rejects:
            return ""

        lines: List[str] = ["--- FEW-SHOT CONTEXT (from user feedback) ---"]

        if accepts:
            lines.append(f"\n✅ EXAMPLES TO EMULATE ({len(accepts)} most recent accepted):")
            for i, ex in enumerate(accepts, 1):
                lines.append(f"\n[{i}] Input: {ex['input_summary']}")
                lines.append(f"    Output: {ex['output_summary']}")
                if ex.get("comment"):
                    lines.append(f"    User note: {ex['comment']}")

        if rejects:
            lines.append(f"\n❌ PATTERNS TO AVOID ({len(rejects)} most recent rejected):")
            for i, ex in enumerate(rejects, 1):
                lines.append(f"\n[{i}] Input: {ex['input_summary']}")
                lines.append(f"    Rejected output: {ex['output_summary']}")
                if ex.get("comment"):
                    lines.append(f"    Reason: {ex['comment']}")

        lines.append("\n--- END FEW-SHOT CONTEXT ---\n")
        return "\n".join(lines)

    # ── Maintenance ───────────────────────────────────────────────────────────

    def prune(self, agent: Optional[str] = None, max_age_days: int = _DEFAULT_PRUNE_DAYS) -> Dict[str, int]:
        """Remove examples older than max_age_days. Returns counts of removed entries per agent."""
        cutoff = datetime.now() - timedelta(days=max_age_days)
        agents = [agent] if agent else [p.stem for p in self.store_dir.glob("*.jsonl")]
        removed: Dict[str, int] = {}

        for ag in agents:
            path = self._path(ag)
            if not path.exists():
                continue
            kept, total = [], 0
            with open(path, encoding="utf-8", errors="replace") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    total += 1
                    try:
                        entry = json.loads(line)
                        ts = datetime.fromisoformat(entry["timestamp"][:19])
                        if ts >= cutoff:
                            kept.append(line)
                    except (json.JSONDecodeError, KeyError, ValueError):
                        kept.append(line)  # keep malformed entries

            removed[ag] = total - len(kept)
            with open(path, "w", encoding="utf-8") as f:
                f.write("\n".join(kept) + ("\n" if kept else ""))

        log.info("FewShot prune: %s", removed)
        return removed

    def stats(self) -> Dict[str, Dict[str, int]]:
        """Return per-agent counts of accepts / rejects / total."""
        result: Dict[str, Dict[str, int]] = {}
        for path in sorted(self.store_dir.glob("*.jsonl")):
            agent = path.stem
            counts: Dict[str, int] = {"accept": 0, "reject": 0, "total": 0}
            with open(path, encoding="utf-8", errors="replace") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                        d = entry.get("decision", "unknown")
                        counts[d] = counts.get(d, 0) + 1
                        counts["total"] += 1
                    except json.JSONDecodeError:
                        continue
            result[agent] = counts
        return result

    # ── Internal ──────────────────────────────────────────────────────────────

    def _path(self, agent: str) -> Path:
        return self.store_dir / f"{agent}.jsonl"

    def _load_filtered(
        self, agent: str, decision: str, n: int, newest_first: bool = True
    ) -> List[Dict]:
        path = self._path(agent)
        if not path.exists():
            return []
        entries: List[Dict] = []
        with open(path, encoding="utf-8", errors="replace") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                    if entry.get("decision") == decision:
                        entries.append(entry)
                except json.JSONDecodeError:
                    continue
        if newest_first:
            entries = list(reversed(entries))
        return entries[:n]
