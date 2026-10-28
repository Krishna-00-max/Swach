from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path

# Always resolve .env relative to this file (backend/.env)
_ENV_FILE = Path(__file__).parent / ".env"


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str = "swachh-surveillance-secret-key-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    OPENAI_SERVICE_ACCOUNT_API_KEY: str = ""
    MAPPLS_API_KEY: str = "airirqzicbyeytqhohrisimzdsdxkbcacbkk"
    FIREBASE_CREDENTIALS_PATH: str = "./firebase-adminsdk.json"
    FIREBASE_PROJECT_ID: str = "swacch-surveillance"
    APP_NAME: str = "Swachh Surveillance"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    ALLOWED_ORIGINS: str = "https://swach-weld.vercel.app,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:3000"

    model_config = {
        "env_file": str(_ENV_FILE),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
