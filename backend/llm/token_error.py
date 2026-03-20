# backend/llm/token_error.py
"""
Central utility to detect token exhaustion / quota errors from any LLM provider.

HuggingFace, OpenAI, and Groq all raise different exception types and messages
when tokens or credits are exhausted. This module normalises them so the rest
of the codebase only needs to call is_token_error(e).
"""

# ── Keyword patterns that indicate token / quota exhaustion ──────
# Covers HuggingFace, OpenAI, Groq, and generic HTTP 429 / 402 errors.
_TOKEN_PATTERNS = [
    # HuggingFace Inference API
    "rate limit",
    "rate_limit",
    "token limit",
    "token_limit",
    "exceeded",
    "quota",
    "too many requests",
    "billing",
    "payment",
    "credits",
    "limit reached",
    "usage limit",
    "monthly limit",
    "daily limit",
    # OpenAI
    "insufficient_quota",
    "you exceeded your current quota",
    "billing hard limit",
    "context_length_exceeded",
    "maximum context length",
    "reduce the length",
    # Groq
    "rate_limit_exceeded",
    "tokens per minute",
    "requests per minute",
    "requests per day",
    # Generic HTTP
    "429",
    "402",
    "payment required",
]


def is_token_error(exc: Exception) -> bool:
    """
    Returns True if the exception looks like a token exhaustion,
    rate limit, quota, or billing error from any supported LLM provider.
    """
    message = str(exc).lower()
    return any(pattern in message for pattern in _TOKEN_PATTERNS)


def token_error_response(extra: str = "") -> dict:
    """
    Returns a standardised error response dict for token/quota errors.
    This is what api/chat.py and agent_chat return to the frontend.
    """
    detail = f" ({extra})" if extra else ""
    return {
        "success":    False,
        "error_code": "TOKEN_LIMIT",
        "error":      (
            f"API token limit or quota reached{detail}. "
            "Please check your API key usage, billing, or rate limits and try again."
        ),
    }