# backend/api/chat.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from nl2sql.clarrifier import clarify_query
from nl2sql.planner import plan_query
from nl2sql.generator import generate_sql
from nl2sql.validator import is_safe_sql

from db.executor import execute_sql
from db.schema import get_table_list, get_schema_preview
from db.connection import test_connection

from graph.graph import build_graph

from llm.client import generate_text
from llm.result_summary_prompt import RESULT_SUMMARY_PROMPT

from memory.chat_store import (
    create_chat, save_message, load_chat_history,
    list_copilot_sessions, get_copilot_session_by_id, update_chat_title,
    delete_copilot_chat,
)
from memory.session_store import (
    get_last_sql, update_last_sql, get_chat_history, append_message,
    get_session_history_by_id, list_nl2sql_sessions, update_session_title,
    delete_nl2sql_session,
)


router = APIRouter()
graph = build_graph()


# ─────────────────────────────────────────────────────────────────
# Request / response models
# ─────────────────────────────────────────────────────────────────

class NL2SQLRequest(BaseModel):
    db_url: str
    user_input: str
    session_id: str
    clarification_response: str | None = None


class AgentChat(BaseModel):
    db_url: str
    user_input: str
    chat_id: int


class CreateChatRequest(BaseModel):
    title: str = "New Copilot Chat"


class TestConnectionRequest(BaseModel):
    db_url: str


class RenameRequest(BaseModel):
    title: str


# ─────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────

def _generate_result_summary(user_input: str, execution: dict) -> str:
    try:
        result = execution.get("result", {})
        prompt = RESULT_SUMMARY_PROMPT.format(
            user_input=user_input,
            rows=result.get("rows", [])[:10],
            row_count=result.get("row_count", 0),
        )
        response = generate_text(prompt)
        return response.content.strip() if hasattr(response, "content") else str(response).strip()
    except Exception:
        return ""


def _suggest_chart(execution: dict) -> dict | None:
    """
    Returns a structured chart suggestion dict or None.
    Shape: { "type": "bar"|"line"|"pie"|"table", "x_axis": str|None, "y_axis": str|None }
    Frontend uses x_axis / y_axis directly as axis labels — no guessing required.
    """
    result = execution.get("result", {})

    if result.get("type") != "select":
        return None

    rows = result.get("rows", [])
    col_names = result.get("col_names", [])
    row_count = result.get("row_count", 0)

    if row_count == 0 or not rows:
        return None

    # Single scalar (e.g. COUNT(*)) — no chart
    if row_count == 1 and len(rows[0]) == 1:
        return None

    num_cols = len(rows[0])
    x_col = col_names[0] if col_names else None
    y_col = col_names[1] if len(col_names) > 1 else None

    # Time dimension in first column → line chart
    first_val = str(rows[0][0]).lower() if rows[0] else ""
    time_hints = ["date", "month", "year", "week", "quarter",
                  "2020", "2021", "2022", "2023", "2024", "2025"]
    if any(hint in first_val for hint in time_hints):
        return {"type": "line", "x_axis": x_col, "y_axis": y_col}

    if num_cols == 2:
        chart_type = "pie" if row_count <= 6 else "bar"
        return {"type": chart_type, "x_axis": x_col, "y_axis": y_col}

    if num_cols >= 2:
        return {"type": "bar", "x_axis": x_col, "y_axis": y_col}

    return {"type": "table", "x_axis": None, "y_axis": None}


# ─────────────────────────────────────────────────────────────────
# DB CONNECTION + SCHEMA PREVIEW
# ─────────────────────────────────────────────────────────────────

@router.post("/test-connection")
def test_db_connection(data: TestConnectionRequest):
    """
    Validate a PostgreSQL URL before the frontend opens the workspace.
    Returns: { success, db_name, tables, error }
    """
    try:
        test_connection(data.db_url)
        tables, db_name = get_schema_preview(data.db_url)
        return {"success": True, "db_name": db_name, "tables": tables, "error": None}
    except Exception as e:
        return {"success": False, "db_name": None, "tables": [], "error": str(e)}


@router.get("/schema-preview")
def schema_preview(db_url: str):
    """
    Return structured table + column list for the workspace header / inspector.
    Returns: { success, db_name, tables: [{ name, columns, pk }] }
    """
    try:
        tables, db_name = get_schema_preview(db_url)
        return {"success": True, "db_name": db_name, "tables": tables}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─────────────────────────────────────────────────────────────────
# NL2SQL PIPELINE
# ─────────────────────────────────────────────────────────────────

@router.post("/chat-db")
def chat_with_db(data: NL2SQLRequest):

    query = data.clarification_response or data.user_input
    last_sql = get_last_sql(data.session_id)
    chat_history = get_chat_history(data.session_id)

    # ── Clarifier ─────────────────────────────────────────────────
    if not data.clarification_response:
        clarification = clarify_query(
            user_input=query, db_url=data.db_url,
            chat_history=chat_history, last_sql=last_sql,
        )
        if not clarification.is_clear:
            append_message(session_id=data.session_id, role="user", content=data.user_input)
            append_message(session_id=data.session_id, role="assistant", content=clarification.question)
            return {
                "success": False,
                "stage": "clarification",
                "error_code": "CLARIFICATION_NEEDED",
                "needs_clarification": True,
                "question": clarification.question,
            }

    if not chat_history:
        update_session_title(data.session_id, query[:60] + ("..." if len(query) > 60 else ""))

    # ── Planner ───────────────────────────────────────────────────
    plan = plan_query(user_input=query, db_url=data.db_url, chat_history=chat_history)

    # ── Generator ─────────────────────────────────────────────────
    sql = generate_sql(
        user_input=query, db_url=data.db_url,
        plan=plan, last_sql=last_sql, chat_history=chat_history,
    )

    # ── Validator ─────────────────────────────────────────────────
    validation = is_safe_sql(sql, get_table_list(data.db_url))
    if not validation["safe"]:
        return {
            "success": False,
            "stage": "validation",
            "error_code": "VALIDATION_FAILED",
            "error": validation["reason"],
            "generated_sql": sql,
        }

    # ── Executor (with one retry on failure) ──────────────────────
    execution_result = execute_sql(data.db_url, sql)
    was_retried = False

    if not execution_result["success"]:
        error_msg = execution_result.get("error", "Unknown execution error")
        original_sql = sql

        # Retry: show the LLM its own error so it can self-correct
        sql = generate_sql(
            user_input=query, db_url=data.db_url,
            plan=plan, last_sql=last_sql, chat_history=chat_history,
            error_feedback=error_msg, failed_sql=original_sql,
        )
        was_retried = True

        # Re-validate the corrected SQL before executing
        validation2 = is_safe_sql(sql, get_table_list(data.db_url))
        if not validation2["safe"]:
            return {
                "success": False,
                "stage": "execution",
                "error_code": "RETRY_FAILED",
                "error": validation2["reason"],
                "generated_sql": sql,
                "original_sql": original_sql,
                "was_retried": True,
            }

        execution_result = execute_sql(data.db_url, sql)

        if not execution_result["success"]:
            return {
                "success": False,
                "stage": "execution",
                "error_code": "RETRY_FAILED",
                "error": execution_result.get("error"),
                "generated_sql": sql,
                "original_sql": original_sql,
                "was_retried": True,
            }

    # ── Summary + chart (SELECT only) ────────────────────────────
    summary = ""
    chart_suggestion = None
    if execution_result.get("query_type") == "SELECT":
        summary = _generate_result_summary(query, execution_result)
        chart_suggestion = _suggest_chart(execution_result)

    # ── Persist ───────────────────────────────────────────────────
    append_message(session_id=data.session_id, role="user", content=query)
    append_message(session_id=data.session_id, role="assistant", content=sql)
    update_last_sql(session_id=data.session_id, sql=sql)

    return {
        "success": True,
        "stage": "complete",
        "generated_sql": sql,
        "summary": summary,
        "chart_suggestion": chart_suggestion,   # { type, x_axis, y_axis } or None
        "was_retried": was_retried,
        "plan": {
            "intent": plan.intent_summary,
            "tables": plan.candidate_tables,
            "columns": plan.candidate_columns,
        },
        "execution": execution_result,
    }


# ── NL2SQL session management ─────────────────────────────────────

@router.get("/nl2sql-sessions")
def get_nl2sql_sessions():
    return list_nl2sql_sessions()


@router.get("/session-history/{session_id}")
def get_session_history(session_id: str):
    return get_session_history_by_id(session_id)


@router.delete("/nl2sql-sessions/{session_id}")
def delete_nl2sql_session_endpoint(session_id: str):
    found = delete_nl2sql_session(session_id)
    if not found:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    return {"success": True, "session_id": session_id}


@router.patch("/nl2sql-sessions/{session_id}")
def rename_nl2sql_session(session_id: str, data: RenameRequest):
    update_session_title(session_id, data.title)
    return {"success": True, "session_id": session_id, "title": data.title}


# ─────────────────────────────────────────────────────────────────
# COPILOT PIPELINE
# ─────────────────────────────────────────────────────────────────

@router.post("/create-chat")
def create_new_chat(data: CreateChatRequest):
    chat_id = create_chat(title=data.title)
    return {"success": True, "chat_id": chat_id}


@router.post("/agent-chat")
def agent_chat(data: AgentChat):
    history = load_chat_history(data.chat_id)

    if not history:
        update_chat_title(data.chat_id, data.user_input[:60] + ("..." if len(data.user_input) > 60 else ""))

    result = graph.invoke({
        "user_input": data.user_input,
        "db_url": data.db_url,
        "chat_history": history,
    })
    tool_result = result["tool_result"]

    save_message(chat_id=data.chat_id, role="user", content=data.user_input)
    save_message(chat_id=data.chat_id, role="assistant",
                 content=tool_result.get("answer", ""), tool_used=tool_result.get("tool"))

    return {"success": True, "response": tool_result}


# ── Copilot session management ────────────────────────────────────

@router.get("/copilot-sessions")
def get_copilot_sessions():
    return list_copilot_sessions()


@router.get("/copilot-history/{chat_id}")
def get_copilot_history(chat_id: int):
    return get_copilot_session_by_id(chat_id)


@router.delete("/copilot-sessions/{chat_id}")
def delete_copilot_session_endpoint(chat_id: int):
    found = delete_copilot_chat(chat_id)
    if not found:
        raise HTTPException(status_code=404, detail=f"Chat '{chat_id}' not found.")
    return {"success": True, "chat_id": chat_id}


@router.patch("/copilot-sessions/{chat_id}")
def rename_copilot_session(chat_id: int, data: RenameRequest):
    update_chat_title(chat_id, data.title)
    return {"success": True, "chat_id": chat_id, "title": data.title}