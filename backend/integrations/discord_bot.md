# DUO Discord Bot — Setup Guide

## 1. Create the bot (discord.com/developers)
1. New Application → name it "DUO Brain"
2. Bot → "Add Bot" → copy the **Token**
3. OAuth2 → URL Generator → Scopes: `bot` → Permissions: **Send Messages, Read Message History, Add Reactions, Embed Links** → paste the generated URL into a browser to invite it to your server

## 2. Enable Privileged Intents
Bot settings → enable **Message Content Intent**

## 3. Configure env vars
```bash
export DISCORD_BOT_TOKEN=your_token_here
export DISCORD_CHANNEL_ID=123456789          # optional: restrict to one channel
export DUO_API_URL=http://localhost:8000      # default if omitted
```

## 4. Install deps & run
```bash
pip install -r backend/integrations/requirements_discord.txt
python backend/integrations/discord_bot.py
```

## Usage
Mention the bot or use a prefix: `!zero`, `!heavyarms`, `!sandrock`, `!altron`
