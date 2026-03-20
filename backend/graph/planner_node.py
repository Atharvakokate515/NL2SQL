# backend/graph/planner_node.py

import logging

from llm.client import llm
from llm.planner_prompt import PLANNER_PROMPT
from llm.planner_parser import planner_parser
from core.planner_schema import PlannerOutput

from langchain_core.prompts import PromptTemplate

logger = logging.getLogger(__name__)


def _format_chat_history(history: list[dict]) -> str:
    """Format last 6 messages (3 exchanges) for the planner prompt."""
    if not history:
        return "No prior conversation."
    lines = []
    for msg in history[-6:]:
        role = msg.get("role", "unknown").capitalize()
        content = msg.get("content", "")
        # Truncate very long messages (e.g. long assistant answers) to keep prompt size sane
        if len(content) > 300:
            content = content[:300] + "..."
        lines.append(f"{role}: {content}")
    return "\n".join(lines)


def plan_tools(state: dict) -> dict:

    user_input   = state["user_input"]
    chat_history = state.get("chat_history", [])   # ← was missing — this is the core fix

    prompt = PromptTemplate(
        template=PLANNER_PROMPT,
        input_variables=["user_input", "chat_history", "FORMAT_INSTRUCTIONS"]
    )

    chain = prompt | llm | planner_parser

    try:
        parsed_output: PlannerOutput = chain.invoke({
            "user_input":         user_input,
            "chat_history":       _format_chat_history(chat_history),   # ← new
            "FORMAT_INSTRUCTIONS": planner_parser.get_format_instructions()
        })

        # Guard: if a tool is listed but has no tasks, drop it and warn.
        cleaned_tools = []

        for tool in parsed_output.tools:
            if tool == "nl2sql" and not parsed_output.sql_tasks:
                logger.warning(
                    "Planner listed 'nl2sql' but sql_tasks is empty for query: '%s'. "
                    "Dropping nl2sql from plan.", user_input
                )
                continue
            if tool == "rag" and not parsed_output.rag_tasks:
                logger.warning(
                    "Planner listed 'rag' but rag_tasks is empty for query: '%s'. "
                    "Dropping rag from plan.", user_input
                )
                continue
            cleaned_tools.append(tool)

        if not cleaned_tools:
            logger.warning(
                "All planned tools dropped for query: '%s'. Falling back to chat.",
                user_input
            )
            cleaned_tools = ["chat"]

        return {
            "planned_tools": cleaned_tools,
            "sql_tasks":     parsed_output.sql_tasks or [],
            "rag_tasks":     parsed_output.rag_tasks or []
        }

    except Exception as e:
        logger.error(
            "Planner failed for query: '%s'. Error: %s. Falling back to chat.",
            user_input, str(e)
        )
        return {
            "planned_tools": ["chat"],
            "sql_tasks":     [],
            "rag_tasks":     []
        }