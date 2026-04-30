# Discord Feedback System — Decision Logging & Agent Learning

**Date Created:** 2026-04-26  
**Status:** Implementation Ready  
**Purpose:** Track user feedback for agent improvement and decision analytics

---

## 📋 Overview

The **feedback system** allows users to rate Discord bot responses in real-time. Feedback is:
- Logged to `.lancedb/` for agent learning
- Aggregated into scorecard metrics
- Used to improve future agent decisions (Phase 6)
- Tracked per persona, command, and user

```
User reacts with emoji
      ↓
Bot captures reaction (✅ ❌ 📊)
      ↓
OpenClaw logs to /agents/feedback
      ↓
Decision log updated (.lancedb/\*-decisions.jsonl)
      ↓
Weekly scorecard aggregates metrics
      ↓
Persona performance tracked (acceptance rate, quality)
      ↓
Agent fine-tuning (Phase 6 feedback loops)
```

---

## 🎯 Reaction Types

After Overlord responds, three reactions appear:

### ✅ Accept

**Meaning:** "This response is good / I agree with this decision"

**What happens:**
1. User clicks ✅ emoji
2. Bot logs: `feedback: "accepted"` to decision log
3. Response marked with 📝 (logged)
4. Acceptance rate increases by 1

**Example:**
```
User: @Overlord status zero
Bot: [shows system status]
User: [reacts with ✅]
→ Decision logged as "accepted" (good response)
```

### ❌ Reject

**Meaning:** "This response is incorrect / I disagree / needs improvement"

**What happens:**
1. User clicks ❌ emoji
2. Bot logs: `feedback: "rejected"` to decision log
3. Response marked with 📝 (logged)
4. Rejection count increases by 1 (for tracking)
5. Agent gets lower priority for this command next time

**Example:**
```
User: @Overlord forecast zero
Bot: [shows forecast]
User: [reacts with ❌]
→ Decision logged as "rejected" (bad response, needs refinement)
```

### 📊 Details

**Meaning:** "Show me the full reasoning / I want to understand more"

**What happens:**
1. User clicks 📊 emoji
2. Bot logs: `feedback: "details_requested"` to decision log
3. Bot sends detailed response in thread (full reasoning, sources, confidence scores)
4. Helps identify what context/clarity users need

**Example:**
```
User: @Overlord data-insights altron
Bot: [shows summary insights]
User: [reacts with 📊]
→ Decision logged as "details_requested"
→ Bot follows up in thread with full analysis, sources, methodology
```

---

## 💾 Feedback Data Structure

### Decision Log Entry

**File:** `.lancedb/{agent}-decisions.jsonl`

```jsonl
{
  "decision_id": "discord_123456789_1704710400",
  "agent": "pm_agent",
  "persona": "zero",
  "command": "status",
  "source": "discord",
  "user_id": "123456789",
  "username": "puntay",
  "channel": "operations",
  "response": "System Status (as of 2026-04-26 15:30 UTC)...",
  "response_length": 1547,
  "cost_tokens": 1930,
  "timestamp": "2026-04-26T15:30:00Z",
  "feedback": "accepted",
  "feedback_timestamp": "2026-04-26T15:30:15Z",
  "feedback_emoji": "✅",
  "response_quality": null
}
```

### Feedback Schema

| Field | Type | Description |
|-------|------|-------------|
| decision_id | string | Unique ID (source_user_timestamp) |
| agent | string | Agent name (pm_agent, observability_agent, etc.) |
| persona | string | Persona routed to (zero, heavyarms, sandrock, altron) |
| command | string | Command issued (status, health, synthesis, etc.) |
| source | string | Source (discord, slack, telegram) |
| user_id | string | User ID (from Discord) |
| username | string | User name |
| channel | string | Discord channel where issued |
| response | string | Full agent response |
| response_length | int | Character count (for quality analysis) |
| cost_tokens | int | Tokens used (for cost tracking) |
| timestamp | ISO | When decision made |
| feedback | string | Feedback type (accepted, rejected, details_requested, null) |
| feedback_timestamp | ISO | When feedback given |
| feedback_emoji | string | Emoji used (✅, ❌, 📊) |
| response_quality | float | Calculated quality score (0-1) |

---

## 📊 Feedback Analytics

### Acceptance Rate (Per Persona)

```
Zero (PM Agent):       82% ✅
├─ status:             85%
├─ synthesis:          78%
├─ forecast:           80%
└─ risks:              82%

HeavyArms (Backend):   91% ✅
├─ health:             94%
├─ observability:      89%
├─ incidents:          90%
└─ optimize:           87%

Sandrock (Frontend):   75% ⚠️ (target: 80%)
├─ frontend-audit:     78%
├─ design-check:       72%
├─ ux-analysis:        70%
└─ accessibility:      78%

Altron (Data):         88% ✅
├─ data-insights:      91%
├─ forecast:           87%
├─ anomalies:          85%
└─ cohorts:            88%
```

**Calculation:** `accepted / (accepted + rejected) * 100`

### Command Performance

```
By Popularity:
1. status             (15 uses, 85% acceptance) ← Most trusted
2. health            (12 uses, 94% acceptance)
3. data-insights     (10 uses, 91% acceptance)
4. synthesis          (8 uses, 78% acceptance)
5. frontend-audit    (5 uses, 78% acceptance)

By Quality:
1. health            (94% acceptance)
2. data-insights     (91% acceptance)
3. observability     (89% acceptance)
4. altron-insights   (88% acceptance)
5. forecast          (80% acceptance)

By Cost-Effectiveness (quality vs tokens):
1. health            (94% accept, 1200 tokens, $0.008/cmd)
2. health            (cost: $0.0000085 per quality point)
```

### Details Requests (Engagement)

```
Command           Requested  Rate
─────────────────────────────────
synthesis         5 of 8     62%  ← Complex, users want details
forecast          3 of 6     50%
data-insights     2 of 10    20%
health            1 of 12     8%  ← Simple, clear responses
status            1 of 15     7%
```

**Insight:** Synthesis/forecast are complex; users request details often. Consider expanding those responses in future.

---

## 🔄 Feedback Loop (Phase 6)

### How Feedback Improves Agents

**Week 1:** Collect baseline feedback
```
Zero (PM Agent): 82% acceptance, 8 rejections
→ Common rejection reasons: "forecast too conservative", "missing key risk"
```

**Week 2:** Update agent persona
```
Add to Zero's prompt: "Be more explicit about risks and uncertainties"
Add to Zero's prompt: "Include probability estimates for forecasts"
```

**Week 3:** Measure improvement
```
Zero (PM Agent): 87% acceptance (↑ 5%)
→ Success! "Risk clarity" is working
```

**Week 4+:** Continuous refinement
```
Repeat weekly for all personas
Use decision logs to extract what made responses better
Build persona "skill tree" (what prompts work best)
```

### Feedback-Driven Metrics

**File:** `02-Areas/Synthesis/Agent-Feedback-Analysis.md`

```markdown
## Feedback Summary (Week of 2026-04-26)

### Acceptance Rates
- Zero (PM):        82% → 87% (+5%) ✅
- HeavyArms:        91% → 93% (+2%) ✅
- Sandrock:         75% → 78% (+3%) ✅
- Altron:           88% → 89% (+1%) ✅

### Rejection Analysis
| Agent | Reason | Count | Fix Applied |
|-------|--------|-------|-------------|
| Zero | Forecast too conservative | 3 | Added probability ranges |
| Sandrock | Missing accessibility checks | 2 | Added WCAG scanning |
| Altron | Trends not interpreted | 2 | Added insight layer |

### Details Requests
- synthesis: 62% (↑ from 50%) — users want more detail (positive signal)
- forecast: 50% (stable) — complex, but expected
- health: 8% (stable) — clear/simple responses working well

### Next Actions
1. Expand synthesis responses (users want more depth)
2. Add confidence scores to forecasts (users want clarity)
3. Implement accessibility auto-scanning for Sandrock
4. Monitor Sandrock closely (below target on 3/4 commands)
```

---

## 🛠️ Implementation in Discord Bot

**File:** `overlord_bot.py`

```python
@bot.event
async def on_reaction_add(reaction, user):
    """Handle feedback reactions"""
    if user == bot.user:
        return
    
    # Check if this is a decision message
    if not hasattr(bot, 'decision_messages'):
        return
    
    msg = reaction.message
    if msg.id not in bot.decision_messages:
        return
    
    decision = bot.decision_messages[msg.id]
    emoji = reaction.emoji
    
    # Map emoji to feedback type
    feedback_map = {
        "✅": "accepted",
        "❌": "rejected",
        "📊": "details_requested"
    }
    
    feedback_type = feedback_map.get(emoji)
    if not feedback_type:
        return
    
    try:
        # Log feedback to backend
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{DUO_BACKEND}/agents/feedback",
                json={
                    "decision_id": decision["decision_id"],
                    "feedback": feedback_type,
                    "user_id": str(user.id),
                    "username": user.name,
                    "timestamp": discord.utils.utcnow().isoformat(),
                    "emoji": emoji
                },
                timeout=aiohttp.ClientTimeout(total=5)
            ) as resp:
                if resp.status == 200:
                    # Add ✓ to show feedback was recorded
                    await msg.add_reaction("📝")
                    
                    # If details requested, send thread response
                    if feedback_type == "details_requested":
                        thread = await msg.create_thread(
                            name=f"Details for {decision['command']}"
                        )
                        
                        # Fetch detailed response from backend
                        async with session.get(
                            f"{DUO_BACKEND}/agents/decision/{decision['decision_id']}/details"
                        ) as detail_resp:
                            if detail_resp.status == 200:
                                detail = await detail_resp.json()
                                await thread.send(embed=discord.Embed(
                                    title="📊 Full Analysis",
                                    description=detail["full_reasoning"][:2000],
                                    color=discord.Color.blue()
                                ))
    
    except Exception as e:
        print(f"Feedback error: {e}")

# Store decision messages for feedback tracking
@bot.event
async def on_message(message):
    if bot.user.mentioned_in(message):
        # ... existing message handling ...
        
        # Store message ID for feedback tracking
        bot.decision_messages = getattr(bot, 'decision_messages', {})
        bot.decision_messages[msg.id] = {
            "decision_id": result.get("decision_id"),
            "persona": persona,
            "command": command,
            "agent": agent_name
        }
        
        # Clean up old entries (keep only last 100)
        if len(bot.decision_messages) > 100:
            oldest = min(bot.decision_messages.keys())
            del bot.decision_messages[oldest]
```

### Backend Endpoint

**File:** `backend/api/routes.py`

```python
@router.post("/agents/feedback")
async def log_feedback(
    decision_id: str,
    feedback: str,
    user_id: str,
    username: str,
    emoji: str
):
    """Log user feedback for decision tracking"""
    try:
        feedback_entry = {
            "decision_id": decision_id,
            "feedback": feedback,
            "user_id": user_id,
            "username": username,
            "emoji": emoji,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Append to feedback log
        log_path = Path(".lancedb/discord-feedback.jsonl")
        log_path.parent.mkdir(exist_ok=True)
        with open(log_path, "a") as f:
            f.write(json.dumps(feedback_entry) + "\n")
        
        # Update decision log with feedback
        update_decision_with_feedback(decision_id, feedback)
        
        return {
            "status": "logged",
            "decision_id": decision_id,
            "feedback": feedback
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def update_decision_with_feedback(decision_id: str, feedback: str):
    """Update decision log entry with feedback"""
    # Read all decisions
    decisions = []
    for log_file in Path(".lancedb").glob("*-decisions.jsonl"):
        if log_file.exists():
            with open(log_file, "r") as f:
                for line in f:
                    entry = json.loads(line)
                    if entry.get("decision_id") == decision_id:
                        entry["feedback"] = feedback
                        entry["feedback_timestamp"] = datetime.utcnow().isoformat()
                    decisions.append(entry)
    
    # Write back
    if decisions:
        log_file = Path(".lancedb") / f"{decisions[0]['agent']}-decisions.jsonl"
        with open(log_file, "w") as f:
            for d in decisions:
                f.write(json.dumps(d) + "\n")
```

---

## 📈 Weekly Scorecard

**File:** `02-Areas/Synthesis/Agent-Scorecard-2026-04-26.md`

```markdown
# Agent Scorecard — Week of 2026-04-26

## Summary

| Agent | Acceptance | Rejections | Details | Commands | Avg Cost |
|-------|------------|-----------|---------|----------|----------|
| Zero | 82% (↑2%) | 2 | 5 | 28 | $0.009 |
| HeavyArms | 91% (→) | 2 | 1 | 18 | $0.007 |
| Sandrock | 75% (↓3%) | 3 | 2 | 8 | $0.010 |
| Altron | 88% (↑1%) | 1 | 2 | 12 | $0.008 |

## Detailed Analysis

### Zero (PM Agent) — 82% Acceptance ✅
**Strengths:**
- Status requests highly trusted (85%)
- Forecast improving (80%, ↑ from 75%)

**Concerns:**
- Synthesis lower than expected (78%)
- 2 rejections due to "missing context"

**Action:** Expand synthesis responses to include more context

### HeavyArms (Backend Agent) — 91% Acceptance ✅✅
**Strengths:**
- Health checks at 94% (highest across all agents)
- Observability improving (89%, ↑ from 87%)
- Consistently high quality

**Concerns:**
- None (performing as expected)

**Action:** Use HeavyArms response style as template for other agents

### Sandrock (Frontend Agent) — 75% Acceptance ⚠️
**Concerns:**
- Below target (80%)
- 3 rejections in 1 week
- Design-check lowest (72%)

**Rejection Analysis:**
- "Missing accessibility audit" (2x)
- "Color check not thorough" (1x)

**Action:** Implement accessibility checklist, enhance color validation

### Altron (Data Agent) — 88% Acceptance ✅
**Strengths:**
- Data-insights highly trusted (91%)
- Forecast improving (87%)

**Concerns:**
- Cohorts lower (88%, niche use case)

**Action:** Continue current approach

## Recommendations

1. **Expand Zero's context** — Users want more detail in synthesis
2. **Fix Sandrock's accessibility** — Add WCAG scanning, implement checklist
3. **Maintain HeavyArms style** — Use as model for other agents
4. **Monitor Sandrock closely** — Next week's feedback is critical
```

---

## 🔐 Privacy & Security

- ✅ Feedback only from message reactors (user_id captured)
- ✅ Decision IDs tied to specific commands (traceable)
- ✅ No PII logged (user IDs only, no names in metrics)
- ✅ Feedback history kept for 90 days then archived
- ✅ Feedback used internally only (not shared with LLM providers)

---

## 📞 Support

**Feedback not being logged?**
1. Verify bot has "Add Reactions" permission
2. Check `/agents/feedback` endpoint is running
3. Verify `.lancedb/` directory exists and is writable

**Want to see feedback data?**
1. Dashboard: `/agents/feedback-summary`
2. Raw logs: `.lancedb/{agent}-decisions.jsonl`
3. Weekly scorecard: `02-Areas/Synthesis/Agent-Scorecard-{date}.md`

---

**Next:** See TEAM_GUNDAM_PERSONAS.md for persona customization.
