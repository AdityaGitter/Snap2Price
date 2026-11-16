import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "ShopSmart AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-shopsmart-jwt-key-for-dev-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./shopsmart.db")

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Gemini API
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

    # External Retailer Affiliate / Product APIs (Optional - defaults to clearly labelled reference adapters)
    AMAZON_PA_API_KEY: Optional[str] = os.getenv("AMAZON_PA_API_KEY", "")
    FLIPKART_AFFILIATE_ID: Optional[str] = os.getenv("FLIPKART_AFFILIATE_ID", "")
    FLIPKART_AFFILIATE_TOKEN: Optional[str] = os.getenv("FLIPKART_AFFILIATE_TOKEN", "")
    CROMA_API_KEY: Optional[str] = os.getenv("CROMA_API_KEY", "")
    RELIANCE_API_KEY: Optional[str] = os.getenv("RELIANCE_API_KEY", "")

    # Notification Services: Email (SMTP) & AWS SNS (Optional - defaults to simulated delivery logging)
    SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: Optional[str] = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "alerts@shopsmart.ai")

    AWS_REGION: str = os.getenv("AWS_REGION", "ap-south-1")
    AWS_SNS_TOPIC_ARN: Optional[str] = os.getenv("AWS_SNS_TOPIC_ARN", "")

    # Background Price Monitoring Worker Settings
    PRICE_CHECK_INTERVAL_SECONDS: int = int(os.getenv("PRICE_CHECK_INTERVAL_SECONDS", "300"))
    ENABLE_IN_PROCESS_PRICE_WORKER: bool = os.getenv("ENABLE_IN_PROCESS_PRICE_WORKER", "false").lower() == "true"

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["*"]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
