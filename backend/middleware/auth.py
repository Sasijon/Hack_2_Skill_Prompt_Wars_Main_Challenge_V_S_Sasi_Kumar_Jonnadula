"""
JWT auth middleware — validates Supabase-issued access tokens.

Two verification modes:
1. Local HS256 verification using SUPABASE_JWT_SECRET (preferred, no network call)
2. Remote verification via Supabase /auth/v1/user (fallback when secret not configured)

All protected routes depend on get_current_user.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from config import get_settings
import httpx
import logging

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer()


async def _verify_via_supabase_api(token: str) -> str:
    """
    Verify token by calling Supabase /auth/v1/user.
    Returns the user ID on success, raises 401 on failure.
    Used as fallback when SUPABASE_JWT_SECRET is not configured.
    """
    settings = get_settings()
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": settings.supabase_service_role_key,
                },
            )
        if resp.status_code == 200:
            data = resp.json()
            user_id = data.get("id")
            if user_id:
                return user_id
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Supabase token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not verify token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    """
    Validate the Bearer JWT token issued by Supabase.
    Returns the user ID (sub claim) on success.
    Raises 401 on invalid or expired tokens.
    """
    token = credentials.credentials
    settings = get_settings()

    # Mode 1: local verification (fast, no network)
    if settings.supabase_jwt_secret:
        try:
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            user_id: str = payload.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token: missing subject.",
                )
            return user_id
        except JWTError as e:
            logger.warning(f"JWT local verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # Mode 2: remote verification via Supabase API
    logger.debug("SUPABASE_JWT_SECRET not set — verifying via Supabase API")
    return await _verify_via_supabase_api(token)
