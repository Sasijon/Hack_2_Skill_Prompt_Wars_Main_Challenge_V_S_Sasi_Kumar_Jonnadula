"""
Habit log endpoints — Task 4.
Creates log entries and recalculates streaks on each submission.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from models.log import LogCreate, LogResponse
from middleware.auth import get_current_user
from database import get_supabase
from services.streak import calculate_streaks
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/logs", tags=["logs"])


@router.post("/", response_model=LogResponse, status_code=status.HTTP_201_CREATED)
async def create_log(
    payload: LogCreate,
    user_id: str = Depends(get_current_user),
):
    db = get_supabase()

    # Verify habit belongs to user
    habit_result = (
        db.table("habits").select("id").eq("id", payload.habit_id).eq("user_id", user_id).execute()
    )
    if not habit_result.data:
        raise HTTPException(status_code=404, detail="Habit not found.")

    now = datetime.now(timezone.utc).isoformat()
    log_id = str(uuid.uuid4())

    data = {
        "id": log_id,
        "habit_id": payload.habit_id,
        "user_id": user_id,
        "log_date": payload.log_date.isoformat(),
        "value": payload.value,
        "intensity": payload.intensity,
        "notes": payload.notes,
        "slipped": payload.slipped,
        "created_at": now,
    }

    result = db.table("logs").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create log.")

    # Recalculate streaks
    await _recalculate_streak(db, payload.habit_id, user_id)

    return result.data[0]


@router.get("/", response_model=list[LogResponse])
async def list_logs(
    habit_id: str = Query(...),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    user_id: str = Depends(get_current_user),
):
    db = get_supabase()

    query = db.table("logs").select("*").eq("habit_id", habit_id).eq("user_id", user_id)

    if start_date:
        query = query.gte("log_date", start_date)
    if end_date:
        query = query.lte("log_date", end_date)

    result = query.order("log_date", desc=True).execute()
    return result.data or []


async def _recalculate_streak(db, habit_id: str, user_id: str) -> None:
    """Fetch all logs for a habit and recalculate current + longest streaks."""
    logs_result = (
        db.table("logs")
        .select("log_date, slipped")
        .eq("habit_id", habit_id)
        .eq("user_id", user_id)
        .execute()
    )
    logs = logs_result.data or []

    dates = [log["log_date"] for log in logs]
    slipped_flags = [log["slipped"] for log in logs]

    current_streak, longest_streak = calculate_streaks(dates, slipped_flags)

    db.table("habits").update(
        {
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("id", habit_id).execute()
