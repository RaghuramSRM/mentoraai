import os
import httpx


class ProviderError(RuntimeError):
    pass


class DemoProvider:
    name = "demo"

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        return user_prompt


class OpenAIProvider:
    name = "openai"

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY", "")
        self.model = os.getenv("OPENAI_MODEL", "gpt-5-mini")
        if not self.api_key:
            raise ProviderError("OPENAI_API_KEY is not configured")

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        try:
            response = httpx.post(
                "https://api.openai.com/v1/responses",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={"model": self.model, "instructions": system_prompt, "input": user_prompt},
                timeout=30,
            )
            response.raise_for_status()
            text = response.json().get("output_text", "").strip()
            if not text:
                raise ProviderError("AI provider returned an empty response")
            return text
        except httpx.TimeoutException as exc:
            raise ProviderError("AI provider timed out") from exc
        except httpx.HTTPStatusError as exc:
            status = exc.response.status_code
            if status == 429:
                raise ProviderError("AI provider rate limit reached") from exc
            raise ProviderError(f"AI provider request failed with status {status}") from exc
        except (httpx.RequestError, ValueError, KeyError) as exc:
            raise ProviderError("AI provider request failed") from exc


def get_provider():
    provider = os.getenv("AI_PROVIDER", "demo").lower()
    if provider == "openai":
        return OpenAIProvider()
    if provider != "demo":
        raise ProviderError(f"Unsupported AI_PROVIDER: {provider}")
    return DemoProvider()
