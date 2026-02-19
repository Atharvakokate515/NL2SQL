from langchain_huggingface import HuggingFaceEndpoint,ChatHuggingFace
from dotenv import load_dotenv
from pathlib import Path
import os
# env_path = Path("C:/Users/Swati/Desktop/New_folder/projects/NL2SQL chatbot agent/.env")
load_dotenv()

model = HuggingFaceEndpoint(
    repo_id="meta-llama/Llama-3.2-1B-Instruct",
    max_new_tokens=100,
    do_sample=False,
    repetition_penalty=0.6,
)
llm = ChatHuggingFace(llm=model, verbose=True)

def generate_text(prompt: str) -> str:
    return llm.invoke(prompt)



if __name__ == "__main__":
    import os
    print(os.getenv("HUGGINGFACEHUB_API_TOKEN"))
