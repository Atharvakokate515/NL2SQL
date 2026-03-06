# rag/db.py

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)


def init_rag_db():
    """
    Creates the chunks and queries tables if they don't exist.
    Called from main.py on startup alongside memory.db.init_db().
    """
    from .models import Base  # noqa: F401 — registers Chunk and Query models
    Base.metadata.create_all(bind=engine)


def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()