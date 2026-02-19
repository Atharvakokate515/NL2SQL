# backend/api/chat.py

from fastapi import APIRouter

from pydantic import BaseModel

from nl2sql.generator import generate_sql
from nl2sql.validator import is_safe_sql

from db.executor import execute_sql
from db.schema import get_table_list

from graph.graph import build_graph

from core.session_memory import get_session, update_session

from memory.chat_store import create_chat,save_message,load_chat_history


router = APIRouter()
graph = build_graph()


class NL2SQLRequest(BaseModel):
    db_url:str
    user_input:str
    session_id: str

class AgentChat(BaseModel):
    db_url:str
    user_input:str

class CreateChatRequest(BaseModel):
    title: str = "New Chat"


# NL2SQL TAB (WITH SESSION MEMORY)
@router.post("/chat-db")
def chat_with_db(data: NL2SQLRequest):

    # 1️ Load session
    session = get_session(data.session_id)

    last_sql = session.get("last_sql")

    # 2️ Generate SQL with memory
    sql = generate_sql(
        user_input=data.user_input,
        db_url=data.db_url,
        last_sql=last_sql
    )

    # 3️ Validate
    tables = get_table_list(data.db_url)
    validation = is_safe_sql(sql, tables)

    if not validation["safe"]:
        return {
            "success": False,
            "stage": "validation",
            "error": validation["reason"],
            "generated_sql": sql
        }

    # 4️ Execute
    execution_result = execute_sql(data.db_url, sql)

    # 5️ Update session memory
    update_session(data.session_id, {
        "last_sql": sql
    })

    return {
        "success": True,
        "generated_sql": sql,
        "execution": execution_result
    }


# CREATE A NEW CHAT SESSION
@router.post("/create-chat")
def create_new_chat(data: CreateChatRequest):

    chat_id = create_chat(title=data.title)

    return {
        "success": True,
        "chat_id": chat_id
    }


# LOAD CHAT HISTORY
@router.get("/chat-history/{chat_id}")
def get_chat_history(chat_id: int):

    history = load_chat_history(chat_id)

    return {
        "chat_id": chat_id,
        "messages": history
    }


# COPILOT AGENT CHAT (RAG + SQL + CHAT)
@router.post("/agent-chat")
def agent_chat(data: AgentChat):

    # 1 Load persistant chat memory
    history = load_chat_history(data.chat_id)

    # 2 Build graph state
    state = {
        "user_input": data.user_input,
        "db_url": data.db_url,
        "chat_history": history
    }

    # 3 Run orchestration
    result = graph.invoke(state)

    tool_result = result["tool_result"]

    # 4 Save user name
    save_message(
        chat_id=data.chat_id,
        role="user",
        content=data.user_input
    )

    # 5 Save assistant response
    save_message(
        chat_id=data.chat_id,
        role="assistant",
        content=tool_result.get("answer", ""),
        tool_used=tool_result.get("tool")
    )

    # 6 Return response
    return {
        "success": True,
        "response": tool_result
    }
