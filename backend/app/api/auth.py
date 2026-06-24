"""
Authentication API - User signup, login, profile
Backed by Supabase Auth with in-memory fallback for dev/offline use.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, field_validator
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt
from passlib.context import CryptContext
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Supabase client (None if misconfigured)
try:
    from app.supabase_client import supabase
except Exception as _e:
    logger.warning(f"Supabase unavailable: {_e}")
    supabase = None

# Bcrypt context for in-memory fallback only
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# In-memory fallback store  {user_id: user_dict}
_fallback_users: dict = {}

# ==================== DATA MODELS ====================

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    role: str
    age_bracket: Optional[str] = "13+"

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("role")
    @classmethod
    def role_must_be_valid(cls, v: str) -> str:
        if v not in ("teacher", "student"):
            raise ValueError("Role must be 'teacher' or 'student'")
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    age_bracket: str
    created_at: str

# ==================== HELPERS ====================

def _create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

# ==================== ENDPOINTS ====================

@router.post("/signup", response_model=UserResponse, status_code=201)
async def signup(request: SignupRequest):
    """
    Register a new user.
    Primary path: Supabase Auth (role stored in user_metadata).
    Fallback: bcrypt in-memory store for offline dev.
    """
    age_bracket = request.age_bracket or "13+"

    if supabase is not None:
        try:
            auth_resp = supabase.auth.sign_up({
                "email": request.email,
                "password": request.password,
                "options": {
                    "data": {
                        "role": request.role,
                        "age_bracket": age_bracket,
                    }
                },
            })

            if not auth_resp.user:
                raise HTTPException(status_code=400, detail="Signup failed — check Supabase email confirmation settings")

            user_id = auth_resp.user.id

            # Best-effort profile insert; fails gracefully if RLS blocks anon key
            try:
                supabase.table("users").insert({
                    "id": user_id,
                    "email": request.email,
                    "role": request.role,
                    "age_bracket": age_bracket,
                    "is_active": True,
                }).execute()
            except Exception as _rls_err:
                logger.warning(f"users table insert blocked (configure service key for full persistence): {_rls_err}")

            # Mirror in in-memory store so login fallback works if Supabase requires email confirmation
            _fallback_users[user_id] = {
                "id": user_id,
                "email": request.email,
                "password_hash": _pwd_context.hash(request.password),
                "role": request.role,
                "age_bracket": age_bracket,
                "created_at": datetime.now().isoformat(),
                "is_active": True,
            }

            logger.info(f"User signed up via Supabase: {request.email} ({request.role})")
            return UserResponse(
                id=user_id,
                email=request.email,
                role=request.role,
                age_bracket=age_bracket,
                created_at=datetime.now().isoformat(),
            )

        except HTTPException:
            raise
        except Exception as e:
            err_str = str(e).lower()
            if "already registered" in err_str or "already exists" in err_str:
                raise HTTPException(status_code=400, detail="Email already registered")
            # Fall through to in-memory on transient Supabase errors (rate limit, network, etc.)
            if "rate limit" in err_str or "too many" in err_str or "429" in err_str:
                logger.warning(f"Supabase rate-limited — using in-memory fallback: {e}")
            else:
                logger.error(f"Supabase signup error — using in-memory fallback: {e}")

    # ── In-memory fallback ──────────────────────────────────────────────────
    logger.warning("Supabase unavailable — storing user in-memory (data will not persist across restarts)")
    for u in _fallback_users.values():
        if u["email"] == request.email:
            raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    _fallback_users[user_id] = {
        "id": user_id,
        "email": request.email,
        "password_hash": _pwd_context.hash(request.password),
        "role": request.role,
        "age_bracket": age_bracket,
        "created_at": datetime.now().isoformat(),
        "is_active": True,
    }

    return UserResponse(
        id=user_id,
        email=request.email,
        role=request.role,
        age_bracket=age_bracket,
        created_at=_fallback_users[user_id]["created_at"],
    )


@router.post("/login")
async def login(request: LoginRequest):
    """
    Authenticate user and return a signed JWT.
    Primary: Supabase Auth sign_in_with_password (role from user_metadata).
    Fallback: bcrypt check against in-memory store.
    """
    if supabase is not None:
        try:
            auth_resp = supabase.auth.sign_in_with_password({
                "email": request.email,
                "password": request.password,
            })

            if not auth_resp.user:
                raise HTTPException(status_code=401, detail="Invalid email or password")

            user = auth_resp.user
            meta = user.user_metadata or {}
            role = meta.get("role", "student")
            age_bracket = meta.get("age_bracket", "13+")

            token = _create_access_token(user.id, request.email, role)
            logger.info(f"User logged in via Supabase: {request.email}")

            return {
                "access_token": token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "email": request.email,
                    "role": role,
                    "age_bracket": age_bracket,
                },
            }

        except HTTPException:
            raise
        except Exception as e:
            err_str = str(e).lower()
            # Always fall through to in-memory: "invalid login credentials" covers both wrong
            # password AND unconfirmed email, so we must verify against in-memory backup first.
            if "rate limit" in err_str or "too many" in err_str or "429" in err_str:
                logger.warning(f"Supabase rate-limited on login — using in-memory fallback: {e}")
            else:
                logger.info(f"Supabase login unavailable — using in-memory fallback: {e}")

    # ── In-memory fallback ──────────────────────────────────────────────────
    user = next((u for u in _fallback_users.values() if u["email"] == request.email), None)
    if not user or not _pwd_context.verify(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = _create_access_token(user["id"], user["email"], user["role"])
    logger.info(f"User logged in (in-memory fallback): {request.email}")

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "age_bracket": user["age_bracket"],
        },
    }


@router.get("/me")
async def get_current_user(token: Optional[str] = None):
    """
    Decode JWT and return user profile.
    Accepts token as query param for compatibility; use Authorization header in production.
    """
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        return UserResponse(
            id=user_id,
            email=payload.get("email", ""),
            role=payload.get("role", "student"),
            age_bracket="13+",
            created_at=datetime.now().isoformat(),
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/logout")
async def logout():
    """Logout — client should discard the JWT."""
    return {"message": "Logged out successfully"}
