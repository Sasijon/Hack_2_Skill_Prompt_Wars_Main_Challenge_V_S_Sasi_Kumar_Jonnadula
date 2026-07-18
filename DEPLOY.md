# HabitHeal — End-to-End Deployment Guide

This guide takes you from a fresh clone to a fully live app:
- **Database**: Supabase (PostgreSQL + Auth)
- **Backend API**: Render (FastAPI)
- **Frontend web**: Vercel (Expo web)

Total time: ~30 minutes.

---

## Prerequisites

- GitHub account (repo already pushed)
- [Supabase](https://supabase.com) account (free)
- [Render](https://render.com) account (free)
- [Vercel](https://vercel.com) account (free)
- [Google AI Studio](https://aistudio.google.com) account (free — 1M tokens/day)
- Node.js 20+ and Python 3.11+ installed locally

---

## Step 1 — Supabase Setup

### 1.1 Create a project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a name (e.g. `habitheal`), set a strong DB password, pick a region close to your users
3. Wait ~2 minutes for provisioning

### 1.2 Run the database migrations

1. In your Supabase project, go to **SQL Editor**
2. Run the migrations **in order**:

```
backend/migrations/001_initial_schema.sql   ← tables, indexes, RLS policies
backend/migrations/002_rls_service_role_fix.sql  ← updated_at trigger + policy fixes
```

3. Copy and paste each file's contents and click **Run**

### 1.3 Collect your credentials

Go to **Project Settings → API** and copy:

| Variable | Where to find it |
|----------|-----------------|
| `SUPABASE_URL` | Project URL (e.g. `https://abcdef.supabase.co`) |
| `SUPABASE_ANON_KEY` | `anon` / `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key — **keep secret, server-side only** |
| `SUPABASE_JWT_SECRET` | **Settings → API → JWT Settings → JWT Secret** |

### 1.4 Configure Auth settings

In **Authentication → URL Configuration**:

- **Site URL**: `https://your-app.vercel.app` (update after Vercel deploy)
- **Redirect URLs** — add all of these:
  ```
  https://your-app.vercel.app/**
  https://your-app.vercel.app
  exp://localhost:8081/--/**
  exp+habitheal://expo-development-client/**
  ```

In **Authentication → Email Templates**:
- Customise the confirmation email subject/body to say "HabitHeal" (optional but professional)

In **Authentication → Providers**:
- **Email** is enabled by default — leave it on
- Enable **magic link** if you want passwordless sign-in

### 1.5 Create the demo user (for evaluators)

1. Go to **Authentication → Users → Add User**
2. Create:
   - Email: `demo@habitheal.app`
   - Password: `HabitHeal2025!`
   - Toggle: **Auto-confirm email** ✓
3. Run the seed script in SQL Editor:
   ```
   backend/migrations/003_seed_demo_data.sql
   ```
   This creates 3 demo habits with 14 days of log history and a sample chat message.

---

## Step 2 — Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **Create API Key** → copy the value
3. Free tier: **1 million tokens/day** — more than enough for evaluation

---

## Step 3 — Backend on Render

### 3.1 Connect your repo

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub account and select this repo
3. Render will detect `backend/render.yaml` automatically

### 3.2 Configure the service

If Render doesn't auto-populate from `render.yaml`, set manually:

| Field | Value |
|-------|-------|
| **Name** | `habitheal-api` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1` |
| **Health Check Path** | `/health` |
| **Plan** | Free |

### 3.3 Set environment variables

In **Environment → Environment Variables**, add:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | from Step 1.3 |
| `SUPABASE_SERVICE_ROLE_KEY` | from Step 1.3 |
| `SUPABASE_JWT_SECRET` | from Step 1.3 |
| `GEMINI_API_KEY` | from Step 2 |
| `APP_ENV` | `production` |
| `APP_VERSION` | `1.0.0` |
| `CORS_ORIGINS` | `https://your-app.vercel.app` (update after Vercel deploy) |

### 3.4 Deploy

Click **Create Web Service** — Render will build and deploy automatically.

After deploy, visit:
```
https://habitheal-api.onrender.com/health
```

You should see:
```json
{"status": "ok", "supabase": "connected", "version": "1.0.0", "env": "production"}
```

> **Free tier note**: Render free services spin down after 15 minutes of inactivity and take ~30 seconds to cold-start. For the evaluation, make one request to `/health` before demonstrating the app to wake it up.

---

## Step 4 — Frontend on Vercel

### 4.1 Import project

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Framework Preset: **Other** (not Next.js)

### 4.2 Set environment variables

In **Settings → Environment Variables**, add:

| Key | Value |
|-----|-------|
| `EXPO_PUBLIC_SUPABASE_URL` | from Step 1.3 |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | from Step 1.3 (anon key, **not** service role) |
| `EXPO_PUBLIC_API_BASE_URL` | `https://habitheal-api.onrender.com` |

### 4.3 Build settings

Vercel picks these up from `vercel.json` automatically:

| Setting | Value |
|---------|-------|
| Build Command | `npx expo export --platform web` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### 4.4 Deploy

Click **Deploy**. After success, your app is live at:
```
https://habitheal-<random>.vercel.app
```

### 4.5 Post-deploy: update CORS and Supabase redirect

1. Copy your Vercel URL (e.g. `https://habitheal-abc123.vercel.app`)
2. In **Render dashboard** → `habitheal-api` → Environment → update `CORS_ORIGINS`:
   ```
   https://habitheal-abc123.vercel.app,http://localhost:8081
   ```
3. In **Supabase Dashboard** → Authentication → URL Configuration → add the Vercel URL to redirect URLs
4. Trigger a redeploy on Render (or it will pick up the env var change automatically)

---

## Step 5 — Verify Everything Works

Run through this checklist in the live app:

- [ ] Open `https://habitheal-abc123.vercel.app`
- [ ] Register a new account (check email for confirmation)
- [ ] Or sign in with demo credentials: `demo@habitheal.app` / `HabitHeal2025!`
- [ ] See the Home dashboard
- [ ] Navigate to **Habits** — 3 demo habits visible
- [ ] Tap a habit → view streak and logs
- [ ] Navigate to **Log** → log today's activity → confirm streak updates
- [ ] Navigate to **Coach** → send a message → receive AI response from Gemini
- [ ] Navigate to **Insights** → generate weekly AI analysis
- [ ] Check `https://habitheal-api.onrender.com/docs` for full Swagger API documentation

---

## Local Development

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# Copy and fill in .env
Copy-Item .env.example .env
# Edit .env with real Supabase + Gemini credentials

# Run server
uvicorn main:app --reload --port 8000

# Run tests
pytest tests/ -v
```

Backend: http://localhost:8000  
Swagger docs: http://localhost:8000/docs

### Frontend

```powershell
cd frontend

# Copy and fill in .env
Copy-Item .env.example .env
# Edit .env with Supabase URL/anon key and API URL

# Run web
npm run web

# Run on Android emulator
npm run android
```

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────┐
│                   Vercel (Web)                       │
│         Expo Web App (React Native for Web)          │
│         https://habitheal-abc.vercel.app             │
└────────────────────┬────────────────────────────────┘
                     │ REST + Bearer JWT
                     ▼
┌─────────────────────────────────────────────────────┐
│               Render (Backend)                       │
│         FastAPI + Uvicorn + APScheduler              │
│         https://habitheal-api.onrender.com           │
│                                                      │
│  Routes: /habits /logs /chat /insights /nudges       │
│  AI: Gemini 1.5 Flash (google-generativeai)         │
│  Scheduler: Hourly nudge job (APScheduler)           │
└────────────────────┬────────────────────────────────┘
                     │ Supabase client (service role)
                     ▼
┌─────────────────────────────────────────────────────┐
│               Supabase                               │
│   PostgreSQL + Row Level Security + Auth (JWT)       │
│   Tables: habits, logs, chat_messages,               │
│           nudges, insights                           │
└─────────────────────────────────────────────────────┘
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Backend 500 on `/health` with `supabase: unreachable` | Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Render env vars |
| Frontend CORS error | Update `CORS_ORIGINS` in Render to include the full Vercel URL (no trailing slash) |
| Auth `Invalid JWT` errors | Ensure `SUPABASE_JWT_SECRET` in Render matches **exactly** what's in Supabase → Settings → API → JWT Settings |
| Vercel build fails | Check `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set in Vercel env |
| Render cold-start timeout | Hit `/health` once to wake up the service before demo |
| Demo seed not found | Make sure you created `demo@habitheal.app` in Supabase Auth first, then run migration 003 |
| Gemini 429 rate limit | Free tier allows 15 requests/minute — space out requests during demo |
