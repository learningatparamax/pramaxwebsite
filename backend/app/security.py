import os
import secrets

from fastapi import Header, HTTPException, status


def require_admin(
    x_admin_key: str | None = Header(default=None)
):
    expected_key = os.getenv("ADMIN_API_KEY")

    if not expected_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Admin security is not configured."
        )

    if not x_admin_key or not secrets.compare_digest(
        x_admin_key,
        expected_key
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authorization is required."
        )
