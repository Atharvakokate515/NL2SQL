"""
RAG System - PostgreSQL (SQLAlchemy) + ChromaDB
"""

import os
from datetime import datetime
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import declarative_base, Session


# SQLAlchemy models
Base = declarative_base()

class Chunk(Base):
    __tablename__ = "chunks"
    id         = Column(Integer, primary_key=True)
    chroma_id  = Column(String, unique=True)
    source     = Column(String)
    page       = Column(Integer)
    created_at = Column(DateTime, default=datetime.now)

class Query(Base):
    __tablename__ = "queries"
    id         = Column(Integer, primary_key=True)
    query      = Column(Text)
    created_at = Column(DateTime, default=datetime.now)


class SimpleRAG:
    def __init__(self, db_url=None, chroma_path="./chroma_db"):
        db_url = db_url or os.getenv("DATABASE_URL")

        # SQLAlchemy engine
        self.engine = create_engine(db_url)
        Base.metadata.create_all(self.engine)

        # ChromaDB
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.vectorstore = Chroma(
            persist_directory=chroma_path,
            embedding_function=self.embeddings
        )

        # Text splitter
        self.splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)

        print("✅ RAG initialized")

    def ingest(self, pdf_path):
        """Ingest PDF into ChromaDB and log metadata to PostgreSQL"""
        reader = PdfReader(pdf_path)
        text   = "\n".join(p.extract_text() for p in reader.pages)
        chunks = self.splitter.split_text(text)
        source = os.path.basename(pdf_path)

        texts, metadatas, ids = [], [], []

        for i, chunk in enumerate(chunks):
            doc_id = f"{source}_{i}_{int(datetime.now().timestamp())}"
            texts.append(chunk)
            metadatas.append({"source": source, "page": i // 10})
            ids.append(doc_id)

        # Add to ChromaDB
        self.vectorstore.add_texts(texts=texts, metadatas=metadatas, ids=ids)

        # Save metadata to PostgreSQL
        with Session(self.engine) as session:
            for doc_id, meta in zip(ids, metadatas):
                session.add(Chunk(chroma_id=doc_id, source=meta["source"], page=meta["page"]))
            session.commit()

        print(f"✅ Ingested {len(chunks)} chunks from {source}")
        return len(chunks)

    def search(self, query, k=5):
        """Search ChromaDB and log query to PostgreSQL"""
        results = self.vectorstore.similarity_search_with_score(query, k=k)

        # Log query
        with Session(self.engine) as session:
            session.add(Query(query=query))
            session.commit()

        formatted = []
        for rank, (doc, score) in enumerate(results, 1):
            formatted.append({
                "rank":       rank,
                "content":    doc.page_content,
                "source":     doc.metadata.get("source"),
                "page":       doc.metadata.get("page"),
                "confidence": round(1 / (1 + score), 3)
            })

        for r in formatted:
            print(f"  [{r['rank']}] {r['source']} p.{r['page']} ({r['confidence']})")

        return formatted

    def answer(self, question, llm=None, k=3):
        """Get answer with citations"""
        results = self.search(question, k)
        context = "\n\n".join(f"[{r['rank']}] {r['content']}" for r in results)

        if llm:
            response = llm.invoke(f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer:")
            answer   = response.content if hasattr(response, "content") else response
        else:
            answer = results[0]["content"][:300] if results else "No results found."

        citations = [
            {"id": r["rank"], "source": r["source"], "page": r["page"], "confidence": r["confidence"]}
            for r in results
        ]

        return {"answer": answer, "citations": citations}

    def history(self, limit=10):
        """Get recent query history"""
        with Session(self.engine) as session:
            rows = session.query(Query).order_by(Query.created_at.desc()).limit(limit).all()
            return [{"query": r.query, "time": str(r.created_at)} for r in rows]

    def stats(self):
        """Get chunk and query counts"""
        with Session(self.engine) as session:
            chunks  = session.query(Chunk).count()
            queries = session.query(Query).count()
        return {"chunks": chunks, "queries": queries}