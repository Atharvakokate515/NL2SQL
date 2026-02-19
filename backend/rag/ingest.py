"""
Key upgrades:
    1.Page streaming
    2.Parallel extraction
    3.Batch vector inserts
    4.Multi-PDF ingestion ready
"""
import os
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma

from .embeddings import load_embeddings
from .db import SessionLocal
from .models import Chunk


class RAGIngestor:

    def __init__(self, chroma_path="./chroma_db", device="cpu"):

        self.embeddings = load_embeddings(device)

        self.vectorstore = Chroma(
            persist_directory=chroma_path,
            embedding_function=self.embeddings
        )

        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=100
        )

    # ---------- PAGE PROCESSOR ----------

    def _process_page(self, args):
        page_num, page = args
        text = page.extract_text()

        if not text:
            return []

        chunks = self.splitter.split_text(text)

        return [(chunk, page_num) for chunk in chunks]

    # ---------- INGEST SINGLE PDF ----------

    def ingest_pdf(self, pdf_path):

        reader = PdfReader(pdf_path)
        source = os.path.basename(pdf_path)

        texts = []
        metadatas = []
        ids = []

        # Parallel page extraction
        with ThreadPoolExecutor(max_workers=8) as executor:
            results = executor.map(
                self._process_page,
                enumerate(reader.pages)
            )

        for page_chunks in results:
            for chunk, page_num in page_chunks:

                doc_id = f"{source}_{page_num}_{int(datetime.utcnow().timestamp())}"

                texts.append(chunk)
                metadatas.append({
                    "source": source,
                    "page": page_num
                })
                ids.append(doc_id)

        # Batch vector insert
        BATCH_SIZE = 128

        for i in range(0, len(texts), BATCH_SIZE):
            self.vectorstore.add_texts(
                texts=texts[i:i+BATCH_SIZE],
                metadatas=metadatas[i:i+BATCH_SIZE],
                ids=ids[i:i+BATCH_SIZE]
            )

        # Save metadata
        session = SessionLocal()

        for doc_id, meta in zip(ids, metadatas):
            session.add(
                Chunk(
                    chroma_id=doc_id,
                    source=meta["source"],
                    page=meta["page"]
                )
            )

        session.commit()
        session.close()

        return len(texts)

    # ---------- MULTI-PDF INGEST ----------

    def ingest_folder(self, folder_path):

        total_chunks = 0

        for file in os.listdir(folder_path):

            if file.endswith(".pdf"):
                pdf_path = os.path.join(folder_path, file)
                total_chunks += self.ingest_pdf(pdf_path)

        return total_chunks
