"""
Gemini 2.0 Flash service — all GenAI calls go through here.
All calls are real API calls; no mocks.
"""
import google.generativeai as genai
from config import get_settings
import logging

logger = logging.getLogger(__name__)

_model = None


def get_gemini_model() -> genai.GenerativeModel:
    """Return a singleton Gemini 1.5 Flash model instance."""
    global _model
    if _model is None:
        settings = get_settings()
        genai.configure(api_key=settings.gemini_api_key)
        _model = genai.GenerativeModel(
            model_name="gemini-flash-latest",
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                max_output_tokens=1024,
            ),
        )
        logger.info("Gemini 2.0 Flash model initialized.")
    return _model


async def generate_text(prompt: str, system_instruction: str | None = None) -> str:
    """
    Generate a text response from Gemini 1.5 Flash.

    Args:
        prompt: The user-facing prompt content.
        system_instruction: Optional system-level instructions for the model persona.

    Returns:
        The model's text response.
    """
    try:
        settings = get_settings()
        genai.configure(api_key=settings.gemini_api_key)

        model = genai.GenerativeModel(
            model_name="gemini-flash-latest",
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                max_output_tokens=1024,
            ),
            system_instruction=system_instruction,
        )

        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini generate_text failed: {e}")
        raise


async def generate_chat_response(
    history: list[dict],
    user_message: str,
    system_instruction: str,
) -> str:
    """
    Continue a multi-turn conversation with Gemini.

    Args:
        history: List of {role: 'user'|'model', parts: [str]} dicts (last 20 messages).
        user_message: The latest user message.
        system_instruction: System prompt enforcing the AI coach persona.

    Returns:
        The AI coach's reply as a string.
    """
    try:
        settings = get_settings()
        genai.configure(api_key=settings.gemini_api_key)

        model = genai.GenerativeModel(
            model_name="gemini-flash-latest",
            generation_config=genai.GenerationConfig(
                temperature=0.75,
                max_output_tokens=512,
            ),
            system_instruction=system_instruction,
        )

        chat = model.start_chat(history=history)
        response = chat.send_message(user_message)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini generate_chat_response failed: {e}")
        raise

async def generate_chat_response_stream(
    history: list[dict],
    user_message: str,
    system_instruction: str,
):
    """
    Continue a multi-turn conversation with Gemini, streaming the response.
    """
    try:
        settings = get_settings()
        genai.configure(api_key=settings.gemini_api_key)

        model = genai.GenerativeModel(
            model_name="gemini-flash-latest",
            generation_config=genai.GenerationConfig(
                temperature=0.75,
                max_output_tokens=512,
            ),
            system_instruction=system_instruction,
        )

        chat = model.start_chat(history=history)
        response = await chat.send_message_async(user_message, stream=True)
        async for chunk in response:
            yield chunk.text
    except Exception as e:
        logger.error(f"Gemini generate_chat_response_stream failed: {e}")
        raise
