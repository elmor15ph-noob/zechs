"""Configuration for Brain App backend."""

import os
from pathlib import Path
from enum import Enum

# Load .env file if it exists
env_file = Path(__file__).parent / ".env"
if env_file.exists():
    try:
        from dotenv import load_dotenv
        load_dotenv(env_file)
        print(f"[Config] Loaded .env from {env_file}")
    except ImportError:
        pass

    # Manual fallback for keys not loaded by load_dotenv
    try:
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    key = key.strip()
                    value = value.strip()
                    os.environ[key] = value
    except Exception:
        pass

# Paths
VAULT_PATH = Path(os.getenv("VAULT_PATH", Path.home() / "Documents" / "SecondBrain"))
PROJECT_ROOT = Path(__file__).parent
LOG_DIR = VAULT_PATH / "BrainApp" / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

# LLM Configuration
class LLMProviderType(str, Enum):
    CLAUDE = "claude"
    OPENAI = "openai"
    OLLAMA = "ollama"
    GEMINI = "gemini"

LLM_PROVIDER = LLMProviderType(os.getenv("LLM_PROVIDER", "ollama").lower())
LLM_MODEL = os.getenv("LLM_MODEL", "gemma2")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
LLM_API_KEY = ANTHROPIC_API_KEY or OPENAI_API_KEY or GOOGLE_API_KEY

# Ollama Configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma2")

# Server Configuration
BACKEND_PORT = int(os.getenv("BACKEND_PORT", 8000))
BACKEND_HOST = os.getenv("BACKEND_HOST", "127.0.0.1")
BACKEND_RELOAD = os.getenv("BACKEND_RELOAD", "true").lower() == "true"

# Frontend Configuration
FRONTEND_PORT = int(os.getenv("FRONTEND_PORT", 3000))
REACT_APP_API_URL = os.getenv("REACT_APP_API_URL", "http://localhost:8000")

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# ─── Agent Kill Switches ────────────────────────────────────────────────────
# Set AGENT_<NAME>_ENABLED=false in .env to disable any agent without touching code.
# All agents are ON by default. Only turn off if you need to silence an agent fast.
AGENT_INBOX_ENABLED         = os.getenv("AGENT_INBOX_ENABLED",      "true").lower() == "true"
AGENT_SYNTHESIS_ENABLED     = os.getenv("AGENT_SYNTHESIS_ENABLED",  "true").lower() == "true"
AGENT_SAP_ENABLED           = os.getenv("AGENT_SAP_ENABLED",        "true").lower() == "true"
AGENT_LLM_KPI_ENABLED       = os.getenv("AGENT_LLM_KPI_ENABLED",    "true").lower() == "true"
AGENT_O2C_ENABLED           = os.getenv("AGENT_O2C_ENABLED",        "true").lower() == "true"
AGENT_ALTRON_ENABLED        = os.getenv("AGENT_ALTRON_ENABLED",      "true").lower() == "true"

# Registry: maps canonical agent names → enabled flag
AGENT_KILL_SWITCHES: dict[str, bool] = {
    "inboxdistiller":       AGENT_INBOX_ENABLED,
    "inbox":                AGENT_INBOX_ENABLED,
    "weeklysynthesisagent": AGENT_SYNTHESIS_ENABLED,
    "synthesis":            AGENT_SYNTHESIS_ENABLED,
    "sapcrawleragent":      AGENT_SAP_ENABLED,
    "sap":                  AGENT_SAP_ENABLED,
    "llmkpiagent":          AGENT_LLM_KPI_ENABLED,
    "llm_kpi":              AGENT_LLM_KPI_ENABLED,
    "o2corchestrator":      AGENT_O2C_ENABLED,
    "o2c":                  AGENT_O2C_ENABLED,
    "altrondigestagent":    AGENT_ALTRON_ENABLED,
    "altron":               AGENT_ALTRON_ENABLED,
}


def is_agent_enabled(agent_name: str) -> bool:
    """Return True if the named agent is allowed to run.

    Checks AGENT_KILL_SWITCHES by lowercased agent name.
    Unknown agents are enabled by default (fail-open).
    """
    return AGENT_KILL_SWITCHES.get(agent_name.lower(), True)


print(f"[Config] LLM Provider: {LLM_PROVIDER}")
print(f"[Config] LLM Model: {LLM_MODEL}")
print(f"[Config] Vault Path: {VAULT_PATH}")
print(f"[Config] Log Directory: {LOG_DIR}")

disabled = [k for k, v in AGENT_KILL_SWITCHES.items() if not v and not any(k == alias for alias in list(AGENT_KILL_SWITCHES.keys())[list(AGENT_KILL_SWITCHES.values()).index(v)+1:])]
if not all(AGENT_KILL_SWITCHES.values()):
    _off = {k for k, v in AGENT_KILL_SWITCHES.items() if not v}
    print(f"[Config] Kill switches OFF: {_off}")
