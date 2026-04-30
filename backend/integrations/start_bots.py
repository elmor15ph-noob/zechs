"""
DUO Brain App — Bot launcher.
Starts all configured channel bots in parallel threads.
Only starts a bot if its required tokens are present in env.

Usage:
    python backend/integrations/start_bots.py

Or from BrainApp root:
    start-bots.bat
"""

import logging
import sys
import threading
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(".env")
load_dotenv(".env.channels")

from integrations.channel_config import ChannelConfig

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("start_bots")


def main():
    cfg = ChannelConfig()
    stop_event = threading.Event()
    threads = []

    log.info("DUO Bot Launcher — checking configured channels...")
    log.info("Enabled channels: %s", cfg.enabled_channels() or ["none — set tokens in .env.channels"])

    # ── Discord ───────────────────────────────────────────────────────────────
    if cfg.has_discord():
        try:
            from integrations.discord_bot import run as discord_run
            t = threading.Thread(target=discord_run, kwargs={"stop_event": stop_event}, name="discord", daemon=True)
            threads.append(t)
            log.info("✓ Discord bot configured — will start")
        except ImportError as e:
            log.warning("Discord bot skipped — missing deps: %s  (pip install discord.py aiohttp)", e)
    else:
        log.info("  Discord bot skipped — DISCORD_BOT_TOKEN not set")

    # ── Slack ─────────────────────────────────────────────────────────────────
    if cfg.has_slack():
        try:
            from integrations.slack_bot import run as slack_run
            t = threading.Thread(target=slack_run, kwargs={"stop_event": stop_event}, name="slack", daemon=True)
            threads.append(t)
            log.info("✓ Slack bot configured — will start")
        except ImportError as e:
            log.warning("Slack bot skipped — missing deps: %s  (pip install slack-bolt)", e)
    else:
        log.info("  Slack bot skipped — SLACK_BOT_TOKEN / SLACK_APP_TOKEN not set")

    if not threads:
        log.warning("No bots to start. Set tokens in .env.channels and try again.")
        log.warning("Copy .env.channels.example → .env.channels, fill in your tokens.")
        return

    for t in threads:
        t.start()
        log.info("Started %s bot thread", t.name)

    log.info("All bots running. Press Ctrl+C to stop.")
    try:
        for t in threads:
            t.join()
    except KeyboardInterrupt:
        log.info("Shutting down...")
        stop_event.set()
        for t in threads:
            t.join(timeout=5)
        log.info("All bots stopped.")


if __name__ == "__main__":
    main()
