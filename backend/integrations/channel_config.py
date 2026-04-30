"""Channel configuration — Pydantic settings for all messaging integrations.

Reads from environment variables (or a .env.channels file if loaded by the
caller). Imported by OpenClawBridge and individual channel bots.

Usage::

    from integrations.channel_config import ChannelConfig

    cfg = ChannelConfig()
    print(cfg.duo_api_url)         # http://localhost:8000
    print(cfg.discord_bot_token)   # from DISCORD_BOT_TOKEN env var
"""

from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings


class ChannelConfig(BaseSettings):
    """Settings for all messaging channel integrations.

    All fields are optional at import time — bots that don't need a particular
    token will never read it. Only the fields that are actually used at runtime
    need to be set.
    """

    # ------------------------------------------------------------------
    # Discord
    # ------------------------------------------------------------------
    discord_bot_token: str = Field(
        default="",
        validation_alias="DISCORD_BOT_TOKEN",
        description="Discord bot token from https://discord.com/developers",
    )
    discord_channel_id: str = Field(
        default="",
        validation_alias="DISCORD_CHANNEL_ID",
        description=(
            "Optional: if set, the Discord bot only responds in this channel. "
            "Leave blank to respond in all channels where it is mentioned."
        ),
    )

    # ------------------------------------------------------------------
    # Slack
    # ------------------------------------------------------------------
    slack_bot_token: str = Field(
        default="",
        validation_alias="SLACK_BOT_TOKEN",
        description="Slack bot OAuth token (xoxb-...)",
    )
    slack_app_token: str = Field(
        default="",
        validation_alias="SLACK_APP_TOKEN",
        description="Slack app-level token for Socket Mode (xapp-...)",
    )
    slack_channel_id: str = Field(
        default="",
        validation_alias="SLACK_CHANNEL_ID",
        description=(
            "Optional: Slack channel ID (C...) to restrict bot to a single channel."
        ),
    )

    # ------------------------------------------------------------------
    # Telegram
    # ------------------------------------------------------------------
    telegram_bot_token: str = Field(
        default="",
        validation_alias="TELEGRAM_BOT_TOKEN",
        description="Telegram bot token from @BotFather",
    )

    # ------------------------------------------------------------------
    # DUO backend
    # ------------------------------------------------------------------
    duo_api_url: str = Field(
        default="http://localhost:8000",
        validation_alias="DUO_API_URL",
        description="Base URL for the DUO Brain App FastAPI backend.",
    )

    # ------------------------------------------------------------------
    # OpenClaw global switches
    # ------------------------------------------------------------------
    openclaw_enabled: bool = Field(
        default=True,
        validation_alias="OPENCLAW_ENABLED",
        description=(
            "Master switch. Set to false to disable all channel routing "
            "without removing individual bot tokens."
        ),
    )
    default_persona: str = Field(
        default="zero",
        validation_alias="DEFAULT_PERSONA",
        description=(
            "Fallback persona when a message has no @mention or !prefix. "
            "Must match a persona key in openclaw/config.yaml."
        ),
    )

    model_config = {
        # Allow extra fields in case a subclass or future .env adds keys
        "extra": "ignore",
        # Read from .env.channels if present alongside the standard .env
        "env_file": (".env", ".env.channels"),
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }

    # ------------------------------------------------------------------
    # Convenience helpers
    # ------------------------------------------------------------------

    @property
    def dispatch_url(self) -> str:
        """Full URL for POST /openclaw/dispatch."""
        return f"{self.duo_api_url.rstrip('/')}/openclaw/dispatch"

    def has_discord(self) -> bool:
        """True if Discord bot token is configured."""
        return bool(self.discord_bot_token)

    def has_slack(self) -> bool:
        """True if both Slack tokens are configured."""
        return bool(self.slack_bot_token and self.slack_app_token)

    def has_telegram(self) -> bool:
        """True if Telegram bot token is configured."""
        return bool(self.telegram_bot_token)

    def enabled_channels(self) -> list[str]:
        """Return names of channels that have tokens configured and OpenClaw is enabled."""
        if not self.openclaw_enabled:
            return []
        channels: list[str] = ["cli"]  # CLI adapter is always on
        if self.has_discord():
            channels.append("discord")
        if self.has_slack():
            channels.append("slack")
        if self.has_telegram():
            channels.append("telegram")
        return channels
