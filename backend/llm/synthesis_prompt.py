# backend/nl2sql/planner.py

from langchain_core.prompts import PromptTemplate

from llm.client import llm
from llm.nl2sql_planner_prompt import NL2SQL_PLANNER_PROMPT
from llm.nl2sql_planner_parser import nl2sql_planner_parser

from core.nl2sql_schema import NL2SQLPlan

from db.schema import get_schema
from db.schema_descriptions import generate_schema_descriptions


def _format_chat_history(history: list[dict]) -> str:
    if not history:
        return "No prior conversation."
    lines = []
    for msg in history:
        role = msg.get("role", "unknown").capitalize()
        content = msg.get("content", "")
        lines.append(f"{role}: {content}")
    return "\n".join(lines)


def plan_query(
    user_input: str,
    db_url: str,
    chat_history: list[dict] | None = None
) -> NL2SQLPlan:
    """
    Produces a structured NL2SQLPlan from a user query.

    Now accepts chat_history (last 2-3 messages) so the planner can correctly
    resolve follow-up queries into accurate candidate tables and columns,
    rather than treating vague follow-ups as standalone ambiguous queries.

    Args:
        user_input   : The (possibly clarified) user query
        db_url       : Target database connection string
        chat_history : Recent conversation messages for follow-up context

    Returns:
        NL2SQLPlan with intent, metrics, dimensions, filters, tables, columns etc.
    """

    raw_schema = get_schema(db_url)
    schema = generate_schema_descriptions(raw_schema)

    # Only pass last 3 exchanges (6 messages) — enough context, not too noisy
    recent_history = chat_history[-6:] if chat_history and len(chat_history) > 6 else (chat_history or [])

    prompt = PromptTemplate(
        template=NL2SQL_PLANNER_PROMPT,
        input_variables=["user_input", "schema", "chat_history", "FORMAT_INSTRUCTIONS"]
    )

    chain = prompt | llm | nl2sql_planner_parser

    plan = chain.invoke({
        "user_input": user_input,
        "schema": schema,
        "chat_history": _format_chat_history(recent_history),
        "FORMAT_INSTRUCTIONS": nl2sql_planner_parser.get_format_instructions()
    })

    return plan


if __name__ == "__main__":
    print("── Planner Test ──")
    db_url = "postgresql://postgres:root@localhost:5432/classicmodels"

    # Test 1: standalone query
    user_input = "List the names of customers who ordered products from the 'Classic Cars' product line."
    plan = plan_query(user_input=user_input, db_url=db_url)
    print("Intent:", plan.intent_summary)
    print("Tables:", plan.candidate_tables)

    # Test 2: follow-up query
    history = [
        {"role": "user", "content": "show total sales by product line"},
        {"role": "assistant", "content": "SELECT product_line, SUM(amount) FROM sales GROUP BY product_line"}
    ]
    plan2 = plan_query(
        user_input="now filter that by Germany only",
        db_url=db_url,
        chat_history=history
    )
    print("\nFollow-up Intent:", plan2.intent_summary)
    print("Tables:", plan2.candidate_tables)