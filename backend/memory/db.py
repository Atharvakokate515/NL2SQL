# backend/memory/db.py

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)


def init_db():
    """
    Creates all tables defined in models.py if they don't exist yet.
    Call this once on app startup from main.py.
    """
    # Import here to ensure all models are registered with Base before create_all
    from .models import Base  # noqa: F401 — side-effect import registers all models
    Base.metadata.create_all(bind=engine)


def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()