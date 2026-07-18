"""
Context builder — assembles habit + log data into a structured string
that gets injected into Gemini prompts for grounded, personalized responses.
"""
from database import get_supabase
import logging

logger = logging.getLogger(__name__)


async def build_habit_context(user_id: str, habit_id: str | None = None) -> str:
    """
    Build a context string summarizing the user's habit(s) and recent logs.

    Args:
        user_id: The authenticated user's ID.
        habit_id: Optional — if provided, focus on a single habit.

    Returns:
        A formatted string suitable for injection into a Gemini system prompt.
    """
    try:
        db = get_supabase()

        # Fetch habits
        habit_query = db.table("habits").select("*").eq("user_id", user_id).eq("is_active", True)
        if habit_id:
            habit_query = habit_query.eq("id", habit_id)

        habits_result = habit_query.execute()
        habits = habits_result.data or []

        if not habits:
            return "The user has not set up any habits yet."

        context_parts = []

        for habit in habits:
            # Fetch last 14 days of logs for this habit
            logs_result = (
                db.table("logs")
                .select("log_date, value, intensity, notes, slipped")
                .eq("habit_id", habit["id"])
                .order("log_date", desc=True)
                .limit(14)
                .execute()
            )
            logs = logs_result.data or []

            habit_ctx = [
                f"Habit: {habit['name']}",
                f"Category: {habit['category']}",
                f"Daily Goal: {habit.get('daily_goal', 'Not set')} {habit.get('goal_unit', '')}".strip(),
                f"Current Streak: {habit['current_streak']} days",
                f"Longest Streak: {habit['longest_streak']} days",
            ]

            if logs:
                habit_ctx.append("Recent logs (last 14 days):")
                for log in logs:
                    status = "slipped" if log["slipped"] else "resisted"
                    note = f" — Note: {log['notes']}" if log.get("notes") else ""
                    habit_ctx.append(
                        f"  {log['log_date']}: {status}, value={log['value']}, intensity={log['intensity']}/5{note}"
                    )
            else:
                habit_ctx.append("No recent logs found.")

            context_parts.append("\n".join(habit_ctx))

        return "\n\n".join(context_parts)

    except Exception as e:
        logger.error(f"build_habit_context failed: {e}")
        return "Could not load habit context."
