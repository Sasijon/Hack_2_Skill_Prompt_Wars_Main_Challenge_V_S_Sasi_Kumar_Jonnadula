"""
AI Coach Chat endpoint — Task 5.
Calls Gemini 1.5 Flash with full habit context and conversation history.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from models.chat import ChatRequest, ChatResponse
from middleware.auth import get_current_user
from database import get_supabase
from services.gemini import generate_chat_response_stream
from services.context_builder import build_habit_context
import uuid
import json
from datetime import datetime, timezone
from limiter import limiter

router = APIRouter(prefix="/chat", tags=["chat"])

SYSTEM_PROMPT_TEMPLATE = """You are HabitHeal Coach, an empathetic and supportive AI habit-breaking coach.
Your role is to:
- Listen with compassion and without judgment
- Celebrate progress and streaks, no matter how small
- Offer practical, evidence-based coping strategies relevant to the user's specific habit
- Reference the user's actual habit data when relevant (streak, recent slips, progress)
- Keep responses concise — 2-4 sentences unless the user asks for more detail
- Never shame the user for slipping; treat it as a learning moment
- Encourage professional help for serious addiction or mental health concerns

Current user habit context:
{habit_context}

Current date: {current_date}
"""


@router.post("/")
@limiter.limit("10/minute")
async def send_message(
    request: Request,
    payload: ChatRequest,
    user_id: str = Depends(get_current_user),
):
    db = get_supabase()

    # Fetch last 20 messages for conversation history
    history_result = (
        db.table("chat_messages")
        .select("role, content")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )
    raw_history = list(reversed(history_result.data or []))

    # Convert to Gemini format: role must be 'user' or 'model'
    gemini_history = [
        {"role": "model" if msg["role"] == "assistant" else "user", "parts": [msg["content"]]}
        for msg in raw_history
    ]

    # Build habit context
    habit_context = await build_habit_context(user_id, payload.habit_id)
    system_instruction = SYSTEM_PROMPT_TEMPLATE.format(
        habit_context=habit_context,
        current_date=datetime.now(timezone.utc).strftime("%A, %B %d, %Y"),
    )

    now = datetime.now(timezone.utc).isoformat()
    user_msg_id = str(uuid.uuid4())
    assistant_msg_id = str(uuid.uuid4())

    db.table("chat_messages").insert([
        {
            "id": user_msg_id,
            "user_id": user_id,
            "habit_id": payload.habit_id,
            "role": "user",
            "content": payload.message,
            "created_at": now,
        }
    ]).execute()

    async def event_generator():
        full_reply = ""
        try:
            async for chunk in generate_chat_response_stream(
                history=gemini_history,
                user_message=payload.message,
                system_instruction=system_instruction,
            ):
                full_reply += chunk
                data = json.dumps({"chunk": chunk, "message_id": assistant_msg_id})
                yield f"data: {data}\n\n"
        except Exception as e:
            # Fallback if Gemini fails (e.g. quota, safety filters)
            fallback_msg = "I'm having a little trouble connecting right now, but I'm here for you! Let's talk more when I'm back online."
            full_reply += fallback_msg
            data = json.dumps({"chunk": fallback_msg, "message_id": assistant_msg_id})
            yield f"data: {data}\n\n"
        finally:
            if full_reply:
                db.table("chat_messages").insert([
                    {
                        "id": assistant_msg_id,
                        "user_id": user_id,
                        "habit_id": payload.habit_id,
                        "role": "assistant",
                        "content": full_reply,
                        "created_at": now,
                    }
                ]).execute()

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/history")
async def get_chat_history(
    habit_id: str | None = None,
    user_id: str = Depends(get_current_user),
):
    db = get_supabase()
    query = db.table("chat_messages").select("*").eq("user_id", user_id)
    if habit_id:
        query = query.eq("habit_id", habit_id)
    result = query.order("created_at", desc=False).limit(50).execute()
    return result.data or []
