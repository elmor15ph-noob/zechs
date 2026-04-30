"""
DUO Brain App — Discord Bot (Heavyarms Integration)
Routes Discord messages to the DUO backend via POST /openclaw/dispatch.

Persona prefixes:
  !zero        → general assistant
  !heavyarms   → SAP expert
  !sandrock    → Project Manager
  !altron      → cross-brain / synthesis

Env vars:
  DISCORD_BOT_TOKEN   — required
  DISCORD_CHANNEL_ID  — optional; if set, only listens in that channel
  DUO_API_URL         — default: http://localhost:8000
"""

import asyncio
import logging
import os
import textwrap
from pathlib import Path
from typing import Optional

import aiohttp
import discord
from discord.ext import commands

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("duo.discord")

# ---------------------------------------------------------------------------
# Config from env
# ---------------------------------------------------------------------------
BOT_TOKEN: str = os.environ.get("DISCORD_BOT_TOKEN", "")
CHANNEL_ID: Optional[int] = (
    int(os.environ["DISCORD_CHANNEL_ID"])
    if os.environ.get("DISCORD_CHANNEL_ID")
    else None
)
DUO_API_URL: str = os.environ.get("DUO_API_URL", "http://localhost:8000").rstrip("/")
DISPATCH_ENDPOINT: str = f"{DUO_API_URL}/openclaw/dispatch"

# Persona prefix map
PERSONA_PREFIXES: dict[str, str] = {
    "!zero": "zero",
    "!heavyarms": "heavyarms",
    "!sandrock": "sandrock",
    "!altron": "altron",
}

# Embed accent colour (cyan #00d4ff)
BOT_NAME = "Overlord"
EMBED_COLOR = 0x00D4FF

# Discord message character limit
DISCORD_CHAR_LIMIT = 2000

# ---------------------------------------------------------------------------
# Bot setup
# ---------------------------------------------------------------------------
intents = discord.Intents.default()
intents.message_content = True  # required for reading message text

bot = commands.Bot(command_prefix="!", intents=intents)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def parse_persona(content: str) -> tuple[str, str]:
    """
    Returns (persona, cleaned_message).
    Strips the leading prefix (e.g. '!heavyarms') if present.
    Defaults to 'zero'.
    """
    for prefix, persona in PERSONA_PREFIXES.items():
        if content.lower().startswith(prefix):
            message = content[len(prefix):].strip()
            return persona, message
    return "zero", content.strip()


def split_message(text: str, limit: int = DISCORD_CHAR_LIMIT) -> list[str]:
    """Split text into chunks that fit within Discord's character limit."""
    if len(text) <= limit:
        return [text]
    # Try to split on paragraph boundaries first, fall back to hard wrap
    chunks: list[str] = []
    while text:
        if len(text) <= limit:
            chunks.append(text)
            break
        split_at = text.rfind("\n\n", 0, limit)
        if split_at == -1:
            split_at = text.rfind("\n", 0, limit)
        if split_at == -1:
            split_at = limit
        chunks.append(text[:split_at])
        text = text[split_at:].lstrip("\n")
    return chunks


def build_embed(response_text: str, persona: str, cost_usd: float, part: int = 0, total: int = 1) -> discord.Embed:
    """Build a styled embed for the response."""
    title = f"{BOT_NAME} — {persona.capitalize()}"
    if total > 1:
        title += f" (part {part}/{total})"

    embed = discord.Embed(
        description=response_text,
        color=EMBED_COLOR,
    )
    embed.set_author(name=title)

    footer_parts = [f"{BOT_NAME} · DUO Brain", f"Persona: {persona}"]
    if cost_usd > 0:
        footer_parts.append(f"${cost_usd:.4f}")
    embed.set_footer(text=" · ".join(footer_parts))

    return embed


async def call_duo_backend(
    session: aiohttp.ClientSession,
    message: str,
    persona: str,
    user: str,
) -> dict:
    """POST to DUO dispatch endpoint and return the JSON response dict."""
    payload = {
        "channel": "discord",
        "persona": persona,
        "message": message,
        "user": user,
        "metadata": {},
    }
    async with session.post(DISPATCH_ENDPOINT, json=payload, timeout=aiohttp.ClientTimeout(total=60)) as resp:
        resp.raise_for_status()
        return await resp.json()


# ---------------------------------------------------------------------------
# Event handlers
# ---------------------------------------------------------------------------

@bot.event
async def on_ready():
    log.info("%s online as %s (id=%s)", BOT_NAME, bot.user, bot.user.id)
    if CHANNEL_ID:
        log.info("Listening exclusively in channel id=%s", CHANNEL_ID)
    else:
        log.info("Listening in all channels (DISCORD_CHANNEL_ID not set)")

    # Set avatar to robot-logo.png on first run (silently skips if unchanged)
    logo_path = (
        Path(__file__).parent.parent.parent / "frontend" / "public" / "robot-logo.png"
    )
    if logo_path.exists():
        try:
            await bot.user.edit(avatar=logo_path.read_bytes())
            log.info("Avatar updated from %s", logo_path)
        except discord.HTTPException:
            pass  # rate-limited or already set — non-fatal


@bot.event
async def on_message(message: discord.Message):
    # Ignore messages from the bot itself
    if message.author.bot:
        return

    # Determine whether to respond:
    # - Always respond to @mentions
    # - If DISCORD_CHANNEL_ID is set, also respond to all messages in that channel
    is_mention = bot.user in message.mentions
    is_target_channel = CHANNEL_ID is not None and message.channel.id == CHANNEL_ID

    if not (is_mention or is_target_channel):
        return

    # Strip the @mention from the content if present
    raw = message.content
    for mention_str in (f"<@{bot.user.id}>", f"<@!{bot.user.id}>"):
        raw = raw.replace(mention_str, "").strip()

    if not raw:
        await message.reply(f"Hey! I'm **{BOT_NAME}**, your DUO second brain. Ask me anything — or prefix with `!zero`, `!heavyarms`, `!sandrock`, or `!altron` to route to a specific agent.")
        return

    persona, clean_message = parse_persona(raw)
    user_display = str(message.author)

    log.info("Request from %s | persona=%s | channel=%s | msg=%.80r", user_display, persona, message.channel, clean_message)

    # Show typing indicator
    async with message.channel.typing():
        try:
            async with aiohttp.ClientSession() as http_session:
                data = await call_duo_backend(http_session, clean_message, persona, user_display)

            response_text: str = data.get("response", "(no response)")
            returned_persona: str = data.get("persona", persona)
            cost_usd: float = float(data.get("cost_usd", 0.0))

            log.info("Response from DUO | persona=%s | cost=$%.4f | chars=%d", returned_persona, cost_usd, len(response_text))

            chunks = split_message(response_text)
            total = len(chunks)

            for i, chunk in enumerate(chunks, start=1):
                embed = build_embed(chunk, returned_persona, cost_usd if i == total else 0.0, part=i, total=total)
                if i == 1:
                    await message.reply(embed=embed)
                else:
                    await message.channel.send(embed=embed)

        except aiohttp.ClientConnectorError:
            log.error("DUO backend unreachable at %s", DUO_API_URL)
            await message.reply(
                "Sorry, the DUO backend is currently unreachable. "
                "Make sure the server is running at `%s`." % DUO_API_URL
            )
        except aiohttp.ClientResponseError as exc:
            log.error("DUO backend returned HTTP %s: %s", exc.status, exc.message)
            await message.reply(
                f"The DUO backend returned an error ({exc.status}). Please try again shortly."
            )
        except asyncio.TimeoutError:
            log.error("DUO backend timed out")
            await message.reply("The DUO backend took too long to respond. Please try again.")
        except Exception as exc:  # noqa: BLE001
            log.exception("Unexpected error handling message: %s", exc)
            await message.reply("An unexpected error occurred. Check the bot logs for details.")

    # Allow built-in commands (e.g. !help) to still work
    await bot.process_commands(message)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    if not BOT_TOKEN:
        raise RuntimeError(
            "DISCORD_BOT_TOKEN environment variable is not set. "
            "Export it before running: export DISCORD_BOT_TOKEN=your_token_here"
        )
    log.info("Starting %s (DUO Discord bot) — connecting to Discord...", BOT_NAME)
    bot.run(BOT_TOKEN, log_handler=None)  # log_handler=None keeps our own logging config
