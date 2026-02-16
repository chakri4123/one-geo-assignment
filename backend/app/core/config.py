from pydantic_settings import BaseSettings

from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str
    GEMINI_API_KEY: Optional[str] = None
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_DEFAULT_REGION: Optional[str] = "ap-south-1"
    S3_BUCKET_NAME: str = "onegeo-las-storage-chakri"

    class Config:
        env_file = ".env"


settings = Settings()
