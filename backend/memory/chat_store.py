from .db import SessionLocal
from .models import ChatSession, ChatMessage


# ---------- CREATE CHAT ----------

def create_chat(title="New Chat"):

    session = SessionLocal()

    chat = ChatSession(title=title)

    session.add(chat)
    session.commit()
    session.refresh(chat)

    session.close()

    return chat.id


# ---------- SAVE MESSAGE ----------

def save_message(chat_id, role, content, tool_used=None):

    session = SessionLocal()

    msg = ChatMessage(
        chat_id=chat_id,
        role=role,
        content=content,
        tool_used=tool_used
    )

    session.add(msg)
    session.commit()
    session.close()


# ---------- LOAD CHAT HISTORY ----------

def load_chat_history(chat_id, limit=10):

    session = SessionLocal()

    rows = (
        session.query(ChatMessage)
        .filter(ChatMessage.chat_id == chat_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
        .all()
    )

    session.close()

    return [
        {
            "role": r.role,
            "content": r.content
        }
        for r in rows
    ]
