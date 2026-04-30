"""OpenClaw Bridge — routes channel messages into DUO's dispatch endpoint.

Reads persona routing rules from openclaw/config.yaml, normalises incoming
messages from Discord / Slack / Telegram into the standard dispatch payload,
forwards to POST /openclaw/dispatch, and formats the response back per channel.

Logs every routed message (with cost) to .lancedb/openclaw-messages.jsonl.
"""

from __future__ import annotations

import json
import logging
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import aiohttp
import yaml

log = logging.getLogger("duo.openclaw_bridge")

# ---------------------------------------------------------------------------
# Paths & defaults
# ---------------------------------------------------------------------------

_HERE = Path(__file__).parent
_REPO_ROOT = _HERE.parent.parent          # BrainApp/
_CONFIG_PATH = _REPO_ROOT / "openclaw" / "config.yaml"
_VAULT_PATH = Path(os.getenv("VAULT_PATH", str(Path.home() / "Documents" / "SecondBrain")))
_LOG_FILE = _VAULT_PATH / ".lancedb" / "openclaw-messages.jsonl"

DISCORD_CHAR_LIMIT = 2000
TELEGRAM_MESSAGE_LIMIT = 4096


# ---------------------------------------------------------------------------
# Response formatters (one per channel)
# ---------------------------------------------------------------------------

def _format_discord(response_text: str, persona: str, cost_usd: float) -> dict:
    """Return a dict with `embeds` list ready for the Discord bot."""
    chunks: list[str] = []
    text = response_text
    while text:
        if len(text) <= DISCORD_CHAR_LIMIT:
            chunks.append(text)
            break
        split_at = text.rfind("\n\n", 0, DISCORD_CHAR_LIMIT)
        if split_at == -1:
            split_at = text.rfind("\n", 0, DISCORD_CHAR_LIMIT)
        if split_at == -1:
            split_at = DISCORD_CHAR_LIMIT
        chunks.append(text[:split_at])
        text = text[split_at:].lstrip("\n")

    total = len(chunks)
    embeds = []
    for i, chunk in enumerate(chunks, 1):
        title = f"DUO — {persona.capitalize()}"
        if total > 1:
            title += f" (part {i}/{total})"
        footer = f"Persona: {persona}"
        if cost_usd > 0 and i == total:
            footer += f" · Cost: ${cost_usd:.4f}"
        embeds.append({
            "title": title,
            "description": chunk,
            "color": 0x00D4FF,  # cyan accent per design system
            "footer": {"text": footer},
        })

    return {
        "channel": "discord",
        "format": "embeds",
        "embeds": embeds,
        "raw": response_text,
    }


def _format_slack(response_text: str, persona: str, cost_usd: float) -> dict:
    """Return a dict with `blocks` list (Slack Block Kit)."""
    blocks: list[dict] = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": f"DUO — {persona.capitalize()}",
                "emoji": True,
            },
        },
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": response_text[:3000]},
        },
    ]

    # Overflow → additional section blocks (Slack limit per block ~3000 chars)
    overflow = response_text[3000:]
    while overflow:
        chunk, overflow = overflow[:3000], overflow[3000:]
        blocks.append({
            "type": "section",
            "text": {"type": "mrkdwn", "text": chunk},
        })

    footer_parts = [f"*Persona:* {persona}"]
    if cost_usd > 0:
        footer_parts.append(f"*Cost:* ${cost_usd:.4f}")
    blocks.append({
        "type": "context",
        "elements": [{"type": "mrkdwn", "text": " · ".join(footer_parts)}],
    })

    return {
        "channel": "slack",
        "format": "blocks",
        "blocks": blocks,
        "raw": response_text,
    }


def _format_telegram(response_text: str, persona: str, cost_usd: float) -> dict:
    """Return plain Markdown text chunked for Telegram."""
    header = f"*DUO — {persona.capitalize()}*\n\n"
    combined = header + response_text
    chunks: list[str] = []
    while combined:
        if len(combined) <= TELEGRAM_MESSAGE_LIMIT:
            chunks.append(combined)
            break
        split_at = combined.rfind("\n\n", 0, TELEGRAM_MESSAGE_LIMIT)
        if split_at == -1:
            split_at = combined.rfind("\n", 0, TELEGRAM_MESSAGE_LIMIT)
        if split_at == -1:
            split_at = TELEGRAM_MESSAGE_LIMIT
        chunks.append(combined[:split_at])
        combined = combined[split_at:].lstrip("\n")

    if cost_usd > 0 and chunks:
        chunks[-1] += f"\n\n_Persona: {persona} · Cost: ${cost_usd:.4f}_"

    return {
        "channel": "telegram",
        "format": "markdown",
        "messages": chunks,
        "raw": response_text,
    }


_FORMATTERS = {
    "discord": _format_discord,
    "slack": _format_slack,
    "telegram": _format_telegram,
}


# ---------------------------------------------------------------------------
# OpenClawBridge
# ---------------------------------------------------------------------------

class OpenClawBridge:
    """Bridges any messaging channel into DUO's /openclaw/dispatch endpoint.

    Usage::

        bridge = OpenClawBridge()
        result = await bridge.route(
            channel="discord",
            user="jay#1234",
            message="!heavyarms What is our O2C throughput?",
            raw_metadata={"guild_id": "...", "channel_id": "..."},
        )
    """

    def __init__(
        self,
        config_path: Path | str | None = None,
        api_url: str | None = None,
        log_path: Path | str | None = None,
    ) -> None:
        self._config_path = Path(config_path or _CONFIG_PATH)
        self._api_url = (api_url or os.getenv("DUO_API_URL", "http://localhost:8000")).rstrip("/")
        self._dispatch_url = f"{self._api_url}/openclaw/dispatch"
        self._log_path = Path(log_path or _LOG_FILE)
        self._config: dict = {}
        self._persona_routing: dict[str, dict[str, str]] = {}
        self._default_personas: dict[str, str] = {}
        self._load_config()

    # ------------------------------------------------------------------
    # Config loading
    # ------------------------------------------------------------------

    def _load_config(self) -> None:
        """Load and parse openclaw/config.yaml."""
        if not self._config_path.exists():
            log.warning("OpenClaw config not found at %s — using defaults", self._config_path)
            self._config = {}
            return

        with self._config_path.open("r", encoding="utf-8") as fh:
            self._config = yaml.safe_load(fh) or {}

        channels_cfg: dict = self._config.get("channels", {})

        # Build per-channel persona routing tables
        for channel_name, channel_data in channels_cfg.items():
            if not isinstance(channel_data, dict):
                continue
            routing = channel_data.get("persona_routing", {})
            self._persona_routing[channel_name] = {
                k.lstrip("@!").lower(): v for k, v in routing.items()
            }
            self._default_personas[channel_name] = channel_data.get(
                "default_persona",
                self._config.get("brain", "zero"),
            )

        log.info(
            "OpenClaw config loaded — channels: %s",
            list(channels_cfg.keys()),
        )

    def reload_config(self) -> None:
        """Hot-reload the config without restarting the process."""
        self._persona_routing.clear()
        self._default_personas.clear()
        self._load_config()

    # ------------------------------------------------------------------
    # Persona resolution
    # ------------------------------------------------------------------

    def _resolve_persona(self, channel: str, message: str) -> tuple[str, str]:
        """Return (persona, cleaned_message).

        Strips leading mention prefixes (@zero, !heavyarms, etc.) if present,
        then falls back to the channel default or the global default (zero).
        """
        from channel_config import ChannelConfig  # lazy import avoids circular dep
        default = (
            self._default_personas.get(channel)
            or ChannelConfig().default_persona
        )

        routing = self._persona_routing.get(channel, {})
        # Check slash-command routing first (from config.yaml routing section)
        slash_routing: dict = self._config.get("routing", {}).get("slash_commands", {})
        for cmd in slash_routing:
            if message.strip().startswith(cmd):
                # Slash commands are handled by a different path; still pick persona
                break

        # Check @mention / !prefix routing
        lower = message.lower()
        for prefix, persona in routing.items():
            if lower.startswith(prefix):
                clean = message[len(prefix):].strip()
                return persona, clean

        # Common bare prefixes not in config (e.g. "!zero some message")
        bare_prefixes = {
            "!zero": "zero",
            "!heavyarms": "heavyarms",
            "!sandrock": "sandrock",
            "!altron": "altron",
        }
        for prefix, persona in bare_prefixes.items():
            if lower.startswith(prefix):
                clean = message[len(prefix):].strip()
                return persona, clean

        return default, message.strip()

    # ------------------------------------------------------------------
    # Logging
    # ------------------------------------------------------------------

    def _log_message(self, entry: dict) -> None:
        """Append a JSONL entry to .lancedb/openclaw-messages.jsonl."""
        try:
            self._log_path.parent.mkdir(parents=True, exist_ok=True)
            with self._log_path.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except OSError as exc:
            log.warning("Could not write openclaw log: %s", exc)

    # ------------------------------------------------------------------
    # Core routing method
    # ------------------------------------------------------------------

    async def route(
        self,
        channel: str,
        user: str,
        message: str,
        raw_metadata: dict[str, Any] | None = None,
    ) -> dict:
        """Normalise, dispatch, format, and log a channel message.

        Parameters
        ----------
        channel:
            Source channel name: ``"discord"``, ``"slack"``, ``"telegram"``,
            or ``"cli"``.
        user:
            Display name / ID of the sender.
        message:
            Raw message text as received from the channel.
        raw_metadata:
            Optional channel-specific metadata (guild IDs, thread IDs, etc.).
            Passed through to the dispatch payload unchanged.

        Returns
        -------
        dict
            Formatted response ready for the originating channel, plus a
            top-level ``"ok": bool`` and ``"persona"`` field.
        """
        raw_metadata = raw_metadata or {}
        persona, clean_message = self._resolve_persona(channel, message)

        payload: dict = {
            "channel": channel,
            "persona": persona,
            "message": clean_message,
            "user": user,
            "metadata": raw_metadata,
        }

        t0 = time.perf_counter()
        response_data: dict = {}
        error_msg: str | None = None

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self._dispatch_url,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=60),
                ) as resp:
                    resp.raise_for_status()
                    response_data = await resp.json()
        except aiohttp.ClientConnectorError as exc:
            error_msg = f"DUO backend unreachable: {exc}"
            log.error(error_msg)
        except aiohttp.ClientResponseError as exc:
            error_msg = f"DUO backend HTTP {exc.status}: {exc.message}"
            log.error(error_msg)
        except Exception as exc:  # noqa: BLE001
            error_msg = f"Unexpected error: {exc}"
            log.exception(error_msg)

        latency_ms = round((time.perf_counter() - t0) * 1000)

        if error_msg:
            log_entry = {
                "ts": datetime.now(timezone.utc).isoformat(),
                "channel": channel,
                "user": user,
                "persona": persona,
                "message_preview": clean_message[:120],
                "ok": False,
                "error": error_msg,
                "latency_ms": latency_ms,
                "cost_usd": 0.0,
            }
            self._log_message(log_entry)
            return {"ok": False, "persona": persona, "error": error_msg, "channel": channel}

        response_text: str = response_data.get("response", "(no response)")
        returned_persona: str = response_data.get("persona", persona)
        cost_usd: float = float(response_data.get("cost_usd", 0.0))

        # Log the successful exchange
        log_entry = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "channel": channel,
            "user": user,
            "persona": returned_persona,
            "message_preview": clean_message[:120],
            "response_chars": len(response_text),
            "ok": True,
            "cost_usd": cost_usd,
            "latency_ms": latency_ms,
            "metadata": raw_metadata,
        }
        self._log_message(log_entry)

        # Format response for the originating channel
        formatter = _FORMATTERS.get(channel, _format_discord)
        formatted = formatter(response_text, returned_persona, cost_usd)
        formatted["ok"] = True
        formatted["persona"] = returned_persona
        formatted["cost_usd"] = cost_usd
        formatted["latency_ms"] = latency_ms

        log.info(
            "Routed %s@%s → persona=%s | cost=$%.4f | latency=%dms | chars=%d",
            user,
            channel,
            returned_persona,
            cost_usd,
            latency_ms,
            len(response_text),
        )
        return formatted
