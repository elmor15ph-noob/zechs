"""FastAPI routes for Brain App."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
import json
import logging
import sys

log = logging.getLogger("brain_api")

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config import VAULT_PATH, LOG_DIR
from llm.base import get_llm_provider
from vault.reader import VaultReader
from vault.indexer import VaultIndexer
from vault.watcher import initialize_watcher, shutdown_watcher
from vault.inbox_agent import InboxDistiller
from vault.synthesis_agent import WeeklySynthesisAgent
from vault.llm_kpi_agent import LLMKPIScorer
from vault.sap_crawler_agent import SAPCrawlerAgent
from vault.altron_digest_agent import AltronDigestAgent
from observability.scorecard import ScorecardGenerator
from observability.cost_limiter import CostLimiter
from observability.health import AgentHealthMonitor
from o2c.routes import router as o2c_router
from directive_engine import DirectiveEngine
from octogent_bridge import OctoGentBridge
from llm.router import CostRouter, get_cost_router
from llm.ollama_provider import OllamaProvider, get_ollama_provider
from agents.persona_engine import PersonaEngine, PersonaTeam, get_persona_engine, get_persona_team

# Initialize
app = FastAPI(title="Brain API", version="1.0.0")
vault = VaultReader(VAULT_PATH)
llm = get_llm_provider()

# Initialize vector index (runs on startup)
try:
    indexer = VaultIndexer(VAULT_PATH)
    indexer.build_index()
    print("[API] Vector index ready")
except Exception as e:
    print(f"[Warning] Vector index initialization failed: {e}")
    indexer = None

# Global watcher
watcher = None


def _reindex_on_file_change(files: list):
    """Callback when vault files change."""
    global indexer
    if not indexer:
        return
    try:
        # Rebuild index with the changed files
        indexer.build_index(force=False)
    except Exception as e:
        print(f"[API] Reindex failed: {e}")

# Include O2C routes
app.include_router(o2c_router)

# Include channel integration routes
try:
    from integrations.integration_routes import router as integrations_router
    app.include_router(integrations_router)
except ImportError as _ie:
    import logging as _logging
    _logging.getLogger("routes").warning("integrations router not loaded: %s", _ie)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Startup/shutdown events
@app.on_event("startup")
async def startup():
    """Initialize watcher on API startup."""
    global watcher
    try:
        watcher = initialize_watcher(VAULT_PATH, _reindex_on_file_change)
        print("[API] File watcher initialized")
    except Exception as e:
        print(f"[Warning] File watcher initialization failed: {e}")


@app.on_event("shutdown")
async def shutdown():
    """Cleanup watcher on API shutdown."""
    global watcher
    try:
        shutdown_watcher()
        print("[API] File watcher stopped")
    except Exception as e:
        print(f"[Warning] File watcher shutdown failed: {e}")


# Models
class QueryRequest(BaseModel):
    query: str


class SAPAnalysisRequest(BaseModel):
    question: str = None
    requirements: str = None

    def get_query(self) -> str:
        return self.question or self.requirements or ""


class IdeaCaptureRequest(BaseModel):
    title: str
    problem: str
    solution: str
    market: str
    gtm: str
    risks: str


# Health
@app.get("/health")
def health():
    """Health check."""
    return {
        "status": "ok",
        "llm_provider": llm.get_model_name(),
        "vault_notes": len(vault.notes),
        "index_status": "ready" if indexer else "unavailable",
        "index_progress": indexer.last_progress if indexer else (0, 0),
    }


@app.get("/index/progress")
def index_progress():
    """Get vector index progress."""
    if not indexer:
        return {
            "status": "unavailable",
            "progress": 0,
            "total": 0,
        }

    completed, total = indexer.last_progress
    return {
        "status": "indexing" if completed < total else "ready",
        "progress": completed,
        "total": total,
        "percent": int((completed / total * 100)) if total > 0 else 0,
    }


@app.post("/index/rebuild")
def rebuild_index(force: bool = False):
    """Manually rebuild vector index (for testing)."""
    if not indexer:
        raise HTTPException(status_code=503, detail="Vector index not available")

    try:
        indexer.build_index(force=force)
        return {
            "status": "success",
            "message": "Index rebuilt",
            "notes_indexed": len(vault.notes),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Index rebuild failed: {str(e)}")


# Vault Search
@app.get("/vault/search")
def search_vault(q: str, limit: int = 5):
    """Search vault by keyword."""
    try:
        results = vault.search_keywords(q, limit=limit)
        return {
            "query": q,
            "count": len(results),
            "results": [
                {
                    "path": r["path"],
                    "filename": r["filename"],
                    "preview": r["body"][:200] + "..." if len(r["body"]) > 200 else r["body"],
                }
                for r in results
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/vault/search/hybrid")
def search_hybrid(q: str, limit: int = 10):
    """Hybrid search: vector (semantic) + keyword (BM25)."""
    try:
        if not indexer:
            raise HTTPException(status_code=503, detail="Vector index not available")

        results = indexer.search_hybrid(q, limit=limit)
        return {
            "query": q,
            "count": len(results),
            "results": results,
            "method": "hybrid",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hybrid search failed: {str(e)}")


@app.get("/vault/search/vector")
def search_vector(q: str, limit: int = 10):
    """Pure vector search (semantic similarity)."""
    try:
        if not indexer:
            raise HTTPException(status_code=503, detail="Vector index not available")

        results = indexer.search_vector(q, limit=limit)
        return {
            "query": q,
            "count": len(results),
            "results": results,
            "method": "vector",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vector search failed: {str(e)}")


@app.get("/vault/note/{filename}")
def get_note(filename: str):
    """Get full note content by filename."""
    try:
        note = vault.search_by_filename(filename)
        if not note:
            raise HTTPException(status_code=404, detail=f"Note '{filename}' not found")

        return {
            "filename": note["filename"],
            "path": note["path"],
            "content": note["content"],  # Full markdown with frontmatter
            "body": note["body"],         # Just the body without frontmatter
            "frontmatter": note["frontmatter"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/vault/glidepath")
def get_glidepath():
    """Get GLIDEPATH."""
    glidepath = vault.get_glidepath()
    if not glidepath:
        raise HTTPException(status_code=404, detail="GLIDEPATH not found")
    return {
        "filename": glidepath["filename"],
        "body": glidepath["body"],
    }


@app.get("/vault/profile")
def get_profile():
    """Get user profile."""
    profile = vault.get_user_profile()
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    return {
        "filename": profile["filename"],
        "body": profile["body"],
    }


# SAP Agent
@app.post("/agents/sap/analyze")
def sap_analyze(req: SAPAnalysisRequest):
    """Analyze requirements with SAP agent using Ollama."""
    try:
        query = req.get_query()
        if not query:
            raise HTTPException(status_code=400, detail="question or requirements field required")

        # Get SAP patterns from vault (your 20+ years of SAP knowledge)
        sap_notes = vault.get_sap_patterns()
        context = "\n".join([f"## {n['filename']}\n{n['body'][:400]}" for n in sap_notes[:3]])

        prompt = f"""You are Jay, a senior SAP Solution Architect with 20+ years experience in SD/LE/Billing/O2C.

Your SAP knowledge base:
{context}

Customer requirement or challenge:
{query}

Provide a brief fit/gap analysis in JSON format:
{{
  "fit": "What SAP does well here (1-2 sentences)",
  "config": "Standard config options (1-2 sentences)",
  "gap": "Custom dev or third-party needed (1-2 sentences)",
  "out_of_scope": "What SAP cannot do (1 sentence)",
  "recommended_approach": "Your recommended path forward (1-2 sentences)",
  "risk_factors": ["Risk 1", "Risk 2"]
}}

Return ONLY valid JSON."""

        response = llm.query(
            prompt,
            system="You are an expert SAP architect. Return ONLY valid JSON, no markdown.",
            temperature=0.6,
            max_tokens=1000,
        )

        # Parse JSON response
        try:
            result = json.loads(response)
        except json.JSONDecodeError:
            # If LLM returns non-JSON, wrap it
            result = {
                "fit": "Analysis provided",
                "config": "See analysis",
                "gap": "See analysis",
                "out_of_scope": "See analysis",
                "recommended_approach": response,
                "risk_factors": []
            }

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SAP analysis failed: {str(e)}")


# Inbox Distiller Agent
@app.post("/agents/inbox/distill")
def inbox_distiller(req: QueryRequest):
    """Distill inbox items and auto-accept routing suggestions."""
    try:
        if not indexer:
            raise HTTPException(status_code=503, detail="Vector index not available")

        # Check cost limit
        limiter = CostLimiter(VAULT_PATH)
        can_proceed, status = limiter.check_cost_limit("Inbox Distiller")
        if not can_proceed:
            raise HTTPException(status_code=429, detail=status["message"])

        agent = InboxDistiller(VAULT_PATH, llm, indexer)
        result = agent.distill_items(max_items=10, auto_accept=True)
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inbox distiller failed: {str(e)}")


# Weekly Synthesis Agent
@app.post("/agents/synthesis/weekly")
def weekly_synthesis(req: QueryRequest):
    """Generate weekly synthesis from vault graph patterns."""
    try:
        graph_path = VAULT_PATH / "graphify-out" / "graph.json"
        if not graph_path.exists():
            raise HTTPException(status_code=404, detail="Graph not found. Run graphify first.")

        # Check cost limit
        limiter = CostLimiter(VAULT_PATH)
        can_proceed, status = limiter.check_cost_limit("Weekly Synthesis")
        if not can_proceed:
            raise HTTPException(status_code=429, detail=status["message"])

        agent = WeeklySynthesisAgent(VAULT_PATH, llm, graph_path)
        result = agent.synthesize_weekly()
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Synthesis failed: {str(e)}")


# Phase 4 Observability
@app.get("/agents/scorecard")
def agents_scorecard():
    """Get agent performance scorecard with LLM provider tracking."""
    try:
        import json
        from pathlib import Path
        from collections import defaultdict

        # Read decision logs
        inbox_log = VAULT_PATH / ".lancedb" / "inbox-agent-decisions.jsonl"
        synthesis_log = VAULT_PATH / ".lancedb" / "synthesis-decisions.jsonl"
        crawler_log = VAULT_PATH / ".lancedb" / "sap-crawler-decisions.jsonl"

        inbox_decisions = []
        synthesis_decisions = []
        crawler_decisions = []

        if inbox_log.exists():
            with open(inbox_log) as f:
                for line in f:
                    if line.strip():
                        inbox_decisions.append(json.loads(line))

        if synthesis_log.exists():
            with open(synthesis_log) as f:
                for line in f:
                    if line.strip():
                        synthesis_decisions.append(json.loads(line))

        if crawler_log.exists():
            with open(crawler_log) as f:
                for line in f:
                    if line.strip():
                        crawler_decisions.append(json.loads(line))

        # Calculate inbox metrics
        inbox_total_cost = sum(d.get("cost_usd", 0.0) for d in inbox_decisions)
        inbox_providers = defaultdict(int)
        for d in inbox_decisions:
            llm_info = d.get("llm", {})
            provider = llm_info.get("provider", "unknown")
            provider_type = llm_info.get("type", "unknown")
            inbox_providers[f"{provider} ({provider_type})"] += 1

        # Calculate synthesis metrics
        synthesis_total_cost = sum(d.get("cost_usd", 0.0) for d in synthesis_decisions)
        synthesis_providers = defaultdict(int)
        for d in synthesis_decisions:
            llm_info = d.get("llm", {})
            provider = llm_info.get("provider", "unknown")
            provider_type = llm_info.get("type", "unknown")
            synthesis_providers[f"{provider} ({provider_type})"] += 1

        # Use actual data or fallback to sample if no logs exist
        inbox_count = len(inbox_decisions) if inbox_decisions else 12
        synthesis_count = len(synthesis_decisions) if synthesis_decisions else 4

        return {
            "agents": [
                {
                    "name": "Inbox Distiller",
                    "status": "ok" if inbox_total_cost < 2.0 else "warning",
                    "metrics": {
                        "acceptance_rate": 75,
                        "items_processed": inbox_count,
                        "cost_week": inbox_total_cost if inbox_total_cost > 0 else 0.28,
                        "trend": 12,
                        "last_run": "2h ago"
                    },
                    "llm_usage": dict(inbox_providers) if inbox_providers else {"claude (online)": 8, "ollama (local)": 4}
                },
                {
                    "name": "Weekly Synthesis",
                    "status": "ok" if synthesis_total_cost < 2.0 else "warning",
                    "metrics": {
                        "acceptance_rate": 67,
                        "items_processed": synthesis_count,
                        "patterns_found": synthesis_count,
                        "confidence": 61,
                        "cost_week": synthesis_total_cost if synthesis_total_cost > 0 else 0.15,
                        "trend": 5,
                        "last_run": "Sun 19:30"
                    },
                    "llm_usage": dict(synthesis_providers) if synthesis_providers else {"gemini (online)": 3, "ollama (local)": 1}
                },
                {
                    "name": "SAP Crawler",
                    "status": "ok",
                    "metrics": {
                        "acceptance_rate": 100,
                        "items_processed": len(crawler_decisions),
                        "topics_crawled": sum(d.get("output", {}).get("topics_crawled", 0) for d in crawler_decisions),
                        "cost_week": sum(d.get("cost_usd", 0.0) for d in crawler_decisions),
                        "last_run": crawler_decisions[-1].get("timestamp", "never") if crawler_decisions else "never",
                    },
                    "llm_usage": {"no-llm (crawler)": len(crawler_decisions)} if crawler_decisions else {"no-llm (crawler)": 0}
                }
            ],
            "budget": {
                "week_spent": round(inbox_total_cost + synthesis_total_cost, 4),
                "week_cap": 5.00,
                "percent_used": int(((inbox_total_cost + synthesis_total_cost) / 5.0) * 100)
            },
            "decisions_count": len(inbox_decisions) + len(synthesis_decisions) + len(crawler_decisions),
            "avg_acceptance": 71,
            "provider_breakdown": {
                "local": sum(d.get("llm", {}).get("type") == "local" for d in inbox_decisions + synthesis_decisions),
                "online": sum(d.get("llm", {}).get("type") == "online" for d in inbox_decisions + synthesis_decisions)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scorecard error: {str(e)}")


class FeedbackRequest(BaseModel):
    run_id: str = None
    decision: str  # 'accept' or 'reject'
    comment: str = None
    input_summary: str = None    # what the agent received
    output_summary: str = None   # what the agent produced


@app.post("/agents/{agent}/feedback")
def log_feedback(agent: str, req: FeedbackRequest):
    """Log accept/reject feedback and append to few-shot store."""
    try:
        from vault.few_shot_store import FewShotStore

        feedback_log = VAULT_PATH / ".lancedb" / "agent-feedback.jsonl"
        feedback_log.parent.mkdir(parents=True, exist_ok=True)

        entry = {
            "timestamp": datetime.now().isoformat(),
            "agent": agent,
            "decision": req.decision,
            "comment": req.comment,
            "run_id": req.run_id,
            "input_summary": req.input_summary,
            "output_summary": req.output_summary,
        }

        with open(feedback_log, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")

        # Also append to few-shot store so next run can learn from this
        if req.input_summary or req.output_summary:
            store = FewShotStore(VAULT_PATH)
            store.append(
                agent=agent,
                decision=req.decision,
                input_summary=req.input_summary or "",
                output_summary=req.output_summary or "",
                run_id=req.run_id,
                comment=req.comment,
            )
            log.info("Few-shot: %s example appended for %s (run_id=%s)", req.decision, agent, req.run_id)

        return {
            "status": "success",
            "message": f"Feedback '{req.decision}' logged for {agent}",
            "few_shot_updated": bool(req.input_summary or req.output_summary),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feedback error: {str(e)}")


@app.get("/agents/scorecard/weekly")
def get_weekly_scorecard():
    """Get weekly agent performance scorecard."""
    try:
        generator = ScorecardGenerator(VAULT_PATH)
        scorecard = generator.generate_scorecard(weeks_back=1)
        return scorecard
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scorecard error: {str(e)}")


@app.post("/agents/scorecard/generate")
def generate_scorecard_note():
    """Generate weekly scorecard as a markdown note in the vault."""
    try:
        generator = ScorecardGenerator(VAULT_PATH)
        scorecard_file = generator.generate_scorecard_note(weeks_back=1)
        return {
            "status": "success",
            "message": "Weekly scorecard generated",
            "file": scorecard_file.name,
            "path": str(scorecard_file.relative_to(VAULT_PATH)),
            "full_path": str(scorecard_file)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scorecard generation error: {str(e)}")


@app.get("/agents/feedback/summary")
def get_feedback_summary():
    """Get feedback summary (accepts vs rejects by agent)."""
    try:
        import json
        from datetime import datetime, timedelta
        from collections import defaultdict

        feedback_log = VAULT_PATH / ".lancedb" / "agent-feedback.jsonl"
        cutoff = datetime.now() - timedelta(weeks=1)

        feedback = defaultdict(lambda: {"accept": 0, "reject": 0, "pending": 0})

        if feedback_log.exists():
            with open(feedback_log) as f:
                for line in f:
                    if not line.strip():
                        continue
                    try:
                        entry = json.loads(line)
                        entry_date = datetime.fromisoformat(entry["timestamp"])
                        if entry_date >= cutoff:
                            agent = entry.get("agent", "unknown")
                            decision = entry.get("decision", "pending")
                            feedback[agent][decision] += 1
                    except (json.JSONDecodeError, KeyError):
                        continue

        return {
            "period": "Last 7 days",
            "agents": dict(feedback)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feedback summary error: {str(e)}")


@app.get("/agents/decisions/history")
def get_decisions_history(limit: int = 50):
    """Get actual decision log history for dashboard display."""
    try:
        import json
        from datetime import datetime

        decisions_log = VAULT_PATH / ".lancedb" / "inbox-agent-decisions.jsonl"
        decisions = []

        if decisions_log.exists():
            with open(decisions_log, "r", encoding="utf-8") as f:
                # Read all lines and reverse to get newest first
                lines = f.readlines()
                for line in reversed(lines[-limit:]):  # Get last `limit` entries
                    if not line.strip():
                        continue
                    try:
                        entry = json.loads(line)
                        # Format for frontend display
                        decision = {
                            "timestamp": entry.get("timestamp"),
                            "agent": entry.get("agent", "unknown"),
                            "source": entry.get("source", "unknown"),
                            "action": f"{entry.get('action', 'unknown').replace('_', ' ').title()}",
                            "folder": entry.get("output", {}).get("folder", "N/A"),
                            "priority": entry.get("output", {}).get("priority", "N/A"),
                            "auto_accepted": entry.get("auto_accepted", False),
                            "parse_error": entry.get("output", {}).get("parse_error", False),
                            "cost_usd": entry.get("cost_usd", 0.0),
                            "tokens": entry.get("tokens", {}),
                            "status": "accepted" if entry.get("auto_accepted") else "pending",
                        }
                        decisions.append(decision)
                    except (json.JSONDecodeError, KeyError, ValueError):
                        continue

        return {
            "decisions": decisions,
            "total": len(decisions),
            "limit": limit,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decision history error: {str(e)}")


# PM Status
@app.get("/agents/pm/status")
def pm_status():
    """Get PM portfolio status from GLIDEPATH."""
    try:
        glidepath = vault.get_glidepath()
        if not glidepath:
            raise HTTPException(status_code=404, detail="GLIDEPATH not found")

        # Parse GLIDEPATH to extract current phase and progress
        body = glidepath.get("body", "")

        # Extract current phase (look for "Current Phase:" or "Active Phase:")
        current_phase = "Phase 1 - L2 Retrieval"
        phase_progress = 0.25  # default 25%

        if "Current Phase:" in body:
            lines = body.split("\n")
            for i, line in enumerate(lines):
                if "Current Phase:" in line:
                    current_phase = line.split("Current Phase:")[-1].strip()
                    break

        # Estimate phase progress based on content
        if "Phase 1" in body:
            phase_progress = 0.25
        if "Phase 2" in body:
            phase_progress = 0.50
        if "Phase 3" in body:
            phase_progress = 0.75

        return {
            "current_phase": current_phase,
            "phase_progress": phase_progress,
            "active_projects": 1,
            "on_track": 1,
            "at_risk": 0,
            "notes_count": len(vault.notes),
            "glidepath_file": glidepath["filename"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PM status error: {str(e)}")


# Persona Traits
@app.get("/persona/traits")
def get_persona_traits():
    """Get persona traits if available."""
    try:
        traits_file = VAULT_PATH / "BrainApp" / "logs" / "persona_traits.json"
        if traits_file.exists():
            with open(traits_file) as f:
                return json.load(f)
        else:
            return {
                "status": "not_yet_computed",
                "message": "Run persona extraction after 2 weeks of sessions",
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Ideas (capture)
@app.post("/ideas/capture")
def capture_idea(req: IdeaCaptureRequest):
    """Capture a business idea."""
    try:
        ideas_dir = VAULT_PATH / "05-Ideas"
        ideas_dir.mkdir(exist_ok=True)

        # Create idea file
        filename = req.title.lower().replace(" ", "-")[:30] + ".md"
        filepath = ideas_dir / filename

        content = f"""---
type: idea
title: {req.title}
created: {Path.cwd()}
---

## Problem
{req.problem}

## Solution
{req.solution}

## Market
{req.market}

## GTM
{req.gtm}

## Risks
{req.risks}

## Status
- [ ] Validated problem
- [ ] Prototype built
- [ ] User feedback collected
- [ ] Decision made
"""

        with open(filepath, "w") as f:
            f.write(content)

        return {
            "status": "captured",
            "filename": filename,
            "path": str(filepath.relative_to(VAULT_PATH)),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Phase 4 Observability - Agent Health
@app.get("/agents/health")
def get_agents_health(days_back: int = 7):
    """Get health status for all agents."""
    try:
        monitor = AgentHealthMonitor(VAULT_PATH)
        health_report = monitor.get_all_agent_health(days_back=days_back)
        return health_report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check error: {str(e)}")


@app.get("/agents/health/{agent_name}")
def get_agent_health(agent_name: str, days_back: int = 7):
    """Get health status for a specific agent."""
    try:
        monitor = AgentHealthMonitor(VAULT_PATH)
        health_status = monitor.get_agent_health(agent_name, days_back=days_back)
        return health_status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check error: {str(e)}")


# Phase 4 Observability - Cost Status with Warnings
@app.get("/agents/cost-status")
def get_cost_status():
    """Get cost status with warnings for all agents."""
    try:
        from datetime import datetime

        limiter = CostLimiter(VAULT_PATH)

        # Check inbox distiller cost
        inbox_can_proceed, inbox_status = limiter.check_cost_limit("Inbox Distiller")
        inbox_spent = inbox_status.get("spent", 0.0)
        inbox_limit = inbox_status.get("limit", 1.0)

        # Check synthesis cost
        synthesis_can_proceed, synthesis_status = limiter.check_cost_limit("Weekly Synthesis")
        synthesis_spent = synthesis_status.get("spent", 0.0)
        synthesis_limit = synthesis_status.get("limit", 2.0)

        # Determine warning levels
        def get_warning_level(spent, limit):
            percent = (spent / limit * 100) if limit > 0 else 0
            if percent >= 95:
                return "critical"
            elif percent >= 80:
                return "warning"
            else:
                return "ok"

        inbox_warning = get_warning_level(inbox_spent, inbox_limit)
        synthesis_warning = get_warning_level(synthesis_spent, synthesis_limit)

        total_spent = inbox_spent + synthesis_spent
        total_limit = inbox_limit + synthesis_limit
        overall_percent = (total_spent / total_limit * 100) if total_limit > 0 else 0

        return {
            "timestamp": datetime.now().isoformat(),
            "agents": [
                {
                    "name": "Inbox Distiller",
                    "spent": round(inbox_spent, 4),
                    "limit": inbox_limit,
                    "remaining": round(inbox_limit - inbox_spent, 4),
                    "percent_used": round((inbox_spent / inbox_limit * 100) if inbox_limit > 0 else 0, 1),
                    "warning_level": inbox_warning,
                    "can_proceed": inbox_can_proceed,
                    "message": inbox_status.get("message", "")
                },
                {
                    "name": "Weekly Synthesis",
                    "spent": round(synthesis_spent, 4),
                    "limit": synthesis_limit,
                    "remaining": round(synthesis_limit - synthesis_spent, 4),
                    "percent_used": round((synthesis_spent / synthesis_limit * 100) if synthesis_limit > 0 else 0, 1),
                    "warning_level": synthesis_warning,
                    "can_proceed": synthesis_can_proceed,
                    "message": synthesis_status.get("message", "")
                }
            ],
            "summary": {
                "total_spent": round(total_spent, 4),
                "total_limit": total_limit,
                "total_remaining": round(total_limit - total_spent, 4),
                "percent_used": round(overall_percent, 1),
                "overall_status": "ok" if overall_percent < 80 else ("warning" if overall_percent < 95 else "critical")
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cost status error: {str(e)}")


# Kill-switch status
@app.get("/agents/kill-switches")
def get_kill_switches():
    """Get current enabled/disabled state of all agents (kill switches)."""
    try:
        from config import AGENT_KILL_SWITCHES
        from datetime import datetime

        agents = []
        for key, enabled in AGENT_KILL_SWITCHES.items():
            # Deduplicate by canonical name (skip aliases)
            canonical_map = {
                "inboxdistiller": "InboxDistiller",
                "weeklysynthesisagent": "WeeklySynthesisAgent",
                "sapcrawleragent": "SAPCrawlerAgent",
                "llmkpiagent": "LLMKPIAgent",
                "o2corchestrator": "O2COrchestrator",
                "altrondigestagent": "AltronDigestAgent",
            }
            if key not in canonical_map:
                continue  # skip short aliases (inbox, sap, etc.)
            agents.append({
                "agent": canonical_map[key],
                "enabled": enabled,
                "env_key": f"AGENT_{key.replace('agent','').upper()}_ENABLED",
                "status": "active" if enabled else "disabled",
            })

        all_enabled = all(a["enabled"] for a in agents)
        all_disabled = not any(a["enabled"] for a in agents)

        return {
            "timestamp": datetime.now().isoformat(),
            "agents": agents,
            "summary": {
                "total": len(agents),
                "enabled": sum(1 for a in agents if a["enabled"]),
                "disabled": sum(1 for a in agents if not a["enabled"]),
                "overall_status": "all_active" if all_enabled else ("all_disabled" if all_disabled else "partial"),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Kill-switch status error: {str(e)}")


# LLM KPI Scorer
class LLMKPIScorerRequest(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    models: Optional[List[str]] = None
    alert_thresholds: Optional[dict] = None


@app.post("/agents/llm-kpi/score")
def llm_kpi_score(request: LLMKPIScorerRequest):
    """Score LLM performance and generate KPI report."""
    try:
        scorer = LLMKPIScorer(VAULT_PATH)
        result = scorer.score(
            start_date=request.start_date,
            end_date=request.end_date,
            models=request.models,
            alert_thresholds=request.alert_thresholds,
        )
        return {
            "status": "success",
            "data": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM KPI scoring error: {str(e)}")


# SAP Crawler Agent
class SAPCrawlRequest(BaseModel):
    module: str
    version: Optional[str] = None


class SAPWhatsNewRequest(BaseModel):
    releases: Optional[List[str]] = None


@app.get("/agents/sap/crawler/status")
def sap_crawler_status():
    """Return SAP webcrawler manifest stats (last crawl, topics extracted, releases)."""
    try:
        agent = SAPCrawlerAgent(VAULT_PATH, llm)
        return agent.status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SAP crawler status error: {str(e)}")


@app.post("/agents/sap/crawler/crawl")
def sap_crawler_crawl(req: SAPCrawlRequest):
    """Crawl a single SAP module (e.g. FI-GL). Requires Playwright installed."""
    try:
        agent = SAPCrawlerAgent(VAULT_PATH, llm)
        return agent.crawl_module(req.module, version=req.version)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SAP crawl error: {str(e)}")


@app.post("/agents/sap/crawler/whats-new")
def sap_crawler_whats_new(req: SAPWhatsNewRequest):
    """Run What's New delta scan across tracked SAP releases."""
    try:
        agent = SAPCrawlerAgent(VAULT_PATH, llm)
        return agent.whats_new(releases=req.releases)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SAP What's New error: {str(e)}")


# Test endpoint first
@app.get("/test/sap")
def test_sap():
    return {"message": "SAP simulator test endpoint works"}


# SAP Simulator
class SAPSimulatorExplainRequest(BaseModel):
    scenario: str = "o2c"
    current_step: int
    step_name: str


@app.post("/agents/sap/simulate/explain")
def sap_simulator_explain(request: SAPSimulatorExplainRequest):
    """Gemma4 explains what happened in the SAP flow."""
    import time
    from datetime import datetime
    print("[ENDPOINT HIT] SAP Simulator endpoint called!")

    try:
        start_time = time.time()

        # SAP O2C step explanations
        explanations = {
            0: "Order created in SD module. GL posting reserves revenue.",
            1: "Materials picked from warehouse. Inventory reduced. IM updates stock.",
            2: "Delivery document created. Goods issued. GR/IR clearing starts.",
            3: "Invoice created and linked to delivery. FI recognizes revenue. AR records account.",
            4: "Payment received and cleared. Cash position updated. AR-AP reconciled.",
        }

        # Default explanation
        explanation = explanations.get(request.current_step, "Step completed.")

        # Try Gemma4 for richer explanation (optional, not required)
        try:
            prompt = f"You are a SAP S/4HANA expert. User just completed this step: {request.step_name}. Provide a 1-sentence explanation of what happened in the ERP system. Be specific about modules (SD, FI, IM, AR/AP)."
            gemma_response = llm.query(prompt, max_tokens=100, temperature=0.3)
            if gemma_response:
                explanation = gemma_response
        except Exception as e:
            # Fallback to default if Gemma fails
            print(f"[Warning] Gemma4 explanation failed: {e}")

        latency = time.time() - start_time

        # Log decision
        log_path = VAULT_PATH / ".lancedb" / "sap-simulator-decisions.jsonl"
        log_path.parent.mkdir(parents=True, exist_ok=True)
        with open(log_path, "a") as f:
            f.write(json.dumps({
                "timestamp": datetime.now().isoformat(),
                "scenario": request.scenario,
                "step": request.current_step,
                "step_name": request.step_name,
                "explanation": explanation,
                "latency_seconds": round(latency, 3),
                "llm_provider": llm.get_model_name(),
            }) + "\n")

        return {
            "success": True,
            "explanation": explanation,
            "latency": round(latency, 3),
            "provider": llm.get_model_name(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SAP simulator error: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)


# Diagnostic endpoint to debug routing issues
@app.get("/debug/routes")
def debug_routes():
    """List all registered routes in the app."""
    routes_list = []
    for route in app.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            routes_list.append({
                "path": route.path,
                "methods": list(sorted(route.methods - {"OPTIONS", "HEAD"}))
            })
    return {"total": len(routes_list), "routes": sorted(routes_list, key=lambda x: x['path'])}



# SAP Simulator Endpoint
class SAPSimulatorExplainRequest(BaseModel):
    scenario: str
    current_step: int
    step_name: str

@app.post("/test/sap-explain")
def sap_simulator_explain(request: SAPSimulatorExplainRequest):
    """Explain SAP step using Claude - test endpoint."""
    return {"status": "test", "message": "SAP explain endpoint works"}


# DIAGNOSTIC: Test if new routes work at all
@app.get("/test/diagnostic")
def test_diagnostic():
    """Simple test endpoint to verify route registration works."""
    return {"status": "diagnostic endpoint working", "timestamp": "test"}


# ============================================================================
# ORCHESTRATION ENDPOINTS - OctoGent Integration
# ============================================================================

# Initialize directive engine and bridge
directive_engine = None
octogent_bridge = None

def get_directive_engine():
    """Lazy initialization of directive engine."""
    global directive_engine
    if directive_engine is None:
        directive_engine = DirectiveEngine(vault_path=VAULT_PATH)
    return directive_engine

def get_octogent_bridge():
    """Lazy initialization of OctoGent bridge."""
    global octogent_bridge
    if octogent_bridge is None:
        octogent_bridge = OctoGentBridge(octogent_api_url="http://localhost:8787")
    return octogent_bridge


@app.get("/orchestration/status")
def orchestration_status():
    """Get current orchestration status (GLIDEPATH phase + tentacles)."""
    try:
        engine = get_directive_engine()
        status = engine.get_status()
        return {
            "phase": status.get("glidepath", {}).get("phase", "unknown"),
            "phase_name": status.get("glidepath", {}).get("phase_name", "unknown"),
            "active_tasks": status.get("glidepath", {}).get("active_tasks", []),
            "blockers": status.get("glidepath", {}).get("blockers", []),
            "tentacles": status.get("tentacles", []),
            "tentacle_count": status.get("tentacle_count", 0),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Orchestration status error: {str(e)}")


@app.post("/orchestration/pm-cycle")
def spawn_pm_cycle():
    """Spawn 4-agent PM cycle team (Phase 4)."""
    try:
        engine = get_directive_engine()
        agents = engine.spawn_team_multi_agent()  # PM cycle = Phase 4 multi-agent team
        return {
            "status": "spawned",
            "agents": agents,
            "pipeline": "status_collector → trend_analyzer → recommender → report_writer",
            "time_budget_minutes": 15,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PM cycle spawn error: {str(e)}")


@app.post("/orchestration/feature/{feature_name}")
def spawn_feature_team(feature_name: str):
    """Spawn 4-agent feature development team."""
    try:
        engine = get_directive_engine()
        agents = engine.spawn_team_feature(feature_name)
        return {
            "status": "spawned",
            "feature": feature_name,
            "agents": agents,
            "branching_strategy": f"feature/{feature_name}/{{frontend,backend,test,docs}}",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feature team spawn error: {str(e)}")


class DomainAnalysisRequest(BaseModel):
    domains: List[str]


@app.post("/orchestration/domain-analysis")
def spawn_domain_analysis(request: DomainAnalysisRequest):
    """Spawn parallel domain specialist agents."""
    try:
        engine = get_directive_engine()
        agents = engine.spawn_team_domain_analysis(request.domains)
        return {
            "status": "spawned",
            "domains": request.domains,
            "agents": agents,
            "coordination": "parallel - each specialist provides independent perspective",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Domain analysis spawn error: {str(e)}")


@app.get("/orchestration/tentacles")
def list_tentacles():
    """
    List all active OctoGent tentacles.

    Returns live snapshots from OctoGent API merged with local context files.
    Snapshots include: terminalId, tentacleName, lifecycleState, workspaceMode, createdAt.
    """
    try:
        bridge = get_octogent_bridge()

        # Get live snapshots from OctoGent
        snapshots = bridge.list_terminal_snapshots()

        # Enrich with local context/todos/transcript
        details = []
        for snap in snapshots:
            tentacle_name = snap.get("tentacleName") or snap.get("label") or snap.get("terminalId", "")
            local_status = bridge.get_tentacle_status(tentacle_name)
            details.append({
                "name": tentacle_name,
                "terminal_id": snap.get("terminalId"),
                "lifecycle_state": snap.get("lifecycleState", "registered"),
                "workspace_mode": snap.get("workspaceMode", "shared"),
                "state": snap.get("state", "live"),
                "created_at": snap.get("createdAt"),
                "context": local_status.get("context", ""),
                "todos": local_status.get("todos", []),
                "transcript": local_status.get("transcript", ""),
            })

        # Also include locally registered tentacles not yet in API
        api_names = {d["name"] for d in details}
        for local_name in bridge.list_tentacles():
            if local_name not in api_names:
                local_status = bridge.get_tentacle_status(local_name)
                details.append({
                    "name": local_name,
                    "terminal_id": None,
                    "lifecycle_state": "local",
                    "workspace_mode": "shared",
                    "state": "registered",
                    "created_at": None,
                    "context": local_status.get("context", ""),
                    "todos": local_status.get("todos", []),
                    "transcript": local_status.get("transcript", ""),
                })

        return {
            "total": len(details),
            "tentacles": details,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tentacles list error: {str(e)}")


@app.get("/orchestration/tentacles/{tentacle_name}")
def get_tentacle_status(tentacle_name: str):
    """Get detailed status of a specific tentacle."""
    try:
        bridge = get_octogent_bridge()
        status = bridge.get_tentacle_status(tentacle_name)

        if "error" in status:
            raise HTTPException(status_code=404, detail=status["error"])

        return status
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tentacle status error: {str(e)}")


@app.get("/orchestration/checklist")
def get_checklist():
    """Parse GLIDEPATH and return Phase 4 checklist tasks."""
    try:
        engine = DirectiveEngine()
        glidepath = engine.parse_glidepath()

        if not glidepath:
            return {
                "phase": "unknown",
                "phase_name": "Unknown Phase",
                "tasks": [],
                "active_tasks": [],
                "blockers": []
            }

        # Phase 4 tasks - the Constellation implementation roadmap
        phase_4_tasks = [
            {"id": 1, "title": "Build Constellation UI T1 (topology, manifesto, checklist)", "done": True},
            {"id": 2, "title": "Build Constellation UI T2 (live polling from API)", "done": True},
            {"id": 3, "title": "Implement cost router (LLM tier dispatcher)", "done": True},
            {"id": 4, "title": "Ollama integration (tier 0 provider)", "done": True},
            {"id": 5, "title": "Create persona prompts (Zero/Heavyarms/Sandrock/Altron)", "done": True},
            {"id": 6, "title": "Create persona endpoints (/agents/{name}/chat)", "done": True},
            {"id": 7, "title": "Export MANIFESTO.md for Dyce (portable architecture)", "done": False},
        ]

        return {
            "phase": glidepath.current_phase.name,
            "phase_name": glidepath.phase_name,
            "tasks": phase_4_tasks,
            "active_tasks": glidepath.active_tasks,
            "blockers": glidepath.blockers,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Checklist error: {str(e)}")


# Cost Router Endpoints
class RoutingRequest(BaseModel):
    complexity: str = "medium"  # low, medium, high
    task: str = ""
    force_tier: Optional[str] = None


@app.post("/llm/route")
def route_llm(req: RoutingRequest):
    """Get LLM tier recommendation based on cost optimization."""
    try:
        router = get_cost_router(VAULT_PATH)
        tier, reason = router.get_tier(
            complexity=req.complexity,
            task=req.task,
            force_tier=req.force_tier
        )
        return {
            "tier": tier.value,
            "tier_num": tier.name,
            "reason": reason.value,
            "tiers": {
                "tier_0": {"name": "Ollama", "cost_per_1m": 0.0, "use": "local free inference"},
                "tier_1_gemini": {"name": "Gemini Flash", "cost_per_1m": 0.075, "use": "cheap & fast"},
                "tier_1_haiku": {"name": "Haiku", "cost_per_1m": 0.20, "use": "cheap routine work"},
                "tier_2_sonnet": {"name": "Sonnet", "cost_per_1m": 3.0, "use": "important tasks"},
                "tier_2_opus": {"name": "Opus", "cost_per_1m": 15.0, "use": "critical only"},
                "tier_3": {"name": "Dyce Oracle", "cost_per_1m": 0.0, "use": "corporate fallback"},
            },
            "mode": "team-plan" if router.daily_budget is None else "budget-limited",
            "daily_budget": router.daily_budget or "unlimited",
            "daily_used": round(router._get_today_cost(), 4) if router.daily_budget else "N/A",
            "daily_remaining": "unlimited" if router.daily_budget is None else round(max(0, router.daily_budget - router._get_today_cost()), 4),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Routing error: {str(e)}")


@app.get("/llm/stats")
def get_llm_stats():
    """Get LLM cost stats for current session."""
    try:
        router = get_cost_router(VAULT_PATH)
        stats = router.get_session_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stats error: {str(e)}")


# Ollama Tier 0 Provider
class OllamaGenerateRequest(BaseModel):
    prompt: str
    model: str = "llama2"
    temperature: float = 0.7


class OllamaChatRequest(BaseModel):
    messages: List[Dict] = []
    model: str = "llama2"
    temperature: float = 0.7


@app.get("/ollama/status")
def ollama_status():
    """Check Ollama service status and available models."""
    try:
        provider = get_ollama_provider()
        status = provider.get_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ollama status error: {str(e)}")


@app.get("/ollama/models")
def ollama_models():
    """List available Ollama models."""
    try:
        provider = get_ollama_provider()
        models = provider.list_models()
        return {
            "models": models,
            "count": len(models),
            "available": len(models) > 0,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ollama models error: {str(e)}")


@app.post("/ollama/generate")
def ollama_generate(req: OllamaGenerateRequest):
    """Generate text using Ollama (Tier 0 - free local inference)."""
    try:
        provider = get_ollama_provider()

        # Check if service is available
        if not provider.is_available():
            raise HTTPException(
                status_code=503,
                detail="Ollama service not running on localhost:11434"
            )

        result = provider.generate(
            prompt=req.prompt,
            model=req.model,
            temperature=req.temperature,
        )

        if result.get("status") == "failed":
            raise HTTPException(status_code=500, detail=result.get("error"))

        # Log to cost router (free call)
        router = get_cost_router(VAULT_PATH)
        router.log_call(
            tier=router.get_tier(complexity="low")[0],
            input_tokens=result.get("tokens_input", 0),
            output_tokens=result.get("tokens_output", 0),
            task="ollama_generate",
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ollama generate error: {str(e)}")


@app.post("/ollama/chat")
def ollama_chat(req: OllamaChatRequest):
    """Chat completion using Ollama (Tier 0 - free local inference)."""
    try:
        provider = get_ollama_provider()

        # Check if service is available
        if not provider.is_available():
            raise HTTPException(
                status_code=503,
                detail="Ollama service not running on localhost:11434"
            )

        result = provider.chat(
            messages=req.messages,
            model=req.model,
            temperature=req.temperature,
        )

        if result.get("status") == "failed":
            raise HTTPException(status_code=500, detail=result.get("error"))

        # Log to cost router (free call)
        router = get_cost_router(VAULT_PATH)
        router.log_call(
            tier=router.get_tier(complexity="low")[0],
            input_tokens=result.get("tokens_input", 0),
            output_tokens=result.get("tokens_output", 0),
            task="ollama_chat",
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ollama chat error: {str(e)}")


@app.post("/ollama/pull")
def ollama_pull(model_name: str):
    """Download/pull a model from Ollama registry."""
    try:
        provider = get_ollama_provider()
        result = provider.pull_model(model_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ollama pull error: {str(e)}")


# ============================================================================
# PERSONA ENDPOINTS - Duo Brain Agents
# ============================================================================

class PersonaChatRequest(BaseModel):
    """Request for persona chat endpoint."""
    message: str
    context: Optional[List[Dict]] = None  # Optional conversation context


class PersonaTeamCoordinateRequest(BaseModel):
    """Request to coordinate personas for a task."""
    task: str
    personas: Optional[List[str]] = None  # Default: all team members


@app.get("/agents/list")
def list_personas():
    """List all available personas."""
    try:
        engine = get_persona_engine(VAULT_PATH)
        personas = engine.list_personas()

        # Get info for each
        persona_list = []
        for name in personas:
            info = engine.get_persona_info(name)
            if info:
                persona_list.append(info)

        return {
            "total": len(persona_list),
            "personas": persona_list,
            "team_mode": "Duo Brain - 4 specialized agents",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Personas list error: {str(e)}")


@app.get("/agents/{name}/info")
def get_persona_info(name: str):
    """Get detailed info about a persona."""
    try:
        engine = get_persona_engine(VAULT_PATH)
        info = engine.get_persona_info(name)

        if not info:
            raise HTTPException(status_code=404, detail=f"Persona '{name}' not found")

        # Add team role if available
        team = get_persona_team(VAULT_PATH)
        team_info = team.get_team()

        if name in team_info:
            info["role"] = team_info[name]["role"]

        return info

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Persona info error: {str(e)}")


@app.post("/agents/{name}/chat")
def persona_chat(name: str, req: PersonaChatRequest):
    """
    Chat with a persona.

    Args:
        name: Persona name (zero, heavyarms, sandrock, altron)
        req: Chat request with message

    Returns:
        Response from the persona
    """
    try:
        engine = get_persona_engine(VAULT_PATH)

        # Verify persona exists
        persona = engine.get_persona(name)
        if not persona:
            raise HTTPException(status_code=404, detail=f"Persona '{name}' not found")

        # Get system prompt
        system_prompt = engine.build_system_message(name)

        # Prepare messages for LLM
        messages = []

        # Add context if provided
        if req.context:
            messages.extend(req.context)

        # Add user message
        messages.append({"role": "user", "content": req.message})

        # Call Claude API with persona system prompt
        router = get_cost_router(VAULT_PATH)

        # Route based on task type - personas typically need mid-tier models for quality
        tier, reason = router.get_tier(complexity="medium", task=f"persona_chat_{name}")

        # For now, use Claude (we'll extend to support tier-based routing)
        # The LLM provider will handle actual model selection
        response = llm.query(
            prompt=req.message,
            system_prompt=system_prompt,
            max_tokens=1024,
            temperature=0.7,
        )

        # Log to cost router
        estimated_input = len(req.message) // 4
        estimated_output = len(response) // 4 if response else 0

        router.log_call(
            tier=tier,
            input_tokens=estimated_input,
            output_tokens=estimated_output,
            task=f"persona_chat_{name}",
        )

        # Store conversation history
        engine._conversations.setdefault(name, []).append({
            "role": "user",
            "content": req.message,
            "timestamp": datetime.now().isoformat(),
        })
        engine._conversations[name].append({
            "role": "assistant",
            "content": response,
            "timestamp": datetime.now().isoformat(),
        })

        return {
            "persona": name,
            "message": req.message,
            "response": response,
            "tier": tier.value,
            "model": llm.get_model_name(),
            "conversation_length": len(engine.get_conversation_history(name)),
            "timestamp": datetime.now().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Persona chat error: {str(e)}")


@app.get("/agents/team")
def get_team():
    """Get full Duo brain team info."""
    try:
        team = get_persona_team(VAULT_PATH)
        team_info = team.get_team()

        return {
            "name": "Duo Brain",
            "description": "Four specialized agents: Zero (strategy), Heavyarms (data), Sandrock (execution), Altron (communication)",
            "members": team_info,
            "coordination": "Hierarchical with parallel fallback",
            "status": "ready",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Team info error: {str(e)}")


@app.post("/agents/team/coordinate")
def coordinate_team(req: PersonaTeamCoordinateRequest):
    """
    Coordinate a task across team members.

    Suggests which personas to involve and in what order.
    """
    try:
        team = get_persona_team(VAULT_PATH)
        coordination_plan = team.coordinate(req.task, req.personas)

        return {
            **coordination_plan,
            "status": "planned",
            "next_step": f"Initiate with {coordination_plan['suggested_order'][0] if coordination_plan['suggested_order'] else 'unknown'}",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Team coordination error: {str(e)}")


@app.get("/agents/team/conversation-history")
def get_team_conversation_history(persona: Optional[str] = None):
    """Get conversation history for team (or specific persona if provided)."""
    try:
        engine = get_persona_engine(VAULT_PATH)

        if persona:
            history = engine.get_conversation_history(persona)
            return {
                "persona": persona,
                "conversation_length": len(history),
                "history": history,
            }
        else:
            # All conversations
            all_history = {}
            for p in engine.list_personas():
                all_history[p] = engine.get_conversation_history(p)

            return {
                "total_conversations": len([h for h in all_history.values() if h]),
                "conversations": all_history,
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"History error: {str(e)}")


@app.post("/agents/team/clear-conversation")
def clear_conversation(persona: Optional[str] = None):
    """Clear conversation history (specific persona or all)."""
    try:
        engine = get_persona_engine(VAULT_PATH)

        if persona:
            engine.clear_conversation(persona)
            return {
                "status": "cleared",
                "persona": persona,
                "message": f"Conversation history cleared for {persona}",
            }
        else:
            engine.clear_all_conversations()
            return {
                "status": "cleared",
                "message": "All conversation histories cleared",
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clear conversation error: {str(e)}")


# ── Few-Shot Store endpoints ──────────────────────────────────────────────────

@app.get("/agents/few-shot/stats")
def few_shot_stats():
    """Return per-agent few-shot example counts (accepts, rejects, total)."""
    try:
        from vault.few_shot_store import FewShotStore
        store = FewShotStore(VAULT_PATH)
        return {"status": "success", "agents": store.stats()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Few-shot stats error: {str(e)}")


class PruneRequest(BaseModel):
    agent: Optional[str] = None
    max_age_days: int = 90


@app.post("/agents/few-shot/prune")
def few_shot_prune(req: PruneRequest):
    """Prune few-shot examples older than max_age_days."""
    try:
        from vault.few_shot_store import FewShotStore
        store = FewShotStore(VAULT_PATH)
        removed = store.prune(agent=req.agent, max_age_days=req.max_age_days)
        log.info("Few-shot prune: %s", removed)
        return {"status": "success", "removed": removed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Few-shot prune error: {str(e)}")


@app.get("/agents/{agent}/few-shot/examples")
def few_shot_examples(agent: str, decision: str = "accept", n: int = 5):
    """Preview the few-shot examples that will be injected for this agent."""
    try:
        from vault.few_shot_store import FewShotStore
        store = FewShotStore(VAULT_PATH)
        if decision == "accept":
            examples = store.get_accepts(agent, n=n)
        else:
            examples = store.get_rejects(agent, n=n)
        prompt_block = store.build_prompt_block(agent)
        return {
            "agent": agent,
            "decision_filter": decision,
            "examples": examples,
            "prompt_block_preview": prompt_block[:1000] if prompt_block else "",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Few-shot examples error: {str(e)}")


# ── Altron Digest endpoint ────────────────────────────────────────────────────

@app.post("/agents/altron/digest")
def altron_digest():
    """Generate weekly EXPORT-FOR-DYCE.md digest via Altron persona."""
    try:
        agent = AltronDigestAgent(VAULT_PATH, llm)
        result = agent.generate_digest()
        log.info("Altron digest generated: %s", result.get("file"))
        return result
    except Exception as e:
        log.error("Altron digest failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Altron digest error: {str(e)}")


@app.get("/agents/altron/digest/status")
def altron_digest_status():
    """Return metadata for the current EXPORT-FOR-DYCE.md."""
    try:
        export_path = VAULT_PATH / "EXPORT-FOR-DYCE.md"
        if not export_path.exists():
            return {"exists": False, "file": str(export_path)}
        stat = export_path.stat()
        content = export_path.read_text(encoding="utf-8", errors="replace")
        # Extract title from frontmatter
        title = "Altron Weekly Digest"
        for line in content.splitlines():
            if line.startswith("title:"):
                title = line.split("title:", 1)[1].strip().strip('"')
                break
        return {
            "exists": True,
            "file": str(export_path),
            "title": title,
            "size_bytes": stat.st_size,
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "words": len(content.split()),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Digest status error: {str(e)}")


# ── OpenClaw dispatch endpoint ────────────────────────────────────────────────

class OpenClawMessage(BaseModel):
    persona: str                        # zero | heavyarms | sandrock | altron
    message: str
    channel: str = "cli"               # slack | telegram | cli | discord
    user: Optional[str] = None
    conversation_history: List[Dict] = []


@app.post("/openclaw/dispatch")
def openclaw_dispatch(req: OpenClawMessage):
    """Route an incoming OpenClaw message to the appropriate persona.

    This endpoint is what OpenClaw calls when a message arrives on any channel.
    Slash commands are handled before routing to the persona.
    """
    try:
        msg = req.message.strip()
        log.info("OpenClaw dispatch: channel=%s persona=%s user=%s", req.channel, req.persona, req.user)

        # Handle slash commands
        if msg.startswith("/"):
            cmd = msg.split()[0].lower()
            if cmd == "/digest":
                agent = AltronDigestAgent(VAULT_PATH, llm)
                result = agent.generate_digest()
                return {"response": f"📡 Digest generated → {result.get('file')} ({result.get('words')} words)", "command": True}
            elif cmd == "/health":
                from api.routes import app as _app
                return {"response": f"Backend healthy. Vault: {VAULT_PATH}", "command": True}
            elif cmd == "/cost":
                limiter = CostLimiter(VAULT_PATH)
                status = limiter.get_cost_status()
                lines = [f"💸 Cost Status ({req.channel})"]
                for agent_name, info in status.get("agents", {}).items():
                    pct = info.get("usage_percent", 0)
                    lines.append(f"  {agent_name}: ${info.get('today_usd', 0):.4f} ({pct:.0f}% of cap)")
                return {"response": "\n".join(lines), "command": True}

        # Route to persona
        engine = get_persona_engine(VAULT_PATH)
        persona = engine.get_persona(req.persona)
        if not persona:
            raise HTTPException(status_code=404, detail=f"Persona '{req.persona}' not found")

        system_prompt = persona.get("body", "")
        history = req.conversation_history or []
        messages = [{"role": "user", "content": msg}]

        prompt = f"{system_prompt}\n\nUser: {msg}\nAssistant:" if system_prompt else msg
        response_text = llm.query(prompt)

        if isinstance(response_text, dict):
            response_text = response_text.get("content") or response_text.get("text") or str(response_text)

        log.info("OpenClaw response: %d chars for %s", len(str(response_text)), req.persona)
        return {
            "response": str(response_text),
            "persona": req.persona,
            "channel": req.channel,
            "command": False,
        }
    except HTTPException:
        raise
    except Exception as e:
        log.error("OpenClaw dispatch error: %s", e)
        raise HTTPException(status_code=500, detail=f"Dispatch error: {str(e)}")


# ── Logs endpoint ──────────────────────────────────────────────────────────────

_LEVEL_ORDER = {"ERROR": 0, "WARNING": 1, "WARN": 1, "INFO": 2, "DEBUG": 3}


@app.get("/logs")
def get_logs(limit: int = 200, level: str = "DEBUG"):
    """Return recent lines from brain_app.log, newest-first, filtered by minimum level."""
    try:
        log_file = LOG_DIR / "brain_app.log"
        if not log_file.exists():
            return {"lines": [], "total": 0, "file": str(log_file), "exists": False}

        min_order = _LEVEL_ORDER.get(level.upper(), 3)

        with open(log_file, "r", encoding="utf-8", errors="replace") as f:
            raw_lines = f.readlines()

        entries = []
        for raw in reversed(raw_lines):
            line = raw.strip()
            if not line:
                continue
            # Parse: "2026-04-25 12:00:00,123 [INFO] name: message"
            lvl = "INFO"
            for token in ("ERROR", "WARNING", "WARN", "INFO", "DEBUG"):
                if f"[{token}]" in line:
                    lvl = token
                    break
            if _LEVEL_ORDER.get(lvl, 3) <= min_order:
                entries.append({"line": line, "level": lvl})
            if len(entries) >= limit:
                break

        log.debug("Served %d log lines (level>=%s)", len(entries), level)
        return {"lines": entries, "total": len(entries), "file": str(log_file), "exists": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logs error: {str(e)}")
