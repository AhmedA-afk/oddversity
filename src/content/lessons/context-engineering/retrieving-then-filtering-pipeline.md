---
title: "A Retrieve-Then-Filter Pipeline"
track: "context-engineering"
status: live
summary: "Retrieve, rerank, budget-filter, inject — traced end to end on one support ticket, showing exactly what each stage drops."
duration: "8 min read"
---

Retrieval isn't one step, it's four, and most retrieval bugs live in the gap between "the right chunk was retrieved" and "the right chunk survived to the prompt." This lesson traces one query through all four stages so you can see exactly where content gets dropped and why.

## The setup

A support bot has a knowledge base of 6,000 articles, already chunked per [Chunking Strategies for Documents](/learn/rag/chunking-strategies-for-documents). A customer sends:

> "My order shipped 9 days ago and tracking still says 'label created.' I want a refund if it doesn't move in 2 days."

The pipeline has a hard **token budget of 800 tokens** for injected context (this bot's system prompt and conversation history already eat most of the window). The knowledge base holds articles on shipping delays, refund policy, label-creation delays specifically, and dozens of unrelated topics (password resets, billing disputes, account deletion).

## Step by step

### Step 1: Retrieve — cast a wide net

The query is embedded and compared against the chunk index; the top 10 chunks by similarity come back:

```text
1. "label created" tracking status explained ............ sim 0.89
2. Shipping delay escalation procedure .................. sim 0.87
3. Refund eligibility: undelivered orders ............... sim 0.85
4. Standard shipping timeframes by region ............... sim 0.81
5. How carriers update tracking statuses ................ sim 0.79
6. Refund policy: general terms ......................... sim 0.76
7. Order cancellation before shipment .................... sim 0.74
8. Carrier contact information ........................... sim 0.71
9. Refund policy: digital goods (non-physical) .......... sim 0.68
10. Account deletion and data retention .................. sim 0.61
```

> **Why this step?** Retrieval's job is recall, not precision — cast wide enough that the right chunks are *somewhere* in the set, even if they're mixed with near-misses. Ten candidates at this stage cost nothing yet; nothing has been injected into the prompt.

### Step 2: Rerank — reorder by actual relevance to this query

A cross-encoder reranker, per [Reranking Retrieved Results](/learn/rag/reranking-retrieved-results), scores each candidate against the full query text (not just the embedding) and reorders:

```text
1. "label created" tracking status explained ............ rerank 0.94
2. Refund eligibility: undelivered orders ............... rerank 0.91
3. Shipping delay escalation procedure .................. rerank 0.88
4. Refund policy: general terms ......................... rerank 0.55
5. Standard shipping timeframes by region ............... rerank 0.52
6. Order cancellation before shipment .................... rerank 0.31
7. How carriers update tracking statuses ................ rerank 0.29
8. Refund policy: digital goods (non-physical) .......... rerank 0.18
9. Carrier contact information ........................... rerank 0.14
10. Account deletion and data retention .................. rerank 0.03
```

> **Why this step?** Embedding similarity conflates "about the same topic" with "answers this specific question." Chunk 6 ("Order cancellation before shipment") was topically close enough to rank #7 on similarity, but reranking correctly buries it — this order hasn't shipped yet, it's stuck, which is a different situation entirely. The reranker sees the query and candidate together and can make that distinction; the embedding step, comparing fixed vectors, couldn't.

### Step 3: Budget-filter — keep what fits, in reranked order

Each candidate chunk has a token cost. The filter walks the reranked list top-down and keeps adding until the 800-token budget is spent:

```text
chunk                                          tokens   running total
"label created" tracking status explained ...... 210 ......... 210
Refund eligibility: undelivered orders ......... 240 ......... 450
Shipping delay escalation procedure ............ 310 ......... 760
Refund policy: general terms ................... 190 ......... [CUT — 950 > 800]
```

```python
def budget_filter(reranked: list[dict], budget: int) -> list[dict]:
    kept, spent = [], 0
    for chunk in reranked:  # already sorted by rerank score, descending
        if spent + chunk["tokens"] > budget:
            continue  # skip this one, but keep checking shorter chunks below it
        kept.append(chunk)
        spent += chunk["tokens"]
    return kept
```

> **Why this step?** Notice the filter doesn't just stop at the first chunk that doesn't fit — it keeps scanning, so a short, lower-ranked chunk further down the list could still slip in under budget even after a bigger one got cut. Here nothing shorter than "Refund policy: general terms" scored high enough to matter, so the top 3 chunks (760 tokens) are what survive. Rank 4 through 10 are dropped entirely — not summarized, not truncated, just excluded from this call.

### Step 4: Inject — assemble the final context

```text
<retrieved_context>
[1] "label created" tracking status explained: ...
[2] Refund eligibility: undelivered orders: ...
[3] Shipping delay escalation procedure: ...
</retrieved_context>

Customer message: "My order shipped 9 days ago and tracking still
says 'label created.' I want a refund if it doesn't move in 2 days."
```

> **Why this step?** The three surviving chunks, together, actually answer the customer's real question — what "label created" means, whether an undelivered order qualifies for a refund, and what the escalation path is. That coverage isn't an accident of this example; it's what steps 2 and 3 were built to produce by scoring for *this specific query* rather than the query's rough topic.

## Where it breaks (+ fix)

**Break: a short but critical chunk gets buried below the cutoff.** If "Refund eligibility: undelivered orders" had reranked at position 6 instead of 2 — plausible if it were phrased more generally — the budget filter might cut it before reaching it, even though it directly answers half the customer's question. Reranking quality is the single point of failure this pipeline is most exposed to: a filter can only keep what reranking already ranked high enough to reach.

**Fix:** don't rely on rerank score alone for chunks that are cheap. A budget-aware cutoff that weighs *tokens saved per relevance point* — not just raw rank order — lets short, moderately-ranked chunks survive even below a longer, higher-ranked one that would blow the budget. [How Retrieval and Budget Interact](/learn/context-engineering/retrieval-budget-interaction) works through exactly this dynamic-fill-to-budget approach in detail, comparing it against a fixed top-k cutoff.

**Break: the reranker itself has no signal for a query that spans two topics.** This query genuinely needs both a shipping-status chunk and a refund-policy chunk — a reranker scoring purely on "how well does this chunk answer the query" can undervalue a chunk that answers only half of a compound question. **Fix:** for known compound-intent queries, consider retrieving per sub-intent (split "is it delayed" from "do I qualify for a refund") and merging results before the budget filter, rather than trusting one reranked list to surface both halves unaided.

## Takeaways

- Retrieval and reranking answer different questions — "what's topically close" versus "what actually answers this" — and conflating them is how a wrong chunk (like the cancellation-before-shipment article) nearly makes it into a support answer.
- The budget filter is not "truncate the list at position k" — walking the full reranked list and skipping only what doesn't fit keeps more of the token budget productively used.
- Every chunk that gets cut at the budget stage is a chunk that was *found* but not *used* — that gap is invisible unless you log which candidates survived each stage, which is exactly what tracing a query like this end to end is for.

**Related:** [What Is RAG and When to Use It](/learn/rag/what-is-rag-and-when-to-use-it) · [Chunking Strategies for Documents](/learn/rag/chunking-strategies-for-documents) · [How Retrieval and Budget Interact](/learn/context-engineering/retrieval-budget-interaction) · [Filtering vs Reranking](/learn/context-engineering/filtering-vs-reranking) · [Relevance Filtering](/learn/context-engineering/relevance-filtering)
