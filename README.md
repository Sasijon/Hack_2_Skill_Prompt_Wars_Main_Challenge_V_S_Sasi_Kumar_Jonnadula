# HabitHeal — AI-Powered Habit Breaking App

> Break harmful habits with an empathetic AI coach, intelligent nudges, and personalized weekly insights — powered by Google Gemini 1.5 Flash.

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| **Web App** | https://frontend-eight-rust-59.vercel.app |
| **Backend API** | https://habitheal-api.onrender.com |
| **API Docs** | https://habitheal-api.onrender.com/docs |

## 🔑 Test Credentials (For Evaluators)

> Use these to log in and explore all features without registering:

- **Email**: `jvs.gps@gmail.com`
- **Password**: `Qwertyu@67pro`

## 🎯 Challenge Alignment

**Challenge**: Breaking Bad Habits & Addiction

| Requirement | How We Meet It |
|-------------|----------------|
| Intelligent Nudges | Gemini generates hourly personalized nudge messages via APScheduler |
| Personalized Tracking | Per-user habit logs, streaks, and daily progress tracking |
| Adaptive Coaching | AI coach reads user's full habit history before every response |
| Behavior Change Support | Weekly AI insights with actionable recommendations |

## ✨ Features

- **Secure Auth** — Email/password via Supabase Auth with JWT verification
- **Habit Management** — Create and manage bad habits across Screen Time, Substance, Eating, Custom categories
- **Daily Logging** — Log daily progress with intensity scores, values, and notes
- **Streak Tracking** — Automatic streak calculation to reward consistency
- **AI Coach Chat** — Real-time streaming chat with Gemini using personal habit context
- **Smart Nudges** — Hourly AI-generated motivational nudges via background scheduler
- **Weekly Insights** — Gemini analyzes weekly patterns and gives actionable recommendations

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native + Expo (TypeScript) — mobile + web |
| Backend | FastAPI (Python) |
| Database & Auth | Supabase (PostgreSQL + RLS + Auth) |
| AI | Google Gemini 1.5 Flash |
| Scheduling | APScheduler (hourly nudge jobs) |
| Rate Limiting | SlowAPI |
| Deployment | Render (backend) + Vercel (web) |

## 🏗️ Architecture

```
User Browser / Mobile App
         │
         ▼
  Vercel (React Native Web)
         │  JWT-authenticated REST calls
         ▼
  Render (FastAPI Backend)
         │                    │
         ▼                    ▼
   Supabase DB          Google Gemini API
  (PostgreSQL + RLS)   (Chat, Nudges, Insights)
```

## 🔒 Security

- All API routes protected by JWT Bearer token authentication
- Supabase Row Level Security (RLS) — users can only access their own data
- Environment variables for all secrets — no hardcoded credentials
- Rate limiting on all endpoints via SlowAPI
- CORS restricted to known frontend domains

## 📁 Project Structure

```
habitheal/
├── frontend/              # Expo app (React Native + TypeScript)
│   ├── app/               # Expo Router screens
│   │   ├── (auth)/        # Login, Register
│   │   └── (tabs)/        # Home, Habits, Log, Chat, Insights
│   ├── lib/               # Supabase client, API helper
│   └── types/             # Shared TypeScript types
└── backend/               # FastAPI server
    ├── routers/            # habits, logs, chat, insights, nudges, auth, health
    ├── services/           # Gemini, streak calculator, nudge scheduler, context builder
    ├── models/             # Pydantic request/response models
    ├── middleware/          # JWT auth (HS256 + ES256 fallback)
    ├── migrations/          # Supabase SQL migrations
    └── tests/              # pytest test suite
```

## 🚀 Local Development

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npx expo start
```

### Environment Variables

Copy `.env.example` to `.env` in both `backend/` and `frontend/` and fill in your values.
