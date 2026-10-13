"""In-memory rate limiting for the public chat endpoint.

Every chat message costs money at the AI provider, so the endpoint is limited
per visitor (per minute and per day) and in total per day. The total cap also
bounds spend if someone spoofs visitor IDs by calling the backend directly.

Counters live in this process's memory: they reset when the server restarts
and are not shared between instances, which is fine for a single backend
instance. Limits are configurable through environment variables.
"""
import os
import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

MINUTE = 60
DAY = 24 * 60 * 60

PER_VISITOR_PER_MINUTE = int(os.getenv("CHAT_LIMIT_PER_MINUTE", "10"))
PER_VISITOR_PER_DAY = int(os.getenv("CHAT_LIMIT_PER_DAY", "100"))
TOTAL_PER_DAY = int(os.getenv("CHAT_LIMIT_TOTAL_PER_DAY", "2000"))

_lock = threading.Lock()
_visitor_hits: dict[str, deque[float]] = defaultdict(deque)
_all_hits: deque[float] = deque()


def _client_id(request: Request) -> str:
    # The Next.js proxy forwards the visitor's IP; without it, fall back to the
    # caller's address (the proxy itself, or a direct caller). A custom header
    # name is used because Azure App Service sets X-Client-IP itself.
    forwarded = request.headers.get("x-visitor-ip", "").strip()
    if forwarded:
        return forwarded[:64]
    return request.client.host if request.client else "unknown"


def _count_since(hits: deque[float], cutoff: float) -> int:
    return sum(1 for hit in hits if hit > cutoff)


def chat_rate_limit(request: Request) -> None:
    now = time.time()
    visitor = _client_id(request)

    with _lock:
        hits = _visitor_hits[visitor]
        while hits and hits[0] <= now - DAY:
            hits.popleft()
        while _all_hits and _all_hits[0] <= now - DAY:
            _all_hits.popleft()

        if len(_all_hits) >= TOTAL_PER_DAY:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="The assistant has reached its daily limit. Please use Connect with human help.",
            )
        if (
            len(hits) >= PER_VISITOR_PER_DAY
            or _count_since(hits, now - MINUTE) >= PER_VISITOR_PER_MINUTE
        ):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="You're sending messages too quickly. Please wait a moment and try again.",
            )

        hits.append(now)
        _all_hits.append(now)

        # Drop visitors with no recent activity so memory stays bounded.
        if len(_visitor_hits) > 10_000:
            for key in [k for k, v in _visitor_hits.items() if not v or v[-1] <= now - DAY]:
                del _visitor_hits[key]
