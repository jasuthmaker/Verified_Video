# Verified Video - Setup Guide

Complete step-by-step guide to get Verified Video running locally and deployed.

---

## Phase 1: Local Development Setup

### Step 1: Prerequisites

Install these first:
- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **Git** — [git-scm.com](https://git-scm.com)
- **Text editor** — VS Code recommended

Verify installation:
```bash
node --version    # Should be v18+
npm --version     # Should be 9+
git --version     # Should be 2.40+
```

### Step 2: Clone & Install

```bash
# Clone repository
git clone <repository-url>
cd verified-video

# Install dependencies
npm install

# Should complete without errors
```

### Step 3: Supabase Setup

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Create new project
   - Name: "Verified Video"
   - Region: Pick closest to you
   - Database password: Set strong password
3. Wait for project to initialize (~2 min)
4. In project dashboard, find **Project Settings → API**
5. Copy these values:
   - **Project URL** (looks like `https://xyz.supabase.co`)
   - **Anon Key** (looks like `eyJ...`)

### Step 4: Environment Configuration

Create `.env.local` in project root:

```bash
# Copy from template
cp .env.example .env.local

# Edit .env.local and fill in:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_ENV=development
VITE_LOG_LEVEL=debug
```

**Important:** Never commit `.env.local` to git (it's in `.gitignore`).

### Step 5: Database Setup

Apply migrations to create tables:

```bash
npm run supabase:push
```

This will:
- Create all 6 tables (users, video_sessions, engagement_logs, session_completions, consent_records, deletion_requests)
- Add indexes for performance
- Enable Row Level Security (RLS) policies
- Create stored functions for business logic

**Check it worked:**
1. Go to Supabase dashboard → SQL Editor
2. Run: `SELECT table_name FROM information_schema.tables WHERE table_schema='public';`
3. You should see: `users`, `video_sessions`, `engagement_logs`, `session_completions`, `consent_records`, `deletion_requests`

### Step 6: Start Dev Server

```bash
npm run dev
```

Expected output:
```
  VITE v5.0.0  ready in 345 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

Open `http://localhost:5173` in browser. You should see Verified Video home page.

---

## Phase 2: Local Testing

### Test User Registration (COPPA Flow)

1. Go to http://localhost:5173
2. Click **Sign Up**
3. Enter:
   - Email: `teacher@test.com`
   - Password: `Test123!@#`
   - Role: **Teacher**
   - Age: **13 or older**
4. Click **Create Account**
5. You should be redirected to Teacher Dashboard

### Test Database

In Supabase dashboard → SQL Editor, run:
```sql
-- Check user was created
SELECT id, email, role, age_bracket, created_at FROM users WHERE email = 'teacher@test.com';

-- Should return 1 row
```

### Test Supabase Auth

In browser DevTools Console:
```javascript
// Check session
const session = await supabase.auth.getSession();
console.log(session);  // Should show user email

// Check current user
const user = await supabase.auth.getUser();
console.log(user.data.user.email);  // Should print email
```

---

## Phase 3: Hot Reload Development

Vite provides instant reload on file changes.

### Try it:
1. Keep dev server running (`npm run dev`)
2. Edit `src/pages/Home.tsx` → change title text
3. Save file → Browser auto-refreshes in <100ms

This is your workflow during development.

---

## Phase 4: Building for Production

### Local Build

```bash
npm run build
```

Creates `dist/` folder with optimized production build.

To preview locally:
```bash
npm run preview
```

Starts local server at `http://localhost:4173` serving the production build.

### Check Build Size

```bash
# After npm run build
ls -lh dist/

# Check individual chunks
du -sh dist/*
```

Goal: Keep total <500KB gzipped (should be ~200-300KB).

---

## Phase 5: Deployment to Vercel

### Step 1: Push to GitHub

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit: Verified Video architecture"
git branch -M main

# Add remote (replace with your GitHub URL)
git remote add origin https://github.com/yourusername/verified-video.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **New Project**
3. Select `verified-video` repository
4. Keep default settings (Vite auto-detected)
5. Add environment variables:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Anon Key
6. Click **Deploy**

Vercel will:
- Clone your repo
- Run `npm install`
- Run `npm run build`
- Deploy `dist/` to CDN

**You're live!** Check your Vercel deployment URL (~`https://verified-video-xyz.vercel.app`).

### Continuous Deployment

Every time you push to GitHub → Vercel auto-deploys. No extra steps needed.

---

## Phase 6: Production Checklist

Before sharing with users:

### Security
- [ ] `.env.local` is in `.gitignore` (never commit secrets)
- [ ] Supabase RLS policies enabled on all tables
- [ ] HTTPS enforced (Vercel handles this)
- [ ] Environment variables set in Vercel dashboard (not in code)

### Database
- [ ] All migrations applied (`npm run supabase:push`)
- [ ] Indexes created (check via Supabase SQL Editor)
- [ ] RLS policies working (test in SQL Editor)
- [ ] Backups configured (Supabase auto-backup, daily snapshots)

### Frontend
- [ ] `npm run type-check` passes (no TypeScript errors)
- [ ] `npm run build` succeeds (no build errors)
- [ ] Links point to production URLs (not localhost)
- [ ] API endpoints use production Supabase URL

### Testing
- [ ] Sign up flow works end-to-end
- [ ] Can create video session (paste YouTube URL)
- [ ] Can view session as student
- [ ] Engagement logs being stored in database
- [ ] Teacher dashboard loads completion data

### Performance
- [ ] Lighthouse score >90 (Vercel Analytics)
- [ ] Core Web Vitals good (LCP, FID, CLS)
- [ ] API response times <200ms

---

## Phase 7: Advanced Setup (Optional)

### Database Backups

Supabase auto-backs up daily. To restore:
1. Supabase dashboard → Backups
2. Click restore button on backup you want

### Custom Domain

1. Buy domain (Namecheap, Google Domains, etc.)
2. Vercel dashboard → Project Settings → Domains
3. Add custom domain
4. Point DNS to Vercel (instructions provided)

### Monitoring & Logging

For Phase 2:
- **Error tracking:** Sentry.io integration
- **Analytics:** Vercel Analytics (built-in)
- **Database queries:** Supabase dashboard → Logs

### Environment-Specific Builds

```bash
# Development
VITE_APP_ENV=development npm run dev

# Staging
VITE_APP_ENV=staging npm run build

# Production (automatic on push to main)
```

---

## Troubleshooting

### Error: "Cannot find module '@supabase/supabase-js'"
```bash
# Missing dependencies
npm install
```

### Error: "VITE_SUPABASE_URL is undefined"
```bash
# Missing .env.local
cp .env.example .env.local
# Edit .env.local with actual values
```

### Error: "RLS policy denies access"
Check Supabase dashboard → SQL Editor → Check RLS policies are enabled:
```sql
SELECT tablename FROM pg_tables 
WHERE tablename IN ('users', 'video_sessions') 
AND schemaname = 'public';

SELECT * FROM pg_policies;  -- Check policies exist
```

### Error: "Port 5173 already in use"
```bash
# Kill process on port 5173
# macOS/Linux:
lsof -i :5173 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Browser shows "CORS error"
1. Check Supabase project settings
2. Verify `VITE_SUPABASE_URL` is correct
3. Try incognito mode (test if browser extensions interfere)

### Engagement logs not saving
1. Check browser console for errors (F12)
2. Verify Supabase RLS policies allow inserts
3. Check `student_id` is being set correctly

---

## Next Steps

1. **Week 1-2:** Build core components (SessionCreator, StudentViewer, useMediaPipe)
2. **Week 2-3:** Wire up engagement tracking and playback tampering detection
3. **Week 3-4:** Build teacher dashboard, COPPA flows, GDPR compliance
4. **Week 4+:** Testing, optimization, Phase 2 features (liveness, NIM)

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed implementation plan.

---

## Quick Reference

### Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run type-check      # Check TypeScript
npm run lint            # Lint code

# Building
npm run build           # Production build
npm run preview         # Preview build locally

# Database
npm run supabase:push   # Apply migrations
npm run supabase:pull   # Pull schema from prod

# Deployment
git push origin main    # Triggers Vercel deploy
```

### File Locations

| File | Purpose |
|------|---------|
| `.env.local` | Environment variables (local only) |
| `src/App.tsx` | Main app + routing |
| `src/services/auth.tsx` | Auth context |
| `src/services/supabase.ts` | Supabase client |
| `supabase/migrations/` | Database schema |
| `vite.config.ts` | Build config |

---

## Support & Help

- **Docs:** Read [ARCHITECTURE.md](./ARCHITECTURE.md) for technical deep dive
- **Issues:** Create GitHub issue for bugs
- **Questions:** Check existing issues/discussions first
- **Emergency:** Email support@verified.video

---

**You're all set! 🚀 Start building.**
