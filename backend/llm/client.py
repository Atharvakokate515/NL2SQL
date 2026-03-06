# backend/llm/client.py

from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from dotenv import load_dotenv
import os

load_dotenv()

model = HuggingFaceEndpoint(
    repo_id="meta-llama/Llama-3.1-8B-Instruct",
    max_new_tokens=512,     # was 100 — silently truncated SQL for any complex query
    do_sample=False,
    repetition_penalty=0.6,
)
llm = ChatHuggingFace(llm=model, verbose=True)


def generate_text(prompt: str) -> str:
    return llm.invoke(prompt)


if __name__ == "__main__":
    print(os.getenv("HUGGINGFACEHUB_API_TOKEN"))