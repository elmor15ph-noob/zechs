"""Abstract LLM Provider interface - supports Claude, OpenAI, Ollama."""

from abc import ABC, abstractmethod
from typing import Optional


class LLMProvider(ABC):
    """Abstract base class for any LLM provider."""

    @abstractmethod
    def query(
        self,
        prompt: str,
        system: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        """Send a query and get a response."""
        pass

    @abstractmethod
    def get_model_name(self) -> str:
        """Return the model identifier."""
        pass


class ClaudeProvider(LLMProvider):
    """Anthropic Claude API provider."""

    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet-20241022"):
        from anthropic import Anthropic

        self.client = Anthropic(api_key=api_key)
        self.model = model

    def query(
        self,
        prompt: str,
        system: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        """Query Claude API."""
        msg = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=system or "You are a helpful assistant.",
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
        )
        return msg.content[0].text

    def get_model_name(self) -> str:
        return self.model


class OpenAIProvider(LLMProvider):
    """OpenAI GPT API provider."""

    def __init__(self, api_key: str, model: str = "gpt-4-turbo"):
        from openai import OpenAI

        self.client = OpenAI(api_key=api_key)
        self.model = model

    def query(
        self,
        prompt: str,
        system: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        """Query OpenAI API."""
        msg = self.client.chat.completions.create(
            model=self.model,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system or "You are a helpful assistant."},
                {"role": "user", "content": prompt},
            ],
            temperature=temperature,
        )
        return msg.choices[0].message.content

    def get_model_name(self) -> str:
        return self.model


class OllamaProvider(LLMProvider):
    """Local Ollama provider (runs on http://localhost:11434)."""

    def __init__(self, base_url: str = "http://localhost:11434", model: str = "gemma2"):
        import requests

        self.base_url = base_url
        self.model = model
        self.requests = requests

    def query(
        self,
        prompt: str,
        system: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        """Query local Ollama."""
        try:
            resp = self.requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "system": system or "You are a helpful assistant.",
                    "temperature": temperature,
                    "num_predict": max_tokens,
                    "stream": False,
                },
                timeout=120,
            )
            resp.raise_for_status()
            return resp.json()["response"]
        except Exception as e:
            raise RuntimeError(f"Ollama error: {e}. Is Ollama running at {self.base_url}?")

    def get_model_name(self) -> str:
        return self.model


class LoadBalancedProvider(LLMProvider):
    """Load balancer between multiple providers (Claude + Gemini)."""

    def __init__(self, primary: LLMProvider, fallback: LLMProvider, strategy: str = "primary"):
        """
        Initialize with primary and fallback providers.

        Args:
            primary: Provider to try first (e.g., Claude)
            fallback: Provider to use if primary fails (e.g., Gemini)
            strategy: "primary" (always use primary), "round-robin", or "cost" (prefer cheaper)
        """
        self.primary = primary
        self.fallback = fallback
        self.strategy = strategy
        self.call_count = 0

    def query(
        self,
        prompt: str,
        system: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        """Query with load balancing fallback."""
        self.call_count += 1

        try:
            # Try primary provider first
            return self.primary.query(prompt, system, temperature, max_tokens)
        except Exception as e:
            print(f"[LoadBalancer] Primary provider failed ({self.primary.get_model_name()}), falling back to {self.fallback.get_model_name()}: {e}")
            try:
                # Fall back to secondary provider
                return self.fallback.query(prompt, system, temperature, max_tokens)
            except Exception as e2:
                print(f"[LoadBalancer] Both providers failed: {e2}")
                raise RuntimeError(f"All LLM providers failed. Primary: {e}, Fallback: {e2}")

    def get_model_name(self) -> str:
        return f"LoadBalanced({self.primary.get_model_name()} → {self.fallback.get_model_name()})"


def get_llm_provider() -> LLMProvider:
    """Factory function to get the configured LLM provider."""
    import os
    from config import LLM_PROVIDER, LLM_MODEL, LLM_API_KEY, OLLAMA_BASE_URL, OLLAMA_MODEL, ANTHROPIC_API_KEY, GOOGLE_API_KEY

    # Check if load balancing is enabled
    load_balance = os.getenv("LOAD_BALANCE", "false").lower() == "true"
    anthropic_key = ANTHROPIC_API_KEY
    google_key = GOOGLE_API_KEY

    if load_balance and anthropic_key and google_key:
        # Load balance between Gemini (primary) and Claude (fallback)
        from .gemini import GeminiProvider
        print("[Config] Load balancing enabled: Gemini (primary) -> Claude (fallback)")
        claude_provider = ClaudeProvider(api_key=anthropic_key, model=LLM_MODEL)
        gemini_provider = GeminiProvider(api_key=google_key, model="gemini-2.5-flash")
        return LoadBalancedProvider(primary=gemini_provider, fallback=claude_provider, strategy="primary")

    elif LLM_PROVIDER.value == "claude":
        if not anthropic_key:
            raise ValueError("ANTHROPIC_API_KEY not set")
        return ClaudeProvider(api_key=anthropic_key, model=LLM_MODEL)

    elif LLM_PROVIDER.value == "openai":
        if not LLM_API_KEY:
            raise ValueError("OPENAI_API_KEY not set")
        return OpenAIProvider(api_key=LLM_API_KEY, model=LLM_MODEL)

    elif LLM_PROVIDER.value == "ollama":
        return OllamaProvider(base_url=OLLAMA_BASE_URL, model=OLLAMA_MODEL)

    elif LLM_PROVIDER.value == "gemini":
        if not google_key:
            raise ValueError("GOOGLE_API_KEY not set")
        from .gemini import GeminiProvider
        return GeminiProvider(api_key=google_key, model=LLM_MODEL)

    else:
        raise ValueError(f"Unknown LLM provider: {LLM_PROVIDER}")
