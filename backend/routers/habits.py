"""
Habit CRUD endpoints — all routes are user-scoped via JWT auth.
Full implementation for Task 3.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from models.habit import HabitCreate, HabitUpdate, HabitResponse
from middleware.auth import get_current_user
from database import get_supabase
from services.streak import calculate_streaks
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/habits", tags=["habits"])


@router.post("/", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
async def create_habit(
    payload: HabitCreate,
    user_id: str = Depends(get_current_user),
):
    db = get_supabase()
    now = datetime.now(timezone.utc).isoformat()
    habit_id = str(uuid.uuid4())

    data = {
        "id": habit_id,
        "user_id": user_id,
        "name": payload.name,
        "description": payload.description,
        "category": payload.category,
        "daily_goal": payload.daily_goal,
        "goal_unit": payload.goal_unit,
        "target_start_date": payload.target_start_date.isoformat() if payload.target_start_date else None,
        "is_active": True,
        "current_streak": 0,
        "longest_streak": 0,
        "created_at": now,
        "updated_at": now,
    }

    result = db.table("habits").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create habit.")
    return result.data[0]


@router.get("/", response_model=list[HabitResponse])
async def list_habits(user_id: str = Depends(get_current_user)):
    db = get_supabase()
    result = (
        db.table("habits")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_active", True)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.get("/{habit_id}", response_model=HabitResponse)
async def get_habit(habit_id: str, user_id: str = Depends(get_current_user)):
    db = get_supabase()
    result = (
        db.table("habits")
        .select("*")
        .eq("id", habit_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Habit not found.")
    return result.data


@router.put("/{habit_id}", response_model=HabitResponse)
async def update_habit(
    habit_id: str,
    payload: HabitUpdate,
    user_id: str = Depends(get_current_user),
):
    db = get_supabase()

    # Verify ownership
    existing = db.table("habits").select("id").eq("id", habit_id).eq("user_id", user_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Habit not found.")

    updates = payload.model_dump(exclude_none=True)
    if "target_start_date" in updates and updates["target_start_date"]:
        updates["target_start_date"] = updates["target_start_date"].isoformat()
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = db.table("habits").update(updates).eq("id", habit_id).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update habit.")
    return result.data[0]


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_habit(habit_id: str, user_id: str = Depends(get_current_user)):
    db = get_supabase()
    existing = db.table("habits").select("id").eq("id", habit_id).eq("user_id", user_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Habit not found.")

    # Soft delete — mark inactive
    db.table("habits").update({"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}).eq("id", habit_id).execute()
