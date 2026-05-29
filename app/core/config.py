from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "Intellify"
    app_env: str = "development"
    environment: str = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    frontend_dev_url: str = "http://localhost:4000"
    database_url: str = Field(
        default=f"sqlite:///{BASE_DIR / 'sales_call_intelligence.db'}"
    )
    llm_provider: str = "mock"
    llm_model: str = "mock-json"
    llm_temperature: float = 0.1
    llm_max_output_tokens: int = 1200
    llm_timeout_seconds: float = 60.0
    openai_api_key: str | None = None
    google_api_key: str | None = None
    groq_api_key: str | None = None
    anthropic_api_key: str | None = None
    llm_provider_fallbacks: str = ""
    app_log_level: str = "INFO"
    prompt_dir: Path = BASE_DIR / "app" / "prompts"
    transcript_dir: Path = BASE_DIR / "transcripts"
    llm_max_retries: int = 2
    quote_fuzzy_threshold: float = 0.68
    max_transcript_chars: int = 50000
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/1"
    langchain_tracing_v2: bool = False
    langchain_api_key: str = ""
    langchain_project: str = "intellify"

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
