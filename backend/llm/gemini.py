"""Google Gemini API provider."""

from typing import Optional
from .base import LLMProvider


class GeminiProvider(LLMProvider):
    """Google Gemini API provider."""

    def __init__(self, api_key: str, model: str = "gemini-pro"):
        try:
            import google.generativeai as genai
        except ImportError:
            raise ImportError("Install google-generativeai: pip install google-generativeai")

        genai.configure(api_key=api_key)
        self.client = genai.GenerativeModel(model)
        self.model = model

    def query(
        self,
        prompt: str,
        system: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> str:
        """Query Gemini API."""
        full_prompt = f"{system or 'You are a helpful assistant.'}\n\n{prompt}"

        response = self.client.generate_content(
            full_prompt,
            generation_config={
                "temperature": temperature,
                "max_output_tokens": max_tokens,
            },
        )

        return response.text

    def get_model_name(self) -> str:
        return self.model
