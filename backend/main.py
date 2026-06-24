"""
Verified Video - Python Backend
Smart Learning. Privacy First.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import time
from datetime import datetime
from collections import defaultdict

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import config (with error handling)
try:
    from app.config import settings
except Exception as e:
    logger.warning(f"Config error: {e}. Using defaults.")
    settings = None

# Import API routes
auth = sessions = engagement = websocket = None
try:
    from app.api import auth, sessions, engagement, websocket
    logger.info("✅ API routes loaded")
except Exception as e:
    logger.warning(f"API routes not loaded: {e}")

# Import ML modules
try:
    from app.ml.face_detection import FaceDetector
    from app.ml.attention import AttentionCalculator
    logger.info("✅ ML modules loaded")
except Exception as e:
    logger.warning(f"ML modules not loaded: {e}")

# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    logger.info("🚀 Verified Video Backend Starting...")
    yield
    logger.info("👋 Verified Video Backend Shutting Down...")

# Initialize FastAPI app
app = FastAPI(
    title="Verified Video API",
    description="Smart Learning. Privacy First.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS configuration (allow frontend requests)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "https://verified-video.vercel.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Security headers middleware ──────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# ── Request logging middleware ───────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response: Response = await call_next(request)
    elapsed_ms = round((time.time() - start) * 1000)
    logger.info(
        f"{request.method} {request.url.path} → {response.status_code} ({elapsed_ms}ms)"
    )
    return response

# ── In-memory rate limiter: 5 login attempts per IP per minute ───────────────
_login_attempts: dict = defaultdict(list)

@app.middleware("http")
async def rate_limit_login(request: Request, call_next):
    if request.url.path == "/api/auth/login" and request.method == "POST":
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        window = 60.0
        attempts = [t for t in _login_attempts[ip] if now - t < window]
        _login_attempts[ip] = attempts
        if len(attempts) >= 5:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many login attempts. Try again in a minute."}
            )
        _login_attempts[ip].append(now)
    return await call_next(request)

# Initialize ML models (lazy load)
detector = None
calculator = None

def get_detector():
    """Lazy load face detector"""
    global detector
    if detector is None:
        try:
            detector = FaceDetector(confidence_threshold=0.5)
        except Exception as e:
            logger.error(f"Failed to load FaceDetector: {e}")
    return detector

def get_calculator():
    """Lazy load attention calculator"""
    global calculator
    if calculator is None:
        try:
            calculator = AttentionCalculator()
        except Exception as e:
            logger.error(f"Failed to load AttentionCalculator: {e}")
    return calculator

# ==================== ENDPOINTS ====================

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "name": "Verified Video API",
        "tagline": "Smart Learning. Privacy First.",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "verified-video-api",
        "timestamp": datetime.now().isoformat()
    }

# Test endpoint (to verify API works)
@app.get("/test")
async def test():
    """Test endpoint"""
    return {
        "message": "API working!",
        "endpoints": [
            "POST /api/auth/signup",
            "POST /api/auth/login",
            "GET /api/sessions",
            "POST /api/sessions",
            "POST /api/engagement/process-frame",
            "WS /ws/engagement/{session_key}"
        ]
    }

# ==================== INCLUDE API ROUTERS ====================

if auth:
    app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
if sessions:
    app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
if engagement:
    app.include_router(engagement.router, prefix="/api/engagement", tags=["Engagement"])

# ==================== WEBSOCKET ====================

@app.websocket("/ws/engagement/{session_key}")
async def websocket_engagement(ws: WebSocket, session_key: str):
    """Real-time engagement tracking WebSocket"""
    if websocket is None:
        await ws.close(code=1011, reason="WebSocket handler not available")
        return
    await websocket.handle_engagement_websocket(ws, session_key)

@app.get("/api/engagement/buffer-status")
async def buffer_status():
    """Check engagement buffer status"""
    if websocket is None:
        return {"error": "WebSocket handler not available"}
    return websocket.get_buffer_status()

# ==================== STARTUP ====================

if __name__ == "__main__":
    import uvicorn
    import os

    # Get port from environment or use default
    port = int(os.getenv("API_PORT", 8000))
    debug = os.getenv("DEBUG", "True").lower() == "true"

    logger.info(f"Starting server on 0.0.0.0:{port} (debug={debug})")
    logger.info("📚 API docs: http://localhost:8000/docs")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=debug,
        log_level="info",
    )
