"""
Engagement API - Process frames and log engagement
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import base64
import cv2
import numpy as np
import logging
from datetime import datetime
from typing import Optional

from app.ml.face_detection import FaceDetector
from app.ml.attention import AttentionCalculator

logger = logging.getLogger(__name__)

try:
    from app.supabase_client import batch_log_engagement as _db_batch_log
    _supabase_ok = True
except Exception:
    _supabase_ok = False
router = APIRouter()

# Initialize ML models
detector = FaceDetector(confidence_threshold=0.5)
calculator = AttentionCalculator()

# ==================== DATA MODELS ====================

class FrameData(BaseModel):
    """Frame processing request"""
    frame: str  # base64 encoded image
    session_key: Optional[str] = None
    position: Optional[int] = None  # video position in seconds
    speed: Optional[float] = 1.0  # playback speed

class EngagementResponse(BaseModel):
    """Engagement response"""
    attention_score: float
    face_present: bool
    face_count: int
    eye_openness: Optional[float] = None
    head_pose: Optional[dict] = None
    timestamp: str

# ==================== ENDPOINTS ====================

@router.post("/process-frame", response_model=EngagementResponse)
async def process_frame(data: FrameData):
    """
    Process a video frame and return engagement metrics

    Input:
    {
        "frame": "base64-encoded-image",
        "session_key": "xyz123" (optional),
        "position": 10,  (optional, video position in seconds)
        "speed": 1.0     (optional, playback speed)
    }

    Output:
    {
        "attention_score": 85,
        "face_present": true,
        "face_count": 1,
        "eye_openness": 0.85,
        "head_pose": {"yaw": 0.1, "pitch": 0.2, "roll": 0.0},
        "timestamp": "2024-01-01T12:00:00"
    }
    """
    try:
        # Decode base64 frame
        try:
            frame_bytes = base64.b64decode(data.frame)
            nparr = np.frombuffer(frame_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None:
                raise ValueError("Invalid image data")
        except Exception as e:
            logger.error(f"Frame decode error: {e}")
            raise HTTPException(status_code=400, detail="Invalid base64 frame")

        # Detect faces
        face_detected, face_count = detector.detect_faces_in_frame(frame)

        # Default values
        attention_score = 0.0
        eye_openness = None
        head_pose = None

        # If face detected, get detailed analysis
        if face_detected:
            landmarks = detector.get_face_landmarks(frame)

            if landmarks and landmarks["face_present"]:
                # Calculate attention
                attention_score = calculator.calculate_attention(landmarks)
                eye_openness = landmarks.get("eye_openness", {}).get("average", 0)
                head_pose = landmarks.get("head_pose", {})

        # Log the engagement data
        logger.info(
            f"Engagement - Session: {data.session_key}, "
            f"Attention: {attention_score:.1f}, "
            f"Face: {face_detected}, "
            f"Position: {data.position}s"
        )

        return EngagementResponse(
            attention_score=attention_score,
            face_present=face_detected,
            face_count=face_count,
            eye_openness=eye_openness,
            head_pose=head_pose,
            timestamp=datetime.now().isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Frame processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

@router.get("/health")
async def engagement_health():
    """Health check for engagement service"""
    return {
        "status": "ok",
        "service": "engagement",
        "face_detection": "ready",
        "attention_calculator": "ready"
    }

@router.post("/batch")
async def batch_logs(logs: list):
    """
    Batch insert engagement logs

    Input: [
        {"attention_score": 85, "face_present": true, ...},
        {"attention_score": 82, "face_present": true, ...},
        ...
    ]
    """
    try:
        logger.info(f"Batch insert: {len(logs)} engagement logs")

        if _supabase_ok and logs:
            persisted = _db_batch_log(logs)
            return {"inserted": len(logs), "persisted": persisted}

        return {"inserted": len(logs), "persisted": False, "message": "Supabase unavailable — logs not persisted"}
    except Exception as e:
        logger.error(f"Batch insert error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/debug/detector-status")
async def detector_status():
    """Debug endpoint - check detector status"""
    return {
        "face_detector": "loaded",
        "attention_calculator": "loaded",
        "confidence_threshold": 0.5
    }
