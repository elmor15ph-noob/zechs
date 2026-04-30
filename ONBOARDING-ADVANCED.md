# DUO Brain App — Team Onboarding Guide

> **Goal:** New team member has their own DUO instance running in under 1 hour.
> This guide strips all personal data — you point DUO at YOUR vault.

---

## What You Get

Your own DUO instance:
- **Hybrid search** across your personal Obsidian vault (vector + keyword)
- **Inbox Distiller** — nightly processing of your `00-Inbox/` captures
- **Weekly Synthesis** — Sunday evening pattern-finding across your notes
- **Agent Observability** — cost tracking, acceptance rates, health monitoring
- **OctoAgent Orchestrator** — spawn parallel agent teams for PM cycles, feature dev
- **Scheduled Tasks** — fully automated, runs while you sleep

Your data stays on your machine. No shared LLM calls, no shared vault.
*(Optional: shared LanceDB collection for project-level knowledge — see § Shared Knowledge)*

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Python | 3.11+ | https://python.org |
| Node.js | 18+ | https://nodejs.org |
| Ollama | latest | https://ollama.ai |
| Git | any | https://git-scm.com |
| Obsidian | any | https://obsidian.md (optional, but vault must exist) |
| pnpm | 8+ | `npm install -g pnpm` (for OctoAgent only) |

**API Keys (at least one):**
- [Anthropic](https://console.anthropic.com) — Claude (best quality)
- [Google AI Studio](https://aistudio.google.com) — Gemini (cheapest)
- *Or*: use `LLM_PROVIDER=ollama` for fully local, cost-free operation

---

## Step 1 — Clone & Configure (5 min)

```bash
# 1. Clone the repo
git clone <repo-url> duo-brain
cd duo-brain/BrainApp

# 2. Copy the config template
cp config.yaml .env.template

# 3. Create your .env (DO NOT commit this — it has your keys)
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your values:
```ini
# Your vault path (where your Obsidian .md files live)
VAULT_PATH=C:/Users/YourName/Documents/YourVaultName

# LLM provider (start with ollama for cost-free)
LLM_PROVIDER=ollama
LLM_MODEL=gemma3:4b

# Add API keys when ready for cloud LLMs
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
```

---

## Step 2 — Vault Setup (5 min)

DUO expects a PARA-structured Obsidian vault. If you don't have one yet:

```bash
# Create the PARA structure
mkdir -p "C:/Users/YourName/Documents/YourVault/00-Inbox"
mkdir -p "C:/Users/YourName/Documents/YourVault/01-Projects"
mkdir -p "C:/Users/YourName/Documents/YourVault/02-Areas"
mkdir -p "C:/Users/YourName/Documents/YourVault/03-Resources"
mkdir -p "C:/Users/YourName/Documents/YourVault/04-Archive"
mkdir -p "C:/Users/YourName/Documents/YourVault/05-Templates"
```

Or point `VAULT_PATH` at an existing vault — DUO adds `.lancedb/` index files but never modifies your existing notes.

---

## Step 3 — Install Dependencies (10 min)

```bash
# Pull local LLM models (needed for embeddings)
ollama pull nomic-embed-text    # ~274MB — vector embeddings
ollama pull gemma3:4b           # ~2.3GB — local inference

# Backend Python deps
cd BrainApp/backend
python -m venv venv
venv\Scripts\activate           # Windows
# source venv/bin/activate      # macOS/Linux
pip install -r requirements.txt

# Frontend JS deps
cd ../frontend
npm install
```

---

## Step 4 — Phase 1 Setup: Index Your Vault (10 min)

```bash
# Start Ollama (separate terminal, keep running)
ollama serve

# Start backend
cd BrainApp/backend
python main.py
# Wait for: "Application startup complete."

# Trigger initial vault index
curl -X POST http://localhost:8000/vault/reindex
# This runs in the background — takes 1-5 min depending on vault size
# Progress: GET http://localhost:8000/vault/index/status
```

**Verification:**
```bash
curl "http://localhost:8000/vault/search/hybrid?query=test&top_k=3"
# Should return results from your vault
```

---

## Step 5 — Start Frontend (5 min)

```bash
cd BrainApp/frontend
npm start
# Opens http://localhost:3000
```

Navigate: **Search** (Ctrl+K) → type a query from your vault → see hybrid results.

If it works, Phase 1 is complete. Your vault is searchable.

---

## Step 6 — Set Up Scheduled Tasks & Channel Integrations (5 min)

To enable Discord / Slack / Telegram routing, copy `.env.channels.example` to `.env.channels`, fill in the tokens for any channels you want active, and restart the backend — `OpenClawBridge` picks them up automatically via `backend/integrations/`.
See `openclaw/config.yaml` for persona routing rules and `backend/integrations/discord_bot.py` for a working Discord reference implementation.

Open Claude Code and run these commands to set up your automation:

```
Create a scheduled task that runs nightly at midnight to call 
POST http://localhost:8000/agents/inbox/distill and processes 
new items in my vault's 00-Inbox/ folder.
```

Or use the pre-built tasks from this repo — they're in `~/.claude/scheduled-tasks/` after setup.

---

## Step 7 — Optional: OctoAgent (10 min)

For parallel agent orchestration (PM cycles, feature teams):

```bash
# Clone OctoAgent
git clone https://github.com/hesamsheikh/octogent.git BrainApp/.octogent
cd BrainApp/.octogent

# Install
pnpm install

# Start (two terminals)
cd apps/api && pnpm dev     # API → port 8787
cd apps/web && pnpm dev     # UI  → port 5173
```

Then in DUO: **Ctrl+G** → OctoAgent tab.

---

## Folder Structure (What DUO Adds to Your Vault)

```
YourVault/
├── 00-Inbox/
│   └── _proposed/           ← Inbox distiller staging area (NEW)
├── 02-Areas/
│   └── Synthesis/           ← Weekly synthesis + scorecards (NEW)
│       ├── Weekly-Synthesis-YYYY-WXX.md
│       └── Agent-Scorecard-YYYY-WXX.md
└── .lancedb/                ← Vector index (NEW, hidden)
    ├── vault.lance/
    ├── inbox-agent-decisions.jsonl
    ├── synthesis-decisions.jsonl
    ├── agent-feedback.jsonl
    ├── scheduled-runs.jsonl
    └── few-shot-examples/
```

Everything under `.lancedb/` is auto-generated and can be safely deleted — DUO will rebuild it.

---

## Customising Your Instance

### Use a different LLM
```ini
# In backend/.env
LLM_PROVIDER=claude
LLM_MODEL=claude-haiku-4-5    # cheaper/faster
```

### Increase cost caps
```ini
AGENT_INBOX_DAILY_CAP=2.0     # Default: $1.00/day
AGENT_SYNTHESIS_DAILY_CAP=4.0 # Default: $2.00/day
```

### Disable agents you don't need
```ini
AGENT_SAP_ENABLED=false       # Disable SAP agent if not doing SAP work
AGENT_O2C_ENABLED=false       # Disable O2C if not doing order processing
```

### Change server port (if 8000 is taken)
```ini
BACKEND_PORT=8001
REACT_APP_API_URL=http://localhost:8001
```

---

## Shared Knowledge (Teams)

If your team wants shared SAP / project-level knowledge without sharing personal vaults:

1. Set up a shared network path for a shared LanceDB collection
2. Each person's `.env`:
   ```ini
   SHARED_LANCEDB_PATH=//fileserver/duo-shared/.lancedb
   SHARED_COLLECTION=shared_sap
   ```
3. Agents will search personal vault first, then fall back to shared collection
4. One person runs `POST /vault/shared/reindex` weekly to update shared docs

---

## Troubleshooting

See **[RUNBOOK.md](RUNBOOK.md)** for detailed failure scenarios.

Quick checks:
```bash
# Is backend alive?
curl http://localhost:8000/health

# Is vault indexed?
curl "http://localhost:8000/vault/search/hybrid?query=test&top_k=1"

# Are agents healthy?
curl http://localhost:8000/agents/health
```

---

## Checklist: "Am I set up?"

- [ ] `backend/.env` has my vault path
- [ ] `ollama serve` running
- [ ] `python main.py` starts without errors
- [ ] `npm start` opens DUO at localhost:3000
- [ ] Search returns results from my vault
- [ ] Inbox distiller runs without error
- [ ] Daily digest task shows in Claude Code scheduled section
- [ ] (Optional) OctoAgent running at localhost:8787

Tick all boxes → you're fully operational.

---

## Fork Pattern for New Team Members

```
1. git clone <repo>
2. cp backend/.env.example backend/.env
3. Edit VAULT_PATH + API keys in .env
4. ollama pull nomic-embed-text && ollama pull gemma3:4b
5. pip install -r backend/requirements.txt
6. cd frontend && npm install
7. python backend/main.py   (terminal 1)
8. cd frontend && npm start  (terminal 2)
9. curl -X POST localhost:8000/vault/reindex
10. Open localhost:3000 → done
```

**Time:** ~45 minutes on good internet (mostly model download time).

---

*DUO v1.0 · Phase 6 Production Hardening · 2026-04-26*
