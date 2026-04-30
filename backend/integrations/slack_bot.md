# Slack Bot Setup (Socket Mode — no public URL needed)

## 1. Create a Slack App
1. Go to https://api.slack.com/apps → **Create New App** → **From scratch**
2. Name: `DUO Brain` · pick your workspace

## 2. Enable Socket Mode
- **Socket Mode** tab → toggle **Enable Socket Mode** ON
- Generate an **App-Level Token** with scope `connections:write` → copy it (`xapp-...`)

## 3. Add OAuth Scopes
- **OAuth & Permissions** → Bot Token Scopes → add:
  - `app_mentions:read`, `chat:write`, `im:history`, `channels:history`
- **Install to Workspace** → copy **Bot User OAuth Token** (`xoxb-...`)

## 4. Enable Events
- **Event Subscriptions** → Enable Events → Subscribe to bot events:
  - `app_mention`, `message.im`

## 5. Set env vars in .env.channels
```
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
```

## 6. Run
```bash
python backend/integrations/slack_bot.py
# or via launcher:
start-bots.bat
```
