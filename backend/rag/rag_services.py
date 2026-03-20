# backend/rag/rag_service.py


class RAGService:

    def __init__(self, searcher, llm=None):
        self.searcher = searcher
        self.llm = llm

    # ─────────────────────────────────────────────────────────────────────
    def _rewrite_query_for_search(self, question: str, chat_history: list[dict]) -> str:
        """
        Rewrites a vague or follow-up question into a self-contained search query
        before it hits the vector store.

        This is the core fix for follow-up failures. When the user says something
        like "in detailed points", ChromaDB must not receive that as the search string
        — it is semantically empty and retrieves irrelevant chunks.

        This method uses the LLM + conversation history to produce a concrete query
        like "detailed summary of NL2SQL and RAG testing document contents".

        Falls back to the original question if:
        - No LLM is available
        - No conversation history (fresh query, no rewriting needed)
        - The LLM call fails for any reason
        """
        if not self.llm or not chat_history:
            return question

        recent = chat_history[-4:] if len(chat_history) > 4 else chat_history
        history_lines = [
            f"{msg.get('role','').capitalize()}: {msg.get('content','')[:200]}"
            for msg in recent
        ]
        history_text = "\n".join(history_lines)

        rewrite_prompt = f"""You are a search query rewriter for a document retrieval system.

            Given conversation history and a follow-up question, rewrite the follow-up into a 
            self-contained search query that captures full intent — even if the follow-up is 
            short, vague, or uses pronouns like "it", "that", "the same", "more detail", etc.

            Output ONLY the rewritten query. No explanation, no quotes, no preamble.
            Keep it under 20 words. Make it specific enough for semantic vector search.
            If the question is already self-contained and clear, return it unchanged.

            Conversation History:
            {history_text}

            Follow-up Question: {question}

            Rewritten search query:"""

        try:
            response = self.llm.invoke(rewrite_prompt)
            rewritten = (
                response.content.strip()
                if hasattr(response, "content")
                else str(response).strip()
            )
            # Sanity check — non-empty and not absurdly long
            if rewritten and len(rewritten) < 200:
                return rewritten
        except Exception:
            pass

        return question

    # ─────────────────────────────────────────────────────────────────────
    def answer(self, question: str, k: int = 5, chat_history: list[dict] = None):
        """
        Answer a question using RAG with follow-up awareness.

        Pipeline:
          1. Rewrite the search query using conversation history (fixes follow-ups)
          2. Search ChromaDB with the enriched query
          3. Build an answer prompt that includes both context chunks and history

        Args:
            question     : The RAG sub-task (may be a follow-up)
            k            : Chunks to retrieve — default 5 (was 3, increased for better
                           summarization coverage of longer documents)
            chat_history : Full conversation history for query rewriting + answering
        """
        chat_history = chat_history or []

        # Step 1 — Rewrite vague/follow-up queries before vector search
        search_query = self._rewrite_query_for_search(question, chat_history)

        # Step 2 — Retrieve relevant chunks using the enriched search query
        results = self.searcher.search(search_query, k)

        context = "\n\n".join(
            f"[{r['rank']}] {r['content']}"
            for r in results
        )

        if self.llm:

            # Build conversation history string for follow-up awareness in the answer
            history_text = ""
            if chat_history:
                lines = []
                for msg in chat_history:
                    role    = msg.get("role", "unknown").capitalize()
                    content = msg.get("content", "")
                    lines.append(f"{role}: {content}")
                history_text = (
                    "\n\nConversation History (for follow-up context):\n"
                    + "\n".join(lines)
                )

            # Step 3 — Answer using the original question (not rewritten) so the LLM
            # honours any format/style instructions the user embedded in their question
            # (e.g. "in detailed points", "as a numbered list", "briefly").
            prompt = f"""You are an enterprise knowledge assistant.
                Answer the question using ONLY the provided document context.
                If the question is a follow-up, use the conversation history to understand what it refers to.
                If the user asked for a specific format (bullet points, numbered list, detailed breakdown,
                brief summary, table, etc.), you MUST strictly use that format in your response.
                Do NOT hallucinate. If the context does not contain enough information, say so clearly.
                {history_text}

                Document Context:
                {context}

                Question: {question}

                Answer:"""

            response = self.llm.invoke(prompt)
            answer = (
                response.content
                if hasattr(response, "content")
                else response
            )

        else:
            answer = results[0]["content"][:300] if results else "No results found."

        return {
            "answer":    answer,
            "citations": results
        }