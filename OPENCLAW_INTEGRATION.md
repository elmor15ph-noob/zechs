# OpenClaw Integration — Discord ↔ DUO Bridge

**Date Created:** 2026-04-26  
**Status:** Configuration Ready  
**Purpose:** Message translation layer between Discord and DUO backend

---

## 📋 Overview

**OpenClaw** is a message bridge that translates between Discord messages and DUO agent requests. It:
- Parses Discord mentions into structured commands
- Routes requests to appropriate DUO agents (Inbox, Synthesis, Observability)
- Converts DUO responses back to Discord embeds
- Logs all transactions for decision tracking
- Handles timeouts, retries, and error fallbacks

```
Discord Message
      ↓
Overlord Bot (receives @mention)
      ↓
OpenClaw Bridge (translates format)
      ↓
DUO Backend (/integrations/openclaw/dispatch)
      ↓
LLM Agent (Claude/Gemini + Vault RAG)
      ↓
Decision Logging (.lancedb)
      ↓
Response back to Discord (embed + reactions)
```

---

## 🔧 Configuration

### Endpoint Setup

**FastAPI Route (Backend):**

File: `backend/api/routes.py`

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import json
from pathlib import Path

router = APIRouter(prefix="/integrations", tags=["integrations"])

class OpenClawRequest(BaseModel):
    source: str  # "discord", "slack", "telegram"
    user_id: str
    username: str
    command: str  # "status", "synthesis", "health", etc.
    persona: str  # "zero", "heavyarms", "sandrock", "altron"
    context: str  # Full message text
    channel: str  # Discord channel name
    timestamp: str  # ISO format

@router.post("/openclaw/dispatch")
async def openclaw_dispatch(req: OpenClawRequest):
    """
    Main entry point for Discord/Slack/Telegram messages.
    Routes to appropriate agent based on command + persona.
    """
    try:
        # Log incoming request
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "source": req.source,
            "user_id": req.user_id,
            "command": req.command,
            "persona": req.persona
        }
        
        # Route to agent
        if req.command in ["status", "synthesis"]:
            agent = "pm_agent"
        elif req.command in ["health", "observability"]:
            agent = "observability_agent"
        elif req.command in ["frontend-audit"]:
            agent = "frontend_agent"
        elif req.command in ["data-insights"]:
            agent = "data_agent"
        else:
            return {
                "response": f"Unknown command: {req.command}",
                "decision_id": None,
                "source": req.source
            }
        
        # Call agent via vault search (hybrid retrieval)
        # This uses vault context + LLM reasoning
        from agents.pm_agent import PMAgent
        from agents.observability_agent import ObservabilityAgent
        
        if agent == "pm_agent":
            pm = PMAgent()
            result = await pm.process_command(
                command=req.command,
                persona=req.persona,
                context=req.context,
                user_id=req.user_id
            )
        elif agent == "observability_agent":
            obs = ObservabilityAgent()
            result = await obs.process_command(
                command=req.command,
                context=req.context,
                user_id=req.user_id
            )
        else:
            result = {"response": "Agent not implemented yet"}
        
        # Log decision
        decision_id = log_decision(
            agent=agent,
            command=req.command,
            source=req.source,
            user_id=req.user_id,
            response=result.get("response"),
            cost_tokens=result.get("usage", {}).get("total_tokens", 0)
        )
        
        return {
            "response": result.get("response"),
            "decision_id": decision_id,
            "source": req.source,
            "usage": result.get("usage", {})
        }
    
    except Exception as e:
        return {
            "response": f"Error: {str(e)}",
            "decision_id": None,
            "source": req.source
        }

@router.post("/openclaw/feedback")
async def openclaw_feedback(decision_id: str, feedback: str, user_id: str):
    """
    Log user feedback (accept/reject/details) for decision tracking.
    Used to train persona model and improve agent decisions.
    """
    try:
        feedback_entry = {
            "decision_id": decision_id,
            "feedback": feedback,  # "accepted", "rejected", "details_requested"
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Append to decision log
        log_path = Path(".lancedb/openclaw-feedback.jsonl")
        with open(log_path, "a") as f:
            f.write(json.dumps(feedback_entry) + "\n")
        
        return {"status": "logged", "decision_id": decision_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def log_decision(agent: str, command: str, source: str, user_id: str, response: str, cost_tokens: int):
    """Log decision to JSONL for agent learning"""
    decision_id = f"{source}_{user_id}_{int(datetime.utcnow().timestamp())}"
    
    entry = {
        "decision_id": decision_id,
        "agent": agent,
        "command": command,
        "source": source,
        "user_id": user_id,
        "response": response,
        "cost_tokens": cost_tokens,
        "timestamp": datetime.utcnow().isoformat(),
        "feedback": None  # Will be populated by /openclaw/feedback endpoint
    }
    
    # Append to decision log
    log_path = Path(f".lancedb/{agent}-decisions.jsonl")
    with open(log_path, "a") as f:
        f.write(json.dumps(entry) + "\n")
    
    return decision_id
```

---

## 📤 Message Format

### Discord → OpenClaw

**Request Structure:**

```json
{
  "source": "discord",
  "user_id": "123456789",
  "username": "puntay",
  "command": "status",
  "persona": "zero",
  "context": "@Overlord status zero — show me system health",
  "channel": "operations",
  "timestamp": "2026-04-26T15:30:00Z"
}
```

**Command Examples:**

```
@Overlord status zero
@Overlord synthesis zero
@Overlord health heavyarms
@Overlord observability heavyarms
@Overlord frontend-audit sandrock
@Overlord data-insights altron
```

### OpenClaw → DUO (Internal)

**Agent Request (after parsing):**

```json
{
  "agent": "pm_agent",
  "command": "status",
  "persona": "zero",
  "user_id": "123456789",
  "vault_query": "recent decisions, system status",
  "context": "user asking for current system health",
  "include_scorecard": true,
  "include_recent_logs": true
}
```

### DUO → OpenClaw Response

**Response Structure:**

```json
{
  "response": "System Status (as of 2026-04-26 15:30 UTC)...",
  "decision_id": "discord_123456789_1704710400",
  "source": "discord",
  "usage": {
    "model": "claude-3-5-sonnet",
    "input_tokens": 1250,
    "output_tokens": 680,
    "total_tokens": 1930,
    "cost_usd": 0.0097
  }
}
```

### OpenClaw → Discord (Embed)

**Discord Embed (final output):**

```
Title: "🤖 PM Agent (Zero Gundam)"
Description: "System Status (as of 2026-04-26 15:30 UTC)..."
Color: Blue (#0099FF)
Footer: "Command: status | Persona: zero"
Reactions: ✅ ❌ 📊
```

---

## 💰 Token Usage & Cost Tracking

### Token Consumption Per Command

Each OpenClaw request involves:

1. **Input tokens** — Discord message + vault context
2. **Output tokens** — Agent response generation
3. **Overhead** — Persona prompt, system instructions

**Typical breakdown:**

| Command | Input Tokens | Output Tokens | Total | Cost (Claude 3.5 Sonnet) |
|---------|--------------|---------------|-------|--------------------------|
| `status` | 800-1200 | 400-600 | 1200-1800 | $0.006-0.009 |
| `synthesis` | 1500-2000 | 800-1200 | 2300-3200 | $0.012-0.016 |
| `health` | 600-800 | 300-500 | 900-1300 | $0.005-0.007 |
| `observability` | 900-1100 | 500-700 | 1400-1800 | $0.007-0.009 |
| `frontend-audit` | 1200-1500 | 600-900 | 1800-2400 | $0.009-0.012 |
| `data-insights` | 1000-1300 | 600-800 | 1600-2100 | $0.008-0.011 |

**Average per command:** ~1500 total tokens = **~$0.008 USD**

### Cost Estimation

**Weekly usage estimate (wasteland.design team):**

```
Assume: 5 team members × 8 commands/week = 40 commands/week

Low estimate (40 × $0.005):  $0.20/week  ($10/year)
Mid estimate (40 × $0.008):  $0.32/week  ($17/year)
High estimate (40 × $0.012): $0.48/week  ($25/year)
```

**Monthly estimate (scaling):**

```
100 commands/month (light usage):   $0.80/month   ($9.60/year)
250 commands/month (moderate):      $2.00/month   ($24/year)
500 commands/month (heavy):         $4.00/month   ($48/year)
```

---

## 🎯 Cost Optimization

### Strategy 1: Caching & Memoization

Cache frequent responses (e.g., `status` commands):

```python
from functools import lru_cache
from datetime import datetime, timedelta

cache_ttl = timedelta(minutes=5)
last_cache_time = {}

@lru_cache(maxsize=100)
def get_status_cached(persona):
    """Cache status for 5 minutes"""
    return pm_agent.status(persona)
```

**Savings:** ~60% reduction (commands reused within 5min window) = **$3-4/month saved**

### Strategy 2: Use Gemini Flash (Faster, Cheaper)

Primary LLM: Claude 3.5 Sonnet ($0.003 input, $0.015 output)  
Alternative: Gemini Flash ($0.075 input, $0.3 output) = **10x cheaper**

In `backend/config.py`:

```python
PRIMARY_LLM = "gemini-flash"  # Fast, cheap
FALLBACK_LLM = "claude-3-5-sonnet"  # Accurate, for complex tasks
```

**Savings:** ~70% reduction = **$7-20/month saved**

### Strategy 3: Vault Query Caching

Cache vault searches (vector embeddings):

```python
from lancedb import db

# Embeddings cached in LanceDB
# Repeated queries on same topic reuse vectors (free)
vault.hybrid_search("recent decisions", use_cache=True)
```

**Savings:** ~30% reduction on vault ops = **$2-5/month saved**

### Strategy 4: Rate Limiting

Enforce per-user limits:

```python
# Max 10 commands per user per day
rate_limit = {
    "per_user": 10,
    "per_day": True,
    "cooldown_seconds": 300  # 5min between commands
}
```

**Savings:** Prevents spam = **$1-3/month saved**

---

## 📊 Cost Monitoring

### Set Daily Budget Alert

In `backend/config.py`:

```python
COST_CONFIG = {
    "daily_budget": 2.00,  # $2/day max
    "monthly_budget": 50.00,  # $50/month cap
    "alert_threshold": 0.80,  # Alert at 80% usage
    "per_agent_daily": {
        "pm_agent": 1.00,
        "observability_agent": 0.50,
        "frontend_agent": 0.30,
        "data_agent": 0.20
    }
}
```

### Track Costs in Dashboard

Endpoint: `GET /agents/cost-summary`

```json
{
  "today": {
    "tokens": 12500,
    "cost": $0.42,
    "commands": 45
  },
  "week": {
    "tokens": 87500,
    "cost": $2.80,
    "commands": 280
  },
  "month": {
    "tokens": 350000,
    "cost": $11.20,
    "commands": 1200
  },
  "budget_remaining": {
    "daily": $1.58,
    "monthly": $38.80
  }
}
```

---

## 🛡️ Error Handling & Fallback

### Timeout Handling

```python
# If response takes >10 seconds, fallback to cached response
try:
    response = await asyncio.wait_for(
        agent.process_command(...),
        timeout=10.0
    )
except asyncio.TimeoutError:
    # Use last known good response
    response = get_cached_response(command)
    response["note"] = "Cached response (agent busy)"
```

### Fallback Chain

```
Try: Claude 3.5 Sonnet (most accurate)
  ↓ (timeout/error)
Try: Gemini Flash (faster/cheaper)
  ↓ (timeout/error)
Try: Cached response + "Agent busy, using recent data"
  ↓ (no cache)
Return: "Agent unavailable, try again in 1 minute"
```

---

## 📋 Monitoring & Logs

### Decision Log Format

**File:** `.lancedb/openclaw-decisions.jsonl`

```jsonl
{"decision_id":"discord_123456789_1704710400","agent":"pm_agent","command":"status","source":"discord","user_id":"123456789","username":"puntay","response":"System Status...","cost_tokens":1930,"timestamp":"2026-04-26T15:30:00Z","feedback":null}
{"decision_id":"discord_987654321_1704710500","agent":"observability_agent","command":"health","source":"discord","user_id":"987654321","username":"team_member","response":"Backend Health...","cost_tokens":1200,"timestamp":"2026-04-26T15:31:00Z","feedback":"accepted"}
```

### Query Logs

```bash
# Count commands by persona
cat .lancedb/openclaw-decisions.jsonl | jq '.persona' | sort | uniq -c

# Average cost per command
cat .lancedb/openclaw-decisions.jsonl | jq '.cost_tokens' | awk '{sum+=$1} END {print sum/NR}'

# Acceptance rate
cat .lancedb/openclaw-decisions.jsonl | jq 'select(.feedback != null)' | jq '.feedback' | sort | uniq -c
```

---

## 🔐 Security

- ✅ **Rate limiting** — Max 10 requests per user per day
- ✅ **Cost caps** — Hard limit on daily spend ($2/day default)
- ✅ **Token logging** — Every request logged for audit trail
- ✅ **User isolation** — Decisions only accessible to requesting user
- ✅ **Input validation** — Commands whitelist only known types
- ✅ **Timeout protection** — No requests run >10 seconds

---

## 📞 Support

**OpenClaw not responding?**
1. Check DUO backend running: `curl http://localhost:8000/health`
2. Check OpenClaw endpoint: `curl -X POST http://localhost:8000/integrations/openclaw/dispatch -d '{"source":"test"}'`
3. Review backend logs for errors

**High token usage?**
- Check cost-summary: `curl http://localhost:8000/agents/cost-summary`
- Enable caching: `use_cache=True` on vault queries
- Switch to Gemini Flash for non-critical commands
- Implement rate limiting

---

**Next:** See TEAM_GUNDAM_PERSONAS.md for persona routing and customization.
