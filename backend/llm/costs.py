"""LLM Cost tracking utility."""

from enum import Enum
from typing import Dict

class LLMProvider(Enum):
    """LLM provider pricing (per 1M tokens)."""
    CLAUDE_OPUS = 15.0  # $15 per 1M input tokens
    CLAUDE_SONNET = 3.0  # $3 per 1M input tokens
    CLAUDE_HAIKU = 0.80  # $0.80 per 1M input tokens
    GPT4_TURBO = 10.0  # $10 per 1M input tokens
    GEMINI_2_FLASH = 0.075  # $0.075 per 1M input tokens (free tier)
    OLLAMA = 0.0  # Free (local)

PROVIDER_PRICES: Dict[str, float] = {
    'claude-3-5-sonnet-20241022': LLMProvider.CLAUDE_SONNET.value,
    'claude-opus': LLMProvider.CLAUDE_OPUS.value,
    'gpt-4-turbo': LLMProvider.GPT4_TURBO.value,
    'gemini-2.0-flash': LLMProvider.GEMINI_2_FLASH.value,
    'gemma2': LLMProvider.OLLAMA.value,
    'ollama': LLMProvider.OLLAMA.value,
}

def estimate_tokens(text: str) -> int:
    """Rough token estimation: ~4 chars per token."""
    return max(1, len(text) // 4)

def calculate_cost(model_name: str, input_tokens: int, output_tokens: int = 0) -> float:
    """Calculate cost for LLM query.

    Args:
        model_name: Model identifier (e.g., 'claude-3-5-sonnet-20241022')
        input_tokens: Number of input tokens
        output_tokens: Number of output tokens (if known)

    Returns:
        Cost in USD
    """
    price_per_1m = PROVIDER_PRICES.get(model_name, 0.0)

    # Input cost (output is typically 2-3x input price, but simplifying)
    total_tokens = input_tokens + (output_tokens * 2 if output_tokens else input_tokens)
    cost = (total_tokens / 1_000_000) * price_per_1m

    return round(cost, 6)

def get_provider_from_model(model_name: str) -> str:
    """Extract provider from model name."""
    if 'claude' in model_name.lower():
        return 'claude'
    elif 'gpt' in model_name.lower():
        return 'openai'
    elif 'gemini' in model_name.lower():
        return 'gemini'
    elif 'ollama' in model_name.lower() or 'gemma' in model_name.lower():
        return 'ollama'
    return 'unknown'

def get_provider_type(model_name: str) -> str:
    """Classify provider as local or online."""
    provider = get_provider_from_model(model_name)
    return 'local' if provider == 'ollama' else 'online'
