"""Ollama provider for local LLM inference (Tier 0 - free)."""

import requests
import json
from typing import Optional, Dict, List
from datetime import datetime


class OllamaProvider:
    """Local Ollama service provider."""

    def __init__(self, base_url: str = "http://localhost:11434"):
        """
        Initialize Ollama provider.

        Args:
            base_url: Ollama API endpoint (default: localhost:11434)
        """
        self.base_url = base_url
        self.api_url = f"{base_url}/api"

    def is_available(self) -> bool:
        """Check if Ollama service is running."""
        try:
            resp = requests.get(f"{self.api_url}/tags", timeout=2)
            return resp.status_code == 200
        except:
            return False

    def list_models(self) -> List[Dict]:
        """List available Ollama models."""
        try:
            resp = requests.get(f"{self.api_url}/tags", timeout=5)
            if resp.status_code != 200:
                return []

            data = resp.json()
            models = []
            for model in data.get("models", []):
                models.append({
                    "name": model.get("name"),
                    "size": model.get("size"),
                    "modified_at": model.get("modified_at"),
                    "digest": model.get("digest"),
                })
            return models
        except Exception as e:
            print(f"[Ollama] List models failed: {e}")
            return []

    def get_status(self) -> Dict:
        """Get Ollama service status."""
        if not self.is_available():
            return {
                "available": False,
                "status": "offline",
                "models": [],
                "message": "Ollama service not running",
            }

        try:
            models = self.list_models()
            return {
                "available": True,
                "status": "online",
                "models": models,
                "model_count": len(models),
                "default_model": models[0]["name"] if models else None,
                "base_url": self.base_url,
            }
        except Exception as e:
            return {
                "available": False,
                "status": "error",
                "message": str(e),
            }

    def generate(
        self,
        prompt: str,
        model: str = "llama2",
        stream: bool = False,
        temperature: float = 0.7,
    ) -> Dict:
        """
        Generate text using Ollama.

        Args:
            prompt: Input prompt
            model: Model name (default: llama2)
            stream: Stream response (not recommended for API)
            temperature: Sampling temperature (0-2)

        Returns:
            {
                "response": generated text,
                "model": model used,
                "tokens_input": input tokens,
                "tokens_output": output tokens,
                "duration_ms": generation time,
                "cost_usd": 0.0 (always free)
            }
        """
        try:
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": stream,
                "temperature": temperature,
            }

            resp = requests.post(
                f"{self.api_url}/generate",
                json=payload,
                timeout=120,
            )

            if resp.status_code != 200:
                return {
                    "error": f"HTTP {resp.status_code}",
                    "status": "failed",
                }

            data = resp.json()
            return {
                "response": data.get("response", ""),
                "model": data.get("model", model),
                "tokens_input": data.get("prompt_eval_count", 0),
                "tokens_output": data.get("eval_count", 0),
                "duration_ms": data.get("total_duration", 0) // 1_000_000,  # nanoseconds → ms
                "cost_usd": 0.0,  # Always free
                "status": "success",
            }

        except requests.Timeout:
            return {
                "error": "Request timeout (>120s)",
                "status": "timeout",
            }
        except Exception as e:
            return {
                "error": str(e),
                "status": "failed",
            }

    def chat(
        self,
        messages: List[Dict],
        model: str = "llama2",
        temperature: float = 0.7,
    ) -> Dict:
        """
        Chat completion using Ollama.

        Args:
            messages: List of {"role": "user"|"assistant", "content": "..."}
            model: Model name (default: llama2)
            temperature: Sampling temperature

        Returns:
            {
                "response": assistant message,
                "model": model used,
                "tokens_input": input tokens,
                "tokens_output": output tokens,
                "duration_ms": generation time,
                "cost_usd": 0.0
            }
        """
        try:
            payload = {
                "model": model,
                "messages": messages,
                "stream": False,
                "temperature": temperature,
            }

            resp = requests.post(
                f"{self.api_url}/chat",
                json=payload,
                timeout=120,
            )

            if resp.status_code != 200:
                return {
                    "error": f"HTTP {resp.status_code}",
                    "status": "failed",
                }

            data = resp.json()
            return {
                "response": data.get("message", {}).get("content", ""),
                "model": data.get("model", model),
                "tokens_input": data.get("prompt_eval_count", 0),
                "tokens_output": data.get("eval_count", 0),
                "duration_ms": data.get("total_duration", 0) // 1_000_000,
                "cost_usd": 0.0,
                "status": "success",
            }

        except requests.Timeout:
            return {
                "error": "Request timeout (>120s)",
                "status": "timeout",
            }
        except Exception as e:
            return {
                "error": str(e),
                "status": "failed",
            }

    def pull_model(self, model_name: str) -> Dict:
        """
        Download/pull a model from Ollama registry.

        Args:
            model_name: Model name (e.g., "llama2", "mistral", "neural-chat")

        Returns:
            {"status": "success|failed", "model": name, "message": details}
        """
        try:
            payload = {"name": model_name}

            # This streams, so we collect the response
            resp = requests.post(
                f"{self.api_url}/pull",
                json=payload,
                timeout=600,  # 10 min timeout for downloads
                stream=True,
            )

            if resp.status_code != 200:
                return {
                    "status": "failed",
                    "model": model_name,
                    "error": f"HTTP {resp.status_code}",
                }

            # Collect final status from stream
            last_status = None
            for line in resp.iter_lines():
                if line:
                    last_status = json.loads(line)

            return {
                "status": "success" if last_status and last_status.get("status") == "success" else "pulling",
                "model": model_name,
                "message": last_status.get("status", "pulling") if last_status else "pulling",
            }

        except requests.Timeout:
            return {
                "status": "timeout",
                "model": model_name,
                "error": "Download timeout (>10 min)",
            }
        except Exception as e:
            return {
                "status": "failed",
                "model": model_name,
                "error": str(e),
            }


def get_ollama_provider(base_url: str = None) -> OllamaProvider:
    """Singleton Ollama provider instance."""
    global _ollama
    if "_ollama" not in globals():
        _ollama = OllamaProvider(base_url or "http://localhost:11434")
    return _ollama
