"""
Nudge endpoints — Task 6.
The APScheduler background job is registered in main.py.
These endpoints expose nudge history and preference settings.
"""
from fastapi import APIRouter, Depends
from models.nudge import NudgeResponse
from middleware.auth import get_current_user
from database import get_supabase

router = APIRouter(prefix="/nudges", tags=["nudges"])


@router.get("/", response_model=list[NudgeResponse])
async def get_nudge_history(
    limit: int = 20,
    user_id: str = Depends(get_current_user),
):
    db = get_supabase()
    result = (
        db.table("nudges")
        .select("*")
        .eq("user_id", user_id)
        .order("sent_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []


@router.post("/{nudge_id}/open", status_code=204)
async def mark_nudge_opened(nudge_id: str, user_id: str = Depends(get_current_user)):
    db = get_supabase()
    db.table("nudges").update({"opened": True}).eq("id", nudge_id).eq("user_id", user_id).execute()
