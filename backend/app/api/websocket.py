"""
WebSocket handler for real-time engagement tracking
"""

from fastapi import WebSocket, WebSocketDisconnect
import json
import logging
import base64
import cv2
import numpy as np
from datetime import datetime
from collections import deque

from app.ml.face_detection import FaceDetector
from app.ml.attention import AttentionCalculator

logger = logging.getLogger(__name__)

try:
    from app.supabase_client import batch_log_engagement as _db_batch_log
    _supabase_ok = True
except Exception:
    _supabase_ok = False

# Initialize ML models
detector = FaceDetector(confidence_threshold=0.5)
calculator = AttentionCalculator()

# Store engagement logs in memory (buffer)
engagement_buffer = {}  # {session_key: [logs]}
BATCH_SIZE = 12  # Batch 12 entries before "saving"
MAX_MESSAGE_BYTES = 512 * 1024  # 512 KB — rejects oversized frames to prevent memory exhaustion

async def handle_engagement_websocket(websocket: WebSocket, session_key: str):
    """
    Handle real-time engagement tracking via WebSocket

    Client sends every 5 seconds:
    {
        "frame": "base64-encoded-image",
        "position": 10,  # video position in seconds
        "speed": 1.0,    # playback speed
        "timestamp": "2024-01-01T12:00:00"
    }

    Server responds:
    {
        "attention_score": 85,
        "face_present": true,
        "timestamp": "2024-01-01T12:00:00",
        "buffered": 1  # number of logs in buffer
    }
    """
    await websocket.accept()
    logger.info(f"✅ WebSocket connected: {session_key}")

    # Initialize buffer for this session
    if session_key not in engagement_buffer:
        engagement_buffer[session_key] = []

    log_count = 0
    recent_scores = deque(maxlen=6)  # Keep last 6 scores for rolling average

    try:
        while True:
            # Receive message from client
            raw_message = await websocket.receive_text()

            if len(raw_message.encode()) > MAX_MESSAGE_BYTES:
                await websocket.send_json({"error": "Message too large"})
                continue

            try:
                message = json.loads(raw_message)
            except json.JSONDecodeError:
                await websocket.send_json({"error": "Invalid JSON"})
                continue

            try:
                # Extract data
                frame_b64 = message.get("frame", "")
                position = message.get("position", 0)
                speed = message.get("speed", 1.0)

                # Decode frame
                if not frame_b64:
                    await websocket.send_json({"error": "No frame provided"})
                    continue

                frame_bytes = base64.b64decode(frame_b64)
                nparr = np.frombuffer(frame_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                if frame is None:
                    await websocket.send_json({"error": "Invalid frame"})
                    continue

                # Process frame
                face_detected, face_count = detector.detect_faces_in_frame(frame)

                attention_score = 0.0
                phone_detected = False
                head_pitch = 0.0

                if face_detected:
                    landmarks = detector.get_face_landmarks(frame)
                    if landmarks and landmarks["face_present"]:
                        attention_score = calculator.calculate_attention(landmarks)
                        head_pose = landmarks.get("head_pose", {})
                        head_pitch = head_pose.get("pitch", 0.0)
                        # Phone detected: head tilted significantly downward
                        # pitch > 0.15 means nose is well below expected position
                        phone_detected = head_pitch > 0.15

                # Add to recent scores
                recent_scores.append(attention_score)
                rolling_avg = sum(recent_scores) / len(recent_scores)

                # Create log entry
                log_entry = {
                    "session_key": session_key,
                    "attention_score": attention_score,
                    "rolling_average": rolling_avg,
                    "face_present": face_detected,
                    "face_count": face_count,
                    "position": position,
                    "speed": speed,
                    "timestamp": datetime.now().isoformat()
                }

                # Add to buffer
                engagement_buffer[session_key].append(log_entry)
                log_count += 1

                # Send response to client
                response = {
                    "attention_score": attention_score,
                    "rolling_average": rolling_avg,
                    "face_present": face_detected,
                    "face_count": face_count,
                    "phone_detected": phone_detected,
                    "head_pitch": round(head_pitch, 3),
                    "timestamp": datetime.now().isoformat(),
                    "buffered": len(engagement_buffer[session_key]),
                    "total_logs": log_count
                }

                await websocket.send_json(response)

                # Flush buffer when full
                if len(engagement_buffer[session_key]) >= BATCH_SIZE:
                    logs_to_save = engagement_buffer[session_key]
                    engagement_buffer[session_key] = []
                    if _supabase_ok:
                        _db_batch_log(logs_to_save)
                        logger.info(f"💾 Flushed {len(logs_to_save)} logs to Supabase ({session_key})")
                    else:
                        logger.info(f"💾 Buffer full ({len(logs_to_save)} logs) — Supabase unavailable, discarding")

            except Exception as e:
                logger.error(f"Frame processing error: {e}")
                await websocket.send_json({"error": str(e)})

    except WebSocketDisconnect:
        logger.info(f"❌ WebSocket disconnected: {session_key}")

        # Flush remaining logs on disconnect
        if session_key in engagement_buffer and engagement_buffer[session_key]:
            remaining = engagement_buffer[session_key]
            if _supabase_ok:
                _db_batch_log(remaining)
                logger.info(f"💾 Flushed {len(remaining)} remaining logs to Supabase on disconnect ({session_key})")
            else:
                logger.info(f"💾 {len(remaining)} logs lost on disconnect (Supabase unavailable)")

        if session_key in engagement_buffer:
            del engagement_buffer[session_key]

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.send_json({"error": f"Server error: {str(e)}"})
        except:
            pass
        await websocket.close()

def get_buffer_status():
    """Get status of all buffers"""
    return {
        "sessions": len(engagement_buffer),
        "total_buffered": sum(len(logs) for logs in engagement_buffer.values()),
        "sessions_detail": {
            session: len(logs) for session, logs in engagement_buffer.items()
        }
    }
