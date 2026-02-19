# rag/rag_service.py

class RAGService:

    def __init__(self, searcher, llm=None):
        self.searcher = searcher
        self.llm = llm

    def answer(self, question, k=3):

        results = self.searcher.search(question, k)

        context = "\n\n".join(
            f"[{r['rank']}] {r['content']}"
            for r in results
        )

        if self.llm:

            prompt = f"""
                Context:
                {context}

                Question: {question}

                Answer using only the context.
                """

            response = self.llm.invoke(prompt)

            answer = (
                response.content
                if hasattr(response, "content")
                else response
            )

        else:
            answer = results[0]["content"][:300]

        return {
            "answer": answer,
            "citations": results
        }
