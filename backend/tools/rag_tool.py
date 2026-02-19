# backend/tools/rag_tool.py

from rag.search import RAGSearcher
from rag.rag_services import RAGService
from rag.embeddings import load_embeddings

from langchain_community.vectorstores import Chroma


# ---------- INIT VECTORSTORE (Singleton Style) ----------

CHROMA_PATH = "./chroma_db"

embeddings = load_embeddings(device="cpu")

vectorstore = Chroma(
    persist_directory=CHROMA_PATH,
    embedding_function=embeddings
)

searcher = RAGSearcher(vectorstore)
rag_service = RAGService(searcher)


# ---------- FOLLOW-UP DETECTOR ----------

FOLLOWUP_KEYWORDS = [
    "it",
    "they",
    "that",
    "those",
    "more",
    "explain",
    "elaborate",
    "who",
    "when",
    "where",
    "why",
    "how"
]


def is_followup(query: str) -> bool:
    q = query.lower()
    return any(word in q for word in FOLLOWUP_KEYWORDS)


# ---------- CONTEXT EXPANDER ----------

def expand_query_with_history(query: str, chat_history: list[dict]) -> str:
    """
    Expands vague follow-up queries using past chat context.
    """

    if not chat_history:
        return query

    last_messages = chat_history[-3:]

    history_text = "\n".join(
        f"{m['role']}: {m['content']}"
        for m in last_messages
    )

    expanded_query = f"""
        Conversation context:
        {history_text}

        User follow-up question:
        {query}

        Rewrite the question into a standalone search query.
        """

    return expanded_query


# ---------- MAIN TOOL ----------

def rag_tool(user_input: str, chat_history: list[dict] = None):
    """
    RAG Tool

    Handles:
    - Fresh document queries
    - Follow-up contextual queries
    - Citation generation
    """

    chat_history = chat_history or []

    # 1️ Detect follow-up
    if is_followup(user_input):
        search_query = expand_query_with_history(
            user_input,
            chat_history
        )
    else:
        search_query = user_input

    # 2️ Run RAG retrieval + answer
    result = rag_service.answer(
        question=search_query,
        k=3
    )

    # 3️ Structured response for agent
    return {
        "tool": "rag",
        "success": True,
        "answer": result["answer"],
        "citations": result["citations"],
        "context_used": search_query
    }
