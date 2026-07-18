from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date


class LogCreate(BaseModel):
    habit_id: str
    log_date: date
    value: float = Field(..., ge=0)
    intensity: int = Field(..., ge=1, le=5)
    notes: Optional[str] = Field(None, max_length=1000)
    slipped: bool

    @field_validator("notes")
    @classmethod
    def sanitize_notes(cls, v: Optional[str]) -> Optional[str]:
        if v:
            return v.strip()
        return v


class LogResponse(BaseModel):
    id: str
    habit_id: str
    user_id: str
    log_date: str
    value: float
    intensity: int
    notes: Optional[str]
    slipped: bool
    created_at: str
