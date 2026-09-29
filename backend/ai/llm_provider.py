"""
LLM Provider Abstraction Layer for ModelBounty.
Supports Groq as the active provider while maintaining an extensible architecture.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import logging
from backend.config import settings

logger = logging.getLogger(__name__)


class LLMNotConfiguredError(Exception):
    """Raised when the requested LLM provider is missing configuration/API key."""
    pass


class LLMAuthenticationError(Exception):
    """Raised when authentication with the LLM provider fails."""
    pass


class LLMRateLimitError(Exception):
    """Raised when the LLM provider rate limit is exceeded."""
    pass


class LLMTimeoutError(Exception):
    """Raised when the LLM provider request times out."""
    pass


class LLMProviderError(Exception):
    """Raised when an unrecoverable provider or network error occurs."""
    pass


class LLMMalformedOutputError(Exception):
    """Raised when the provider output cannot be parsed into valid schema."""
    pass


class BaseLLMProvider(ABC):
    """Abstract base class for all LLM providers."""
    name: str

    @abstractmethod
    def is_configured(self) -> bool:
        """Return True if the provider is fully configured with valid credentials."""
        pass

    @abstractmethod
    def get_model(self) -> str:
        """Return the active model identifier."""
        pass

    @abstractmethod
    def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.1,
        max_tokens: int = 2048,
        json_mode: bool = True
    ) -> str:
        """Execute a chat completion request and return the raw assistant message content."""
        pass


class GroqProvider(BaseLLMProvider):
    """Official Groq SDK provider implementation."""
    name = "groq"

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout: Optional[float] = None
    ):
        self.api_key = api_key or getattr(settings, "GROQ_API_KEY", None)
        self.model = model or getattr(settings, "GROQ_MODEL", None) or "qwen/qwen3.8-27b"
        self.timeout = timeout or getattr(settings, "GROQ_TIMEOUT", 30.0)

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    def get_model(self) -> str:
        return self.model

    def _get_client(self):
        if not self.is_configured():
            raise LLMNotConfiguredError("GROQ_API_KEY is not configured")
        try:
            import groq
            return groq.Groq(
                api_key=self.api_key,
                timeout=self.timeout
            )
        except Exception as e:
            # Sanitize error: never leak key
            raise LLMProviderError(f"Failed to initialize Groq client: {type(e).__name__}") from None

    def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.1,
        max_tokens: int = 2048,
        json_mode: bool = True
    ) -> str:
        client = self._get_client()
        import groq

        kwargs: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        try:
            completion = client.chat.completions.create(**kwargs)
            if not completion.choices or not completion.choices[0].message:
                raise LLMMalformedOutputError("Groq returned an empty response")
            return completion.choices[0].message.content or ""
        except groq.AuthenticationError:
            # Never leak api_key or header tokens
            raise LLMAuthenticationError("Groq authentication failed. Please verify API credentials.") from None
        except groq.RateLimitError:
            raise LLMRateLimitError("Groq rate limit exceeded. Please retry later.") from None
        except (groq.APITimeoutError, TimeoutError):
            raise LLMTimeoutError("Groq request timed out.") from None
        except groq.APIConnectionError:
            raise LLMProviderError("Failed to connect to Groq API.") from None
        except groq.APIStatusError as e:
            raise LLMProviderError(f"Groq API returned HTTP error code {e.status_code}.") from None
        except Exception as e:
            if isinstance(e, (LLMAuthenticationError, LLMRateLimitError, LLMTimeoutError, LLMMalformedOutputError)):
                raise e
            raise LLMProviderError(f"Unexpected Groq provider error: {type(e).__name__}") from None


def get_llm_provider() -> BaseLLMProvider:
    """Factory function returning the active configured LLM provider."""
    provider_name = (settings.LLM_PROVIDER or "groq").lower().strip()
    if provider_name == "groq":
        return GroqProvider()
    # Default to Groq
    return GroqProvider()
