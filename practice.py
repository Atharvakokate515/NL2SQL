"""
Minimal RAG with SQLite Caching - Under 200 Lines
Features: Persistence, Citations, Confidence Scores
"""

import os
import faiss
import sqlite3
from sentence_transformers import SentenceTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader


class SimpleRAG:
    def __init__(self, db_path="rag.db"):
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        self.splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
        self.db_path = db_path
        self.index = None
        
        # Init database
        conn = sqlite3.connect(db_path)
        conn.execute('''CREATE TABLE IF NOT EXISTS chunks (
            id INTEGER PRIMARY KEY,
            content TEXT,
            source TEXT,
            page INTEGER,
            idx INTEGER
        )''')
        conn.execute('''CREATE TABLE IF NOT EXISTS queries (
            id INTEGER PRIMARY KEY,
            query TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )''')
        conn.commit()
        conn.close()
        
        # Load existing index
        if os.path.exists("index.faiss"):
            self.index = faiss.read_index("index.faiss")
            print(f"✅ Loaded existing index")
    
    def ingest(self, pdf_path):
        """Ingest PDF with auto-save to DB and FAISS"""
        # Extract text
        reader = PdfReader(pdf_path)
        text = "\n".join([p.extract_text() for p in reader.pages])
        
        # Chunk
        chunks = self.splitter.split_text(text)
        print(f"📄 {len(chunks)} chunks from {os.path.basename(pdf_path)}")
        
        # Embed
        embeddings = self.model.encode(chunks)
        
        # Create or update FAISS index
        if self.index is None:
            self.index = faiss.IndexFlatL2(embeddings.shape[1])
        
        start_idx = self.index.ntotal
        self.index.add(embeddings)
        
        # Save to database
        conn = sqlite3.connect(self.db_path)
        filename = os.path.basename(pdf_path)
        
        for i, chunk in enumerate(chunks):
            conn.execute(
                "INSERT INTO chunks (content, source, page, idx) VALUES (?, ?, ?, ?)",
                (chunk, filename, i // 10, start_idx + i)
            )
        
        conn.commit()
        conn.close()
        
        # Save FAISS index
        faiss.write_index(self.index, "index.faiss")
        print(f"✅ Saved to database and FAISS")
        
        return len(chunks)
    
    def search(self, query, k=5):
        """Search with confidence scores and citations"""
        if self.index is None:
            return []
        
        # Embed query
        query_vec = self.model.encode([query])
        
        # Search FAISS
        distances, indices = self.index.search(query_vec, k)
        
        # Get chunks from database
        conn = sqlite3.connect(self.db_path)
        results = []
        
        for rank, (idx, dist) in enumerate(zip(indices[0], distances[0]), 1):
            row = conn.execute(
                "SELECT content, source, page FROM chunks WHERE idx = ?", 
                (int(idx),)
            ).fetchone()
            
            if row:
                confidence = 1 / (1 + dist)  # Convert distance to 0-1 score
                results.append({
                    "rank": rank,
                    "content": row[0],
                    "source": row[1],
                    "page": row[2],
                    "confidence": round(confidence, 3)
                })
        
        # Log query
        conn.execute("INSERT INTO queries (query) VALUES (?)", (query,))
        conn.commit()
        conn.close()
        
        # Print results
        print(f"\n🔍 '{query}' - {len(results)} results:")
        for r in results:
            print(f"  [{r['rank']}] {r['source']} p.{r['page']} ({r['confidence']:.3f})")
        
        return results
    
    def answer(self, question, llm=None, k=3):
        """Get answer with citations"""
        results = self.search(question, k)
        
        if not results:
            return {"answer": "No information found.", "citations": []}
        
        # Build context
        context = "\n\n".join([f"[{r['rank']}] {r['content']}" for r in results])
        
        # Generate answer
        if llm:
            prompt = f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer:"
            answer = llm.invoke(prompt)
        else:
            answer = f"From the documents:\n{results[0]['content'][:300]}..."
        
        # Citations
        citations = [
            {"id": r['rank'], "source": r['source'], "page": r['page'], 
             "confidence": r['confidence']}
            for r in results
        ]
        
        return {"answer": answer, "citations": citations}
    
    def history(self, limit=10):
        """Get query history"""
        conn = sqlite3.connect(self.db_path)
        rows = conn.execute(
            "SELECT query, timestamp FROM queries ORDER BY timestamp DESC LIMIT ?",
            (limit,)
        ).fetchall()
        conn.close()
        
        return [{"query": r[0], "time": r[1]} for r in rows]
    
    def stats(self):
        """Get system stats"""
        conn = sqlite3.connect(self.db_path)
        
        total_chunks = conn.execute("SELECT COUNT(*) FROM chunks").fetchone()[0]
        total_queries = conn.execute("SELECT COUNT(*) FROM queries").fetchone()[0]
        sources = dict(conn.execute(
            "SELECT source, COUNT(*) FROM chunks GROUP BY source"
        ).fetchall())
        
        conn.close()
        
        return {
            "chunks": total_chunks,
            "queries": total_queries,
            "sources": sources
        }
