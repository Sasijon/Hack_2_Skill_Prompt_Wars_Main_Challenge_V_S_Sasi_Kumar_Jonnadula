from pydantic import BaseModel
from typing import List


class WeeklyInsightResponse(BaseModel):
    id: str
    user_id: str
    week_start: str
    summary: str
    recommendations: List[str]
    generated_at: str
