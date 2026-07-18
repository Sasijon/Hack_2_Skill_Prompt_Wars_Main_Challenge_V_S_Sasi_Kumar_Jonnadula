from supabase import create_client, Client
from config import get_settings
import logging

logger = logging.getLogger(__name__)

_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Return a singleton Supabase client using the service role key (server-side only)."""
    global _supabase_client
    if _supabase_client is None:
        settings = get_settings()
        _supabase_client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
        logger.info("Supabase client initialized.")
    return _supabase_client


async def check_supabase_connection() -> bool:
    """Lightweight connectivity check — queries the users table count."""
    try:
        client = get_supabase()
        # A simple query to verify the connection is live
        result = client.table("habits").select("id", count="exact").limit(0).execute()
        return True
    except Exception as e:
        logger.error(f"Supabase connection check failed: {e}")
        return False
