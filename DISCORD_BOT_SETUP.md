# Overlord Discord Bot — Setup Guide

**Date Created:** 2026-04-26  
**Status:** Ready for Deployment  
**Team:** wasteland.design

---

## 📋 Overview

The **Overlord Discord bot** connects your wasteland.design Discord server directly to the DUO Brain system. It:
- Routes messages to DUO agents via OpenClaw bridge
- Returns synthesis results, status updates, and analysis directly in Discord
- Collects feedback (✅ accept, ❌ reject, 📊 details) for decision logging
- Supports team personas: Zero (PM), HeavyArms (Backend), Sandrock (Frontend), Altron (Data)

---

## ⚡ Quick Start (5 minutes)

### 1. Create Discord Bot in Developer Portal

1. Go to **Discord Developer Portal** → https://discord.com/developers/applications
2. Click **"New Application"** → name it `Overlord`
3. Go to **Bot** section → click **"Add Bot"**
4. Under **TOKEN**, click **"Copy"** → save this securely (you'll need it)
5. Go to **OAuth2** → **URL Generator**
   - **Scopes:** `bot`
   - **Permissions:** `Send Messages`, `Read Messages/View Channels`, `Read Message History`, `Add Reactions`
   - Copy generated URL → open in browser → select your Discord server → authorize

### 2. Install Dependencies

```bash
pip install discord.py==2.3.2 python-dotenv aiohttp
```

### 3. Create .env File

```bash
# .env
DISCORD_BOT_TOKEN=<your-bot-token>
DUO_BACKEND_URL=http://localhost:8000
OPENCLAW_ENDPOINT=http://localhost:8000/integrations/openclaw/dispatch
```

### 4. Create Bot Script

**File:** `overlord_bot.py`

```python
import discord
from discord.ext import commands
import aiohttp
import os
from dotenv import load_dotenv
import json
import traceback

load_dotenv()

TOKEN = os.getenv("DISCORD_BOT_TOKEN")
DUO_BACKEND = os.getenv("DUO_BACKEND_URL")
OPENCLAW_ENDPOINT = os.getenv("OPENCLAW_ENDPOINT")

intents = discord.Intents.default()
intents.message_content = True
intents.reactions = True

bot = commands.Bot(command_prefix="!", intents=intents)

# Team personas
PERSONAS = {
    "zero": "PM Agent (Zero Gundam) — Status & synthesis",
    "heavyarms": "Backend Agent (Heavy Arms) — System health & ops",
    "sandrock": "Frontend Agent (Sandrock) — UI/UX analysis",
    "altron": "Data Agent (Altron) — Metrics & insights"
}

@bot.event
async def on_ready():
    print(f"✅ Overlord online as {bot.user}")
    await bot.change_presence(activity=discord.Game(name="DUO Brain operations"))

@bot.event
async def on_message(message):
    """Route @mentions to DUO agents"""
    if message.author == bot.user:
        return
    
    if bot.user.mentioned_in(message):
        async with message.channel.typing():
            try:
                # Parse command and persona
                args = message.content.split()
                command = args[1] if len(args) > 1 else "status"
                persona = args[2].lower() if len(args) > 2 else "zero"
                
                if persona not in PERSONAS:
                    await message.reply(f"❌ Unknown persona: `{persona}`. Use: {', '.join(PERSONAS.keys())}")
                    return
                
                # Prepare OpenClaw request
                payload = {
                    "source": "discord",
                    "user_id": str(message.author.id),
                    "username": message.author.name,
                    "command": command,
                    "persona": persona,
                    "context": message.content,
                    "channel": message.channel.name,
                    "timestamp": message.created_at.isoformat()
                }
                
                # Send to DUO via OpenClaw
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        OPENCLAW_ENDPOINT,
                        json=payload,
                        timeout=aiohttp.ClientTimeout(total=10)
                    ) as resp:
                        if resp.status == 200:
                            result = await resp.json()
                            response_text = result.get("response", "No response")
                            
                            # Format response in Discord embed
                            embed = discord.Embed(
                                title=f"🤖 {PERSONAS.get(persona, 'Unknown')}",
                                description=response_text[:2000],  # Discord limit
                                color=discord.Color.blue()
                            )
                            embed.set_footer(text=f"Command: {command} | Persona: {persona}")
                            
                            msg = await message.reply(embed=embed, mention_author=False)
                            
                            # Add feedback reactions
                            await msg.add_reaction("✅")  # Accept
                            await msg.add_reaction("❌")  # Reject
                            await msg.add_reaction("📊")  # Details
                            
                            # Store message ID for feedback tracking
                            bot.decision_messages = getattr(bot, 'decision_messages', {})
                            bot.decision_messages[msg.id] = {
                                "decision_id": result.get("decision_id"),
                                "persona": persona,
                                "command": command
                            }
                        else:
                            await message.reply(f"❌ DUO backend error ({resp.status}). Try again shortly.")
            
            except asyncio.TimeoutError:
                await message.reply("⏱️ Request timeout. DUO backend may be busy.")
            except Exception as e:
                print(f"Error: {traceback.format_exc()}")
                await message.reply(f"❌ Error processing command: `{str(e)}`")

@bot.event
async def on_reaction_add(reaction, user):
    """Handle feedback reactions for decision logging"""
    if user == bot.user:
        return
    
    # Check if this is a decision message
    if not hasattr(bot, 'decision_messages') or reaction.message.id not in bot.decision_messages:
        return
    
    decision = bot.decision_messages[reaction.message.id]
    emoji = reaction.emoji
    
    feedback_map = {
        "✅": "accepted",
        "❌": "rejected",
        "📊": "details_requested"
    }
    
    feedback_type = feedback_map.get(emoji)
    if not feedback_type:
        return
    
    try:
        # Log feedback to DUO
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{DUO_BACKEND}/agents/feedback",
                json={
                    "decision_id": decision["decision_id"],
                    "feedback": feedback_type,
                    "user_id": str(user.id),
                    "timestamp": discord.utils.utcnow().isoformat()
                },
                timeout=aiohttp.ClientTimeout(total=5)
            ) as resp:
                if resp.status == 200:
                    # React with checkmark to show feedback was recorded
                    await reaction.message.add_reaction("📝")
    except Exception as e:
        print(f"Feedback error: {e}")

# Run bot
bot.run(TOKEN)
```

### 5. Run the Bot

```bash
python overlord_bot.py
```

Expected output:
```
✅ Overlord online as Overlord#1234
```

---

## 📖 Full Setup Guide

### Prerequisites

- Python 3.10+
- Discord server with admin access (wasteland.design)
- DUO Brain backend running on port 8000
- OpenClaw bridge configured (see OPENCLAW_INTEGRATION.md)

### Installation Steps

#### Step 1: Create Discord Application

1. Go to https://discord.com/developers/applications
2. Click **"New Application"** (top right)
3. **Name:** `Overlord`
4. Click **"Create"**

#### Step 2: Configure Bot

1. Left sidebar → **"Bot"**
2. Click **"Add Bot"**
3. Under **TOKEN** section, click **"Copy"** (save securely)
4. Under **GATEWAY INTENTS**, enable:
   - ✅ Message Content Intent (required to read message content)
   - ✅ Guilds
   - ✅ Guild Messages

#### Step 3: Set Permissions

1. Left sidebar → **"OAuth2"** → **"URL Generator"**
2. **Scopes:** Check `bot`
3. **Permissions:**
   - ✅ Send Messages
   - ✅ Read Messages/View Channels
   - ✅ Read Message History
   - ✅ Add Reactions
   - ✅ Embed Links
4. Copy **GENERATED URL** at bottom
5. Paste URL in browser, select your Discord server, click **"Authorize"**

#### Step 4: Add Bot to Server

1. In Discord, go to **Server Settings** → **Integrations** → **Bots and Apps**
2. Should see `Overlord` listed as "Bot Member"
3. Click on it, verify permissions

#### Step 5: Install Python Environment

```bash
# Create virtual environment (recommended)
python -m venv venv

# Activate
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install discord.py==2.3.2 python-dotenv aiohttp
```

#### Step 6: Configure Environment

Create `.env` file in project root:

```
DISCORD_BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE
DUO_BACKEND_URL=http://localhost:8000
OPENCLAW_ENDPOINT=http://localhost:8000/integrations/openclaw/dispatch
```

**⚠️ SECURITY:** Never commit `.env` to git. Add to `.gitignore`:
```
.env
*.pyc
__pycache__/
venv/
```

#### Step 7: Run Bot

```bash
python overlord_bot.py
```

**Success indicators:**
- Console shows `✅ Overlord online as Overlord#<id>`
- Bot appears online in Discord server (green dot next to name)
- Bot responds to @mentions with DUO commands

---

## 🎮 Commands Reference

All commands use format: `@Overlord <command> [persona]`

| Command | Persona | What It Does |
|---------|---------|--------------|
| `status` | `zero` | Show current system health & recent decisions |
| `synthesis` | `zero` | Weekly analysis of PM decisions |
| `health` | `heavyarms` | Backend system health (uptime, errors, latency) |
| `observability` | `heavyarms` | Agent metrics (cost, acceptance rate, performance) |
| `frontend-audit` | `sandrock` | UI/UX review of last deployed components |
| `data-insights` | `altron` | Key metrics and trends from past week |

### Examples

```
@Overlord status zero
→ Shows system status and recent agent decisions

@Overlord health heavyarms
→ Shows backend health metrics

@Overlord synthesis zero
→ Generates weekly synthesis of PM decisions
```

---

## 💬 Feedback System

After Overlord responds, three reactions appear:

| Reaction | Meaning | Effect |
|----------|---------|--------|
| ✅ | Accept | Log decision as good (used for agent training) |
| ❌ | Reject | Flag decision as incorrect (triggers review) |
| 📊 | Details | Request full context/reasoning (logged for analysis) |

**How it works:**
1. User reacts with emoji
2. Bot logs feedback to `/agents/feedback` endpoint
3. Decision marked with 📝 (feedback recorded)
4. Acceptance rate tracked in agent scorecard

---

## 🔧 Troubleshooting

### Bot Doesn't Respond to @mentions

**Cause:** Message Content Intent not enabled.

**Fix:**
1. Discord Developer Portal → **Bot** → **GATEWAY INTENTS**
2. Enable **Message Content Intent**
3. Restart bot

### "No module named discord"

**Cause:** discord.py not installed.

**Fix:**
```bash
pip install discord.py==2.3.2
```

### Bot Goes Offline / "Connection closed by server"

**Cause:** Token is invalid or bot was removed from server.

**Fix:**
1. Check token in `.env` (copy fresh from Developer Portal)
2. Verify bot still in Discord server (Server Settings → Integrations → Bots)
3. Restart bot: `python overlord_bot.py`

### OpenClaw Returns 404 Errors

**Cause:** DUO backend not running or OpenClaw endpoint incorrect.

**Fix:**
1. Verify DUO backend running: `curl http://localhost:8000/health`
2. Check OPENCLAW_ENDPOINT in `.env` points to correct URL
3. See OPENCLAW_INTEGRATION.md for bridge setup

### Reactions Not Working

**Cause:** Bot doesn't have "Add Reactions" permission.

**Fix:**
1. Discord Developer Portal → OAuth2 → URL Generator
2. Ensure **"Add Reactions"** is checked
3. Re-authorize bot (open generated URL again)

---

## 📊 Monitoring Bot Activity

### Check Bot Uptime

```bash
curl http://localhost:8000/agents/health
# Shows bot status in agent health metrics
```

### View Decision Logs

```bash
# Decision logs stored in LanceDB
# Location: .lancedb/discord-decisions.jsonl
```

### Bot Metrics

Via DUO dashboard:
1. Go to `https://duo-brain.wasteland.design/docs`
2. Endpoint: `GET /agents/health`
3. Look for `discord_bot` metrics

---

## 🚀 Deployment

### For Team Use

1. Create bot on a shared account (or bot-specific account)
2. Generate long-lived token (store securely in 1Password or similar)
3. Deploy to server with persistent Python environment:
   - Option A: Windows service (uses NSSM)
   - Option B: Docker container
   - Option C: Cloud platform (Replit, Railway, etc.)

### Windows Service Setup (NSSM)

```bash
# Download NSSM from https://nssm.cc/download

# Install as service
nssm install overlord_discord python overlord_bot.py
nssm set overlord_discord AppDirectory C:\path\to\bot

# Start service
nssm start overlord_discord

# Check status
nssm status overlord_discord
```

### Docker Setup

**Dockerfile:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY overlord_bot.py .
CMD ["python", "overlord_bot.py"]
```

**requirements.txt:**
```
discord.py==2.3.2
python-dotenv==1.0.0
aiohttp==3.8.5
```

**Run:**
```bash
docker build -t overlord .
docker run --env-file .env overlord
```

---

## 🔐 Security Checklist

- ✅ Token stored in `.env` (never hardcoded)
- ✅ `.env` added to `.gitignore`
- ✅ Token rotated after any accidental exposure
- ✅ Bot has minimal permissions (no admin)
- ✅ Message history kept for audit trail (decision logs)
- ✅ Feedback reactions logged for bias detection
- ✅ Rate limiting on OpenClaw endpoint (prevent spam)

---

## 📞 Support

**Setup Issues?**
- Check Discord Developer Portal settings (intents, permissions)
- Verify DUO backend running on port 8000
- Review error messages in bot console
- Check `.env` file has correct token and endpoints

**Integration Issues?**
- See OPENCLAW_INTEGRATION.md for bridge setup
- See DISCORD_FEEDBACK_SYSTEM.md for feedback loops
- Check DUO backend logs for errors: `curl http://localhost:8000/health`

---

## 📝 Change Log

| Date | Change | Status |
|------|--------|--------|
| 2026-04-26 | Initial bot setup guide | ✅ Complete |
| TBD | Deploy to team server | Pending |
| TBD | Connect to Slack/Telegram bridges | Planned |
| TBD | Add AI-generated command suggestions | Planned |

---

**Next:** See OPENCLAW_INTEGRATION.md for connecting Discord → DUO backend.
