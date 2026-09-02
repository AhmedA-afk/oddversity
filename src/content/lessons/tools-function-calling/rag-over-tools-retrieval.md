---
title: "Retrieval Over a 200-Tool Registry"
track: "tools-function-calling"
status: live
summary: "Build an embedding-and-top-k pipeline that injects only the relevant tools per call instead of sending all 200."
duration: "8 min read"
---

This builds the thing [Why More Tools Means Worse Choices](/learn/tools-function-calling/too-many-tools-confuse-models) argues for: instead of shipping every tool schema on every call, embed the catalog once and retrieve a short list per request.

## What we're building

A retrieval layer that sits between your tool registry and the API call: given the user's message, it returns the top-k most relevant tool schemas to inject into `tools`, instead of the full registry. We'll build it with a standard embedding model and an in-memory vector store — the same shape scales to a real vector database, but the mechanics are identical at any size.

## Setup

You need three things: a registry of tool definitions (name, description, JSON schema), an embedding model, and somewhere to store and search the vectors. This example uses a generic embedding API and a plain in-memory index — swap in a real vector store (pgvector, a managed index) once the registry is large enough that linear scan is the bottleneck.

```python
import numpy as np

def embed(text: str) -> np.ndarray:
    # Call your embedding model of choice; returns a fixed-length vector.
    # e.g. response = embedding_client.embed(text); return np.array(response.embedding)
    ...

class ToolIndex:
    def __init__(self):
        self.tools = []       # list of tool definition dicts
        self.vectors = None   # (n_tools, dim) array, built once

    def build(self, tool_defs: list[dict]):
        self.tools = tool_defs
        texts = [f"{t['name']}: {t['description']}" for t in tool_defs]
        self.vectors = np.stack([embed(t) for t in texts])
```

## Build it

### Embed every tool once, offline

```python
tool_index = ToolIndex()
tool_index.build(load_full_registry())  # your 200 tool definitions
```

This runs once, not per request — the whole point is to pay the embedding cost at catalog-build time (and again only when a tool is added or its description changes), not on the hot path of every user turn.

### Embed the query and retrieve top-k

```python
def retrieve_tools(index: ToolIndex, query: str, k: int = 15) -> list[dict]:
    q_vec = embed(query)
    # cosine similarity against every tool vector
    sims = index.vectors @ q_vec / (
        np.linalg.norm(index.vectors, axis=1) * np.linalg.norm(q_vec)
    )
    top_k_idx = np.argsort(-sims)[:k]
    return [index.tools[i] for i in top_k_idx]
```

> **Why this step?** This is the actual fix: the API call downstream sees `k` schemas instead of 200. `k` between 10 and 30 is a reasonable starting range — small enough to keep the schema block short, large enough that a slightly-off query still surfaces the right tool.

### Wire it into the call

```python
def call_model_with_retrieval(user_message: str, conversation: list):
    relevant_tools = retrieve_tools(tool_index, user_message, k=15)
    return call_model(
        messages=conversation + [{"role": "user", "content": user_message}],
        tools=relevant_tools,
        tool_choice={"type": "auto"},
    )
```

The rest of the tool-calling loop — parsing the call, executing it, returning results — is unchanged; see [The Tool Call Loop](/learn/tools-function-calling/the-tool-call-loop) if that part needs a refresher. Retrieval only changes what goes into `tools`.

### Fall back to keyword matching where embeddings are overkill

```python
def retrieve_tools_bm25(index: ToolIndex, query: str, k: int = 15) -> list[dict]:
    # Cruder than embeddings, but needs no embedding model or vector store —
    # good enough when tool names/descriptions are already keyword-rich.
    from rank_bm25 import BM25Okapi
    corpus = [f"{t['name']} {t['description']}".lower().split() for t in index.tools]
    bm25 = BM25Okapi(corpus)
    scores = bm25.get_scores(query.lower().split())
    top_k_idx = np.argsort(-scores)[:k]
    return [index.tools[i] for i in top_k_idx]
```

## Run it

A quick sanity check before trusting this on real traffic: run a handful of known queries through `retrieve_tools` and check the correct tool lands in the top-k.

```python
queries_and_expected = [
    ("cancel my subscription", "cancel_subscription"),
    ("what's my current bill", "get_invoice"),
    ("move my meeting to 3pm", "reschedule_event"),
]

for query, expected_name in queries_and_expected:
    retrieved = retrieve_tools(tool_index, query, k=15)
    hit = any(t["name"] == expected_name for t in retrieved)
    print(f"{'PASS' if hit else 'FAIL'}: '{query}' -> expected {expected_name}")
```

Anything that fails here is a recall miss you'll hit in production — this is the same check formalized in [Selection Accuracy at 5, 50, and 200 Tools](/learn/tools-function-calling/measuring-selection-accuracy-vs-count).

## Harden it

- **Track misses, not just hits.** Log the retrieved set alongside which tool the model actually called (or should have called) for every real request, and periodically eval recall@k against that log — the discipline is identical to [evaluating RAG quality](/learn/rag/evaluating-rag-quality).
- **Widen k or hybridize on low-confidence queries.** If the top similarity score is close to the k-th score (a flat distribution), the query is ambiguous — fall back to a larger k or blend the embedding score with BM25 rather than trusting a narrow cut.
- **Always include a small set of "pinned" tools** (things like a `search_more_tools` escape hatch, or safety-critical tools like `escalate_to_human`) regardless of similarity score, so retrieval can't accidentally hide something the agent must always be able to reach.
- **Re-embed on description changes, not on a schedule.** Stale embeddings after a tool's description is edited silently degrade retrieval — tie the re-embed step to your tool registry's deploy process.

## Extend it

- Layer this under a namespacing scheme — retrieve within a category rather than across the whole registry, once you've narrowed the domain via [Router Tools and Grouped Dispatch](/learn/tools-function-calling/tool-namespacing-and-grouping).
- Replace the in-memory `np.stack` index with a real vector store once linear scan (O(n) per query) becomes the bottleneck — the retrieval logic above doesn't change, only where the vectors live.
- Add a `search_tools(query)` meta-tool that lets the model *call* this retrieval function itself mid-conversation, instead of you always pre-retrieving before the first call — useful when the right query depends on reasoning the model has already done in-context.

**Related:** [Why More Tools Means Worse Choices](/learn/tools-function-calling/too-many-tools-confuse-models), [Tool Selection at Scale](/learn/tools-function-calling/tool-selection-at-scale), [Selection Accuracy at 5, 50, and 200 Tools](/learn/tools-function-calling/measuring-selection-accuracy-vs-count), [Router Tools and Grouped Dispatch](/learn/tools-function-calling/tool-namespacing-and-grouping)
