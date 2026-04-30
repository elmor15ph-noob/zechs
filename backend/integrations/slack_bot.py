"""
DUO Brain App — Slack Bot (Altron Integration)
Routes Slack @mentions and DMs to the DUO backend via POST /openclaw/dispatch.

Persona prefixes (in message body after @duo mention):
  zero        → general assistant
  heavyarms   → SAP expert
  sandrock    → Project Manager
  altron      → cross-brain / synthesis

Socket Mode — no public URL required.

Setup:
  SLACK_BOT_TOKEN=xoxb-...
  SLACK_APP_TOKEN=xapp-...
  DUO_API_URL=http://localhost:8000
"""

import asyncio
import logging
import os
import re
import time
from threading import Event

import httpx
from dotenv import load_dotenv
from slack_bolt import App
from slack_bolt.adapter.socket_mode import SocketModeHandler

load_dotenv(".env")
load_dotenv(".env.channels")

log = logging.getLogger("slack_bot")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] slack_bot: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

SLACK_BOT_TOKEN = os.getenv("SLACK_BOT_TOKEN", "")
SLACK_APP_TOKEN = os.getenv("SLACK_APP_TOKEN", "")
DUO_API_URL = os.getenv("DUO_API_URL", "http://localhost:8000").rstrip("/")
DISPATCH_URL = f"{DUO_API_URL}/openclaw/dispatch"
DEFAULT_PERSONA = os.getenv("DEFAULT_PERSONA", "zero")

PERSONAS = {"zero", "heavyarms", "sandrock", "altron"}
PERSONA_RE = re.compile(r"\b(" + "|".join(PERSONAS) + r")\b", re.IGNORECASE)

PERSONA_COLORS = {
    "zero":       "#00d4ff",
    "heavyarms":  "#ff6b35",
    "sandrock":   "#10b981",
    "altron":     "#a855f7",
}


def parse_persona(text: str) -> tuple[str, str]:
    """Extract persona prefix and clean message text."""
    clean = re.sub(r"<@[A-Z0-9]+>", "", text).strip()  # remove @bot mention
    match = PERSONA_RE.match(clean)
    if match:
        persona = match.group(1).lower()
        clean = clean[match.end():].strip()
        return persona, clean
    return DEFAULT_PERSONA, clean


def call_duo(persona: str, message: str, user: str) -> dict:
    """Synchronous call to DUO dispatch endpoint."""
    try:
        resp = httpx.post(
            DISPATCH_URL,
            json={"channel": "slack", "persona": persona, "message": message, "user": user, "metadata": {}},
            timeout=60.0,
        )
        resp.raise_for_status()
        return resp.json()
    except httpx.ConnectError:
        return {"error": "DUO backend is offline. Start it with `python main.py`."}
    except httpx.HTTPStatusError as e:
        return {"error": f"DUO backend returned {e.response.status_code}."}
    except Exception as e:
        return {"error": f"Unexpected error: {e}"}


def build_blocks(persona: str, response_text: str, cost_usd: float, latency_ms: int) -> list:
    """Build Slack Block Kit blocks for the response."""
    color = PERSONA_COLORS.get(persona, "#00d4ff")
    return [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": f"DUO · {persona.capitalize()}", "emoji": True},
        },
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": response_text[:3000]},  # Slack section limit
        },
        {"type": "divider"},
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": f"💰 ${cost_usd:.4f} · ⏱ {latency_ms}ms · persona: `{persona}`",
                }
            ],
        },
    ]


def handle_message(say, user_id: str, text: str) -> None:
    """Core handler — parses persona, calls DUO, posts Block Kit response."""
    persona, clean_text = parse_persona(text)

    if not clean_text:
        say(text=f"Hi <@{user_id}>! Ask me anything. Prefix with a persona name to route: `zero heavyarms sandrock altron`.")
        return

    # Post a "thinking" placeholder
    thinking = say(text=f"_{persona.capitalize()} is thinking..._")

    t0 = time.time()
    result = call_duo(persona, clean_text, user_id)
    latency_ms = int((time.time() - t0) * 1000)

    if "error" in result:
        say(text=f"⚠️ *DUO error:* {result['error']}")
        return

    response_text = result.get("response", "_(no response)_")
    cost_usd = result.get("cost_usd", 0.0)

    say(
        blocks=build_blocks(persona, response_text, cost_usd, latency_ms),
        text=response_text[:200],  # fallback for notifications
    )
    log.info("Responded to %s via persona=%s cost=$%.4f latency=%dms", user_id, persona, cost_usd, latency_ms)


def create_app() -> App:
    app = App(token=SLACK_BOT_TOKEN)

    @app.event("app_mention")
    def on_mention(event, say):
        handle_message(say, event["user"], event.get("text", ""))

    @app.event("message")
    def on_dm(event, say):
        # Only handle DMs, not channel messages (those come via app_mention)
        if event.get("channel_type") == "im" and not event.get("bot_id"):
            handle_message(say, event["user"], event.get("text", ""))

    return app


def run(stop_event: Event | None = None) -> None:
    if not SLACK_BOT_TOKEN or not SLACK_APP_TOKEN:
        log.error("SLACK_BOT_TOKEN and SLACK_APP_TOKEN must be set.")
        return

    log.info("Starting Slack bot (Socket Mode)...")
    app = create_app()
    handler = SocketModeHandler(app, SLACK_APP_TOKEN)

    if stop_event:
        import threading
        def _watch():
            stop_event.wait()
            log.info("Stop signal received — disconnecting Slack bot.")
            handler.close()
        threading.Thread(target=_watch, daemon=True).start()

    handler.start()


if __name__ == "__main__":
    run()
