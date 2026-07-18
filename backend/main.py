"""
HabitHeal FastAPI backend — main entry point.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from config import get_settings
from limiter import limiter
from routers import health, auth, habits, logs, chat, insights, nudges
from services.nudge_scheduler import run_nudge_job

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start APScheduler on app startup and shut it down cleanly."""
    settings = get_settings()
    logger.info(f"HabitHeal API starting — env={settings.app_env}, version={settings.app_version}")

    # Schedule nudge job — runs every hour
    scheduler.add_job(run_nudge_job, "interval", hours=1, id="nudge_job", replace_existing=True)
    scheduler.start()
    logger.info("APScheduler started — nudge job running every hour.")

    yield  # App is running

    scheduler.shutdown(wait=False)
    logger.info("APScheduler shut down.")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="HabitHeal API",
        description="AI-powered habit-breaking backend powered by Gemini 1.5 Flash.",
        version=settings.app_version,
        lifespan=lifespan,
        docs_url="/docs" if settings.app_env != "production" else None,
        redoc_url="/redoc" if settings.app_env != "production" else None,
    )
    
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # CORS — allow Expo web (localhost:8081, 19006) and Vercel
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(habits.router)
    app.include_router(logs.router)
    app.include_router(chat.router)
    app.include_router(insights.router)
    app.include_router(nudges.router)

    return app


app = create_app()
