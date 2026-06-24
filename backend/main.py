"""
Verified Video - Python Backend
Smart Learning. Privacy First.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.api import auth, sessions, engagement, websocket_handler

# Configure logging
logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

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
        "https://verified-video.vercel.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "verified-video-api"}

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
app.include_router(engagement.router, prefix="/api/engagement", tags=["Engagement"])

# WebSocket endpoint for real-time engagement tracking
@app.websocket("/ws/engagement/{session_key}")
async def websocket_engagement(websocket: WebSocket, session_key: str):
    """
    WebSocket endpoint for real-time engagement tracking

    Client sends:
    - Video frames (base64 encoded)
    - Playback events (pause, seek, speed)

    Server sends:
    - Attention score (0-100)
    - Face detection result
    - Any flags/warnings
    """
    await websocket_handler.handle_engagement_websocket(websocket, session_key)

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
