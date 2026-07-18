"""
Nudge scheduler — runs as a background job via APScheduler.
Every hour, checks for users who have missed logging today and
generates a personalized nudge via Gemini 1.5 Flash.
"""
import logging
import uuid
from datetime import datetime, timezone, date
from database import get_supabase
from services.gemini import generate_text
from services.context_builder import build_habit_context

logger = logging.getLogger(__name__)

NUDGE_SYSTEM_PROMPT = """You are HabitHeal's notification writer.
Generate a SHORT (1-2 sentences), warm, and personalized push notification
to motivate a user to log their habit today. 

Use the user's habit context below to make it specific and personal.
Do NOT be generic. Reference their streak or recent progress if available.
Keep it under 140 characters total (like a good tweet).

Do not include any prefix like "Notification:" or quotes — just the message itself."""


async def run_nudge_job() -> None:
    """
    Main nudge scheduler job — called every hour by APScheduler.
    1. Finds all active habits with nudge_frequency != 'off'.
    2. Checks if the user has already logged today.
    3. If not, generates and records a nudge via Gemini.
    """
    logger.info("Nudge scheduler: starting run.")
    db = get_supabase()
    today = date.today().isoformat()

    try:
        # Fetch all active habits for users who have nudges enabled
        habits_result = (
            db.table("habits")
            .select("id, user_id, name, current_streak, nudge_frequency, expo_push_token")
            .eq("is_active", True)
            .neq("nudge_frequency", "off")
            .execute()
        )
        habits = habits_result.data or []
        logger.info(f"Nudge scheduler: {len(habits)} habits to check.")

        for habit in habits:
            user_id = habit["user_id"]
            habit_id = habit["id"]

            # Check if user already logged today for this habit
            log_check = (
                db.table("logs")
                .select("id")
                .eq("habit_id", habit_id)
                .eq("user_id", user_id)
                .eq("log_date", today)
                .execute()
            )
            if log_check.data:
                continue  # Already logged — no nudge needed

            # Check nudge frequency — "gentle" = once/day, "regular" = up to 3/day
            existing_nudges = (
                db.table("nudges")
                .select("id")
                .eq("user_id", user_id)
                .eq("habit_id", habit_id)
                .gte("sent_at", f"{today}T00:00:00Z")
                .execute()
            )
            nudge_count = len(existing_nudges.data or [])
            max_nudges = 1 if habit.get("nudge_frequency") == "gentle" else 3
            if nudge_count >= max_nudges:
                continue

            # Generate personalized nudge via Gemini
            habit_context = await build_habit_context(user_id, habit_id)
            prompt = f"User's habit context:\n{habit_context}\n\nCurrent time: {datetime.now(timezone.utc).strftime('%I:%M %p UTC')}\n\nGenerate a nudge."

            nudge_message = await generate_text(
                prompt=prompt,
                system_instruction=NUDGE_SYSTEM_PROMPT,
            )

            # Store nudge in DB
            nudge_id = str(uuid.uuid4())
            db.table("nudges").insert({
                "id": nudge_id,
                "user_id": user_id,
                "habit_id": habit_id,
                "message": nudge_message,
                "sent_at": datetime.now(timezone.utc).isoformat(),
                "opened": False,
            }).execute()

            # Send via Expo Push Notifications if token available
            expo_token = habit.get("expo_push_token")
            if expo_token:
                await _send_expo_push(expo_token, nudge_message, habit["name"])

            logger.info(f"Nudge sent for habit {habit_id}, user {user_id}")

    except Exception as e:
        logger.error(f"Nudge scheduler error: {e}")


async def _send_expo_push(expo_token: str, message: str, habit_name: str) -> None:
    """Send a push notification via Expo's push service."""
    import httpx

    payload = {
        "to": expo_token,
        "title": "HabitHeal",
        "body": message,
        "data": {"habit_name": habit_name},
        "sound": "default",
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://exp.host/--/api/v2/push/send",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10.0,
            )
            response.raise_for_status()
            logger.info(f"Expo push sent to {expo_token[:20]}...")
    except Exception as e:
        logger.warning(f"Expo push failed: {e}")
