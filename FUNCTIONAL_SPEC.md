# Brain App — Functional Specification
## LLM-Agnostic, Future-Proof, Scalable Architecture

**Version:** 1.0  
**Date:** 2026-04-18  
**Status:** In Development (Phase 1 + Phase 2 parallel)

---

## Executive Summary

Brain App is a cross-device knowledge system that makes your Obsidian vault accessible from work laptop (browser), home desktop (native app), and phone (mobile web). The system is designed to be **LLM-agnostic** (works with Claude, OpenAI, local Ollama), **future-proof** (microservices-ready), and **scalable** (cloud-ready when needed).

**3 Phases:**
- **Phase 1 (4 weeks):** Web dashboard + cloud sync (accessible from office browser)
- **Phase 2 (4 weeks, parallel):** Desktop native app (rich UI for complex work)
- **Phase 3 (later):** Email interface (async fallback when home is off)

---

## Architecture Overview

### High-Level Components

```
┌─────────────────────────────────────────────┐
│ Cloud Sync Layer                           │
│ Obsidian Sync OR GitHub Actions            │
└────────────┬────────────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
┌──────────┐   ┌──────────────┐
│ Phone    │   │ Home Desktop │
│ (Mobile) │   │              │
└──────────┘   ├──────────────┤
               │ Backend      │ ← FastAPI (Python)
               │ + Vault      │ ← Reads local vault
               │              │
               ├──────────────┤
               │ Frontend     │ ← React (web)
               │ (Port 3000)  │ ← Responsive design
               │              │
               ├──────────────┤
               │ Desktop App  │ ← Electron
               │              │ ← Rich UI
               └──────────────┘

┌─────────────────────────────────────────────┐
│ Office (Work Laptop)                        │
│ → Cloudflare Tunnel → Home Desktop Backend  │
│ → HTTPS Public URL                          │
└─────────────────────────────────────────────┘
```

---

## Abstraction Layer: LLM-Agnostic Design

### Problem
If we hard-code Claude API calls, the system is locked to Anthropic. Future upgrades to OpenAI, local models, or new LLMs require rewriting.

### Solution: LLM Provider Interface

**Backend defines an abstract LLM interface:**

```python
# backend/llm/base.py
from abc import ABC, abstractmethod

class LLMProvider(ABC):
    """Abstract base for any LLM (Claude, OpenAI, Ollama, etc.)"""
    
    @abstractmethod
    def query(self, prompt: str, system: str = None, temperature: float = 0.7) -> str:
        """Send a query, get a response."""
        pass
    
    @abstractmethod
    def get_model_name(self) -> str:
        """Return model identifier."""
        pass

# Concrete implementations:
# - backend/llm/claude.py (Anthropic SDK)
# - backend/llm/openai.py (OpenAI SDK)
# - backend/llm/ollama.py (Local Ollama)

class ClaudeProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet"):
        self.client = Anthropic(api_key=api_key)
        self.model = model
    
    def query(self, prompt: str, system: str = None, temperature: float = 0.7) -> str:
        msg = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            system=system or "You are a helpful assistant.",
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature
        )
        return msg.content[0].text

class OllamaProvider(LLMProvider):
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "gemma2"):
        self.base_url = base_url
        self.model = model
    
    def query(self, prompt: str, system: str = None, temperature: float = 0.7) -> str:
        import requests
        resp = requests.post(f"{self.base_url}/api/generate", json={
            "model": self.model,
            "prompt": prompt,
            "system": system or "You are a helpful assistant.",
            "temperature": temperature,
            "stream": False
        })
        return resp.json()["response"]
```

**Backend uses the interface, not concrete implementations:**

```python
# backend/agents/sap_agent.py
from backend.llm.base import LLMProvider

class SAPAgent:
    def __init__(self, llm: LLMProvider, vault_reader):
        self.llm = llm
        self.vault_reader = vault_reader
    
    def analyze_fit_gap(self, requirements: str) -> str:
        vault_context = self.vault_reader.search("SAP patterns")
        prompt = f"Given these SAP patterns:\n{vault_context}\n\nAnalyze: {requirements}"
        return self.llm.query(prompt, system="You are a SAP expert.")
```

**Configuration (environment):**
```python
# backend/config.py
import os

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "claude")  # claude, openai, ollama
LLM_API_KEY = os.getenv("ANTHROPIC_API_KEY")  # or OPENAI_API_KEY
LLM_MODEL = os.getenv("LLM_MODEL", "claude-3-5-sonnet")

# Factory
def get_llm_provider() -> LLMProvider:
    if LLM_PROVIDER == "claude":
        return ClaudeProvider(api_key=LLM_API_KEY, model=LLM_MODEL)
    elif LLM_PROVIDER == "openai":
        return OpenAIProvider(api_key=LLM_API_KEY, model=LLM_MODEL)
    elif LLM_PROVIDER == "ollama":
        return OllamaProvider(model=LLM_MODEL)
    else:
        raise ValueError(f"Unknown provider: {LLM_PROVIDER}")
```

**Benefits:**
- ✅ Switch LLMs by changing environment variable
- ✅ No code changes needed for new providers
- ✅ Easy testing (mock LLMProvider)
- ✅ Future-proof (add GPT-5, Claude 5, etc. as new classes)
- ✅ Scalable (LLM is injected dependency, not global)

---

## Backend Architecture

### Folder Structure
```
backend/
├── __init__.py
├── config.py                 # Configuration (API keys, LLM provider)
├── main.py                   # FastAPI app entry
├── llm/
│   ├── __init__.py
│   ├── base.py              # Abstract LLMProvider
│   ├── claude.py            # Claude implementation
│   ├── openai.py            # OpenAI implementation
│   ├── ollama.py            # Local Ollama implementation
├── vault/
│   ├── __init__.py
│   ├── reader.py            # Read .md files, parse frontmatter
│   ├── search.py            # BM25 + semantic search
│   └── cache.py             # Caching (memory + optional Redis)
├── agents/
│   ├── __init__.py
│   ├── base.py              # Base agent class
│   ├── sap_agent.py         # SAP fit/gap analysis
│   ├── pm_agent.py          # PM status + RAG
│   └── synthesis_agent.py   # Weekly synthesis
├── api/
│   ├── __init__.py
│   ├── routes.py            # FastAPI routes
│   ├── models.py            # Pydantic models (request/response)
│   └── middleware.py        # CORS, logging, auth
└── tests/
    ├── test_vault.py
    ├── test_agents.py
    └── test_llm.py
```

### Key Modules

**1. Vault Reader** (`backend/vault/reader.py`)
```python
class VaultReader:
    def __init__(self, vault_path: str):
        self.vault_path = Path(vault_path)
        self.cache = {}
    
    def get_all_notes(self) -> List[Dict]:
        """Load all .md files with frontmatter."""
        notes = []
        for md_file in self.vault_path.rglob("*.md"):
            with open(md_file) as f:
                content = f.read()
                # Parse frontmatter + body
                frontmatter, body = self._parse_markdown(content)
                notes.append({
                    "path": str(md_file.relative_to(self.vault_path)),
                    "frontmatter": frontmatter,
                    "body": body,
                    "timestamp": md_file.stat().st_mtime
                })
        return notes
    
    def search(self, query: str, limit: int = 5) -> List[Dict]:
        """BM25 + semantic search."""
        # Implementation in backend/vault/search.py
        pass
```

**2. Agents** (`backend/agents/sap_agent.py`)
```python
class SAPAgent:
    def __init__(self, llm: LLMProvider, vault_reader: VaultReader):
        self.llm = llm
        self.vault = vault_reader
    
    def analyze_fit_gap(self, requirements: str) -> str:
        """Analyze customer requirements against SAP patterns."""
        patterns = self.vault.search("SAP fit gap patterns", limit=5)
        context = "\n".join([p["body"] for p in patterns])
        
        prompt = f"""You are a SAP expert. Given these SAP patterns:
{context}

Analyze these requirements:
{requirements}

Provide:
1. Fit (what SAP can do as-is)
2. Config (what needs configuration)
3. Gap (what needs custom development)
4. Out of Scope (what SAP can't do)

Format as JSON."""
        
        return self.llm.query(prompt, system="You are an expert SAP architect.")
```

**3. FastAPI Routes** (`backend/api/routes.py`)
```python
from fastapi import FastAPI
from backend.llm.base import get_llm_provider
from backend.vault.reader import VaultReader
from backend.agents.sap_agent import SAPAgent

app = FastAPI()

# Dependencies
vault = VaultReader("/path/to/vault")
llm = get_llm_provider()
sap_agent = SAPAgent(llm, vault)

@app.get("/health")
def health():
    return {"status": "ok", "llm_provider": llm.get_model_name()}

@app.get("/vault/search")
def search_vault(q: str, limit: int = 5):
    results = vault.search(q, limit=limit)
    return {"query": q, "results": results}

@app.post("/agents/sap/analyze")
def sap_analyze(requirements: str):
    analysis = sap_agent.analyze_fit_gap(requirements)
    return {"analysis": analysis}

@app.get("/agents/pm/status")
def pm_status():
    # Load from decision logs, compute RAG status
    pass

@app.post("/ideas/capture")
def capture_idea(title: str, description: str):
    # Save to vault as new idea note
    pass
```

---

## Frontend Architecture

### Folder Structure
```
frontend/
├── public/
├── src/
│   ├── index.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── Dashboard.tsx          # Main 5-section layout
│   │   ├── Search.tsx             # Vault search + display
│   │   ├── SAPAssistant.tsx       # Chat-like SAP agent
│   │   ├── PMStatus.tsx           # Portfolio health, RAG
│   │   ├── BusinessIdeas.tsx      # Idea capture + list
│   │   ├── PersonaTraits.tsx      # Display persona metrics
│   │   └── common/                # Buttons, cards, layout
│   ├── hooks/
│   │   ├── useVaultSearch.ts      # Search hook
│   │   ├── useSAPAgent.ts         # SAP agent hook
│   │   └── useAPI.ts              # Generic API hook
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces
│   ├── styles/
│   │   └── index.css              # Tailwind
│   └── utils/
│       └── api.ts                 # Fetch wrapper
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

### Key Components

**Dashboard.tsx** (5 sections)
```tsx
export function Dashboard() {
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <SearchSection />
      <SAPAssistant />
      <PMStatus />
      <BusinessIdeas />
      <PersonaTraits />
    </div>
  );
}
```

**Responsive Design:**
- Desktop (1280px+): 2-3 columns
- Tablet (768px): 1-2 columns
- Mobile (375px): 1 column, stacked

---

## Desktop App Architecture (Electron)

### Folder Structure
```
desktop/
├── main.ts                   # Electron main process
├── preload.ts                # IPC bridge
├── src/
│   ├── App.tsx              # Electron app
│   ├── components/
│   │   ├── SAPBoard.tsx     # Drag-drop fit/gap board
│   │   ├── IdeaCanvas.tsx   # Mind-map idea canvas
│   │   ├── PMDashboard.tsx  # Gantt + risk heatmap
│   │   ├── NoteEditor.tsx   # Edit vault notes
│   │   ├── AgentButtons.tsx # Trigger buttons
│   │   └── PersonaWidget.tsx
│   └── styles/
├── package.json
└── webpack.config.js
```

**Why Electron first (not native):**
- Reuse React code from Phase 1
- Faster MVP (4 weeks vs 8 weeks for Swift/C#)
- Cross-platform (Mac + Windows)
- Can migrate to native later if needed

---

## Data Flow

### Scenario 1: SAP Query from Office

```
1. User at office opens browser
   https://mybrain.yourname.workers.dev

2. Frontend sends query to backend
   POST /agents/sap/analyze
   {
     "requirements": "How to handle split billing?"
   }

3. Backend (home desktop):
   - LLM provider: Claude (via Anthropic SDK)
   - Vault reader: Search "SAP billing patterns"
   - SAP agent: Query LLM with context
   - Return JSON response

4. Frontend displays result
   Fit: "SAP billing module can handle multi-level bills"
   Config: "Requires configuration of billing variants"
   Gap: "Custom logic for revenue recognition timing"
```

### Scenario 2: Capture Idea from Phone

```
1. User on phone opens same URL
   https://mybrain.yourname.workers.dev (mobile view)

2. Click "New Idea"
   Enter: Title, Problem, Solution, Market, GTM, Risks

3. Frontend: POST /ideas/capture
   Backend: Create new .md in vault/05-Ideas/

4. Next sync: Obsidian syncs new file to cloud
   Phone Obsidian app sees it (if subscribed)
```

### Scenario 3: Desktop App SAP Board

```
1. User on home desktop opens Electron app

2. Click "Load Customer Requirements"
   - Load from vault notes or paste

3. Drag requirements into columns:
   Fit | Config | Gap | Out

4. Click "Analyze with Agent"
   - Electron IPC → Backend: /agents/sap/analyze
   - LLM analyzes, returns suggestions
   - Update board with patterns

5. Save analysis to vault
   - Electron writes markdown to vault
   - Vault syncs to cloud
```

---

## Data Storage

### Vault Structure (Already exists)
```
SecondBrain/
├── 01-Index/
├── 02-Areas/
│   ├── GLIDEPATH-Autonomous-Knowledge-System.md
│   ├── SAP Patterns/
│   └── PM Work/
├── 03-Resources/
├── 04-Archives/
├── 05-Templates/
└── BrainApp/          # NEW: App code + logs
    ├── backend/
    ├── frontend/
    ├── desktop/
    └── logs/          # NEW: Session logs, decision logs
        ├── session_decisions.jsonl
        ├── search_queries.jsonl
        └── agent_calls.jsonl
```

### Logging
All interactions logged for observability:
- `session_decisions.jsonl`: Every session (phase adherence, complexity)
- `search_queries.jsonl`: Every vault search (query, results, latency)
- `agent_calls.jsonl`: Every agent call (input, output, LLM used, cost)

**Benefits:**
- Understand what queries are popular
- Optimize which LLM to use (Claude for reasoning, Ollama for simple searches)
- Cost tracking (OpenAI vs Claude pricing)

---

## Phase 1 Breakdown (4 weeks)

### Week 1: Backend Setup + Vault Reader
- [ ] Create FastAPI app skeleton
- [ ] Implement LLM provider abstraction (Claude + Ollama)
- [ ] Build vault reader (load all .md files)
- [ ] Implement BM25 search
- [ ] Test vault reading on home desktop

### Week 2: Frontend Dashboard UI
- [ ] React app skeleton (TypeScript)
- [ ] Dashboard layout (5 sections)
- [ ] Component stubs (Search, SAP, PM, Ideas, Traits)
- [ ] Tailwind styling
- [ ] Mobile responsive design

### Week 3: API Integration + SAP Agent
- [ ] Wire frontend ↔ backend (API calls)
- [ ] Implement SAP agent (/agents/sap/analyze)
- [ ] Implement PM agent (/agents/pm/status)
- [ ] Implement search (vault search + display)
- [ ] Test on localhost

### Week 4: Cloudflare Tunnel + Mobile Testing
- [ ] Setup Cloudflare Tunnel (public URL)
- [ ] Test office access from browser
- [ ] Mobile responsive testing
- [ ] Obsidian Sync testing (phone access)
- [ ] Deploy to localhost, test end-to-end

---

## Phase 2 Breakdown (4 weeks, parallel)

### Week 1: Electron Setup + File Structure
- [ ] Electron main/preload/renderer setup
- [ ] File structure, webpack config
- [ ] Window management (multiple panels)
- [ ] IPC bridge (renderer ↔ main)

### Week 2: SAP Visual Board
- [ ] Drag-drop library (React DnD)
- [ ] 4 columns: Fit | Config | Gap | Out
- [ ] Requirement cards (editable)
- [ ] Risk indicators (color-coded)
- [ ] Agent analysis button

### Week 3: Idea Canvas + PM Dashboard + Persona Widget
- [ ] Business Idea Canvas (concentric circles, mind-map)
- [ ] PM Dashboard (Gantt-like, risk heatmap)
- [ ] Persona Widget (display + real-time feedback)
- [ ] Note editor (edit vault files)

### Week 4: Agent Triggers + Integration + Testing
- [ ] Agent trigger buttons (SAP, PM, synthesis)
- [ ] Sync back to vault (save analyses)
- [ ] End-to-end testing
- [ ] Packaging + installer

---

## Testing Strategy

### Unit Tests
- `backend/tests/test_vault.py` — vault reader, search
- `backend/tests/test_llm.py` — LLM abstraction (mock providers)
- `frontend/src/components/__tests__/` — component rendering

### Integration Tests
- `backend/tests/test_agents.py` — agents + vault + LLM
- Frontend ↔ backend API contract tests

### E2E Tests
- Vault search workflow (office → home → phone)
- SAP agent analysis (end-to-end)
- Idea capture + sync (phone → vault → desktop)
- Obsidian Sync verification (cloud ↔ phone)

### Manual Testing Checklist
- [ ] Localhost access on home desktop
- [ ] Cloudflare Tunnel access from office
- [ ] Mobile responsive (phone browser)
- [ ] Obsidian phone sync (if using Obsidian Sync)
- [ ] Agent responses (Claude vs Ollama)

---

## Deployment

### Phase 1: Local-Only
- FastAPI backend runs on home desktop (port 8000)
- React frontend runs on home desktop (port 3000, proxied)
- Cloudflare Tunnel exposes backend to office
- No cloud infrastructure needed

### Phase 2: Optional Cloud Migration (Later)
- Deploy FastAPI to AWS/Heroku
- Frontend to Vercel/Netlify
- Vault in private GitHub repo
- Always-on (home desktop doesn't need to be running)

---

## Configuration (Environment Variables)

```bash
# .env (in root, or set in CI/CD)

# LLM Configuration
LLM_PROVIDER=claude              # claude, openai, ollama
ANTHROPIC_API_KEY=sk-ant-...     # Or OPENAI_API_KEY
LLM_MODEL=claude-3-5-sonnet      # Model identifier

# Vault Configuration
VAULT_PATH=~/Documents/SecondBrain

# Backend
BACKEND_PORT=8000
BACKEND_HOST=127.0.0.1

# Frontend
FRONTEND_PORT=3000
REACT_APP_API_URL=http://localhost:8000

# Cloudflare (if using Tunnel)
CLOUDFLARE_TUNNEL_TOKEN=...

# Logging
LOG_LEVEL=INFO
LOG_DIR=~/Documents/SecondBrain/BrainApp/logs
```

---

## Future Enhancements (Post-MVP)

1. **Phase 3:** Email fallback interface
2. **Cloud migration:** Always-on AWS/Heroku backend
3. **Multi-user:** Share insights with team (read-only)
4. **API monetization:** Sell vault search API to others
5. **Plugin system:** Let users add custom agents
6. **LLM cost optimization:** Auto-switch to cheaper models for simple queries

---

## Success Criteria

**Phase 1 Complete:**
- [ ] Web dashboard accessible from office (browser)
- [ ] Vault search works (BM25 + semantic)
- [ ] SAP agent responds to queries
- [ ] PM status pulls decision logs
- [ ] Business ideas can be captured
- [ ] Mobile responsive
- [ ] Obsidian Sync tested (phone access working)

**Phase 2 Complete:**
- [ ] Desktop app launches and connects to backend
- [ ] SAP board interactive (drag-drop works)
- [ ] Idea canvas functional (mind-map)
- [ ] PM dashboard shows Gantt + risk heatmap
- [ ] Persona widget displays + gives feedback
- [ ] Agent triggers functional
- [ ] Sync back to vault working

---

## Next Steps

1. **TEST OBSIDIAN SYNC** (this week)
   - Subscribe to Obsidian Sync ($96/yr)
   - Verify phone syncs with home desktop
   - Verify laptop can read synced vault

2. **BUILD PHASE 1** (Week 1-4)
   - Backend: FastAPI + LLM abstraction + vault reader
   - Frontend: React dashboard + API integration
   - Deploy: Cloudflare Tunnel for office access

3. **BUILD PHASE 2** (Week 1-4, parallel)
   - Electron: SAP board + idea canvas + PM dashboard
   - Integration: Connect to backend agents

4. **TEST & ITERATE** (Week 5+)
   - Phase 3: Email fallback interface
   - Optimization: Logging, cost tracking
   - Future: Cloud migration when ready

---

*This document will be updated as implementation progresses. See `logs/` directory for session decision logs.*
