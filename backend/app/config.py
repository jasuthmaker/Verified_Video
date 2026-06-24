"""
Application configuration and settings
"""

from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings"""

    # App
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    APP_NAME: str = "Verified Video API"
    APP_VERSION: str = "0.1.0"

    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_JWT_SECRET: str

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Face Detection & ML
    FACE_DETECTION_CONFIDENCE: float = 0.5
    MIN_FACE_DETECTION_FRAMES: int = 3  # Require 3+ frames to confirm face
    ATTENTION_BATCH_INTERVAL: int = 5  # Send engagement every 5 seconds
    ATTENTION_THRESHOLD: int = 70  # % required to pass

    # Playback Tampering Detection
    SKIP_DETECTION_THRESHOLD: int = 5  # Seconds (abrupt jump = skip)
    SPEED_ANOMALY_MIN: float = 0.5  # Minimum playback speed
    SPEED_ANOMALY_MAX: float = 2.0  # Maximum playback speed
    PAUSE_WARNING_THRESHOLD: int = 300  # 5 minutes

    # Engagement Logging
    ENGAGEMENT_LOG_BATCH_SIZE: int = 12  # Batch 12 entries before insert
    ENGAGEMENT_LOG_BUFFER_TIME: int = 5  # Seconds

    # Nvidia NIM (Phase 2)
    NIM_API_KEY: Optional[str] = None
    NIM_API_URL: str = "https://api.nima.ai/v1"
    NIM_MODEL: str = "meta-llama-3-70b-instruct"

    # COPPA (Children's Online Privacy Protection)
    COPPA_ENABLED: bool = True
    PARENTAL_CONSENT_EXPIRE_DAYS: int = 30
    MINOR_LOG_RETENTION_DAYS: int = 30

    # GDPR
    GDPR_ENABLED: bool = True
    ADULT_LOG_RETENTION_DAYS: int = 90
    AUTO_DELETE_LOGS_ENABLED: bool = True

    # Database
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_ECHO: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

# Instantiate settings
settings = Settings()

# Validate required settings
def validate_settings():
    """Validate that all required settings are present"""
    required = ["SUPABASE_URL", "SUPABASE_KEY", "SECRET_KEY"]
    missing = [key for key in required if not getattr(settings, key, None)]

    if missing:
        raise ValueError(f"Missing required settings: {', '.join(missing)}")

try:
    validate_settings()
except ValueError as e:
    print(f"⚠️  Configuration Error: {e}")
    print("Ensure .env file has SUPABASE_URL, SUPABASE_KEY, and SECRET_KEY")
