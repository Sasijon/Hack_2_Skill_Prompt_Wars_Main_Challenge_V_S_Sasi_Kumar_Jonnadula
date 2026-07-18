"""
Personalized AI Insights endpoint — Task 7.
Aggregates last 7 days of logs and calls Gemini for analysis.
"""
from fastapi import APIRouter, Depends
from models.insight import WeeklyInsightResponse
from middleware.auth import get_current_user
from database import get_supabase
from services.gemini import generate_text
import uuid
from datetime import datetime, timezone, timedelta
import json

router = APIRouter(prefix="/insights", tags=["insights"])

INSIGHTS_SYSTEM_PROMPT = """You are HabitHeal's insight analyst. 
Given structured habit log data for the past 7 days, produce:
1. A 3-4 sentence narrative analysis of patterns and progress.
2. Exactly 3 specific, actionable recommendations (one per line, each starting with '- ').

Be specific, warm, and evidence-based. Reference actual data points (specific days, intensity scores, etc.).
Do not hallucinate data — only reference what is provided.

Return your response in this exact JSON format:
{
  "summary": "narrative text here",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}"""


@router.get("/weekly", response_model=WeeklyInsightResponse)
async def get_weekly_insights(user_id: str = Depends(get_current_user)):
    db = get_supabase()

    today = datetime.now(timezone.utc).date()
    week_start = today - timedelta(days=7)

    # Fetch habits
    habits_result = (
        db.table("habits").select("id, name, category, current_streak, longest_streak")
        .eq("user_id", user_id)
        .eq("is_active", True)
        .execute()
    )
    habits = habits_result.data or []

    if not habits:
        # Return empty insight if no habits
        return WeeklyInsightResponse(
            id=str(uuid.uuid4()),
            user_id=user_id,
            week_start=week_start.isoformat(),
            summary="You haven't added any habits yet. Add a habit to start tracking your progress.",
            recommendations=["Add your first habit", "Set a daily goal", "Check back next week for insights"],
            generated_at=datetime.now(timezone.utc).isoformat(),
        )

    # Aggregate log data per habit
    habit_summaries = []
    for habit in habits:
        logs_result = (
            db.table("logs")
            .select("log_date, value, intensity, slipped")
            .eq("habit_id", habit["id"])
            .eq("user_id", user_id)
            .gte("log_date", week_start.isoformat())
            .lte("log_date", today.isoformat())
            .execute()
        )
        logs = logs_result.data or []

        slip_days = sum(1 for log in logs if log["slipped"])
        resist_days = len(logs) - slip_days
        avg_intensity = sum(log["intensity"] for log in logs) / len(logs) if logs else 0
        avg_value = sum(log["value"] for log in logs) / len(logs) if logs else 0

        habit_summaries.append({
            "habit": habit["name"],
            "category": habit["category"],
            "current_streak": habit["current_streak"],
            "longest_streak": habit["longest_streak"],
            "days_logged": len(logs),
            "slip_days": slip_days,
            "resist_days": resist_days,
            "avg_intensity": round(avg_intensity, 1),
            "avg_value": round(avg_value, 1),
        })

    prompt = f"Here is the user's habit data for the week of {week_start.isoformat()} to {today.isoformat()}:\n\n{json.dumps(habit_summaries, indent=2)}\n\nProvide analysis and recommendations."

    raw_response = await generate_text(prompt=prompt, system_instruction=INSIGHTS_SYSTEM_PROMPT)

    # Parse JSON response from Gemini
    try:
        # Strip markdown code fences if present
        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        parsed = json.loads(cleaned.strip())
        summary = parsed.get("summary", raw_response)
        recommendations = parsed.get("recommendations", [])
    except (json.JSONDecodeError, KeyError):
        summary = raw_response
        recommendations = []

    insight_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # Persist insight
    db.table("insights").insert({
        "id": insight_id,
        "user_id": user_id,
        "week_start": week_start.isoformat(),
        "summary": summary,
        "recommendations": recommendations,
        "generated_at": now,
    }).execute()

    return WeeklyInsightResponse(
        id=insight_id,
        user_id=user_id,
        week_start=week_start.isoformat(),
        summary=summary,
        recommendations=recommendations,
        generated_at=now,
    )
