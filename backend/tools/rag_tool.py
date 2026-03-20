# backend/tools/rag_tool.py

from rag.search import RAGSearcher
from rag.rag_services import RAGService
from rag.embeddings import load_embeddings

from langchain_chroma import Chroma


# ── Init vectorstore (singleton style) ───────────────────────────

CHROMA_PATH = "./chroma_db"

embeddings = load_embeddings(device="cpu")

vectorstore = Chroma(
    persist_directory=CHROMA_PATH,
    embedding_function=embeddings
)

searcher = RAGSearcher(vectorstore)
rag_service = RAGService(searcher)


# ── Main tool ────────────────────────────────────────────────────

def rag_tool(user_input: str, chat_history: list[dict] = None):
    """
    RAG Tool — handles both fresh queries and follow-up questions.

    Key improvements over original:
    1. k=5 instead of k=3 — retrieves more chunks for better summarization coverage.
       3 chunks was often too few to meaningfully summarize a full document.
    2. Passes chat_history to RAGService which now does query rewriting before
       hitting ChromaDB. This means follow-ups like "in detailed points" or
       "tell me more" are expanded into concrete search queries using context,
       rather than being sent raw to the vector store where they return noise.
    """

    chat_history = chat_history or []

    # Pass the last 6 messages (3 exchanges) — enough context for rewriting
    recent_history = chat_history[-6:] if len(chat_history) > 6 else chat_history

    result = rag_service.answer(
        question=user_input,
        k=5,                        # increased from 3
        chat_history=recent_history
    )

    return {
        "tool":         "rag",
        "success":      True,
        "answer":       result["answer"],
        "citations":    result["citations"],
        "context_used": user_input
    }