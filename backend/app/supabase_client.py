"""
Supabase Client Configuration
Handles all database operations with proper error handling
"""

from supabase import create_client, Client
from app.config import settings
import logging
from typing import Optional, Dict, List, Any

logger = logging.getLogger(__name__)

# Initialize Supabase client
try:
    supabase: Client = create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_KEY,
    )
    logger.info("✅ Supabase client initialized")
except Exception as e:
    logger.error(f"❌ Failed to initialize Supabase: {e}")
    supabase = None

# ==================== User Operations ====================

def create_user(email: str, password: str, role: str, age_bracket: str) -> Optional[Dict]:
    """Create new user in Supabase"""
    try:
        # Sign up with auth
        auth_response = supabase.auth.sign_up({
            "email": email,
            "password": password,
        })

        user_id = auth_response.user.id

        # Create user profile
        response = supabase.table("users").insert({
            "id": user_id,
            "email": email,
            "role": role,
            "age_bracket": age_bracket,
            "is_active": True
        }).execute()

        logger.info(f"✅ User created: {email}")
        return response.data[0] if response.data else {"id": user_id, "email": email}

    except Exception as e:
        logger.error(f"Failed to create user {email}: {e}")
        return None

def get_user_by_email(email: str) -> Optional[Dict]:
    """Get user by email"""
    try:
        response = supabase.table("users").select("*").eq("email", email).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Failed to get user {email}: {e}")
        return None

def get_user_by_id(user_id: str) -> Optional[Dict]:
    """Get user by ID"""
    try:
        response = supabase.table("users").select("*").eq("id", user_id).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Failed to get user {user_id}: {e}")
        return None

# ==================== Session Operations ====================

def create_session(teacher_id: str, video_url: str, title: str, description: str = "") -> Optional[Dict]:
    """Create video session"""
    try:
        import uuid
        import hashlib
        session_key = str(uuid.uuid4())[:12]
        session_key_hash = hashlib.sha256(session_key.encode()).hexdigest()

        response = supabase.table("video_sessions").insert({
            "teacher_id": teacher_id,
            "video_url": video_url,
            "session_key": session_key,
            "session_key_hash": session_key_hash,
            "title": title,
            "description": description,
            "is_active": True,
            "video_type": "youtube",
            "engagement_threshold": 70
        }).execute()

        logger.info(f"✅ Session created: {session_key}")
        return response.data[0] if response.data else None

    except Exception as e:
        logger.error(f"Failed to create session: {e}")
        return None

def get_session_by_key(session_key: str) -> Optional[Dict]:
    """Get session by share key"""
    try:
        response = supabase.table("video_sessions").select("*").eq("session_key", session_key).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Failed to get session {session_key}: {e}")
        return None

def get_session_by_id(session_id: str) -> Optional[Dict]:
    """Get session by ID"""
    try:
        response = supabase.table("video_sessions").select("*").eq("id", session_id).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Failed to get session {session_id}: {e}")
        return None

def get_user_sessions(teacher_id: str) -> List[Dict]:
    """Get all sessions for teacher"""
    try:
        response = supabase.table("video_sessions").select("*").eq("teacher_id", teacher_id).execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Failed to get sessions for {teacher_id}: {e}")
        return []

# ==================== Engagement Operations ====================

def log_engagement(session_id: str, student_id: str, engagement_data: Dict) -> Optional[Dict]:
    """Log engagement metric"""
    try:
        response = supabase.table("engagement_logs").insert({
            "session_id": session_id,
            "student_id": student_id,
            **engagement_data,
            "timestamp": engagement_data.get("timestamp", "now()")
        }).execute()

        return response.data[0] if response.data else None

    except Exception as e:
        logger.error(f"Failed to log engagement: {e}")
        return None

def batch_log_engagement(logs: List[Dict]) -> bool:
    """Batch insert engagement logs"""
    try:
        if not logs:
            return True

        response = supabase.table("engagement_logs").insert(logs).execute()
        logger.info(f"✅ Logged {len(logs)} engagement records")
        return True

    except Exception as e:
        logger.error(f"Failed to batch log engagement: {e}")
        return False

def get_engagement_logs(session_id: str, student_id: str) -> List[Dict]:
    """Get engagement logs for session/student"""
    try:
        response = supabase.table("engagement_logs").select("*").eq(
            "session_id", session_id
        ).eq("student_id", student_id).execute()

        return response.data or []

    except Exception as e:
        logger.error(f"Failed to get logs for {session_id}/{student_id}: {e}")
        return []

def get_session_engagement_summary(session_id: str, student_id: str) -> Optional[Dict]:
    """Calculate engagement summary (using RPC function)"""
    try:
        response = supabase.rpc(
            "calculate_engagement_summary",
            {"session_id": session_id, "student_id": student_id}
        ).execute()

        return response.data[0] if response.data else None

    except Exception as e:
        logger.error(f"Failed to calculate summary: {e}")
        return None

# ==================== Session Completion ====================

def record_completion(session_id: str, student_id: str, completion_data: Dict) -> Optional[Dict]:
    """Record session completion"""
    try:
        response = supabase.table("session_completions").insert({
            "session_id": session_id,
            "student_id": student_id,
            **completion_data,
            "completed_at": completion_data.get("completed_at", "now()")
        }).execute()

        logger.info(f"✅ Completion recorded for {student_id}")
        return response.data[0] if response.data else None

    except Exception as e:
        logger.error(f"Failed to record completion: {e}")
        return None

# ==================== Consent Operations ====================

def record_consent(user_id: str, session_id: Optional[str], consent_type: str, consent_given: bool) -> bool:
    """Record user consent (COPPA/GDPR)"""
    try:
        supabase.table("consent_records").insert({
            "user_id": user_id,
            "session_id": session_id,
            "consent_type": consent_type,
            "consent_given": consent_given,
            "timestamp": "now()"
        }).execute()

        logger.info(f"✅ Consent recorded: {user_id} - {consent_type}")
        return True

    except Exception as e:
        logger.error(f"Failed to record consent: {e}")
        return False

# ==================== Data Deletion (GDPR) ====================

def request_deletion(user_id: str, reason: str = "User request") -> bool:
    """Request data deletion (GDPR right to be forgotten)"""
    try:
        supabase.table("deletion_requests").insert({
            "user_id": user_id,
            "reason": reason,
            "status": "pending"
        }).execute()

        logger.info(f"✅ Deletion request created for {user_id}")
        return True

    except Exception as e:
        logger.error(f"Failed to create deletion request: {e}")
        return False

def soft_delete_user(user_id: str) -> bool:
    """Soft delete user (GDPR)"""
    try:
        supabase.rpc("soft_delete_user", {"user_id": user_id}).execute()
        logger.info(f"✅ User {user_id} soft deleted")
        return True
    except Exception as e:
        logger.error(f"Failed to soft delete user: {e}")
        return False

# ==================== Health Check ====================

def health_check() -> bool:
    """Check if Supabase connection is alive"""
    try:
        supabase.table("users").select("id").limit(1).execute()
        return True
    except Exception as e:
        logger.error(f"Supabase health check failed: {e}")
        return False
