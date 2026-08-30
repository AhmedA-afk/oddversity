---
title: "Build a RAG pipeline over your own documents"
description: "A working retrieval pipeline in about 120 lines of Python — parse, chunk, embed, search, answer with citations — plus the four places it will quietly go wrong."
question: "How do I make an LLM answer questions about my own documents?"
level: "beginner"
duration: "35 min"
published: "2026-08-30"
tags: ["RAG", "Python", "Retrieval"]
featured: true
steps:
  - "Collect and parse the documents into plain text with their source metadata"
  - "Split each document into retrievable chunks along its own structure"
  - "Embed the chunks and store them with their metadata"
  - "Retrieve candidates for a question and inspect what came back"
  - "Assemble a grounded prompt and require citations"
  - "Check for the four standard failure modes before you trust it"
related:
  - "/learn/rag/what-is-rag-and-when-to-use-it"
  - "/learn/rag/chunking-strategies-for-documents"
  - "/learn/rag/evaluating-rag-quality"
  - "/learn/rag/grounding-answers-with-citations"
---

You have a folder of documents and you want a model to answer questions about them. The
pattern is retrieval-augmented generation: find the passages that plausibly contain the
answer, put them in the prompt, and require the model to answer only from what it was
given. Nothing about it is magic, and every part of it is inspectable — which is the
point, because most RAG systems fail in the retrieval half, not the generation half.

This builds the whole thing with a local embedding model and SQLite. No vector database,
no framework, no account. Once it works you can swap any layer out.

## What you'll have at the end

A script that answers a question about your own files and shows you the exact passages it
used. Roughly 120 lines. It is deliberately small enough to read in one sitting, because
you will need to change it.

## Step 1 — Parse, and keep the metadata

The single most common early mistake is throwing away where the text came from. Keep the
source path, the section heading, and the position from the start.

```python
# pip install pymupdf
import fitz  # PyMuPDF
from pathlib import Path

def load_documents(folder: str) -> list[dict]:
    docs = []
    for path in Path(folder).rglob("*"):
        if path.suffix.lower() == ".pdf":
            with fitz.open(path) as pdf:
                for page_no, page in enumerate(pdf, start=1):
                    text = page.get_text("text").strip()
                    if text:
                        docs.append({"source": str(path), "locator": f"p.{page_no}", "text": text})
        elif path.suffix.lower() in {".md", ".txt"}:
            text = path.read_text(encoding="utf-8", errors="ignore").strip()
            if text:
                docs.append({"source": str(path), "locator": "whole file", "text": text})
    return docs
```

`locator` is what lets you show a citation a human can actually check. A pipeline that
cannot point at a page number is not auditable, and an unauditable answer is worth very
little in a support or compliance setting.

## Step 2 — Chunk along the document's structure, not a ruler

Fixed-size character windows are the default in every quickstart and they are the default
because they are easy, not because they are good. They slice tables in half and cut
procedures mid-step. Split on structure first, then fall back to size.

```python
import re

def chunk(text: str, target_chars: int = 1400, overlap: int = 160) -> list[str]:
    # Prefer paragraph boundaries; only fall back to a hard cut when a
    # single paragraph is longer than the target.
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks, current = [], ""
    for para in paragraphs:
        if len(current) + len(para) + 2 <= target_chars:
            current = f"{current}\n\n{para}" if current else para
            continue
        if current:
            chunks.append(current)
        while len(para) > target_chars:
            cut = para.rfind(" ", 0, target_chars)
            cut = cut if cut > target_chars * 0.6 else target_chars
            chunks.append(para[:cut])
            para = para[max(0, cut - overlap):]
        current = para
    if current:
        chunks.append(current)
    return chunks
```

Overlap exists to stop a fact being severed at a boundary. It is not a quality dial — more
overlap mostly buys you near-duplicate retrieval results, not better answers.

## Step 3 — Embed and store

`sentence-transformers` runs locally and is good enough to learn on. SQLite is a real
database and will carry you further than you expect; you do not need a vector store until
your corpus stops fitting in memory.

```python
# pip install sentence-transformers numpy
import json, sqlite3
import numpy as np
from sentence_transformers import SentenceTransformer

MODEL = SentenceTransformer("all-MiniLM-L6-v2")

def build_index(docs: list[dict], db_path: str = "index.db") -> None:
    rows = []
    for doc in docs:
        for i, piece in enumerate(chunk(doc["text"])):
            rows.append({**doc, "text": piece, "chunk_no": i})

    vectors = MODEL.encode([r["text"] for r in rows], normalize_embeddings=True)

    db = sqlite3.connect(db_path)
    db.execute("DROP TABLE IF EXISTS chunks")
    db.execute(
        "CREATE TABLE chunks (id INTEGER PRIMARY KEY, source TEXT, locator TEXT,"
        " chunk_no INTEGER, text TEXT, vector BLOB)"
    )
    db.executemany(
        "INSERT INTO chunks (source, locator, chunk_no, text, vector) VALUES (?,?,?,?,?)",
        [
            (r["source"], r["locator"], r["chunk_no"], r["text"], v.astype("float32").tobytes())
            for r, v in zip(rows, vectors)
        ],
    )
    db.commit()
    print(f"indexed {len(rows)} chunks from {len(docs)} documents")
```

`normalize_embeddings=True` matters: with unit vectors, cosine similarity is just a dot
product, which keeps the search step to one line.

## Step 4 — Retrieve, and look at what comes back

```python
def search(question: str, k: int = 6, db_path: str = "index.db") -> list[dict]:
    db = sqlite3.connect(db_path)
    rows = db.execute("SELECT source, locator, text, vector FROM chunks").fetchall()
    matrix = np.vstack([np.frombuffer(r[3], dtype="float32") for r in rows])
    query = MODEL.encode([question], normalize_embeddings=True)[0]
    scores = matrix @ query
    best = np.argsort(-scores)[:k]
    return [
        {"source": rows[i][0], "locator": rows[i][1], "text": rows[i][2], "score": float(scores[i])}
        for i in best
    ]
```

Before you wire in a model, run five real questions through `search` and read the results
yourself. If the right passage is not in the top six, no amount of prompt engineering
downstream will save the answer. This is the step people skip, and it is the step that
decides whether the system works.

## Step 5 — Ground the answer, and demand citations

```python
def build_prompt(question: str, hits: list[dict]) -> str:
    context = "\n\n".join(
        f"[{i + 1}] {h['source']} ({h['locator']})\n{h['text']}" for i, h in enumerate(hits)
    )
    return (
        "Answer the question using only the numbered sources below.\n"
        "Cite the sources you used as [1], [2] and so on.\n"
        "If the sources do not contain the answer, say exactly: "
        "'The provided sources do not answer this.'\n\n"
        f"SOURCES:\n{context}\n\nQUESTION: {question}\nANSWER:"
    )
```

The explicit refusal string is doing real work. Without it the model will smooth over a
retrieval miss with something plausible, and a plausible wrong answer is worse than a
visible gap — you can monitor a refusal rate, you cannot monitor a confident fabrication.

## Step 6 — Check the four things that break

Run these before you show anyone the demo.

**Retrieval miss.** Ask a question whose answer you know is in the corpus, in wording that
does not appear in the document. If the passage does not surface, your chunks are probably
too small or too structureless. Vector search matches meaning, but it matches the meaning
of *the whole chunk*, and a chunk containing five topics has a blurry meaning.

**The exact-term miss.** Ask for a product code, an error string, or a version number.
Dense vectors are weak at rare exact tokens. The standard fix is hybrid search — run a
keyword search alongside the vector search and merge the rankings.

**Stale and duplicate sources.** Put an old copy of a document in your corpus and ask a
question it answers differently. If nothing in the pipeline prefers the current version,
your system will confidently quote last year's policy. Store a timestamp and filter or
boost on it.

**Context overflow.** Six chunks at 1,400 characters is fine. Thirty is not, and the
symptom is subtle: quality drops in the middle of the context rather than erroring. Cap
what you send and rerank instead of sending more.

## Where to take it next

Add hybrid search first — it is the highest-value single upgrade for most corpora. Then
add a reranker over the top 30 candidates. Only then consider a vector database, and only
because of scale, not quality.

Before any of that, write down five questions with their correct answers and the passage
each answer should come from. That file is your eval set, and it is the difference between
tuning and guessing.
