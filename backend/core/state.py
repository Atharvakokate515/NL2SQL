from typing import TypedDict, Optional, Any


class AgentState(TypedDict):

    user_input: str
    db_url: Optional[str]

    planned_tools: Optional[list[str]]

    sql_tasks: Optional[list[str]]
    rag_tasks: Optional[list[str]]

    sql_results: Optional[list[Any]]
    rag_results: Optional[list[Any]]

    tool_result: Optional[Any]

    chat_history: list[dict]
