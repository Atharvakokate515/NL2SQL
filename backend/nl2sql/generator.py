# backend/nl2sql/generator.py

import re
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers.pydantic import OutputParserException

from llm.client import llm
from llm.schema_parser import schema_parser
from llm.nl2sql_prompts import NL2SQL_PROMPT

from core.nl2sql_plan_schema import NL2SQLPlan

from db.schema import get_schema
from db.schema_descriptions import generate_schema_descriptions


def clean_sql(sql: str) -> str:
    sql = sql.replace("\\n", " ")
    sql = sql.replace("\n", " ")
    sql = sql.strip()
    return sql


def format_chat_history(history: list[dict]) -> str:
    if not history:
        return "No prior conversation."
    lines = []
    for msg in history:
        role = msg.get("role", "unknown").capitalize()
        content = msg.get("content", "")
        lines.append(f"{role}: {content}")
    return "\n".join(lines)


def _extract_sql_from_error(error_str: str) -> str | None:
    """Try to pull the SQL string out of a malformed JSON parser error."""
    # Pattern: "sql": "SELECT ..."  possibly with escaped quotes inside
    match = re.search(r'"sql"\s*:\s*"((?:[^"\\]|\\.)*)"', error_str)
    if match:
        return match.group(1).replace('\\"', '"').replace('\\n', ' ').strip()
    # Fallback: grab anything that looks like a SELECT statement
    match = re.search(r'(SELECT\s+.+?)(?:\\n|"|}|$)', error_str, re.IGNORECASE | re.DOTALL)
    if match:
        return match.group(1).replace('\\n', ' ').strip()
    return None


def generate_sql(
    user_input: str,
    db_url: str,
    plan: NL2SQLPlan,
    last_sql: str | None = None,
    chat_history: list[dict] | None = None,
    error_feedback: str | None = None,
    failed_sql: str | None = None,
) -> str:

    raw_schema = get_schema(db_url)
    enriched_schema = generate_schema_descriptions(raw_schema)
    history_text = format_chat_history(chat_history or [])

    if error_feedback and failed_sql:
        from llm.nl2sql_prompts import NL2SQL_RETRY_PROMPT
        prompt = PromptTemplate(
            template=NL2SQL_RETRY_PROMPT,
            input_variables=[
                "user_input", "schema", "last_sql",
                "intent_summary", "metrics_requested", "dimensions_requested",
                "filters_detected", "aggregation_required", "grouping_conceptually_required",
                "sorting_requested", "candidate_tables", "candidate_columns",
                "chat_history", "FORMAT_INSTRUCTIONS",
                "failed_sql", "error_feedback",
            ]
        )
    else:
        prompt = PromptTemplate(
            template=NL2SQL_PROMPT,
            input_variables=[
                "user_input", "schema", "last_sql",
                "intent_summary", "metrics_requested", "dimensions_requested",
                "filters_detected", "aggregation_required", "grouping_conceptually_required",
                "sorting_requested", "candidate_tables", "candidate_columns",
                "chat_history", "FORMAT_INSTRUCTIONS",
            ]
        )

    chain = prompt | llm | schema_parser

    invoke_args = {
        "user_input": user_input,
        "schema": enriched_schema,
        "last_sql": last_sql or "None",
        "intent_summary": plan.intent_summary,
        "metrics_requested": ", ".join(plan.metrics_requested) if plan.metrics_requested else "None",
        "dimensions_requested": ", ".join(plan.dimensions_requested) if plan.dimensions_requested else "None",
        "filters_detected": ", ".join(plan.filters_detected) if plan.filters_detected else "None",
        "aggregation_required": plan.aggregation_required,
        "grouping_conceptually_required": plan.grouping_conceptually_required,
        "sorting_requested": plan.sorting_requested,
        "candidate_tables": ", ".join(plan.candidate_tables),
        "candidate_columns": str(plan.candidate_columns),
        "chat_history": history_text,
        "FORMAT_INSTRUCTIONS": schema_parser.get_format_instructions(),
    }

    if error_feedback and failed_sql:
        invoke_args["failed_sql"] = failed_sql
        invoke_args["error_feedback"] = error_feedback

    try:
        raw_output = chain.invoke(invoke_args)
    except OutputParserException as e:
        # LLM produced valid SQL but in malformed JSON — try to extract it
        error_str = str(e.args[0]) if e.args else ""
        print(f"[generator] OutputParserException — attempting SQL extraction from raw output")
        extracted = _extract_sql_from_error(error_str)
        if extracted:
            print(f"[generator] Extracted SQL: {extracted[:100]}...")
            return clean_sql(extracted)
        raise ValueError(
            f"LLM failed to produce parseable SQL output. "
            f"Raw error: {error_str[:300]}"
        )

    return clean_sql(raw_output.sql)