"""
Auth utility endpoints.
The actual sign-up / sign-in happens client-side via Supabase Auth.
These endpoints provide server-side token verification and user profile access.
"""
from fastapi import APIRouter, Depends
from middleware.auth import get_current_user
from database import get_supabase
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
async def get_me(user_id: str = Depends(get_current_user)) -> dict:
    """
    Verify the caller's JWT and return their user ID.
    The frontend calls this on app startup to confirm the stored session
    is still valid against the backend.
    """
    return {"user_id": user_id, "status": "authenticated"}
