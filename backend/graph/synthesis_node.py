# backend/graph/synthesis_node.py

from llm.client import generate_text
from llm.synthesis_prompt import SYNTHESIS_PROMPT


def format_sql_results(sql_results):

    if not sql_results:
        return "No SQL data available."

    formatted = []

    for item in sql_results:

        task = item["task"]
        result = item["result"]

        formatted.append(
            f"Task: {task}\nResult: {result}\n"
        )

    return "\n".join(formatted)


def format_rag_results(rag_results):

    if not rag_results:
        return "No document context available."

    formatted = []

    for item in rag_results:

        task = item["task"]
        answer = item["result"]["answer"]

        formatted.append(
            f"Task: {task}\nContext: {answer}\n"
        )

    return "\n".join(formatted)

def format_citations(rag_results):

    if not rag_results:
        return "No citations available."

    formatted = []

    for item in rag_results:

        citations = item["result"].get("citations", [])

        for c in citations:

            formatted.append(
                f"Source: {c['source']} | "
                f"Page: {c['page']} | "
                f"Confidence: {round(1 - c['score'], 3)}"
            )

    return "\n".join(formatted)


def synthesize_answer(state: dict):

    user_query = state["user_input"]

    sql_results = state.get("sql_results", [])
    rag_results = state.get("rag_results", [])

    formatted_sql = format_sql_results(sql_results)
    formatted_rag = format_rag_results(rag_results)
    formatted_citations = format_citations(rag_results)

    prompt = SYNTHESIS_PROMPT.format(
        user_query=user_query,
        sql_results=formatted_sql,
        rag_context=formatted_rag,
        citations=formatted_citations
    )

    response = generate_text(prompt).content

    return {
        "tool_result": {
            "tool": "synthesis",
            "answer": response,
            "rag_used": bool(rag_results),
            "sql_used": bool(sql_results),
            "citations": formatted_citations if rag_results else None
        }
    }
