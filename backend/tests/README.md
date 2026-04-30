# Brain App API Test Suite

Comprehensive unit and integration tests for all Brain App API endpoints.

## Quick Start

### Run All Tests
```bash
cd backend
pytest tests/test_endpoints.py -v
```

### Run Specific Test Class
```bash
pytest tests/test_endpoints.py::TestPhase4HealthEndpoint -v
```

### Run with Detailed Output
```bash
pytest tests/test_endpoints.py -vv -s
```

---

## Test Structure

### Test Classes (28 tests total)

| Class | Tests | Status | Purpose |
|-------|-------|--------|---------|
| `TestHealthEndpoint` | 3 | ✓ PASS | Core health check validation |
| `TestAgentScorecard` | 3 | 2/3 PASS | Scorecard metrics validation |
| `TestDecisionsHistory` | 3 | ✓ PASS | Decision log retrieval |
| `TestWeeklyScorecard` | 2 | ✓ PASS | Weekly aggregation |
| `TestPhase4HealthEndpoint` | 3 | 1/3 PASS | **FAILING: Endpoint routing** |
| `TestPhase4SpecificAgentHealth` | 2 | 1/2 PASS | **FAILING: Endpoint routing** |
| `TestPhase4CostStatus` | 3 | 2/3 PASS | **FAILING: Endpoint routing** |
| `TestInboxDistillerPOST` | 2 | ✓ PASS | Agent action validation |
| `TestSynthesisPOST` | 2 | ✓ PASS | Synthesis execution |
| `TestFeedbackPOST` | 2 | ✓ PASS | Feedback logging |
| `TestPhase4ScorecardGenerate` | 2 | 1/2 PASS | **FAILING: Endpoint routing** |
| `TestEndpointSummary` | 1 | ✓ PASS | Comprehensive summary |

### Test Results

**Current: 22/28 passing (78.6%)**

✓ 7 endpoints working correctly
❌ 4 endpoints returning 404 (Phase 4 routing issue)

---

## What Each Test Validates

### HTTP Status Codes
Tests verify that endpoints return expected status codes:
- 200: Success
- 201: Created
- 404: Not Found (CURRENT ISSUE for Phase 4 endpoints)
- 422: Validation Error

### Response Structure
Validates that responses contain required fields:
- Root-level fields (e.g., "timestamp", "agents", "summary")
- Nested field structure
- Data type correctness

### Field Validation
Ensures required fields are present and correctly typed:
- String fields (agent names, status values)
- Numeric fields (costs, counts, rates)
- Array fields (agents, decisions, alerts)
- Object fields (summary stats, metrics)

### Domain Logic
Tests that values make sense:
- Status values are valid: "healthy", "degrading", "broken", "unknown"
- Warning levels are valid: "ok", "warning", "critical"
- Limits respect configured bounds

---

## Running Tests Locally

### Prerequisites
```bash
pip install pytest requests
```

### Start Backend Server
```bash
cd backend
python main.py
```

### Run Tests in Another Terminal
```bash
cd backend
pytest tests/test_endpoints.py -v
```

### View Results
Test output shows:
- ✓ PASSED for working endpoints
- ✗ FAILED for broken endpoints
- Details of assertion failures

---

## Automated Weekly Testing

A scheduled task runs tests every **Sunday at 19:30 UTC**:

```bash
Job ID: weekly-endpoint-tests
Schedule: 0 19 * * 0 (Weekly, Sunday 7:30 PM)
Action: Run full test suite + generate report
```

Results are logged for trend analysis and regression detection.

---

## Test Data

### Test Payloads

**GET requests:** Use default parameters or query strings
```
/health
/agents/scorecard
/agents/decisions/history?limit=5
/agents/scorecard/weekly
/agents/health
/agents/health/Inbox%20Distiller
/agents/cost-status
```

**POST requests:** Use minimal valid payloads
```json
/agents/inbox/distill: {"query": "test"}
/agents/synthesis/weekly: {"query": "test"}
/agents/{agent}/feedback: {"decision": "accept", "comment": "test"}
/agents/scorecard/generate: {}
```

### Test Data Safety
- Tests use read-only operations (GET) where possible
- POST tests use minimal, non-destructive payloads
- No test data is persisted between runs
- Safe to run repeatedly

---

## Troubleshooting

### "Backend server is NOT running"
Start the backend before running tests:
```bash
cd backend
python main.py
```

### Tests timeout
Increase timeout or check if server is hanging:
```bash
# Increase timeout to 30 seconds
pytest tests/test_endpoints.py --timeout=30
```

### Phase 4 endpoints still failing
These are blocked by a routing issue. See:
- `/c/Users/punta/Documents/SecondBrain/ENDPOINT-DIAGNOSTICS-REPORT.md`
- Front-end integration blocked until this is fixed

### Response validation failures
May indicate schema changes. Update test assertions:
```python
# In test_endpoints.py, update assertion to match new schema
assert "new_field" in response_data
```

---

## Continuous Integration

### GitHub Actions Integration (Future)
```yaml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: cd backend && pytest tests/test_endpoints.py -v
```

### Pre-commit Hook (Future)
```bash
#!/bin/sh
# .git/hooks/pre-commit
cd backend && pytest tests/test_endpoints.py --tb=short || exit 1
```

---

## Performance Metrics

### Test Execution Time
- Full suite: ~96 seconds
- Per test: ~3 seconds average
- Parallel run: ~30 seconds (with pytest-xdist)

### Network Calls
- 11 unique endpoints tested
- 28 total HTTP requests
- No database operations

---

## Test Maintenance

### Adding New Tests
1. Create test class following naming convention: `Test<Feature>`
2. Add test methods with `test_` prefix
3. Use descriptive docstrings
4. Run full suite to verify

Example:
```python
class TestNewFeature:
    def test_new_endpoint_returns_200(self):
        """New endpoint should return 200 OK."""
        import requests
        resp = requests.get("http://localhost:8000/new/endpoint")
        assert resp.status_code == 200
```

### Updating Test Assertions
When API responses change:
1. Review change requirements
2. Update affected test assertions
3. Run tests to verify
4. Document the change

### Monitoring Test Results
- Check `TEST_REPORT.md` weekly
- Track pass rate trends
- Note any regressions
- Fix issues promptly

---

## Known Limitations

### Phase 4 Endpoint Routing
- 4 endpoints defined but not accessible via HTTP
- Functions work when called directly in Python
- Indicates FastAPI/Uvicorn initialization issue
- **BLOCKING:** Phase 4 dashboard work

### Response Schema Variance
- Some endpoints use nested "metrics" field
- Others return flat structure
- Tests handle both variants

### Timeout Behavior
- Synthesis endpoint may timeout (expected)
- Tests handle gracefully with longer timeout
- No impact on other endpoints

---

## Resources

- **Test Report:** `tests/TEST_REPORT.md`
- **Test Results:** `tests/latest_test_run.log`
- **Diagnostics:** `/c/Users/punta/Documents/SecondBrain/ENDPOINT-DIAGNOSTICS-REPORT.md`
- **Code:** `tests/test_endpoints.py`

---

## Support

For test issues or to add new tests:
1. Check this README
2. Review TEST_REPORT.md
3. Check latest_test_run.log for details
4. Examine test_endpoints.py implementation

---

**Last Updated:** 2026-04-19  
**Next Scheduled Test:** 2026-04-26 (Sunday 19:30 UTC)  
**Test Framework Version:** pytest 9.0.3
