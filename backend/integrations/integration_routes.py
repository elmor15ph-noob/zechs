"""FastAPI routes for channel integration status, health, and test dispatch."""

import time
import logging
from typing import Optional
from fastapi import APIRouter
import httpx

log = logging.getLogger("integration_routes")

router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.get("/status")
def integration_status():
    """Returns which channel bots are configured (tokens present) vs missing."""
    from integrations.channel_config import ChannelConfig
    cfg = ChannelConfig()
    return {
        "discord": {
            "configured": cfg.has_discord(),
            "channel_id": cfg.discord_channel_id or "all channels",
        },
        "slack": {
            "configured": cfg.has_slack(),
            "channel_id": cfg.slack_channel_id or "all channels",
        },
        "telegram": {
            "configured": cfg.has_telegram(),
        },
        "enabled_channels": cfg.enabled_channels(),
        "default_persona": cfg.default_persona,
        "duo_api_url": cfg.duo_api_url,
    }


@router.get("/health")
def integration_health():
    """Pings the DUO backend and reports channel bot configuration health."""
    from integrations.channel_config import ChannelConfig
    cfg = ChannelConfig()

    backend_ok = False
    backend_latency_ms = None
    try:
        t0 = time.time()
        resp = httpx.get(f"{cfg.duo_api_url}/health", timeout=5.0)
        backend_latency_ms = int((time.time() - t0) * 1000)
        backend_ok = resp.status_code == 200
    except Exception:
        pass

    return {
        "backend": {
            "ok": backend_ok,
            "latency_ms": backend_latency_ms,
            "url": cfg.duo_api_url,
        },
        "bots": {
            "discord": {"configured": cfg.has_discord()},
            "slack":   {"configured": cfg.has_slack()},
            "telegram":{"configured": cfg.has_telegram()},
        },
        "overall": "ok" if backend_ok else "backend_down",
    }


@router.post("/test-dispatch")
def test_dispatch(message: str = "ping", persona: str = "zero", channel: str = "test"):
    """Send a test message through the full dispatch pipeline and return the result."""
    from integrations.channel_config import ChannelConfig
    cfg = ChannelConfig()

    try:
        t0 = time.time()
        resp = httpx.post(
            cfg.dispatch_url,
            json={"channel": channel, "persona": persona, "message": message, "user": "test", "metadata": {}},
            timeout=30.0,
        )
        latency_ms = int((time.time() - t0) * 1000)
        if resp.status_code == 200:
            data = resp.json()
            return {"success": True, "persona": persona, "response": data.get("response"), "cost_usd": data.get("cost_usd", 0.0), "latency_ms": latency_ms}
        else:
            return {"success": False, "error": f"HTTP {resp.status_code}: {resp.text}", "latency_ms": latency_ms}
    except httpx.ConnectError:
        return {"success": False, "error": "DUO backend is offline — start with python main.py"}
    except Exception as e:
        return {"success": False, "error": str(e)}
