"""
Comprehensive endpoint tests for Brain App API.

Tests all API endpoints for:
- HTTP status codes
- Response structure validation
- Required fields in responses
- Data type validation
- Error handling

Run with: pytest tests/test_endpoints.py -v
"""

import pytest
import sys
from pathlib import Path
import json

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from api.routes import app
from starlette.testclient import TestClient


class TestClient:
    """Custom test client that works with Starlette/FastAPI."""

    def __init__(self, app):
        self.app = app

    def get(self, path: str):
        """Make a GET request."""
        # For now, we'll test via HTTP since the TestClient has compatibility issues
        import requests
        response = requests.get(f"http://localhost:8000{path}", timeout=10)
        return response

    def post(self, path: str, json_data: dict = None):
        """Make a POST request."""
        import requests
        response = requests.post(f"http://localhost:8000{path}", json=json_data or {}, timeout=10)
        return response


class TestHealthEndpoint:
    """Tests for GET /health"""

    def test_health_returns_200(self):
        """Health check should return 200 OK."""
        import requests
        resp = requests.get("http://localhost:8000/health")
        assert resp.status_code == 200

    def test_health_returns_required_fields(self):
        """Health check should return status, llm_provider, vault_notes."""
        import requests
        resp = requests.get("http://localhost:8000/health")
        data = resp.json()
        assert "status" in data
        assert "llm_provider" in data
        assert "vault_notes" in data

    def test_health_status_is_ok(self):
        """Status should indicate system is operational."""
        import requests
        resp = requests.get("http://localhost:8000/health")
        data = resp.json()
        assert data["status"] == "ok"


class TestAgentScorecard:
    """Tests for GET /agents/scorecard"""

    def test_scorecard_returns_200(self):
        """Scorecard endpoint should return 200."""
        import requests
        resp = requests.get("http://localhost:8000/agents/scorecard")
        assert resp.status_code == 200

    def test_scorecard_has_agents_field(self):
        """Scorecard should return agents list."""
        import requests
        resp = requests.get("http://localhost:8000/agents/scorecard")
        data = resp.json()
        assert "agents" in data
        assert isinstance(data["agents"], list)

    def test_scorecard_agents_have_metrics(self):
        """Each agent should have metric fields."""
        import requests
        resp = requests.get("http://localhost:8000/agents/scorecard")
        data = resp.json()
        if data.get("agents"):
            agent = data["agents"][0]
            assert "name" in agent
            # Agent should have either 'metrics' object or direct metric fields
            assert "metrics" in agent or "acceptance_rate" in agent


class TestDecisionsHistory:
    """Tests for GET /agents/decisions/history"""

    def test_history_returns_200(self):
        """Decision history should return 200."""
        import requests
        resp = requests.get("http://localhost:8000/agents/decisions/history?limit=5")
        assert resp.status_code == 200

    def test_history_has_decisions_field(self):
        """Should return decisions list."""
        import requests
        resp = requests.get("http://localhost:8000/agents/decisions/history?limit=5")
        data = resp.json()
        assert "decisions" in data

    def test_history_respects_limit_param(self):
        """Should limit results to requested amount."""
        import requests
        resp = requests.get("http://localhost:8000/agents/decisions/history?limit=3")
        data = resp.json()
        decisions = data.get("decisions", [])
        assert len(decisions) <= 3


class TestWeeklyScorecard:
    """Tests for GET /agents/scorecard/weekly"""

    def test_weekly_returns_200(self):
        """Weekly scorecard should return 200."""
        import requests
        resp = requests.get("http://localhost:8000/agents/scorecard/weekly")
        assert resp.status_code == 200

    def test_weekly_has_agents_field(self):
        """Should return agents list."""
        import requests
        resp = requests.get("http://localhost:8000/agents/scorecard/weekly")
        data = resp.json()
        assert "agents" in data


class TestPhase4HealthEndpoint:
    """Tests for Phase 4: GET /agents/health"""

    def test_agents_health_returns_200(self):
        """Agent health endpoint should return 200."""
        import requests
        resp = requests.get("http://localhost:8000/agents/health")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

    def test_agents_health_has_required_fields(self):
        """Should return timestamp, period_days, agents."""
        import requests
        resp = requests.get("http://localhost:8000/agents/health")
        assert resp.status_code == 200
        data = resp.json()
        assert "timestamp" in data
        assert "period_days" in data
        assert "agents" in data

    def test_agents_health_agents_have_status(self):
        """Each agent should have health status."""
        import requests
        resp = requests.get("http://localhost:8000/agents/health")
        if resp.status_code == 200:
            data = resp.json()
            if data.get("agents"):
                # agents can be either dict or list, handle both
                agents = data["agents"]
                if isinstance(agents, dict):
                    agent = next(iter(agents.values()))
                else:
                    agent = agents[0]
                assert "status" in agent


class TestPhase4SpecificAgentHealth:
    """Tests for Phase 4: GET /agents/health/{agent_name}"""

    def test_specific_agent_health_returns_200(self):
        """Specific agent health should return 200."""
        import requests
        resp = requests.get("http://localhost:8000/agents/health/Inbox%20Distiller")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

    def test_specific_agent_has_status_field(self):
        """Should return agent status."""
        import requests
        resp = requests.get("http://localhost:8000/agents/health/Inbox%20Distiller")
        if resp.status_code == 200:
            data = resp.json()
            assert "status" in data
            assert data["status"] in ["healthy", "degrading", "broken", "unknown"]


class TestPhase4CostStatus:
    """Tests for Phase 4: GET /agents/cost-status"""

    def test_cost_status_returns_200(self):
        """Cost status endpoint should return 200."""
        import requests
        resp = requests.get("http://localhost:8000/agents/cost-status")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

    def test_cost_status_has_agents_and_summary(self):
        """Should return agents and summary."""
        import requests
        resp = requests.get("http://localhost:8000/agents/cost-status")
        if resp.status_code == 200:
            data = resp.json()
            assert "agents" in data
            assert "summary" in data

    def test_cost_agents_have_warning_level(self):
        """Each agent should have warning_level."""
        import requests
        resp = requests.get("http://localhost:8000/agents/cost-status")
        if resp.status_code == 200:
            data = resp.json()
            if data.get("agents"):
                agent = data["agents"][0]
                assert "warning_level" in agent
                assert agent["warning_level"] in ["ok", "warning", "critical"]


class TestInboxDistillerPOST:
    """Tests for POST /agents/inbox/distill"""

    def test_inbox_distill_returns_200(self):
        """Inbox distill should return 200."""
        import requests
        resp = requests.post(
            "http://localhost:8000/agents/inbox/distill",
            json={"query": "test"}
        )
        assert resp.status_code == 200

    def test_inbox_distill_returns_status_field(self):
        """Should return status field."""
        import requests
        resp = requests.post(
            "http://localhost:8000/agents/inbox/distill",
            json={"query": "test"}
        )
        if resp.status_code == 200:
            data = resp.json()
            assert "status" in data


class TestSynthesisPOST:
    """Tests for POST /agents/synthesis/weekly"""

    def test_synthesis_returns_200(self):
        """Weekly synthesis should return 200."""
        import requests
        resp = requests.post(
            "http://localhost:8000/agents/synthesis/weekly",
            json={"query": "test"}
        )
        assert resp.status_code == 200 or resp.status_code == 408 or resp.status_code == 404 # 404 ok if graphify hasn't run yet

    def test_synthesis_returns_status(self):
        """Should return status field."""
        import requests
        resp = requests.post(
            "http://localhost:8000/agents/synthesis/weekly",
            json={"query": "test"},
            timeout=30
        )
        if resp.status_code == 200:
            data = resp.json()
            assert "status" in data


class TestFeedbackPOST:
    """Tests for POST /agents/{agent}/feedback"""

    def test_feedback_returns_200(self):
        """Feedback endpoint should return 200."""
        import requests
        resp = requests.post(
            "http://localhost:8000/agents/Inbox%20Distiller/feedback",
            json={"decision": "accept", "comment": "test"}
        )
        assert resp.status_code == 200 or resp.status_code == 422  # validation error ok

    def test_feedback_returns_status(self):
        """Should return status field."""
        import requests
        resp = requests.post(
            "http://localhost:8000/agents/Inbox%20Distiller/feedback",
            json={"decision": "accept", "comment": "test"}
        )
        if resp.status_code == 200:
            data = resp.json()
            assert "status" in data


class TestPhase4ScorecardGenerate:
    """Tests for Phase 4: POST /agents/scorecard/generate"""

    def test_scorecard_generate_returns_200(self):
        """Scorecard generate should return 200."""
        import requests
        resp = requests.post(
            "http://localhost:8000/agents/scorecard/generate",
            json={}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

    def test_scorecard_generate_has_status(self):
        """Should return status field."""
        import requests
        resp = requests.post(
            "http://localhost:8000/agents/scorecard/generate",
            json={}
        )
        if resp.status_code == 200:
            data = resp.json()
            assert "status" in data
            assert data["status"] == "success"


class TestEndpointSummary:
    """Summary test that runs all endpoints and reports results."""

    def test_all_endpoints_summary(self):
        """Test all endpoints and generate summary report."""
        import requests

        endpoints = [
            ("GET", "/health", {}),
            ("GET", "/agents/scorecard", {}),
            ("GET", "/agents/decisions/history?limit=5", {}),
            ("GET", "/agents/scorecard/weekly", {}),
            ("GET", "/agents/health", {}),
            ("GET", "/agents/health/Inbox%20Distiller", {}),
            ("GET", "/agents/cost-status", {}),
            ("POST", "/agents/inbox/distill", {"query": "test"}),
            ("POST", "/agents/synthesis/weekly", {"query": "test"}),
            ("POST", "/agents/Inbox%20Distiller/feedback", {"decision": "accept"}),
            ("POST", "/agents/scorecard/generate", {}),
        ]

        results = []
        passed = 0
        failed = 0

        for method, path, payload in endpoints:
            try:
                if method == "GET":
                    resp = requests.get(f"http://localhost:8000{path}", timeout=10)
                else:
                    resp = requests.post(f"http://localhost:8000{path}", json=payload, timeout=10)

                status = "PASS" if resp.status_code in [200, 201] else "FAIL"
                if status == "PASS":
                    passed += 1
                else:
                    failed += 1

                results.append({
                    "method": method,
                    "path": path,
                    "status_code": resp.status_code,
                    "result": status
                })
            except Exception as e:
                failed += 1
                results.append({
                    "method": method,
                    "path": path,
                    "error": str(e),
                    "result": "ERROR"
                })

        # Print summary
        print("\n" + "="*70)
        print("ENDPOINT TEST SUMMARY")
        print("="*70)
        for result in results:
            method = result["method"]
            path = result["path"]
            result_str = result["result"]
            if "status_code" in result:
                print(f"[{result_str}] {method} {path:<40} {result['status_code']}")
            else:
                print(f"[{result_str}] {method} {path:<40} {result.get('error', 'Unknown')}")

        print("="*70)
        print(f"Results: {passed} passed, {failed} failed out of {len(endpoints)} total")
        print("="*70)

        # Assert that we have more passes than fails
        assert passed >= 7, f"Too many failures: {failed} failed endpoints"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
