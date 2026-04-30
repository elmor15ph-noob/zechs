# Brain App — Getting Started at Home

## What You Have

- **Backend (FastAPI)**: Configured to use local Ollama by default
- **Frontend (React)**: 5-section dashboard — Search, SAP Assistant, PM Status, Ideas, Persona Traits
- **Desktop (Electron)**: Full app with sidebar navigation and 6 tabs
- **Vault**: Connected to your local Obsidian vault (81 notes)

## Prerequisites

### 1. Install Ollama (One-time)

Download: https://ollama.ai

After installation, pull the `gemma2` model (used by default):

```bash
ollama pull gemma2
```

### 2. Start Ollama Server

In PowerShell or cmd, run:

```bash
ollama serve
```

This starts the Ollama API at `http://localhost:11434` and stays running.

## Quick Start (3 steps)

### Step 1: Start Everything

Run this batch file:

```bash
cd C:\Users\punta\Documents\SecondBrain\BrainApp
start-all.bat
```

This will:
- ✓ Check Ollama is running
- ✓ Install Python dependencies (once)
- ✓ Start backend on http://localhost:8000
- ✓ Install npm dependencies (once)
- ✓ Start React frontend on http://localhost:3000
- ✓ Start Electron desktop app

### Step 2: Verify Everything

Open http://localhost:8000/docs in your browser — you should see the API documentation and a green "health" check showing:

```json
{
  "status": "ok",
  "llm_provider": "ollama",
  "llm_model": "gemma2",
  "vault_notes": 81
}
```

### Step 3: Test Features

**Web Dashboard:**
- Search vault notes
- Ask SAP fit/gap questions
- Check PM status
- Capture business ideas
- View persona traits

**Desktop App:**
- Navigate via sidebar
- Drag-drop SAP board
- View idea mind-map
- Edit notes

## Troubleshooting

### "Ollama not running"
```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Test it
curl http://localhost:11434/api/tags
```

### "Cannot reach backend" (Frontend shows error)
```bash
# Check backend is running
curl http://localhost:8000/health

# If not, manually start it:
cd backend
python main.py
```

### "Port already in use"
```bash
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill it (replace PID)
taskkill /PID <PID> /F

# Or change BACKEND_PORT in backend/config.py
```

## LLM Configuration

Currently using **Ollama + gemma2** (local, free, no tokens).

### Switch to Claude

```bash
# Set environment variables before starting
set LLM_PROVIDER=claude
set ANTHROPIC_API_KEY=sk-ant-...

# Then run start-all.bat
```

### Switch to Gemini

```bash
set LLM_PROVIDER=gemini
set GOOGLE_API_KEY=AIza...

# Then run start-all.bat
```

### Switch to OpenAI

```bash
set LLM_PROVIDER=openai
set OPENAI_API_KEY=sk-...

# Then run start-all.bat
```

## File Locations

| Component | Location |
|-----------|----------|
| React Frontend | `frontend/` |
| FastAPI Backend | `backend/` |
| Electron Desktop | `desktop/` |
| Obsidian Vault | `C:\Users\punta\Documents\SecondBrain` |
| API Docs | http://localhost:8000/docs |

## Next Steps

1. Test the web dashboard at http://localhost:3000
2. Try searching your vault notes
3. Ask SAP questions (using Ollama backend)
4. Capture a business idea
5. Check persona traits (will show "not yet computed" until 2 weeks of sessions)

## For Future: Cloud Deployment

Once you've tested locally and everything works:
- Deploy backend to AWS/GCP/Heroku
- Deploy frontend to Vercel/Netlify
- Set `REACT_APP_API_URL` to cloud backend URL

But for now: **local Ollama is free and fast.**

---

Questions? Check `FUNCTIONAL_SPEC.md` for architecture details.
