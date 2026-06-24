# Verified Video

**Smart Learning. Privacy First.**

A privacy-first engagement verification platform for K-12 educators. Teachers paste video links, students watch with transparent engagement tracking. No surveillance, no stored videos, no invasive monitoring—just trust.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)]()
[![React](https://img.shields.io/badge/React-18.2-blue)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)]()

---

## Features (MVP)

✅ **Easy Session Creation** — Teachers paste a YouTube/HLS URL, get an instant shareable link  
✅ **Real-Time Engagement Tracking** — Face detection + attention scoring via MediaPipe (client-side)  
✅ **Playback Integrity** — Detects skipping, speed anomalies, and long pauses  
✅ **Student Transparency** — Clear consent flow, students see their own attention score  
✅ **Teacher Analytics** — Completion %, average attention, student list with individual scores  
✅ **Privacy-First** — No video storage, client-side face detection, auto-deleted logs  
✅ **COPPA/GDPR Compliant** — Parental consent for minors, right to be forgotten, encrypted sessions  
✅ **Completely Free to Build** — Vercel + Supabase + Nvidia NIM free tiers cover MVP  

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier)
- Nvidia NIM API key (Phase 2, optional)

### Installation

```bash
# Clone repo
git clone <repo-url>
cd verified-video

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Fill in Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

# Start dev server
npm run dev
```

Visit `http://localhost:5173` and you're live.

### Database Setup

```bash
# Apply migrations to Supabase
npm run supabase:push

# (Optional) Pull schema from production
npm run supabase:pull
```

---

## How It Works

### **For Teachers**

1. **Sign up** — Email + password, confirm COPPA if <13
2. **Create session** — Paste YouTube link, click "Create"
3. **Share link** — Copy `https://verified.video/watch/xyz123`, send to students
4. **Monitor** — Dashboard shows who completed, attention scores, any flags

### **For Students**

1. **Click link** — Opens video in Verified Video player
2. **Enable webcam** — Simple consent modal (no camera recording, just attention tracking)
3. **Watch** — Real-time attention score displayed (0-100%)
4. **Complete** — Finish video → summary shows your engagement %, submitted to teacher

---

## Architecture Overview

```
React Frontend (Vercel)
    ↓
Supabase Backend (PostgreSQL + Auth)
    ↓
Client-Side Face Detection (MediaPipe)
    ↓
Engagement Logs (Encrypted, Auto-Deleted)
    ↓
Teacher Dashboard (Analytics)
```

**Key Components:**
- `StudentViewer.tsx` — Main engagement tracking loop
- `useMediaPipe.ts` — Face detection + attention scoring
- `SessionCreator.tsx` — Video URL validation + session generation
- `TeacherDashboard.tsx` — Analytics + completion tracking

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

---

## Project Structure

```
verified-video/
├── src/
│   ├── components/
│   │   ├── auth/           # Login, signup, COPPA flows
│   │   ├── teacher/        # Dashboard, session management
│   │   ├── student/        # Video player, engagement tracking
│   │   └── shared/         # Reusable components
│   ├── hooks/              # Custom React hooks (useMediaPipe, useAuth, etc.)
│   ├── services/           # Supabase, Auth, API layer
│   ├── types/              # TypeScript interfaces
│   ├── pages/              # Route pages
│   └── utils/              # Helpers (encryption, validation, NIM)
├── supabase/
│   └── migrations/         # Database schema (SQL)
├── index.html              # Entry point
├── vite.config.ts          # Build config
├── tailwind.config.js      # CSS framework
└── package.json            # Dependencies
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18 + TypeScript | Modern, type-safe, component-driven |
| Styling | Tailwind CSS | Utility-first, responsive, zero config |
| Build | Vite | Fast, ES modules, instant HMR |
| Backend | Supabase (PostgreSQL) | Free tier, built-in auth, RLS, Realtime |
| Face Detection | MediaPipe FaceMesh | Client-side, no API cost, 100% private |
| Hosting | Vercel + Supabase | Free tiers cover MVP, zero DevOps |
| AI (Phase 2) | Nvidia NIM | Free 10K API calls/month, anomaly detection |

---

## Key Features Deep Dive

### Real-Time Engagement Tracking

MediaPipe FaceMesh detects:
- **Face presence** — Is a face in frame? (boolean)
- **Attention score** — 0-100 blend of blink rate (50%), head pose (30%), gaze direction (20%)

**Privacy:** Only scores logged, never facial geometry. Video never leaves your device.

### Playback Integrity Checks

Detects:
- **Skipping** — Abrupt position jump → flagged
- **Speed anomalies** — Playing at 2x speed → warning
- **Long pauses** — Paused >5 min → soft alert (not hard fail)

### Session Completion Summary

After watching, students see:
```
Watch Time:       28:00 / 28:00  ✓
Attention Score:  87%            ✓
Result:           VERIFIED       ✓
Status:           Submitted to Teacher
```

Teacher is notified immediately.

---

## Privacy & Security

### What We DON'T Store
- ❌ Video files (stream from YouTube/HLS only)
- ❌ Facial images or biometrics
- ❌ Raw IP addresses
- ❌ Keystroke logs, screen recording
- ❌ Personally identifiable metadata

### What We DO Store (Encrypted)
- ✅ Engagement scores (0-100 attention)
- ✅ Session participation (yes/no presence)
- ✅ Completion time + duration
- ✅ Playback events (skips, pauses)

### Compliance
- **COPPA** — Parental consent required for <13. Age gate + email verification.
- **GDPR** — Right to be forgotten. Soft delete users + cascade delete data.
- **FERPA** — Educational records encrypted. Teacher-owned access only.
- **Auto-deletion** — Logs deleted 30 days (minors) / 90 days (adults)

---

## Deployment

### Frontend (Vercel)

```bash
# Push to GitHub
git push origin main

# Vercel auto-deploys
# Visit https://verified-video.vercel.app
```

### Backend (Supabase)

```bash
# Set up project at supabase.com (free tier)
# Get credentials from project settings
# Add to .env:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Push migrations
npm run supabase:push
```

### Environment Variables

Create `.env.local`:
```
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_NIM_API_KEY=... (Phase 2)
VITE_APP_ENV=production
```

---

## Development

### Install Dependencies
```bash
npm install
```

### Run Dev Server
```bash
npm run dev
# Opens http://localhost:5173
```

### Type Checking
```bash
npm run type-check
```

### Build for Production
```bash
npm run build
# Outputs to dist/
```

### Lint Code
```bash
npm run lint
```

---

## Roadmap

### Phase 1 (MVP - Current)
- ✅ User authentication (teacher/student/admin)
- ✅ Session creation (paste URL → shareable link)
- ✅ Real-time engagement tracking
- ✅ Playback integrity checking
- ✅ Teacher dashboard + analytics
- ✅ COPPA/GDPR compliance

### Phase 2 (Advanced)
- ⏳ Liveness challenges (blink detection, random prompts)
- ⏳ Device fingerprinting (VM/emulation detection)
- ⏳ Nvidia NIM anomaly detection (collusion detection)
- ⏳ Peer comparison analytics
- ⏳ Student transparency view
- ⏳ LMS integration (Canvas, Google Classroom)
- ⏳ Mobile app

### Phase 3 (Growth)
- ⏳ AI-powered insights (at-risk student detection)
- ⏳ Behavioral clustering (study groups, outliers)
- ⏳ Offline mode (encrypted local caching)
- ⏳ Advanced reporting + bulk operations
- ⏳ School/district admin panel

---

## Contributing

Contributions welcome! Please follow:
1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## API Endpoints (to be documented)

### Authentication
- `POST /auth/signup` — Register (with COPPA gating)
- `POST /auth/login` — Sign in
- `GET /auth/user` — Current user profile
- `POST /auth/logout` — Sign out
- `DELETE /auth/account` — GDPR right to be forgotten

### Teacher Sessions
- `POST /teacher/sessions` — Create session
- `GET /teacher/sessions` — List sessions
- `GET /teacher/sessions/{id}/analytics` — Dashboard stats
- `GET /teacher/sessions/{id}/students` — Student list
- `POST /teacher/sessions/{id}/export` — CSV download

### Student Engagement
- `GET /student/session/{sessionKey}` — Fetch session
- `POST /student/engagement` — Log telemetry
- `POST /student/session/{id}/complete` — Mark complete

See [API.md](./API.md) for detailed specs.

---

## Troubleshooting

### "Supabase connection failed"
- Check `.env` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Verify Supabase project is active at supabase.com

### "Face detection not working"
- Check browser allows camera access
- Verify webcam is plugged in and working
- Try incognito mode (test if browser extensions interfere)

### "Session link not working"
- Verify session_key_hash is indexed in database
- Check RLS policy allows public read access to active sessions

### "CORS error on API calls"
- Confirm Supabase CORS settings allow your Vercel domain
- Check request headers include `Authorization: Bearer {token}`

---

## FAQ

**Q: Why is there no video recording?**  
A: Privacy-first design. We only care if students are present and paying attention. Recording = massive liability + legal complexity. Streaming from YouTube is free.

**Q: Can I use non-YouTube videos?**  
A: Yes, via HLS streaming. Teachers provide HLS stream URL. Phase 2 adds S3 upload option.

**Q: What if a student uses a fake face?**  
A: Phase 2 adds liveness challenges (blink, look left/right). MVP trusts the honor system for homework-level stakes.

**Q: How long are engagement logs kept?**  
A: 30 days for minors (<13), 90 days for adults. Auto-deleted via scheduled job.

**Q: Can teachers see individual student faces?**  
A: No. Teachers only see completion %, attention score, and playback events. Zero video.

**Q: Is this GDPR/COPPA compliant?**  
A: Yes. Parental consent for minors, encrypted sessions, right to be forgotten, minimal data retention.

---

## License

Verified Video is MIT licensed. See [LICENSE](./LICENSE).

---

## Support

- 📧 Email: support@verified.video
- 📚 Docs: [ARCHITECTURE.md](./ARCHITECTURE.md)
- 🐛 Issues: [GitHub Issues](https://github.com/verified-video/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/verified-video/discussions)

---

## Acknowledgments

Built with:
- [React](https://react.dev)
- [Supabase](https://supabase.com)
- [MediaPipe](https://mediapipe.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite](https://vitejs.dev)
- [Nvidia NIM](https://developer.nvidia.com/nim)

---

**Smart Learning. Privacy First. 🚀**
