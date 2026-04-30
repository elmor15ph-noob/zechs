"""SAP Crawler Agent — wraps the SAP webcrawler as a DUO BaseAgent with full observability."""

from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import json
import sys
import time

from .agent_base import BaseAgent

# Path to the SAP webcrawler project
SAP_CRAWLER_ROOT = Path(r"C:\Users\punta\OneDrive\Jay Files\Documents\Claude\Projects\SAP Expert with Webcrawler capability")
SAP_CRAWLER_SRC = SAP_CRAWLER_ROOT / "crawler"


class SAPCrawlerAgent(BaseAgent):
    """
    Wraps fetch_sap.py and update_check.py as a DUO agent.

    Capabilities:
    - crawl_module(module)   — fetch a single SAP module (e.g. FI-GL)
    - whats_new()            — delta scan all tracked releases
    - status()               — return manifest stats without crawling
    """

    SUPPORTED_MODULES = ["FI-GL", "MM", "SD", "FI-AP", "FI-AR", "FI-AA", "CO", "MM", "PP", "QM", "PM", "EWM"]

    def __init__(self, vault_path: Path, llm_provider, **kwargs):
        super().__init__(vault_path, llm_provider)
        self._log_file = self.lancedb_dir / "sap-crawler-decisions.jsonl"
        self._manifest_path = SAP_CRAWLER_ROOT / "index" / "manifest.json"
        # Inject crawler src into path for imports
        if str(SAP_CRAWLER_SRC) not in sys.path:
            sys.path.insert(0, str(SAP_CRAWLER_SRC))

    def get_log_file(self) -> Path:
        return self._log_file

    def get_agent_name(self) -> str:
        return "SAPCrawlerAgent"

    def run(self) -> Dict[str, Any]:
        self.assert_enabled()
        """Default run: return current status without crawling."""
        return self.status()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def status(self) -> Dict[str, Any]:
        """Return manifest stats: last crawl, topics extracted, releases tracked."""
        self.start_timer()
        manifest = self._load_manifest()
        history = manifest.get("crawl_history", [])
        update_history = manifest.get("update_history", [])
        scopes = manifest.get("content_scopes", {})

        result = {
            "status": "ok",
            "last_crawl": manifest.get("last_crawl", "never"),
            "topics_extracted": sum(s.get("topics_extracted", 0) for s in scopes.values()),
            "crawl_runs": len(history),
            "whats_new_runs": len(update_history),
            "releases_tracked": manifest.get("releases_tracked", []),
            "phase": manifest.get("phase", "unknown"),
            "agent": self.get_agent_name(),
            "cost_usd": 0.0,
            "tokens": {},
        }
        self.log_decision(result, input_data={"action": "status"})
        return result

    def crawl_module(self, module: str, version: Optional[str] = None) -> Dict[str, Any]:
        """Crawl a single SAP module. Returns result dict."""
        self.start_timer()
        input_data = {"action": "crawl_module", "module": module, "version": version}

        try:
            from fetch_sap import crawl_modules
            crawl_modules([module], version=version)
            manifest = self._load_manifest()
            history = manifest.get("crawl_history", [])
            last_run = history[-1] if history else {}
            topics_crawled = len(last_run.get("topics", []))
            result = {
                "status": "success",
                "module": module,
                "topics_crawled": topics_crawled,
                "fetched_at": last_run.get("ts", datetime.now(timezone.utc).isoformat()),
                "cost_usd": 0.0,
                "tokens": {},
            }
            self.log_decision(result, input_data=input_data)
            return result
        except Exception as e:
            error_result = {"status": "error", "module": module, "cost_usd": 0.0, "tokens": {}}
            self.log_decision(error_result, input_data=input_data, error=str(e))
            return {**error_result, "error": str(e)}

    def whats_new(self, releases: Optional[List[str]] = None) -> Dict[str, Any]:
        """Run a What's New delta scan across tracked releases."""
        self.start_timer()
        input_data = {"action": "whats_new", "releases": releases}

        try:
            from update_check import run_whats_new_refresh
            diffs = run_whats_new_refresh(releases=releases)
            total_new = sum(d.get("new_count", 0) for d in diffs.values())
            result = {
                "status": "success",
                "releases_scanned": len(diffs),
                "total_new_entries": total_new,
                "diffs": diffs,
                "cost_usd": 0.0,
                "tokens": {},
            }
            self.log_decision(result, input_data=input_data)
            return result
        except Exception as e:
            error_result = {"status": "error", "cost_usd": 0.0, "tokens": {}}
            self.log_decision(error_result, input_data=input_data, error=str(e))
            return {**error_result, "error": str(e)}

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _load_manifest(self) -> Dict[str, Any]:
        if self._manifest_path.exists():
            return json.loads(self._manifest_path.read_text(encoding="utf-8"))
        return {}
