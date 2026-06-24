# Verified Video - Python Backend

**Smart Learning. Privacy First.**

FastAPI backend for face detection, eye tracking, and engagement analysis.

---

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

Required:
- `SUPABASE_URL` — From supabase.com project settings
- `SUPABASE_KEY` — From supabase.com project settings
- `SECRET_KEY` — Any random string for JWT signing

### 3. Run Backend

```bash
python main.py
# or
uvicorn main:app --reload
```

Server runs on `http://localhost:8000`

API docs available at `http://localhost:8000/docs` (Swagger UI)

---

## Project Structure

```
backend/
├── main.py                          # FastAPI entry point
├── requirements.txt                 # Python dependencies
├── .env.example                     # Environment template
│
├── app/
│   ├── __init__.py
│   ├── config.py                    # Settings & validation
│   ├── database.py                  # Supabase connection
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py                  # /api/auth/* endpoints
│   │   ├── sessions.py              # /api/sessions/* endpoints
│   │   ├── engagement.py            # /api/engagement/* endpoints
│   │   └── websocket.py             # WebSocket handling
│   │
│   ├── ml/
│   │   ├── __init__.py
│   │   ├── face_detection.py        # ✅ Face detection with MediaPipe
│   │   ├── eye_tracking.py          # Eye openness & gaze (Phase 2)
│   │   ├── attention.py             # ✅ Attention score calculation
│   │   ├── anomaly.py               # Playback tampering detection
│   │   └── models.py                # Pre-trained models (if needed)
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── engagement_service.py    # Business logic
│   │   ├── session_service.py       # Session management
│   │   └── analytics_service.py     # Dashboard analytics
│   │
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── encryption.py            # AES-256 session keys
│   │   ├── validators.py            # Input validation
│   │   └── helpers.py               # Utility functions
│   │
│   └── models/
│       ├── __init__.py
│       ├── user.py                  # User model
│       ├── session.py               # VideoSession model
│       └── engagement.py            # EngagementLog model
│
└── tests/
    ├── __init__.py
    ├── test_face_detection.py
    ├── test_engagement.py
    └── test_api.py
```

---

## Core Modules

### **app/ml/face_detection.py** ✅ (IMPLEMENTED)

```python
from app.ml.face_detection import FaceDetector

detector = FaceDetector(confidence_threshold=0.5)

# Detect faces in a frame
face_detected, face_count = detector.detect_faces_in_frame(frame)

# Get detailed landmarks
landmarks = detector.get_face_landmarks(frame)
# Returns:
# {
#     "face_present": bool,
#     "face_count": int,
#     "landmarks": 468-point mesh,
#     "head_pose": {"yaw": float, "pitch": float, "roll": float},
#     "eye_openness": {"left_eye": float, "right_eye": float, "average": float}
# }
```

### **app/ml/attention.py** ✅ (IMPLEMENTED)

```python
from app.ml.attention import AttentionCalculator

calculator = AttentionCalculator()

# Calculate attention score
score = calculator.calculate_attention(landmarks_data)
# Returns: float (0-100)

# Get engagement level
level = calculator.get_engagement_level(score)
# Returns: 'high' | 'medium' | 'low'

# Calculate rolling average
avg = calculator.calculate_rolling_average(recent_scores)
```

---

## API Endpoints (To Be Implemented)

### Authentication
```
POST   /api/auth/signup         — Register with COPPA gating
POST   /api/auth/login          — Email + password sign-in
GET    /api/auth/user           — Current user profile
POST   /api/auth/logout         — Sign out
DELETE /api/auth/account        — GDPR right to be forgotten
```

### Sessions
```
POST   /api/sessions            — Create session from URL
GET    /api/sessions            — List teacher's sessions
GET    /api/sessions/{id}       — Get session details
PUT    /api/sessions/{id}       — Update session
DELETE /api/sessions/{id}       — Delete session
GET    /api/sessions/{id}/analytics — Dashboard stats
```

### Engagement
```
POST   /api/engagement          — Log engagement data
GET    /api/engagement/session/{id} — Get session logs
WS     /ws/engagement/{session_key}  — Real-time engagement tracking
```

---

## Real-Time WebSocket Flow

```
Client (Browser) → Python Backend
│
├─ Connect to /ws/engagement/{session_key}
├─ Send frame every 5 seconds: {"frame": "base64-encoded-image"}
├─ Send playback event: {"event": "play|pause|seek", "position": 10}
│
↓
│
Python Backend Processing
│
├─ Decode frame (base64 → OpenCV image)
├─ Detect face + landmarks
├─ Calculate attention score
├─ Detect playback tampering
├─ Batch log to Supabase
│
↓
│
Server → Client
│
└─ Send engagement data: {"attention": 85, "face_present": true, ...}
```

---

## Example: Process Video Frame

```python
import cv2
from app.ml.face_detection import FaceDetector
from app.ml.attention import AttentionCalculator

# Load image
frame = cv2.imread("test_frame.jpg")

# Detect face
detector = FaceDetector()
face_detected, face_count = detector.detect_faces_in_frame(frame)

if face_detected:
    # Get landmarks
    landmarks = detector.get_face_landmarks(frame)
    
    # Calculate attention
    calculator = AttentionCalculator()
    attention_score = calculator.calculate_attention(landmarks)
    
    print(f"Attention: {attention_score:.1f}%")
    print(f"Face count: {face_count}")
    print(f"Eye openness: {landmarks['eye_openness']['average']:.2f}")
    print(f"Head pose: yaw={landmarks['head_pose']['yaw']:.2f}")
```

---

## Testing

### Run Tests

```bash
pytest tests/
```

### Manual Testing

```bash
# Test face detection
python -c "from app.ml.face_detection import FaceDetector; print('✅ Face detection imported successfully')"

# Test API
curl http://localhost:8000/health
# Should return: {"status": "ok", "service": "verified-video-api"}
```

---

## Development Workflow

### Week 1-2: Core Implementation

1. **API Structure** (auth, sessions, engagement routes)
2. **Supabase Integration** (models, queries)
3. **WebSocket Handler** (real-time engagement tracking)
4. **Face Detection Pipeline** (frame → attention score)
5. **Testing** (unit + integration)

### Week 2-3: Full Integration

1. **Connect Frontend** (React sends frames via WebSocket)
2. **Dashboard Data** (analytics queries)
3. **Compliance** (GDPR, COPPA)
4. **Performance** (batch logging, caching)

### Week 3-4: Polish

1. **Error Handling**
2. **Logging & Monitoring**
3. **Documentation**
4. **Deployment** (Heroku, Railway, or custom server)

---

## Deployment

### Local
```bash
python main.py
```

### Production (Heroku)
```bash
heroku create verified-video-api
heroku config:set SUPABASE_URL=... SUPABASE_KEY=... SECRET_KEY=...
git push heroku main
```

### Production (Railway)
```bash
railway up
```

### Production (AWS/GCP/Azure)
- Use Docker: `docker build -t verified-video-api .`
- Deploy container with GPU support (for video processing)

---

## Key Dependencies

| Library | Purpose |
|---------|---------|
| **FastAPI** | Web framework |
| **MediaPipe** | Face detection + landmarks |
| **OpenCV** | Image processing |
| **NumPy** | Numerical calculations |
| **Supabase** | Database + Auth |
| **Pydantic** | Data validation |
| **SQLAlchemy** | ORM (if needed) |

---

## Next Steps

1. Implement API routers in `app/api/`
2. Implement services in `app/services/`
3. Connect WebSocket handler
4. Test face detection with real camera feed
5. Integrate with frontend

See [../ARCHITECTURE.md](../ARCHITECTURE.md) for detailed implementation guide.

---

**Built with Python. Powered by FastAPI. Verified by MediaPipe.** 🚀
