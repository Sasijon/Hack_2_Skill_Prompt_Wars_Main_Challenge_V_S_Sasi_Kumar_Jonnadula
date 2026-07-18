from pydantic import BaseModel, Field, field_validator
from typing import Literal, Optional
from datetime import date
import uuid

HabitCategory = Literal["screen_time", "substance", "eating", "custom"]


class HabitCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    category: HabitCategory
    daily_goal: Optional[float] = Field(None, ge=0)
    goal_unit: Optional[str] = Field(None, max_length=20)
    target_start_date: Optional[date] = None

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Habit name cannot be blank.")
        return v.strip()


class HabitUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    category: Optional[HabitCategory] = None
    daily_goal: Optional[float] = Field(None, ge=0)
    goal_unit: Optional[str] = Field(None, max_length=20)
    target_start_date: Optional[date] = None
    is_active: Optional[bool] = None


class HabitResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str]
    category: HabitCategory
    daily_goal: Optional[float]
    goal_unit: Optional[str]
    target_start_date: Optional[str]
    is_active: bool
    current_streak: int
    longest_streak: int
    created_at: str
    updated_at: str
