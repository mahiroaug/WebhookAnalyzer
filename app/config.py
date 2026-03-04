"""pydantic-settings による設定管理"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """アプリケーション設定"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # NGROK_AUTH_TOKEN 等の未定義変数を無視
    )

    database_url: str = "postgresql://webhook:webhook@db:5432/webhook_analyzer"
    ollama_host: str = "http://ollama:11434"
    ngrok_api_url: str = "http://localhost:4040"  # US-162: ngrok ローカル API
    llm_provider: str = "ollama"
    ollama_model: str = "gemma3:4b"

    # 受信APIの安全性・運用
    webhook_payload_max_bytes: int = 1 * 1024 * 1024  # 1MB
    webhook_request_timeout_seconds: int = 30


settings = Settings()
