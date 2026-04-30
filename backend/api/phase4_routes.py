"""Phase 4 Observability Routes - Explicit registration.

These routes are defined separately to avoid registration issues
and are explicitly added to the main app in main.py.
"""

from fastapi import HTTPException
from pathlib import Path

VAULT_PATH = Path().cwd().parent


def setup_phase4_routes(app):
    """Register all Phase 4 routes on the provided app instance."""

    @app.get("/agents/health")
    def get_agents_health(days_back: int = 7):
        """Get health status for all agents."""
        try:
            from observability.health import AgentHealthMonitor
            from config import VAULT_PATH as CONFIG_VAULT_PATH

            monitor = AgentHealthMonitor(CONFIG_VAULT_PATH)
            health_report = monitor.get_all_agent_health(days_back=days_back)
            return health_report
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Health check error: {str(e)}")

    @app.get("/agents/health/{agent_name}")
    def get_agent_health(agent_name: str, days_back: int = 7):
        """Get health status for a specific agent."""
        try:
            from observability.health import AgentHealthMonitor
            from config import VAULT_PATH as CONFIG_VAULT_PATH

            monitor = AgentHealthMonitor(CONFIG_VAULT_PATH)
            health_status = monitor.get_agent_health(agent_name, days_back=days_back)
            return health_status
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Health check error: {str(e)}")

    @app.get("/agents/cost-status")
    def get_cost_status():
        """Get cost status with warnings for all agents."""
        try:
            from datetime import datetime
            from observability.cost_limiter import CostLimiter
            from config import VAULT_PATH as CONFIG_VAULT_PATH

            limiter = CostLimiter(CONFIG_VAULT_PATH)

            inbox_can_proceed, inbox_status = limiter.check_cost_limit("Inbox Distiller")
            inbox_spent = inbox_status.get("spent", 0.0)
            inbox_limit = inbox_status.get("limit", 1.0)

            synthesis_can_proceed, synthesis_status = limiter.check_cost_limit("Weekly Synthesis")
            synthesis_spent = synthesis_status.get("spent", 0.0)
            synthesis_limit = synthesis_status.get("limit", 2.0)

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

    @app.post("/agents/scorecard/generate")
    def generate_scorecard_note():
        """Generate weekly scorecard as a markdown note in the vault."""
        try:
            from observability.scorecard import ScorecardGenerator
            from config import VAULT_PATH as CONFIG_VAULT_PATH

            generator = ScorecardGenerator(CONFIG_VAULT_PATH)
            scorecard_file = generator.generate_scorecard_note(weeks_back=1)
            return {
                "status": "success",
                "message": "Weekly scorecard generated",
                "file": scorecard_file.name,
                "path": str(scorecard_file.relative_to(CONFIG_VAULT_PATH)),
                "full_path": str(scorecard_file)
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Scorecard generation error: {str(e)}")

    print("[Phase4] All Phase 4 routes registered successfully")
    return app
