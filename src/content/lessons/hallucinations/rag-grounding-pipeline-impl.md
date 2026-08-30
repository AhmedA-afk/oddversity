---
title: "Implementation: A RAG Grounding Pipeline"
track: "hallucinations"
status: live
summary: "Build retrieve-then-generate end to end, with an instruction to answer only from context and cite the spans used."
duration: "9 min read"
---

Grounding fundamentals told you what grounding is supposed to do. This lesson builds the smallest version of it that actually works: retrieve, constrain the prompt to the retrieved text, generate, and check that citations exist.

## What we're building

A retrieve-then-generate pipeline over a small in-memory document set. To keep every line runnable without an API key or a vector database, the retriever is a plain bag-of-words similarity scorer instead of a real embedding model — the pattern is identical, only the similarity function changes when you swap in a real one. We'll run one query through it twice: once with a weak, unscoped prompt, once with a properly grounded one, and see the answer change from a fabricated detail to the retrieved correct one.

## Setup

Pure Python standard library — no installs needed to follow along. Two swap points are marked clearly: the retriever (`bow_vector` / `cosine`) is where you'd plug in real embeddings, and `call_llm` is where you'd plug in your actual model provider.

## Build it

### Step 1: A toy retriever

```python
import re
import math
from collections import Counter

def tokenize(text):
    return re.findall(r"[a-z0-9]+", text.lower())

def bow_vector(text):
    return Counter(tokenize(text))

def cosine(a: Counter, b: Counter) -> float:
    common = set(a) & set(b)
    numerator = sum(a[t] * b[t] for t in common)
    norm_a = math.sqrt(sum(v * v for v in a.values()))
    norm_b = math.sqrt(sum(v * v for v in b.values()))
    denom = norm_a * norm_b
    return numerator / denom if denom else 0.0

def retrieve(query, docs, k=2):
    q_vec = bow_vector(query)
    scored = [(cosine(q_vec, bow_vector(d["text"])), d) for d in docs]
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [d for score, d in scored[:k] if score > 0]
```

This is deliberately a toy — bag-of-words cosine similarity is far weaker than an embedding-based retriever and will miss paraphrases. It's here so the whole pipeline runs with no external dependency. In production, replace `bow_vector`/`cosine` with real embeddings and an approximate nearest-neighbor index; the retrieve-then-generate wiring below doesn't change.

### Step 2: The grounding prompt template

This is the part that actually does the mitigation work — not the retriever.

```python
def build_prompt(query, chunks):
    context = "\n\n".join(f"[{c['id']}] {c['text']}" for c in chunks)
    return f"""Answer the question using ONLY the information in the
documents below. Cite the document id in brackets, like [doc1], after
every claim that depends on it. If the documents do not contain the
answer, say "I don't have enough information to answer that" instead
of guessing.

Documents:
{context}

Question: {query}
Answer:"""
```

Three clauses are doing the work, and each maps to a specific failure this lesson's toy example will show:

- **"ONLY the information in the documents below"** — scopes the model away from parametric memory, not just toward the documents.
- **the citation instruction** — makes the grounding checkable, the subject of [enforcing citations](/learn/hallucinations/enforcing-citations-impl).
- **the explicit escape hatch** — without it, models tend to answer anyway even when the retrieved text doesn't cover the question; see [teaching a model to say "I don't know"](/learn/hallucinations/teaching-models-to-say-i-dont-know).

### Step 3: Wiring retrieve → prompt → generate

```python
def call_llm(prompt: str) -> str:
    # Swap point: call your actual model provider here.
    raise NotImplementedError("wire up your LLM client")

def answer_grounded(query, docs, k=2):
    chunks = retrieve(query, docs, k=k)
    if not chunks:
        return "I don't have enough information to answer that."
    prompt = build_prompt(query, chunks)
    return call_llm(prompt)
```

### Step 4: A weak baseline, for contrast

To see grounding actually change behavior, keep an ungrounded path around:

```python
def answer_ungrounded(query):
    return call_llm(f"Answer the question: {query}")
```

## Run it

A toy corpus:

```python
docs = [
    {"id": "doc1", "text": (
        "Refunds for digital subscriptions are processed within "
        "5 business days of cancellation, minus a $2 processing fee."
    )},
    {"id": "doc2", "text": (
        "Physical merchandise can be returned within 30 days of "
        "delivery for a full refund, no processing fee applies."
    )},
]

query = "What's the processing fee on a digital subscription refund?"
```

Run `answer_ungrounded(query)` and, because the model has no way to know this company's specific policy, it produces something generic and wrong — a plausible-sounding fee, or a claim that there's no fee at all, patterned off what refund policies typically look like.

Run `answer_grounded(query, docs)` instead. `retrieve` scores `doc1` far higher than `doc2` (it shares "refund," "digital," "subscription," "processing," "fee"), so the prompt only contains `doc1`. The model's task is now to read one short paragraph and report a number that's sitting right in front of it: "The processing fee is $2 [doc1]." The fabricated figure from the ungrounded run is replaced by the actual retrieved one, with a citation a human can check in one glance.

The exact wording your model produces will vary — this is illustrative of the *pattern*, not a transcript from a specific provider.

## Harden it

This minimal pipeline has two known gaps this module addresses next:

- **Bad retrieval still gets forced into an answer.** If `retrieve` had scored `doc2` instead — plausible with a weaker retriever, or an ambiguous query — the model would be grounded in the *wrong* passage and would still answer confidently. [Corrective and Self-RAG](/learn/hallucinations/corrective-rag-pattern-impl) adds a grading step before generation to catch this.
- **Citations aren't verified, only requested.** Nothing here stops the model from writing `[doc1]` next to a claim `doc1` doesn't actually support. [Enforcing citations](/learn/hallucinations/enforcing-citations-impl) and the [citation verification loop](/learn/hallucinations/citation-verification-loop) close that gap.

## Extend it

Two directions worth building next: swap the toy retriever for real embeddings and pay attention to chunk ordering and size, covered in [context engineering for grounding](/learn/hallucinations/context-engineering-for-grounding); and if the answer needs to feed another system rather than a human, wrap the output in a validated schema per [structured output decoding](/learn/hallucinations/structured-output-decoding-impl).

**Related:** [Grounding Fundamentals](/learn/hallucinations/grounding-fundamentals), [Grounding Answers with Citations](/learn/rag/grounding-answers-with-citations), [Retrieval-Augmented Mitigation](/learn/hallucinations/retrieval-augmented-mitigation), [Enforcing Citations](/learn/hallucinations/enforcing-citations-impl)
