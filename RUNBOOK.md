# DUO Brain App — Operations Runbook

> **Who this is for:** Anyone running DUO (Jay, BJ, team). Read this when something breaks.
> Last updated: 2026-04-26

---

## Quick Reference

| Symptom | Jump to |
|---------|---------|
| Backend won't start | [§ Backend startup failures](#backend-startup-failures) |
| Agents not running / silent | [§ Kill switch](#kill-switch-fired) |
| LLM calls failing / expensive | [§ LLM provider failures](#llm-provider-failures) |
| Inbox distiller doing nothing | [§ Inbox distiller stalled](#inbox-distiller-stalled) |
| Weekly synthesis empty | [§ Weekly synthesis empty](#weekly-synthesis-empty) |
| Cost cap hit / agent disabled | [§ Cost cap exceeded](#cost-cap-exceeded) |
| LanceDB / vector search broken | [§ LanceDB corruption](#lancedb-corruption) |
| OctoAgent terminals hanging | [§ OctoAgent issues](#octoagent-issues) |
| Scheduled tasks not firing | [§ Scheduled tasks not firing](#scheduled-tasks-not-firing) |
| Frontend blank / API 404 | [§ Frontend issues](#frontend-issues) |

---

## Backend Startup Failures

### Symptom
`python main.py` exits immediately or throws an ImportError.

### Causes & Fixes

**Missing dependency**
```
ModuleNotFoundError: No module named 'lancedb'
```
Fix:
```bash
cd BrainApp/backend
pip install -r requirements.txt
# Or selectively:
pip install lancedb watchdog sentence-transformers
```

**Port already in use**
```
ERROR: [Errno 10048] address already in use
```
Fix:
```bash
# Find and kill the process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
# Or change port:
# In .env: BACKEND_PORT=8001
```

**Bad .env**
```
pydantic_settings.main.SettingsError: error parsing value for field ...
```
Fix: copy `.env.example` → `.env`, fill in your values.

**Vault path missing**
```
FileNotFoundError: [Errno 2] No such file or directory: 'C:/Users/.../SecondBrain'
```
Fix: set `VAULT_PATH` in `.env` to your actual Obsidian vault directory.

---

## Kill Switch Fired

### Symptom
Agent call returns immediately with `AgentDisabledError` or API responds:
```json
{"detail": "[KillSwitch] InboxDistiller is disabled."}
```

### Cause
`AGENT_INBOX_ENABLED=false` (or similar) is set in `.env`.

### Fix
```bash
# In BrainApp/backend/.env
AGENT_INBOX_ENABLED=true      # Re-enable inbox distiller
AGENT_SYNTHESIS_ENABLED=true  # Re-enable weekly synthesis
# etc.
```
Restart backend after changing `.env` if `BACKEND_RELOAD=false`.

### When to USE kill switches (intentionally)
- Agent is burning cost on bad outputs → disable while fixing prompts
- Scheduled task is running in a loop → disable to stop it
- Testing a new agent version → disable old one first
- Going on leave → disable all non-essential agents

---

## LLM Provider Failures

### Symptom
Agents return errors mentioning API timeouts, 429 (rate limit), or 503.

### Causes & Fixes

**Gemini 429 — quota exceeded**
```
google.api_core.exceptions.ResourceExhausted: 429 Quota exceeded
```
Fix: switch to Claude fallback in `.env`:
```
LLM_PROVIDER=claude
LOAD_BALANCE=false
```

**Claude 529 — overloaded**
Anthropic occasionally returns 529 under high load.
Fix: the `BaseAgent._call_with_retry()` method handles this automatically (3 retries, exponential backoff). If it persists:
```
LLM_PROVIDER=gemini
```

**Ollama not running**
```
httpx.ConnectError: All connection attempts failed
```
Fix:
```bash
ollama serve   # Start Ollama in a separate terminal
ollama pull nomic-embed-text  # For vector embeddings
ollama pull gemma3:4b         # For local LLM fallback
```

**API key expired / missing**
Check `.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
```
Rotate keys at: https://console.anthropic.com / https://aistudio.google.com

---

## Inbox Distiller Stalled

### Symptom
`00-Inbox/` has items but `00-Inbox/_proposed/` is empty. Agent runs but produces nothing.

### Checks

1. **Check decision log:**
   ```bash
   tail -20 "C:/Users/punta/Documents/SecondBrain/.lancedb/inbox-agent-decisions.jsonl"
   ```
   Look for `"error": "..."` entries.

2. **Check kill switch:**
   ```bash
   curl http://localhost:8000/agents/health/InboxDistiller
   ```

3. **Check cost cap:**
   ```bash
   curl http://localhost:8000/agents/cost-status
   ```
   If `can_proceed: false` → cap hit for the day, resets midnight.

4. **Run manually:**
   ```bash
   curl -X POST http://localhost:8000/agents/inbox/distill \
     -H "Content-Type: application/json" \
     -d '{"query": "process inbox", "max_items": 5}'
   ```

### Common Root Causes
- **Ollama not running** → embeddings fail → hybrid search returns no context → LLM produces poor output → parse error → nothing written
- **Inbox items have no `.md` extension** — distiller only processes `.md` files
- **Items already in `_proposed/`** — distiller skips items it already processed (checks slug collision)
- **LLM JSON parse error** — check `parse_error` field in decisions log

---

## Weekly Synthesis Empty

### Symptom
`02-Areas/Synthesis/Weekly-Synthesis-YYYY-WXX.md` not written, or written with "No patterns found."

### Checks

1. **Vault graph stale:**
   ```bash
   curl http://localhost:8000/vault/graph/stats
   ```
   If `last_built` > 7 days ago, rebuild:
   ```bash
   curl -X POST http://localhost:8000/vault/graph/rebuild
   ```

2. **Not enough notes** — synthesis needs ≥20 notes to find non-trivial patterns.

3. **Manual trigger:**
   ```bash
   curl -X POST http://localhost:8000/agents/synthesis/run \
     -H "Content-Type: application/json" \
     -d '{"query": "weekly synthesis", "use_graph": true}'
   ```

4. **Fallback synthesis** — if graph unavailable, synthesis falls back to direct vault scan. Check `synthesis-decisions.jsonl` for `"fallback": true`.

---

## Cost Cap Exceeded

### Symptom
`GET /agents/cost-status` shows `can_proceed: false`. Agents return:
```json
{"detail": "Cost cap exceeded for InboxDistiller. Spent $1.05/$1.00 today."}
```

### Fix (short-term)
Caps reset at midnight UTC. Wait or temporarily raise the cap:

In `observability/cost_limiter.py` adjust:
```python
DAILY_CAPS = {
    "Inbox Distiller": 2.0,    # was 1.0
    "Weekly Synthesis": 4.0,   # was 2.0
}
```

### Fix (investigate why cap hit)
```bash
# Check what's burning cost
tail -50 ".lancedb/inbox-agent-decisions.jsonl" | python3 -c "
import sys, json
for line in sys.stdin:
    d = json.loads(line)
    print(d.get('timestamp','')[:16], d.get('cost_usd', 0), d.get('llm',{}).get('model',''))
"
```
Likely causes: expensive model (Claude Sonnet instead of Haiku), very long context, repeated runs.

---

## LanceDB Corruption

### Symptom
```
lancedb.exceptions.LanceDBException: Cannot read index
```
or vector search returning empty results despite notes existing.

### Fix

**Rebuild the entire index (safe — non-destructive to vault notes):**
```bash
curl -X POST http://localhost:8000/vault/reindex
```

**Manual rebuild:**
```bash
cd BrainApp/backend
python3 -c "
from vault.indexer import VaultIndexer
from pathlib import Path
idx = VaultIndexer(Path('C:/Users/punta/Documents/SecondBrain'))
idx.rebuild()
print('Done')
"
```

**Nuclear option (if corrupt):**
```bash
# Deletes index — data in vault .md files is safe
rd /s /q "C:\Users\punta\Documents\SecondBrain\.lancedb\vault.lance"
# Then rebuild via API above
```

---

## OctoAgent Issues

### Symptom
OctoAgent dashboard shows 0 tentacles, or terminals stuck in "running".

### OctoAgent not running
The OctoGent Live tab iframe will show "not running" panel.
```bash
# Start OctoAgent (from BrainApp/.octogent/)
cd .octogent/apps/api && pnpm dev    # API → port 8787
cd .octogent/apps/web && pnpm dev    # UI  → port 5173
```
Ctrl+G in DUO → OctoAgent tab → "OctoGent Live (:5173)" tab shows the full UI.

### Terminals stuck in "running"
OctoAgent sometimes doesn't clean up PTY sessions.
Fix: restart OctoAgent (`Ctrl+C` both processes, restart above).

### Spawn fails (API timeout)
```bash
curl -X POST http://localhost:8787/api/terminals \
  -H "Content-Type: application/json" \
  -d '{"name": "test", "workspaceMode": "shared", "agentProvider": "claude-code"}'
```
If 404/503 → OctoAgent API is down (port 8787 not responding).

The DUO orchestration endpoints (`/orchestration/*`) gracefully fall back to local file state when OctoAgent is unavailable — **no data is lost**.

---

## Scheduled Tasks Not Firing

### Symptom
`daily-agent-digest`, `inbox-distiller-nightly`, etc. haven't run at expected time.

### Check
Look in the Claude Code sidebar → Scheduled section. Each task shows `lastRunAt`.

Also check the run log:
```bash
type "C:\Users\punta\Documents\SecondBrain\.lancedb\scheduled-runs.jsonl"
```

### Common causes

**Claude Code / desktop app was closed** — scheduled tasks only fire when the app is running. Start Claude Code before leaving for the day.

**Backend was down when task fired** — tasks log `"status": "skipped"` if the API returns connection refused. The task will retry on next schedule.

**Task disabled** — check the Scheduled section in sidebar; toggle enabled back on.

### Manual trigger
Any scheduled task can be run on-demand from the Claude Code sidebar by clicking "Run now".

---

## Frontend Issues

### Blank screen / white page
```bash
# Check frontend is running
cd BrainApp/frontend && npm start
# Should open http://localhost:3000
```

### API 404 errors in browser console
Backend URL mismatch. Check `frontend/src/` fetches use `http://localhost:8000`.

In `.env`: `REACT_APP_API_URL=http://localhost:8000`
Then rebuild: `npm run build`

### "Connection failed. Is backend running on port 8000?"
Start backend:
```bash
cd BrainApp/backend && python main.py
```

### OctoAgent tab shows "not running"
Expected if OctoAgent isn't started. Use the **Orchestrator** sub-tab (left tab) which works without OctoAgent. Start OctoAgent if you need live terminal view.

---

## Full Restart Sequence

When everything seems broken, restart in this order:

```bash
# 1. Kill everything
taskkill /F /IM python.exe    # backend
taskkill /F /IM node.exe      # frontend + OctoAgent

# 2. Start Ollama (if using local LLMs)
ollama serve

# 3. Start backend
cd C:\Users\punta\Documents\SecondBrain\BrainApp\backend
python main.py

# 4. Start frontend (separate terminal)
cd C:\Users\punta\Documents\SecondBrain\BrainApp\frontend
npm start

# 5. (Optional) Start OctoAgent
cd C:\Users\punta\Documents\SecondBrain\BrainApp\.octogent\apps\api
pnpm dev
# (another terminal)
cd C:\Users\punta\Documents\SecondBrain\BrainApp\.octogent\apps\web
pnpm dev
```

Or use the convenience script:
```bash
cd C:\Users\punta\Documents\SecondBrain\BrainApp
start-all.bat
```

---

## Health Check Endpoints

| Endpoint | What it checks |
|----------|---------------|
| `GET /health` | Backend alive |
| `GET /agents/health` | All agents: error rate, acceptance rate, latency |
| `GET /agents/cost-status` | Per-agent spend vs cap |
| `GET /agents/scorecard/weekly` | Weekly performance metrics |
| `GET /orchestration/status` | GLIDEPATH phase + active tentacles |
| `GET /vault/search/hybrid?query=test&top_k=3` | LanceDB + BM25 working |

Quick full health check:
```bash
for endpoint in /health /agents/health /agents/cost-status; do
  echo "--- $endpoint ---"
  curl -s http://localhost:8000$endpoint | python3 -m json.tool 2>/dev/null || echo "FAILED"
done
```

---

## Logs & Debugging

| File | What's in it |
|------|-------------|
| `.lancedb/inbox-agent-decisions.jsonl` | Every inbox distiller decision |
| `.lancedb/synthesis-decisions.jsonl` | Every synthesis run |
| `.lancedb/agent-feedback.jsonl` | All accept/reject feedback |
| `.lancedb/scheduled-runs.jsonl` | All scheduled task run outcomes |
| `.lancedb/few-shot-examples/` | Per-agent RLHF examples |
| `BrainApp/logs/` | FastAPI access logs |
| `.octogent/tentacles/*/transcript.log` | OctoAgent session transcripts |

---

*Runbook maintained by: Jay / DUO team · v1.0 · 2026-04-26*
