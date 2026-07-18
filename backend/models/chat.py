from pydantic import BaseModel, Field
from typing import Optional, Literal


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    habit_id: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    habit_id: Optional[str]
    message_id: str


class ChatMessageRecord(BaseModel):
    id: str
    habit_id: Optional[str]
    user_id: str
    role: Literal["user", "assistant"]
    content: str
    created_at: str
