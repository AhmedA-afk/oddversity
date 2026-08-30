---
title: "Relevance Filtering in Depth"
track: "context-engineering"
status: live
summary: "Top-k alone misses redundancy and task-conditioning — three sharper filters and how they compound."
duration: "9 min read"
---

Top-k retrieval answers one question — "which candidates score highest against the query?" — and treats that as the whole filtering problem. It isn't. A naive top-8 can hand you three near-duplicate chunks, two chunks that are relevant to the topic but useless for the specific task, and one that's exactly what you needed sitting at rank 6. This is the deferred rigor behind [Relevance Filtering](/learn/context-engineering/relevance-filtering): the mechanics of the three filters that actually separate a good context from a merely on-topic one.

## Optional depth: who needs this

If your retrieval set is small (under ~5 candidates) and your corpus has little redundancy, top-k with a similarity floor is probably enough — skip to [what to include vs. what to cut](/learn/context-engineering/what-to-include-vs-what-to-cut) for the simpler heuristic. This lesson is for pipelines where retrieval returns overlapping or task-mismatched candidates often enough that top-k is visibly leaving quality on the table.

## Filter 1: similarity threshold, not just similarity rank

Top-k keeps a fixed count regardless of how good the candidates actually are. If your corpus has one great match and nine mediocre ones, top-8 stuffs in eight things, most of which shouldn't be there; if it has fifteen great matches, top-8 arbitrarily throws away seven good ones.

A threshold-based filter inverts this: fix a minimum similarity score (say, cosine similarity ≥ 0.6, tuned against your own eval set — this number is illustrative, not a universal constant) and keep everything that clears it, up to a hard cap that protects your budget. This makes candidate count a function of match quality, not a fixed slot count. The tradeoff: a threshold needs calibration per embedding model and per corpus, because similarity scores aren't comparable across different embedding spaces — a 0.6 in one model's cosine-similarity distribution might be a strong match, and a mediocre one in another's.

```python
def filter_by_threshold(candidates, min_score=0.6, max_keep=6):
    passing = [c for c in candidates if c.score >= min_score]
    passing.sort(key=lambda c: c.score, reverse=True)
    return passing[:max_keep]
```

## Filter 2: redundancy

Similarity search often returns several chunks that are near-paraphrases of each other — the same policy restated in a FAQ, a help doc, and an onboarding email. Each individually clears the relevance bar; together they burn three times the tokens for one idea's worth of information, and they push out something that would have added a *second* idea.

The fix is a redundancy pass after relevance scoring: for each pair of candidates that both cleared the threshold, compute a similarity score between the candidates themselves (not to the query — to each other), and drop the lower-ranked one of any pair that's too close.

```python
def drop_near_duplicates(candidates, sim_fn, dup_threshold=0.92):
    kept = []
    for c in candidates:  # already sorted by relevance, best first
        if not any(sim_fn(c.text, k.text) >= dup_threshold for k in kept):
            kept.append(c)
    return kept
```

Concretely: say a naive top-8 for "what's your cancellation policy" returns three chunks — the cancellation policy page, an FAQ entry restating the same 30-day window in different words, and a support macro that quotes the FAQ entry verbatim. All three clear the similarity floor. A redundancy pass computing pairwise text similarity finds the FAQ entry and the macro are a ~0.95 match to each other, keeps the higher-relevance one, and drops the other — freeing roughly a chunk's worth of budget for something that actually adds new information, like the refund-timing chunk that was sitting at rank 6 and would otherwise never have made the cut.

## Filter 3: task-conditioned usefulness

Similarity to the query is not the same as usefulness for the task. A chunk can be topically on-point and still useless: a coding agent asked to fix a bug doesn't need the *marketing description* of the feature it's debugging, even if that description embeds close to the query about the feature. A support agent drafting a refund reply doesn't need the *internal escalation SLA* for refunds, even though it's a near-perfect semantic match to "refund" — that document answers a different question than the one being asked.

Task-conditioning means scoring relevance against the task, not just the query string:

- **Document-type rules** — a coding task excludes marketing/legal doc types outright, regardless of score, the way [metadata filtering](/learn/rag/chunking-strategies-for-documents) narrows the candidate pool before similarity even runs.
- **Role-appropriate scope** — a customer-facing agent shouldn't retrieve internal-only documents into a prompt it might echo back, independent of how relevant they score.
- **A small LLM-judged usefulness pass** — for high-stakes pipelines, a cheap secondary call that asks "does this chunk help answer this specific question, yes/no" catches cases pure embedding similarity can't, at the cost of extra latency and calls.

This is also where filtering and [reranking](/learn/rag/reranking-retrieved-results) split responsibilities, covered in full in [Filtering vs. Reranking](/learn/context-engineering/filtering-vs-reranking): reranking answers "which of these is most relevant," task-conditioning answers "is this kind of content appropriate here at all," and they're not the same question.

## Compounding the three filters

Run them in this order because each one is cheaper and coarser than the next: threshold first (cut the obviously irrelevant, cheap check), then task-conditioning rules (cut the wrong-category content, still cheap), then redundancy (the most expensive pairwise check, now running over a much smaller set):

```python
def filter_pipeline(candidates, task_type, min_score=0.6, max_keep=6):
    passed = filter_by_threshold(candidates, min_score, max_keep=20)
    passed = [c for c in passed if is_task_appropriate(c, task_type)]
    passed = drop_near_duplicates(passed, sim_fn=text_similarity)
    return passed[:max_keep]
```

On the same ten-chunk example from [What to Include vs. What to Cut](/learn/context-engineering/what-to-include-vs-what-to-cut): a naive top-8 by similarity alone would have kept both the direct refund-policy chunk and its near-duplicate FAQ restatement, plus the warranty-terms chunk (topically adjacent but not task-appropriate for a refund-window question) and the careers-page noise chunk that a strict threshold would have rejected outright. Running threshold → task rules → redundancy in sequence drops the careers snippet at step one, the warranty chunk at step two, and the FAQ duplicate at step three — leaving a materially smaller, cleaner set than similarity rank alone would have produced.

## The cost of getting this wrong

Every skipped filter has a distinct failure signature: skip the threshold and you pad the context with low scorers just to hit a count; skip redundancy and you pay token cost for zero new information while displacing something that would have helped; skip task-conditioning and the model gets content that's topically plausible but answers the wrong question, which is a harder failure to catch in eval because the retrieved content *looks* relevant on inspection.

**Related:** [Relevance Filtering: Deciding What Doesn't Make the Cut](/learn/context-engineering/relevance-filtering), [What to Include vs. What to Cut](/learn/context-engineering/what-to-include-vs-what-to-cut), [Filtering vs. Reranking](/learn/context-engineering/filtering-vs-reranking), [Reranking Retrieved Results](/learn/rag/reranking-retrieved-results)
