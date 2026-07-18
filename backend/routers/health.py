from fastapi import APIRouter
from database import check_supabase_connection
from config import get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict:
    """
    Health check endpoint.
    Returns app status, Supabase connectivity, and current version.
    """
    settings = get_settings()
    supabase_ok = await check_supabase_connection()

    return {
        "status": "ok",
        "supabase": "connected" if supabase_ok else "unreachable",
        "version": settings.app_version,
        "env": settings.app_env,
    }
