---
title: "Implementation: Corrective and Self-RAG"
track: "hallucinations"
status: live
summary: "Grade retrieved chunks before generating, re-query on a miss, and have the model check its draft against the evidence."
duration: "9 min read"
---

The [RAG pipeline you built earlier](/learn/hallucinations/rag-grounding-pipeline-impl) trusts whatever the retriever hands back. This lesson adds the check [corrective and self-RAG](/learn/rag/corrective-self-rag) is built around: grade retrieval before you generate, and don't let a bad first attempt become the final answer.

## What we're building

The same toy retriever from the previous implementation lesson, with two additions: a relevance grader that runs after retrieval and before generation, and a self-critique pass that runs after generation and before the answer ships. We'll walk a query where the first retrieval attempt is weak, watch the grader catch it, and see the corrective branch fix it.

## Setup

Continuing directly from [the RAG grounding pipeline](/learn/hallucinations/rag-grounding-pipeline-impl) — same `docs`, `bow_vector`, `cosine`, `retrieve`, and `call_llm` stub. Nothing new to install.

## Build it

### Step 1: A relevance grader

```python
RELEVANCE_THRESHOLD = 0.15

def grade_relevance(query, chunks):
    """Returns (best_score, chunks) — cheap proxy for an LLM- or
    classifier-based grader in a real system."""
    if not chunks:
        return 0.0, chunks
    q_vec = bow_vector(query)
    best = max(cosine(q_vec, bow_vector(c["text"])) for c in chunks)
    return best, chunks
```

In production this grading step is usually a small LLM call or a lightweight trained classifier judging "does this chunk address the query," not a similarity score — a low cosine score and a genuinely irrelevant chunk aren't the same thing. The threshold here is illustrative; you tune it against your own retrieval-precision numbers, not a fixed constant.

> **Why this step?** Standard RAG has no off-ramp — whatever comes back from retrieval goes straight into the prompt. Grading gives the pipeline a decision point instead of an assumption.

### Step 2: The corrective branch

```python
def rewrite_query(query):
    # In production: an LLM call that generalizes or rephrases the
    # query. Kept simple here to stay dependency-free.
    return query.replace("processing fee", "fee").replace("digital", "")

def retrieve_with_correction(query, docs, k=2):
    chunks = retrieve(query, docs, k=k)
    score, chunks = grade_relevance(query, chunks)

    if score >= RELEVANCE_THRESHOLD:
        return chunks, "correct"

    # Incorrect or ambiguous: try a rewritten query before giving up.
    retried = retrieve(rewrite_query(query), docs, k=k)
    retried_score, retried = grade_relevance(query, retried)
    if retried_score >= RELEVANCE_THRESHOLD:
        return retried, "corrected"

    return [], "no_evidence"
```

> **Why this step?** This mirrors the three-way branch from [corrective and self-RAG](/learn/rag/corrective-self-rag) — correct, incorrect, ambiguous — collapsed to what's practical without a live web-search fallback: accept, retry with a reformulated query, or admit defeat and let abstention take over.

### Step 3: Self-critique against the evidence

```python
def self_critique(answer, chunks):
    """Checks the draft answer's cited claims against the chunks it
    cited. A real system uses NLI entailment or an LLM judge here —
    see nli-entailment-grounding-check-impl for the full version."""
    cited_ids = set(re.findall(r"\[(\w+)\]", answer))
    available_ids = {c["id"] for c in chunks}
    unsupported = cited_ids - available_ids
    return len(unsupported) == 0, unsupported

def answer_with_self_rag(query, docs, k=2):
    chunks, status = retrieve_with_correction(query, docs, k=k)
    if status == "no_evidence":
        return "I don't have enough information to answer that."

    prompt = build_prompt(query, chunks)
    draft = call_llm(prompt)
    ok, bad_citations = self_critique(draft, chunks)
    if not ok:
        return "I don't have enough information to answer that."
    return draft
```

> **Why this step?** This is a cheap stand-in for the "ISSUP" reflection Self-RAG's trained model produces natively — checking that the draft didn't cite a chunk it was never given. It won't catch case 4 from [why RAG still hallucinates](/learn/hallucinations/why-rag-still-hallucinates) (a real citation next to an unsupported claim); that needs the full [citation verification loop](/learn/hallucinations/citation-verification-loop).

## Run it

Query: `"What's the digital processing fee?"` against the same two-document corpus from the previous lesson. Suppose the bag-of-words retriever, weighted by the unusual phrasing, scores both documents too close together and `retrieve` returns `doc2` (physical merchandise) as the top hit — a bad retrieval, exactly the failure mode from [why RAG still hallucinates](/learn/hallucinations/why-rag-still-hallucinates).

`grade_relevance` scores this below `RELEVANCE_THRESHOLD` because `doc2`'s vocabulary barely overlaps with the query. That triggers the corrective branch: `rewrite_query` strips "digital" and normalizes "processing fee" to "fee," `retrieve` runs again, and this time `doc1` — which contains "fee" prominently — scores above threshold. The pipeline now generates from the correct passage instead of silently answering from the wrong one, recovering from a retrieval miss that a standard RAG pipeline would have generated a fabricated-sounding answer from without ever noticing.

## Harden it

- Replace the string-based `rewrite_query` with an actual LLM call that reformulates based on *why* the first retrieval failed — too narrow, too broad, wrong terminology — rather than a fixed heuristic.
- Add a real fallback source (a web search API, a broader index) for the "no evidence anywhere" case, instead of going straight to abstention.
- Replace the citation-existence check in `self_critique` with real entailment checking, covered fully in the [citation verification loop](/learn/hallucinations/citation-verification-loop).

## Extend it

This loop costs at least one extra model or classifier call for grading, and a full second retrieval round on the corrective path — real latency, not free. It earns that cost where wrong answers are expensive and retrieval is genuinely noisy: open-ended queries, large or messy corpora, anything closer to agentic RAG where the system is expected to notice when it needs to look further. If your retriever is already precise, the grading step mostly adds latency for little gain — measure retrieval precision first, per [evaluating RAG quality](/learn/rag/evaluating-rag-quality), before deciding this is worth the round-trip. The [mitigation tradeoffs deep dive](/learn/hallucinations/mitigation-tradeoffs-deep-dive) covers this cost-benefit call in more general terms.

**Related:** [Corrective and Self-RAG](/learn/rag/corrective-self-rag), [Why RAG Still Hallucinates](/learn/hallucinations/why-rag-still-hallucinates), [Implementation: A RAG Grounding Pipeline](/learn/hallucinations/rag-grounding-pipeline-impl), [Citation Verification Loop](/learn/hallucinations/citation-verification-loop)
