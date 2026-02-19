# rag/embeddings.py

from langchain_community.embeddings import HuggingFaceEmbeddings

def load_embeddings(device="cpu"):

    return HuggingFaceEmbeddings(
        model_name="BAAI/bge-small-en",   # Faster than MiniLM
        model_kwargs={"device": device}
    )
#Switch to "cuda" if GPU exists.