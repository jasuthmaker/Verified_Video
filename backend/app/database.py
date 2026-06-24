"""
Supabase Database Connection
"""

from supabase import create_client, Client
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Supabase client
try:
    supabase: Client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_KEY,
    )
    logger.info("✅ Connected to Supabase")
except Exception as e:
    logger.error(f"❌ Failed to connect to Supabase: {e}")
    raise

async def get_db():
    """Dependency for FastAPI endpoints"""
    return supabase
