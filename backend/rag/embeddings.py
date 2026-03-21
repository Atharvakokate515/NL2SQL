# backend/rag/embeddings.py
import os
from dotenv import load_dotenv

load_dotenv()

_PROVIDER = os.getenv("LLM_PROVIDER", "huggingface").lower().strip()


if _PROVIDER == "huggingface":
    from langchain_huggingface import HuggingFaceEndpointEmbeddings

    def load_embeddings(device="cpu"):
        return HuggingFaceEndpointEmbeddings(
            model="BAAI/bge-small-en-v1.5",
            huggingfacehub_api_token=os.getenv("HUGGINGFACEHUB_API_TOKEN"),
        )
    print("[Embeddings] Provider: HuggingFace API  |  Model: BAAI/bge-small-en-v1.5")


elif _PROVIDER in ("openai", "groq"):
    from langchain_openai import OpenAIEmbeddings

    def load_embeddings(device="cpu"):
        return OpenAIEmbeddings(
            model="text-embedding-3-small",
            api_key=os.getenv("OPENAI_API_KEY"),
        )
    print("[Embeddings] Provider: OpenAI API  |  Model: text-embedding-3-small")


else:
    raise ValueError(
        f"Unknown LLM_PROVIDER='{_PROVIDER}'. "
        f"Choose one of: huggingface, openai, groq"
    )