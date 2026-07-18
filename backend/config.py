from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", case_sensitive=False)

    supabase_url: str
    supabase_service_role_key: str
    supabase_jwt_secret: str = ""   # Optional: fetched from Supabase if blank
    gemini_api_key: str
    app_env: str = "development"
    app_version: str = "1.0.0"
    cors_origins: str = "http://localhost:8081,http://localhost:19006"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
