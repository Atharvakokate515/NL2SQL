# backend/llm/client.py
"""
Unified LLM client — switch providers by setting LLM_PROVIDER in backend/.env

Supported providers:
  LLM_PROVIDER=huggingface   (default)  uses HuggingFace Inference API
  LLM_PROVIDER=openai                   uses OpenAI API  (gpt-4o by default)
  LLM_PROVIDER=groq                     uses Groq API    (llama-3.3-70b by default)

Model overrides (optional, each has a sensible default):
  HUGGINGFACE_MODEL=meta-llama/Llama-3.3-70B-Instruct
  OPENAI_MODEL=gpt-4o
  GROQ_MODEL=llama-3.3-70b-versatile

API keys:
  HUGGINGFACEHUB_API_TOKEN=hf_...
  OPENAI_API_KEY=sk-...
  GROQ_API_KEY=gsk_...

Example .env for OpenAI:
  LLM_PROVIDER=openai
  OPENAI_API_KEY=sk-...

Example .env for Groq:
  LLM_PROVIDER=groq
  GROQ_API_KEY=gsk_...

Example .env for HuggingFace (existing / default):
  LLM_PROVIDER=huggingface
  HUGGINGFACEHUB_API_TOKEN=hf_...
"""

import os
from dotenv import load_dotenv

load_dotenv()

_PROVIDER = os.getenv("LLM_PROVIDER", "huggingface").lower().strip()


# ─────────────────────────────────────────────────────────────────
# HuggingFace  (original / default)
# ─────────────────────────────────────────────────────────────────
if _PROVIDER == "huggingface":
    from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace

    _model_id = os.getenv("HUGGINGFACE_MODEL", "meta-llama/Llama-3.3-70B-Instruct")

    _endpoint = HuggingFaceEndpoint(
        repo_id=_model_id,
        max_new_tokens=512,
        do_sample=False,
        repetition_penalty=0.6,
    )
    llm = ChatHuggingFace(llm=_endpoint, verbose=False)
    print(f"[LLM] Provider: HuggingFace  |  Model: {_model_id}")


# ─────────────────────────────────────────────────────────────────
# OpenAI
# pip install langchain-openai
# ─────────────────────────────────────────────────────────────────
elif _PROVIDER == "openai":
    from langchain_openai import ChatOpenAI

    _model_id = os.getenv("OPENAI_MODEL", "gpt-4o")

    llm = ChatOpenAI(
        model=_model_id,
        temperature=0,
        api_key=os.getenv("OPENAI_API_KEY"),
    )
    print(f"[LLM] Provider: OpenAI  |  Model: {_model_id}")


# ─────────────────────────────────────────────────────────────────
# Groq
# pip install langchain-groq
# ─────────────────────────────────────────────────────────────────
elif _PROVIDER == "groq":
    from langchain_groq import ChatGroq

    _model_id = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    llm = ChatGroq(
        model=_model_id,
        temperature=0,
        api_key=os.getenv("GROQ_API_KEY"),
    )
    print(f"[LLM] Provider: Groq  |  Model: {_model_id}")


# ─────────────────────────────────────────────────────────────────
else:
    raise ValueError(
        f"Unknown LLM_PROVIDER='{_PROVIDER}'. "
        f"Choose one of: huggingface, openai, groq"
    )


# ─────────────────────────────────────────────────────────────────
# Shared helper — used by synthesis_node and result_summary_prompt
# ─────────────────────────────────────────────────────────────────
def generate_text(prompt: str):
    return llm.invoke(prompt)


# ─────────────────────────────────────────────────────────────────
# Quick test
# ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"Provider : {_PROVIDER}")
    print(f"Testing  : {llm}")
    try:
        response = generate_text("Say hello in one sentence.")
        content  = response.content if hasattr(response, "content") else str(response)
        print(f"Response : {content}")
    except Exception as e:
        print(f"Error    : {e}")

if __name__ == "__main__":
    print(os.getenv("HUGGINGFACEHUB_API_TOKEN"))
    print("==="*30)
    test_prompt = "Write a short poem about AI in 2 lines."
    try:
        response = generate_text(test_prompt)
        print("Test prompt:", test_prompt)
        print("LLM response:", response)
    except Exception as e:
        print("Error while testing LLM client:", e)