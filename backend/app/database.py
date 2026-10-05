"""Database configuration.

Local development: leave DATABASE_URL unset and a SQLite file (backend/pramax.db)
is used automatically, so no database server is needed.

Production: set DATABASE_URL to a managed PostgreSQL connection string
(e.g. Neon, Supabase, Render Postgres). Both ``postgres://`` and
``postgresql://`` forms are accepted and routed to the psycopg 3 driver.
"""
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_SQLITE_URL = f"sqlite:///{BACKEND_DIR / 'pramax.db'}"


def normalize_database_url(url: str | None) -> str:
    """Return a SQLAlchemy URL, defaulting to local SQLite."""
    if not url or not url.strip():
        return DEFAULT_SQLITE_URL

    url = url.strip()

    # Hosting providers commonly hand out postgres:// or postgresql:// URLs;
    # point them at the installed psycopg 3 driver.
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]

    return url


DATABASE_URL = normalize_database_url(os.getenv("DATABASE_URL"))
IS_SQLITE = DATABASE_URL.startswith("sqlite")

if IS_SQLITE:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    # pool_pre_ping / pool_recycle keep connections healthy on serverless
    # Postgres (e.g. Neon), which closes idle connections.
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=int(os.getenv("DB_POOL_SIZE", "5")),
        max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "5")),
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
