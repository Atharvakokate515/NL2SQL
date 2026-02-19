# backend/core/planner_schema.py

from pydantic import BaseModel
from typing import List


class PlannerOutput(BaseModel):

    tools: List[str]
    sql_tasks: List[str]
    rag_tasks: List[str]
