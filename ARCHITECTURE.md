# Verified Video - Architecture Documentation

## Project Overview

Verified Video is a privacy-first engagement verification platform for K-12 educators. Teachers paste video URLs, generate shareable links, and students watch with transparent engagement tracking via webcam face detection and attention scoring.

**Tech Stack:**
- **Frontend:** React 18 + TypeScript + Tailwind CSS + Vite
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Face Detection:** MediaPipe FaceMesh (client-side)
- **AI:** Nvidia NIM (Phase 2 - anomaly detection)
- **Hosting:** Vercel (frontend) + Supabase (backend)

---

## Directory Structure

```
verified-video/
├── public/                          # Static assets
├── src/
│   ├── components/
│   │   ├── auth/                   # Authentication components (SignupFlow, LoginPage, etc.)
│   │   ├── teacher/                # Teacher-specific components
│   │   │   ├── TeacherDashboard.tsx
│   │   │   ├── SessionCreator.tsx
│   │   │   ├── SessionAnalytics.tsx
│   │   │   ├── StudentViewer.tsx
│   │   │   └── ExportButton.tsx
│   │   ├── student/                # Student-specific components
│   │   │   ├── StudentViewer.tsx   # Main engagement tracking loop
│   │   │   ├── WebcamConsent.tsx
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── FaceDetectionOverlay.tsx
│   │   │   ├── EngagementIndicator.tsx
│   │   │   └── CompletionSummary.tsx
│   │   └── shared/                 # Shared components
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── NavBar.tsx
│   │       └── Toast.tsx
│   ├── hooks/
│   │   ├── useAuth.ts              # Authentication hook
│   │   ├── useMediaPipe.ts         # Face detection + attention scoring
│   │   ├── useEngagementLogger.ts  # Batch engagement log telemetry
│   │   ├── usePlaybackTampering.ts # Detect skip/speed/pause anomalies
│   │   └── useTabVisibility.ts     # Track browser focus
│   ├── utils/
│   │   ├── sessionEncryption.ts    # Encrypt/decrypt session keys
│   │   ├── nimbusAPI.ts            # Nvidia NIM integration
│   │   ├── youtubeValidator.ts     # Parse YT URL + fetch metadata
│   │   ├── faceDetectionLogic.ts   # MediaPipe wrapper
│   │   └── telemetryBatcher.ts     # Batch engagement logs
│   ├── services/
│   │   ├── supabase.ts             # Supabase client initialization
│   │   ├── auth.tsx                # Auth context provider
│   │   ├── api.ts                  # API service layer
│   │   └── engagement.ts           # Engagement data service
│   ├── types/
│   │   └── index.ts                # TypeScript type definitions
│   ├── pages/
│   │   ├── Home.tsx                # Landing page
│   │   ├── Login.tsx               # Teacher/Student login
│   │   ├── Signup.tsx              # Registration with COPPA
│   │   ├── TeacherDashboard.tsx    # Main teacher hub
│   │   ├── StudentWatch.tsx        # Video player + engagement
│   │   └── NotFound.tsx            # 404 page
│   ├── styles/
│   │   └── globals.css             # Global Tailwind + custom CSS
│   ├── App.tsx                     # Main app component + routing
│   └── main.tsx                    # React DOM entry point
├── supabase/
│   ├── migrations/
│   │   ├── 20240101000000_init_schema.sql     # Database schema + RLS
│   │   ├── 20240102000000_functions.sql       # Stored functions (Phase 2)
│   │   └── 20240103000000_auto_delete.sql     # GDPR compliance job
│   └── seed.sql                    # Seed data for development
├── index.html                      # HTML entry point
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── postcss.config.js               # PostCSS configuration
├── package.json                    # Dependencies
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
├── ARCHITECTURE.md                 # This file
└── README.md                       # Project overview
```

---

## Core Components & Their Responsibilities

### **1. Authentication (Auth Context)**
**Files:** `src/services/auth.tsx`, `src/pages/Login.tsx`, `src/pages/Signup.tsx`

Handles user sign-up, sign-in, and profile management. Implements COPPA gating for minors.

**Flow:**
1. User signs up with email + password → Supabase Auth
2. User profile created in `users` table
3. Auth state persisted in React Context
4. Age bracket determines parental consent requirement

---

### **2. Teacher Session Management**
**Files:** `src/components/teacher/*`, `src/pages/TeacherDashboard.tsx`

Teachers create video sessions by pasting a URL.

**SessionCreator Component:**
1. Teacher pastes YouTube/HLS URL
2. Validates URL (fetches metadata, duration)
3. Generates encrypted session_key
4. Stores session in `video_sessions` table
5. Returns shareable link: `https://verified.video/watch/{session_key}`

**TeacherDashboard:**
1. Lists all teacher's sessions
2. Shows completion %, avg attention
3. Displays student list per session
4. Provides CSV export

---

### **3. Student Engagement Tracking (Core MVP)**
**Files:** `src/components/student/StudentViewer.tsx`, `src/hooks/useMediaPipe.ts`, `src/utils/faceDetectionLogic.ts`

The heart of the application. Real-time tracking while student watches video.

**StudentViewer Component:**
1. Student clicks shareable link → `GET /watch/{session_key}`
2. Shows webcam consent modal (transparent, simple)
3. Initializes MediaPipe FaceMesh (client-side)
4. Embeds YouTube IFrame or HLS stream
5. Runs engagement tracking loop (every 5 sec):
   - Face detection + attention score
   - Playback position + speed + pause events
   - Tab visibility tracking
   - Batch logs to Supabase

**Engagement Metrics (calculated real-time):**
- `face_present` (boolean): Face detected in current frame
- `attention_score` (0-100): Blend of blink rate, head pose, gaze
- `playback_position_seconds` (int): Current video timestamp
- `playback_speed` (float): Detect if skipped ahead or changed speed
- `skip_detected` (bool): Abrupt position jump detected
- `tab_active` (bool): Student's browser tab is focused
- `pause_duration_seconds` (int): How long paused

**Playback Tampering Detection:**
- Skip detection: Abrupt position jump → flag as skip
- Speed anomaly: Speed > 1.5x or < 0.5x → warning
- Long pause: Pause > 5 min → soft warning (not hard flag)

---

### **4. Face Detection & Attention Scoring (MediaPipe)**
**File:** `src/hooks/useMediaPipe.ts`, `src/utils/faceDetectionLogic.ts`

MediaPipe FaceMesh runs 100% client-side in WebGL. **No video leaves the browser.**

**Process:**
1. Request camera access (explicit user consent)
2. Initialize MediaPipe with 3D face mesh model
3. Every 5 seconds:
   - Detect face landmarks (468 points on face)
   - Calculate eye openness (blink detection)
   - Calculate head rotation (yaw, pitch, roll)
   - Estimate gaze direction (eye center relative to head)
4. Attention score = 50% eye openness + 30% head pose + 20% gaze forward
5. Store only `attention_score`, never store facial geometry

**Privacy Implementation:**
- Face landmarks processed locally, never sent to server
- Only numerical scores logged (0-100 attention)
- No video frame storage
- No facial recognition or biometric ID

---

### **5. Engagement Logging (Batching)**
**File:** `src/utils/telemetryBatcher.ts`, `src/hooks/useEngagementLogger.ts`

Collects engagement data locally, batches every 5 seconds, sends to Supabase.

**Batching Logic:**
- Collect 1 log entry every 5 sec (e.g., face_present=true, attention_score=85)
- Batch 5 entries = 25 seconds of data → POST `/engagement_logs`
- Benefits: Reduces API calls 5x, saves bandwidth, improves responsiveness

**Data Stored in `engagement_logs` table:**
- session_id, student_id, timestamp
- face_present, face_count, attention_score
- playback_position_seconds, playback_speed, skip_detected
- tab_active, window_focused
- device_fingerprint_hash (optional)

---

### **6. Session Completion & Summary**
**File:** `src/components/student/CompletionSummary.tsx`

After student finishes video:
1. Calculate engagement summary:
   - `total_engagement_seconds` = count of entries where face_present=true × 5
   - `engagement_percentage` = (total_engagement / video_duration) × 100
   - `avg_attention_score` = mean of all attention scores
2. Compare against `engagement_threshold` (default 70%)
3. Store in `session_completions` table
4. Show summary screen to student
5. Notify teacher (realtime update via Supabase)

**Example Summary:**
- Watch Time: 28:00 / 28:00
- Attention Score: 87%
- Result: ✓ VERIFIED (87% > 70% threshold)
- Status: Submitted to Teacher

---

### **7. Teacher Analytics Dashboard**
**File:** `src/components/teacher/SessionAnalytics.tsx`

Teacher views completion data:
- Completion rate % (# completed / # viewers)
- Avg attention score (across all students)
- Student list with individual scores
- Flags for anomalies (Phase 2: NIM analysis)
- CSV export for records

**Dashboard Queries:**
```sql
-- Get session completion stats
SELECT 
  COUNT(*) as total_students,
  COUNT(CASE WHEN engagement_percentage >= 70 THEN 1 END) as passed,
  AVG(avg_attention_score) as avg_attention
FROM session_completions
WHERE session_id = $1;
```

---

## Database Schema (PostgreSQL / Supabase)

### **Key Tables:**

**users**
- id (UUID)
- email (unique)
- role (teacher | student | admin)
- age_bracket (13+ | <13) — COPPA flag
- has_parental_consent (bool)
- is_active (bool)
- deleted_at (soft delete for GDPR)

**video_sessions**
- id (UUID)
- teacher_id (FK)
- video_url (YouTube or HLS)
- session_key (encrypted, shareable)
- session_key_hash (indexed for lookup)
- engagement_threshold (default 70%)
- is_active (bool)

**engagement_logs** (high-volume table)
- session_id (FK)
- student_id (FK)
- timestamp
- face_present (bool)
- attention_score (float 0-100)
- playback_position_seconds (int)
- playback_speed (float)
- skip_detected (bool)
- tab_active (bool)
- **Indexes:** (session_id, timestamp), (student_id, timestamp)

**session_completions**
- session_id (FK)
- student_id (FK)
- completed_at (timestamp)
- total_engagement_seconds (int)
- engagement_percentage (float)
- avg_attention_score (float)
- flagged_for_review (bool)

**consent_records** (immutable audit trail)
- user_id (FK)
- consent_type (webcam | data_collection | parental_approval | terms)
- consent_given (bool)
- timestamp (when given)
- ip_address_hash (hashed, not stored raw)

---

## Row Level Security (RLS)

All tables have RLS enabled. Policies enforce:
- Teachers see only own sessions
- Students see only own engagement logs
- Public can access sessions via public session_key
- Admin can query all data

Example policy:
```sql
CREATE POLICY "Teachers can view their own sessions"
  ON video_sessions FOR SELECT
  USING (auth.uid() = teacher_id OR role = 'admin');
```

---

## API Layer (to be built)

**Authentication Endpoints:**
- `POST /auth/signup` — Register with COPPA gating
- `POST /auth/login` — Email + password sign-in
- `GET /auth/user` — Current user profile
- `DELETE /auth/account` — GDPR right to be forgotten

**Teacher Session Endpoints:**
- `POST /teacher/sessions` — Create session from URL
- `GET /teacher/sessions` — List teacher's sessions
- `GET /teacher/sessions/{id}/analytics` — Dashboard stats

**Student Engagement Endpoints:**
- `GET /student/session/{session_key}` — Fetch session metadata
- `POST /student/engagement` — Log telemetry (batch)
- `POST /student/session/{id}/complete` — Mark as finished

---

## Deployment Strategy

### **Frontend (Vercel)**
```
1. Push code to GitHub
2. Vercel auto-deploys on push
3. Environment: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
4. Build: npm run build → dist/
5. Free tier: 100 GB bandwidth/month
```

### **Backend (Supabase)**
```
1. Supabase project created (free tier)
2. Database migrations applied
3. RLS policies enabled
4. Auth providers configured (email/magic link)
5. Free tier: 500 MB storage, 50K API calls/day
```

### **Environment Variables**
See `.env.example` for required vars:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_NIM_API_KEY (Phase 2)
- VITE_APP_ENV (development | staging | production)

---

## Development Workflow

### **Setup:**
```bash
npm install
cp .env.example .env
# Fill in Supabase credentials in .env
npm run dev
```

### **Database Migrations:**
```bash
# Create new migration
npm run supabase:migrate -- add_feature_name

# Apply migrations locally
npm run supabase:push

# Pull schema from production
npm run supabase:pull
```

### **Testing:**
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build
```

---

## Phase-by-Phase Feature Rollout

### **Phase 1 (MVP - Weeks 1-4)** ✅
- ✅ User auth (signup/login + COPPA)
- ✅ Session creation (paste URL → shareable link)
- ✅ Student viewer (webcam + video player)
- ✅ Real-time engagement tracking (MediaPipe)
- ✅ Playback tampering detection
- ✅ Teacher dashboard (basic analytics)
- ✅ GDPR/COPPA compliance

### **Phase 2 (Advanced Features - Week 5+)**
- ⏳ Liveness challenges ("blink now")
- ⏳ Device fingerprinting (detect VM/emulation)
- ⏳ Nvidia NIM anomaly detection (collusion detection)
- ⏳ Peer comparison analytics
- ⏳ Student transparency view (see own score)
- ⏳ LMS integration (Canvas, Classroom)

---

## Security & Privacy Checklist

- ✅ TLS 1.3 (all HTTPS)
- ✅ Session keys encrypted (AES-256)
- ✅ RLS enforced on all tables
- ✅ Engagement logs anonymized (no PII)
- ✅ Auto-delete logs (30 days minors, 90 days adults)
- ✅ COPPA parental consent flow
- ✅ GDPR right to be forgotten (soft delete)
- ✅ IP addresses hashed (never stored raw)
- ✅ Consent audit trail (immutable)
- ✅ No video storage (streaming only)
- ✅ No facial biometrics stored (only attention scores)

---

## Monitoring & Logging

**To be implemented (Phase 2):**
- Error tracking (Sentry)
- Performance monitoring (Vercel Analytics)
- Database query performance
- API request logging
- User engagement funnels

---

## Key Decisions & Trade-offs

| Decision | Choice | Why |
|----------|--------|-----|
| Face Detection | MediaPipe (client-side) | No API cost, full privacy control, 100% encrypted locally |
| Video Hosting | YouTube IFrame | Free, reliable, no storage cost |
| Backend Database | PostgreSQL via Supabase | Free tier, full-featured, RLS, Realtime |
| Engagement Batching | 5 second intervals | Balances real-time feel with API efficiency |
| Attention Scoring | Behavioral (blink + pose) | Non-invasive, not biometric ID, harder to spoof |
| Session Keys | Encrypted UUIDs in URL | Stateless, shareable, no DB lookup for public access |

---

## Common Questions

**Q: Why no video recording?**
A: Privacy-first design. Only attention scores matter, not video. Reduces storage costs 100x, eliminates privacy concerns.

**Q: Can students cheat with a fake face?**
A: Hard. Phase 2 adds liveness challenges (blink now). Low-stakes homework doesn't need bulletproof security.

**Q: What happens to engagement logs?**
A: Auto-deleted after 30 days (minors) or 90 days (adults). GDPR & COPPA compliant.

**Q: How does teacher know who watched?**
A: Email/enrollment list when sharing link. Session completion logs student_id + engagement_percentage.

**Q: Can students download videos?**
A: No. Videos stream from YouTube/HLS. No local copy. Cannot be redistributed.

---

**Last Updated:** 2024  
**Maintained by:** Verified Video Team
