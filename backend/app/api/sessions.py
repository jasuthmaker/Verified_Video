"""
Sessions API - Manage video sessions
Backed by Supabase with in-memory fallback.
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, field_validator
import logging
import uuid
from datetime import datetime
from typing import Optional
from jose import jwt, JWTError
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Supabase helpers (None if unavailable)
try:
    from app.supabase_client import (
        create_session as _db_create_session,
        get_session_by_key as _db_get_by_key,
        get_session_by_id as _db_get_by_id,
        get_user_sessions as _db_get_user_sessions,
        record_completion as _db_record_completion,
    )
    _supabase_ok = True
except Exception as _e:
    logger.warning(f"Supabase session helpers unavailable: {_e}")
    _supabase_ok = False

# In-memory fallback {session_id: session_dict}
_sessions: dict = {}

# ==================== DATA MODELS ====================

class CreateSessionRequest(BaseModel):
    video_url: str
    title: Optional[str] = None
    description: Optional[str] = None

    @field_validator("video_url")
    @classmethod
    def url_must_be_valid(cls, v: str) -> str:
        if not v or not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("video_url must start with http:// or https://")
        return v

    @field_validator("title")
    @classmethod
    def title_max_length(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 200:
            raise ValueError("title must be 200 characters or fewer")
        return v

class SessionResponse(BaseModel):
    id: str
    session_key: str
    video_url: str
    title: Optional[str]
    description: Optional[str]
    created_at: str
    share_url: str

# ==================== HELPERS ====================

_SHARE_BASE = "https://verified-video.vercel.app"
_LOCAL_BASE = "http://localhost:5173"

def _extract_teacher_id(authorization: Optional[str]) -> Optional[str]:
    """Pull user_id from Bearer JWT, returning None if missing/invalid."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        token = authorization.split(" ", 1)[1]
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None

def _make_share_url(session_key: str, local: bool = False) -> str:
    base = _LOCAL_BASE if local else _SHARE_BASE
    return f"{base}/watch/{session_key}"

# ==================== ENDPOINTS ====================

@router.post("/", response_model=SessionResponse)
async def create_session(
    request: CreateSessionRequest,
    authorization: Optional[str] = Header(None),
):
    """
    Create a new video session.
    Saves to Supabase when teacher is authenticated; falls back to in-memory.
    """
    if not request.video_url:
        raise HTTPException(status_code=400, detail="video_url required")
    if not request.title:
        raise HTTPException(status_code=400, detail="title required")

    teacher_id = _extract_teacher_id(authorization)

    # ── Supabase path ────────────────────────────────────────────────────────
    if _supabase_ok and teacher_id:
        try:
            data = _db_create_session(
                teacher_id=teacher_id,
                video_url=request.video_url,
                title=request.title,
                description=request.description or "",
            )
            if data:
                key = data.get("session_key", "")
                logger.info(f"Session persisted to Supabase: {key}")
                return SessionResponse(
                    id=data["id"],
                    session_key=key,
                    video_url=request.video_url,
                    title=request.title,
                    description=request.description or "",
                    created_at=data.get("created_at", datetime.now().isoformat()),
                    share_url=_make_share_url(key),
                )
        except Exception as _e:
            logger.warning(f"Supabase session create failed, falling back to in-memory: {_e}")

    # ── In-memory fallback ───────────────────────────────────────────────────
    session_id = str(uuid.uuid4())
    session_key = str(uuid.uuid4())[:12]
    session = {
        "id": session_id,
        "session_key": session_key,
        "video_url": request.video_url,
        "title": request.title,
        "description": request.description or "",
        "created_at": datetime.now().isoformat(),
        "is_active": True,
        "completion_count": 0,
        "share_url": _make_share_url(session_key, local=True),
        "teacher_id": teacher_id,
    }
    _sessions[session_id] = session
    logger.info(f"Session created in-memory: {session_id} (key={session_key})")

    return SessionResponse(
        id=session_id,
        session_key=session_key,
        video_url=request.video_url,
        title=session["title"],
        description=session["description"],
        created_at=session["created_at"],
        share_url=session["share_url"],
    )


@router.get("/")
async def list_sessions(authorization: Optional[str] = Header(None)):
    """
    List sessions.
    When authenticated: queries Supabase for the teacher's sessions, merges in-memory.
    Unauthenticated: returns in-memory sessions only.
    """
    teacher_id = _extract_teacher_id(authorization)
    combined: list = []

    if _supabase_ok and teacher_id:
        try:
            db_sessions = _db_get_user_sessions(teacher_id)
            if db_sessions:
                combined.extend(db_sessions)
        except Exception as _e:
            logger.warning(f"Supabase list_sessions failed: {_e}")

    # Always include in-memory sessions (may include offline-created ones)
    for s in _sessions.values():
        combined.append(s)

    return {"sessions": combined, "total": len(combined)}


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    """Get session details by ID."""
    if _supabase_ok:
        try:
            data = _db_get_by_id(session_id)
            if data:
                key = data.get("session_key", "")
                return SessionResponse(
                    id=data["id"],
                    session_key=key,
                    video_url=data["video_url"],
                    title=data.get("title", ""),
                    description=data.get("description", ""),
                    created_at=data.get("created_at", ""),
                    share_url=_make_share_url(key),
                )
        except Exception as _e:
            logger.warning(f"Supabase get_session failed: {_e}")

    if session_id not in _sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    s = _sessions[session_id]
    return SessionResponse(
        id=s["id"],
        session_key=s["session_key"],
        video_url=s["video_url"],
        title=s["title"],
        description=s["description"],
        created_at=s["created_at"],
        share_url=s.get("share_url", _make_share_url(s["session_key"])),
    )


@router.get("/key/{session_key}")
async def get_session_by_key(session_key: str):
    """Look up session metadata by share key (used by StudentWatch)."""
    if _supabase_ok:
        try:
            data = _db_get_by_key(session_key)
            if data:
                return {
                    "title": data.get("title", ""),
                    "description": data.get("description", ""),
                    "video_url": data["video_url"],
                    "duration": data.get("duration_seconds", 0),
                    "engagement_threshold": data.get("engagement_threshold", 70),
                }
        except Exception as _e:
            logger.warning(f"Supabase get_by_key failed: {_e}")

    for s in _sessions.values():
        if s["session_key"] == session_key:
            return {
                "title": s["title"],
                "description": s["description"],
                "video_url": s["video_url"],
                "duration": 0,
                "engagement_threshold": 70,
            }

    raise HTTPException(status_code=404, detail="Session not found")


@router.post("/{session_id}/complete")
async def complete_session(session_id: str, completion_data: dict):
    """
    Record a student's session completion.
    Input: {student_id, engagement_percentage, avg_attention, total_engagement_seconds}
    """
    student_id = completion_data.get("student_id")

    if _supabase_ok and student_id:
        try:
            _db_record_completion(session_id, student_id, {
                "engagement_percentage": completion_data.get("engagement_percentage", 0),
                "avg_attention_score": completion_data.get("avg_attention", 0),
                "total_engagement_seconds": completion_data.get("total_engagement_seconds", 0),
                "passed_engagement_threshold": completion_data.get("engagement_percentage", 0) >= 70,
            })
            logger.info(f"Completion persisted to Supabase: session={session_id} student={student_id}")
        except Exception as _e:
            logger.warning(f"Supabase record_completion failed: {_e}")

    count = 1
    if session_id in _sessions:
        _sessions[session_id]["completion_count"] += 1
        count = _sessions[session_id]["completion_count"]

    return {"status": "completed", "session_id": session_id, "total_completions": count}


@router.get("/{session_id}/analytics")
async def session_analytics(session_id: str):
    """Get basic session analytics."""
    session = _sessions.get(session_id, {})
    return {
        "session_id": session_id,
        "title": session.get("title", ""),
        "total_viewers": 0,
        "completed": session.get("completion_count", 0),
        "completion_rate": 0,
        "avg_attention": 0,
    }
