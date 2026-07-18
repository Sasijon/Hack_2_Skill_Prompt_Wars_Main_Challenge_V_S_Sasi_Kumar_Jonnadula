# HabitHeal — AI-Powered Habit Breaking App

> Break harmful habits with an empathetic AI coach, intelligent nudges, and personalized weekly insights — powered by Gemini 1.5 Flash.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native + Expo (TypeScript) — mobile + web |
| Backend | FastAPI (Python) |
| Database & Auth | Supabase (PostgreSQL + Auth) |
| LLM | Gemini 1.5 Flash |
| Push Notifications | Expo Push Notifications |
| Deployment | Render (backend) + Vercel (web) |

## Project Structure

```
habitheal/
├── frontend/          # Expo app (React Native + TypeScript)
│   ├── app/           # Expo Router screens
│   │   ├── (auth)/    # Login, Register
│   │   └── (tabs)/    # Home, Habits, Log, Chat, Insights
│   ├── lib/           # Supabase client, API helper
│   └── types/         # Shared TypeScript types
└── backend/           # FastAPI server
    ├── routers/       # API route handlers
    ├── services/      # Gemini, streak, nudge scheduler, context builder
    ├── models/        # Pydantic request/response models
    ├── middleware/     # JWT auth
    ├── migrations/    # Supabase SQL schema
    └── tests/         # pytest test suite
```

## Setup Guide

### 1. Supabase Project

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `backend/migrations/001_initial_schema.sql`
3. Copy your project credentials from **Settings → API**:
   - `Project URL`
   - `anon` key (for frontend)
   - `service_role` key (for backend — keep secret)
   - `JWT Secret` (Settings → API → JWT Settings)

### 2. Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key (free tier: 1M tokens/day)

### 3. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Supabase + Gemini credentials

# Run the server
uvicorn main:app --reload --port 8000

# Run tests
pytest tests/ -v
```

Backend will be available at: http://localhost:8000  
Swagger docs: http://localhost:8000/docs

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase URL + anon key, and backend API URL

# Start the Expo dev server
npm start

# Web browser (easiest for testing)
npm run web

# Android emulator
npm run android

# iOS simulator (macOS only)
npm run ios
```

### 5. Deployment

**Backend → Render**
1. Push code to GitHub
2. Connect repo to [Render](https://render.com), select `backend/` as root
3. Use the `render.yaml` config — set env vars in Render dashboard
4. Your API URL will be: `https://habitheal-api.onrender.com`

**Frontend → Vercel**
1. Connect repo to [Vercel](https://vercel.com), select `frontend/` as root
2. Set `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_BASE_URL` as env vars
3. Build command: `npx expo export --platform web`
4. Output directory: `dist`

## Test Credentials (for evaluators)

Set these in your Supabase project after running the migration, then update the README with actual values before submission.

```
Email:    test@habitheal.demo
Password: HabitHeal2025!
```

## Features

- **Habit Management** — Create custom habits with categories, daily goals, and target dates
- **Daily Logging** — Log habit activity with intensity ratings, notes, and slip/resist tracking
- **Streak Tracking** — Automatic streak calculation with current + longest streak display
- **AI Coach Chat** — Real-time chat with Gemini 1.5 Flash, context-aware of your full habit history
- **Intelligent Nudges** — Hourly scheduler checks for missed logs and sends personalized AI-generated push notifications
- **Weekly Insights** — AI-generated narrative analysis with 3 actionable recommendations every Sunday
- **Cross-Platform** — Runs on iOS, Android, and web from a single codebase

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check + Supabase connectivity |
| POST | `/habits/` | Create a habit |
| GET | `/habits/` | List user's habits |
| PUT | `/habits/{id}` | Update a habit |
| DELETE | `/habits/{id}` | Soft-delete a habit |
| POST | `/logs/` | Log habit activity |
| GET | `/logs/` | Get logs by habit + date range |
| POST | `/chat/` | Send message to AI coach |
| GET | `/chat/history` | Get conversation history |
| GET | `/insights/weekly` | Get AI weekly insight report |
| GET | `/nudges/` | Get nudge history |
| POST | `/nudges/{id}/open` | Mark nudge as opened |
