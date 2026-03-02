import logging
import traceback

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Secure DRF exception handler.

    - Unhandled exceptions (500s): log full stack trace server-side,
      return a generic message — never expose Python internals to the client.
    - Handled DRF exceptions (4xx): normalize to a predictable JSON shape:
        { "error": "<main message>", "details": { ...field_errors } }
    """

    # Let DRF handle what it knows about first
    response = exception_handler(exc, context)

    # ── Rule 1: Unhandled exception (DB errors, unhandled Python exceptions) ──
    if response is None:
        # Log full traceback to the server console / log aggregator
        view = context.get('view', None)
        logger.exception(
            "Unhandled server error in view %s: %s\n%s",
            type(view).__name__ if view else "unknown",
            exc,
            traceback.format_exc(),
        )
        return Response(
            {"error": "A server error occurred. Our team has been notified."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # ── Rule 2: Normalize all 4xx DRF responses to standard shape ─────────────
    data = response.data

    if isinstance(data, dict):
        if 'error' not in data:
            # DRF typically puts the message in 'detail'
            detail = data.pop('detail', None)
            remaining_fields = {k: v for k, v in data.items()}
            response.data = {
                "error": str(detail) if detail else _http_status_message(response.status_code),
                "details": remaining_fields,
            }
        # If already has 'error' key, leave it alone — already in correct shape
    elif isinstance(data, list):
        # Some DRF errors come back as a plain list (e.g. non-field errors)
        response.data = {
            "error": "; ".join(str(e) for e in data),
            "details": {},
        }
    else:
        response.data = {
            "error": str(data),
            "details": {},
        }

    return response


def _http_status_message(status_code: int) -> str:
    """Return a safe, generic message for a given HTTP status code."""
    messages = {
        400: "The request data was invalid.",
        401: "Authentication is required.",
        403: "You do not have permission to perform this action.",
        404: "The requested resource was not found.",
        405: "This operation is not allowed.",
        429: "Too many requests. Please slow down.",
    }
    return messages.get(status_code, "An error occurred.")
