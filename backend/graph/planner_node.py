from llm.client import generate_text,llm
from llm.planner_prompt import PLANNER_PROMPT
from llm.planner_parser import planner_parser
from core.planner_schema import PlannerOutput

from langchain.prompts import PromptTemplate


def plan_tools(state: dict):

    user_input = state["user_input"]

    # prompt = PLANNER_PROMPT.format(
    #     user_input=user_input
    # )

    prompt = PromptTemplate(template=PLANNER_PROMPT)
    chain = prompt | llm | planner_parser
    raw_output = chain.invoke({"user_input":user_input}).content

    # raw_output = generate_text(prompt).content




    try:
        parsed_output = planner_parser.parse(raw_output)

    except Exception:

        # Fallback → default to chat
        parsed_output = PlannerOutput(
            tools=["chat"],
            sql_tasks=[],
            rag_tasks=[]
        )

    return {
        "planned_tools": parsed_output.tools,
        "sql_tasks": parsed_output.sql_tasks,
        "rag_tasks": parsed_output.rag_tasks
    }