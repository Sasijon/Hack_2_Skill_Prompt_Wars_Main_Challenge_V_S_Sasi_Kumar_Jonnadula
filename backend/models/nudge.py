from pydantic import BaseModel
from typing import Optional


class NudgeResponse(BaseModel):
    id: str
    user_id: str
    habit_id: Optional[str]
    message: str
    sent_at: str
    opened: bool
