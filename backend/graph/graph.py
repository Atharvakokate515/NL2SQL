from langgraph.graph import StateGraph,START, END

from core.state import AgentState
from graph.planner_node import plan_tools
from graph.execution_node import execute_tools
from graph.synthesis_node import synthesize_answer


def build_graph():

    graph = StateGraph(AgentState)

    graph.add_node("plan_tools", plan_tools)
    graph.add_node("execute_tools", execute_tools)
    graph.add_node("synthesize_answer", synthesize_answer)

    graph.add_edge(START,"plan_tools")

    graph.add_edge("plan_tools", "execute_tools")
    graph.add_edge("execute_tools", "synthesize_answer")
    graph.add_edge("synthesize_answer", END)

    return graph.compile()
