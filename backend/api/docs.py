# backend/api/docs.py
"""
Document upload and management endpoints.

POST /api/upload-doc    → upload a single PDF, ingest it (or re-ingest if updated)
GET  /api/docs          → list all ingested documents
DELETE /api/docs/{source} → delete a document and all its chunks
"""

import os
import shutil
import tempfile

from fastapi import APIRouter, UploadFile, File, HTTPException

from rag.ingest import RAGIngestor
from rag.rag_db import SessionLocal
from rag.models import Chunk

router = APIRouter()

# Single shared ingestor instance — reuses the same ChromaDB connection
_ingestor = None


def get_ingestor() -> RAGIngestor:
    global _ingestor
    if _ingestor is None:
        _ingestor = RAGIngestor(chroma_path="./chroma_db")
    return _ingestor


# ─────────────────────────────────────────────────────────────────
# Upload + ingest
# ─────────────────────────────────────────────────────────────────

@router.post("/upload-doc")
async def upload_doc(file: UploadFile = File(...)):
    """
    Upload a PDF and ingest it into the RAG vector store.

    - First upload → fresh ingestion
    - Re-upload of same filename → old chunks deleted, re-ingested fresh
      (this is how document updates are handled)

    Only PDF files are accepted.
    """

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    # Save to a temp file — UploadFile is a stream, RAGIngestor needs a path
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        ingestor = get_ingestor()
        result = ingestor.ingest_pdf(tmp_path)

        # Rename source in result to the original filename
        # (temp file has a random name — we want the real filename stored)
        result["source"] = file.filename

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

    finally:
        os.unlink(tmp_path)  # always clean up the temp file

    return {
        "success": True,
        **result
    }


# ─────────────────────────────────────────────────────────────────
# List ingested documents
# ─────────────────────────────────────────────────────────────────

@router.get("/docs")
def list_docs():
    """
    List all ingested documents with their chunk counts.
    Used by the frontend to show what's in the knowledge base.
    """

    session = SessionLocal()
    try:
        # Group by source to get one row per document
        from sqlalchemy import func
        rows = (
            session.query(
                Chunk.source,
                func.count(Chunk.id).label("chunk_count"),
                func.min(Chunk.created_at).label("ingested_at")
            )
            .group_by(Chunk.source)
            .order_by(func.min(Chunk.created_at).desc())
            .all()
        )

        return {
            "success": True,
            "documents": [
                {
                    "source": row.source,
                    "chunk_count": row.chunk_count,
                    "ingested_at": row.ingested_at.isoformat()
                }
                for row in rows
            ]
        }

    finally:
        session.close()


# ─────────────────────────────────────────────────────────────────
# Delete a document
# ─────────────────────────────────────────────────────────────────

@router.delete("/docs/{source}")
def delete_doc(source: str):
    """
    Delete a document and all its chunks from ChromaDB and the chunks table.
    """

    ingestor = get_ingestor()

    if not ingestor.is_already_ingested(source):
        raise HTTPException(status_code=404, detail=f"Document '{source}' not found.")

    deleted_count = ingestor._delete_existing_chunks(source)

    return {
        "success": True,
        "source": source,
        "chunks_deleted": deleted_count
    }