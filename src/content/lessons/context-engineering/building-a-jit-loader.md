---
title: "Building a Just-in-Time Loader"
track: "context-engineering"
status: live
summary: "A working index-plus-hydrate loader with a fetch_full(id) tool and a token budget guard, wired into a minimal agent loop."
duration: "8 min read"
---

The pattern from [The Just-in-Time Loading Pattern](/learn/context-engineering/just-in-time-context-loading-pattern) is easy to describe and easy to get slightly wrong in code — usually by forgetting the budget guard until an agent has already hydrated the whole corpus one document at a time. This lesson builds the whole thing, guard included.

## What we're building

A `JITLoader` over a small in-memory document store, exposing two things to an agent: a permanently visible index of summaries, and a `fetch_full(doc_id)` tool that hydrates one document's full text into a running total — capped by a token budget that refuses further fetches once it's exhausted. Then a minimal agent loop that uses it, and a token comparison against loading everything eagerly.

## Setup

Standard library only. We'll approximate token counts with a simple word-count-based estimator — good enough to demonstrate the mechanism; swap in a real tokenizer (see [Counting Tokens in Practice](/learn/context-engineering/counting-tokens-in-practice)) for production use.

## Build it

### Step 1: The document store and a cheap token estimator

```python
from dataclasses import dataclass

@dataclass
class Document:
    doc_id: str
    title: str
    summary: str      # ~1 sentence, always in context
    full_text: str     # hydrated only on demand

def estimate_tokens(text: str) -> int:
    # Rough heuristic: ~1.3 tokens per word. Good enough for budgeting demos;
    # see Counting Tokens in Practice for a real tokenizer-based count.
    return int(len(text.split()) * 1.3)

CORPUS = [
    Document("d1", "Refund Policy", "How and when refunds are issued.",
             "Full refund policy text... " * 40),
    Document("d2", "Shipping Delays", "What to tell customers about late shipments.",
             "Full shipping delay procedure... " * 55),
    Document("d3", "Account Deletion", "Steps to delete a customer account.",
             "Full account deletion steps... " * 30),
    # imagine 200 more of these
]
```

> **Why this step?** `summary` and `full_text` are deliberately separate fields — the index is built entirely from `summary`, so its cost never scales with document length. This is the same separation [Reference by Pointer](/learn/context-engineering/reference-by-pointer-not-value) argues for generally: the thing that's always in context is small on purpose.

### Step 2: The loader — index eagerly, hydrate with a budget guard

```python
class BudgetExceededError(Exception):
    pass

class JITLoader:
    def __init__(self, corpus: list[Document], hydrate_budget: int):
        self.corpus = {d.doc_id: d for d in corpus}
        self.hydrate_budget = hydrate_budget
        self.tokens_spent_hydrating = 0
        self.hydrated: dict[str, str] = {}

    def index(self) -> str:
        lines = [f"- {d.doc_id}: {d.title} — {d.summary}" for d in self.corpus.values()]
        return "\n".join(lines)

    def fetch_full(self, doc_id: str) -> str:
        if doc_id in self.hydrated:
            return self.hydrated[doc_id]  # already paid for; don't pay twice

        doc = self.corpus.get(doc_id)
        if doc is None:
            return f"[error: no document with id '{doc_id}']"

        cost = estimate_tokens(doc.full_text)
        if self.tokens_spent_hydrating + cost > self.hydrate_budget:
            raise BudgetExceededError(
                f"fetching '{doc_id}' ({cost} tok) would exceed the "
                f"{self.hydrate_budget}-token hydration budget "
                f"({self.tokens_spent_hydrating} already spent)"
            )

        self.tokens_spent_hydrating += cost
        self.hydrated[doc_id] = doc.full_text
        return doc.full_text
```

> **Why this step?** The budget check happens *before* the hydration is committed — fail before spending, not after, the same discipline [What a Token Budget Is](/learn/context-engineering/what-a-token-budget-is) argues for generally. Caching in `self.hydrated` matters just as much: without it, a model that references the same document twice in one task pays for it twice, silently doubling cost for zero benefit.

### Step 3: A minimal agent loop that decides what to fetch

```python
def run_agent(loader: JITLoader, task: str, doc_ids_the_model_wants: list[str]) -> dict:
    # In a real system, doc_ids_the_model_wants comes from the model choosing
    # tool calls turn by turn based on the index and what it's read so far.
    # Here we simulate that decision explicitly to keep the example runnable.
    context = f"TASK: {task}\n\nINDEX:\n{loader.index()}\n\n"
    fetched = []
    for doc_id in doc_ids_the_model_wants:
        try:
            content = loader.fetch_full(doc_id)
            context += f"\n--- {doc_id} ---\n{content}\n"
            fetched.append(doc_id)
        except BudgetExceededError as e:
            context += f"\n[skipped {doc_id}: {e}]\n"
            break
    return {
        "context": context,
        "fetched": fetched,
        "hydration_tokens_spent": loader.tokens_spent_hydrating,
    }
```

> **Why this step?** The loop stops cleanly on `BudgetExceededError` instead of crashing the whole task — a real agent would report the skip to the model and let it decide whether to proceed with what it has, rather than losing all prior progress over one over-budget fetch.

## Run it

```python
loader = JITLoader(CORPUS, hydrate_budget=150)

result = run_agent(
    loader,
    task="A customer wants to delete their account after a shipping delay.",
    doc_ids_the_model_wants=["d3", "d2"],  # the two relevant docs, chosen from the index
)

print(result["fetched"])                  # ['d3', 'd2']
print(result["hydration_tokens_spent"])   # sum of d3 + d2's estimated tokens, well under 150
```

Compare against loading everything eagerly:

```python
def eager_total_tokens(corpus: list[Document]) -> int:
    return sum(estimate_tokens(d.full_text) for d in corpus)

print(eager_total_tokens(CORPUS))          # every document's full text, unconditionally
print(result["hydration_tokens_spent"])    # only d3 and d2
```

With three documents this comparison is illustrative rather than dramatic — but the ratio is the point, not the absolute numbers: eager cost scales with the *whole corpus*, JIT cost scales with *what the task actually touched*. At 200 documents where a task touches two, that ratio is what makes JIT loading worth the extra round-trips.

## Harden it

- **Budget the whole context, not just hydration.** This example only guards the hydrated-content budget. A production loader should account for the index size and the running conversation too — see [Setting Per-Segment Budgets](/learn/context-engineering/setting-per-segment-budgets) for splitting a single total budget across index, hydration, and history.
- **Make the index itself informative enough to route on.** If two documents have near-identical summaries, the model can't choose well between them from the index alone — a bad index defeats JIT the same way a bad retriever defeats RAG.
- **Log every `fetch_full` call.** When a task's hydration cost balloons unexpectedly, you want a record of which document triggered the overage, not just the final total — this is the kind of thing [Context Observability and Token Accounting](/learn/context-engineering/context-observability-and-token-accounting) is built around.

## Extend it

Swap the `doc_ids_the_model_wants` simulation for a real tool-calling loop where the model sees `loader.index()` in its system context and calls `fetch_full` as an actual tool, deciding turn by turn based on what it's read. Add a rerank step before hydration so the model chooses from a shortlist rather than the full index — that's exactly the shape [A Retrieve-Then-Filter Pipeline](/learn/context-engineering/retrieving-then-filtering-pipeline) builds next, with reranking and budget-filtering as explicit pipeline stages instead of an implicit model decision.

**Related:** [The Just-in-Time Loading Pattern](/learn/context-engineering/just-in-time-context-loading-pattern) · [Reference by Pointer](/learn/context-engineering/reference-by-pointer-not-value) · [Setting Per-Segment Budgets](/learn/context-engineering/setting-per-segment-budgets) · [A Retrieve-Then-Filter Pipeline](/learn/context-engineering/retrieving-then-filtering-pipeline) · [Context Observability and Token Accounting](/learn/context-engineering/context-observability-and-token-accounting)
