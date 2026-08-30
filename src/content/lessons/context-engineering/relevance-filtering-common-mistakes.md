---
title: "Selection and Ordering Mistakes"
track: "context-engineering"
status: live
summary: "Fixed top-k, undetected duplicates, dumping retrieval mid-window, and unlabeled blocks — four mistakes and their fixes."
duration: "8 min read"
---

These four show up in nearly every RAG or agent pipeline at some point, usually because each one looks completely reasonable in isolation and only fails once the pipeline meets real, messy input.

### The mistake: a fixed top-k regardless of candidate quality

**Why it's wrong.** Top-k treats "how many documents to include" as a constant, when the right number depends entirely on how many candidates actually clear a quality bar for *this* query. A query with one great match and a query with eight great matches get the same slot count, which means the first case pads the context with weak filler and the second case discards good candidates arbitrarily.

**Symptom.** Answers that are subtly wrong or padded with irrelevant tangents on narrow queries (because the pipeline forced in k documents when only 1 was actually good), alongside answers that miss a fact that was clearly retrieved but happened to rank at position k+1 on a broad query.

**Fix.** Filter by a similarity or relevance threshold with a max cap, not a fixed count — see [Relevance Filtering in Depth](/learn/context-engineering/relevance-filtering-in-depth) for the threshold-plus-cap pattern, and [What to Include vs. What to Cut](/learn/context-engineering/what-to-include-vs-what-to-cut) for the value-per-token heuristic that should decide the cap.

### The mistake: no redundancy check before insertion

**Why it's wrong.** Similarity search frequently returns several near-paraphrases of the same underlying fact — a policy page, an FAQ entry, and a support macro that all say the same thing in different words. Each clears a relevance threshold independently; nothing catches that together they're one idea's worth of information at three times the token cost.

**Symptom.** A context window that "looks" well-retrieved on inspection — every chunk is genuinely on-topic — but still underperforms, because three of its slots are functionally one slot repeated, crowding out a distinct fact that would have actually helped.

**Fix.** Run a pairwise redundancy pass after relevance scoring and drop the lower-ranked half of any near-duplicate pair, as covered in [Relevance Filtering in Depth](/learn/context-engineering/relevance-filtering-in-depth).

```python
kept = drop_near_duplicates(ranked_candidates, sim_fn=text_similarity, dup_threshold=0.92)
```

### The mistake: dumping retrieved content in raw retrieval order, mid-window

**Why it's wrong.** Whatever order a retriever returns results in — usually raw similarity rank — has no relationship to where that content should sit for the model's attention. Concatenating retrieved chunks in that order routinely buries the single best chunk at position 4 of 8, dead center, which is exactly the position [Lost in the Middle, Explained](/learn/context-engineering/lost-in-the-middle-explained) shows the model attends to worst.

**Symptom.** A pipeline that clearly retrieved the right document — you can find it in the logged candidate list — but the final answer misses or garbles the fact inside it, with no error anywhere in the retrieval step itself.

**Fix.** Add an explicit ordering pass that places the highest-value content at the head and tail of the assembled context, not wherever the retriever's internal ranking happened to put it — see [Ordering Context for Attention](/learn/context-engineering/ordering-context-for-attention) for the head-and-tail placement algorithm.

### The mistake: unlabeled, undelimited context blocks

**Why it's wrong.** Pasting several documents back-to-back with no boundary or identifier gives the model content but no scaffolding to reference it by. It can summarize the gist, but asking it to cite a specific source or distinguish one document's claim from another's becomes guesswork, because nothing in the text marks where one document ends and the next begins.

**Symptom.** Hallucinated or unverifiable citations, claims blended across two sources into one false composite statement, or a model that answers using the wrong document's content because nothing marked which was which.

**Fix.** Wrap every injected block in a labeled, bounded structure — an ID, a source name, an explicit close — per [Structured Context Injection](/learn/context-engineering/structured-context-injection-patterns), and pick a delimiter format matched to whether the content is trusted, code-assembled, or human-reviewed, per [XML vs. Markdown vs. JSON Delimiters](/learn/context-engineering/xml-vs-markdown-vs-json-delimiting).

### The mistake: a critical instruction stated once, only at the top

**Why it's wrong.** A system-prompt instruction gets a real but *relative* advantage from primacy — an advantage that shrinks as more recent content accumulates in a long session and competes for the same attention. Assuming "stated once at the start" is permanent coverage ignores that recency's pull only grows as the transcript grows, covered in full in [Recency and Primacy Effects](/learn/context-engineering/recency-and-primacy-effects).

**Symptom.** An agent reliably follows a constraint in early turns and quietly drops it deep into a long session — not because the instruction was removed from context, but because it's been structurally outweighed by everything said since.

**Fix.** Restate genuinely critical constraints near the point of generation, conditioned on relevance rather than on every single turn — see the worked comparison in [Placing Instructions So They Stick](/learn/context-engineering/placing-instructions-for-adherence).

### The mistake: filtering and reranking treated as the same step

**Why it's wrong.** Reranking answers "which candidate is more relevant than which" — a comparative, order-producing question. Filtering answers "which candidates are relevant enough to be here at all." A pipeline that only reranks will confidently sort a bad candidate set into "least bad to most bad" order and hand all of it over anyway, because reranking has no mechanism to reject a candidate outright.

**Symptom.** A well-ordered context window that's still mostly noise — the best available candidate is legitimately first, but "best available" was never good enough to include in the first place.

**Fix.** Run both steps, in the right order — rerank first for an accurate score, then apply a threshold-based cutoff on the reranked scores, not a fixed count. See [Filtering vs. Reranking](/learn/context-engineering/filtering-vs-reranking) for the full pipeline.

## Pre-flight checklist

- [ ] Inclusion is decided by a relevance/similarity threshold with a cap, not a fixed top-k count.
- [ ] A redundancy pass runs before insertion and drops near-duplicate chunks, keeping the higher-ranked one.
- [ ] Retrieved content is explicitly reordered — highest-value first or last, not left in raw retrieval order.
- [ ] Every injected block has a stable ID and an explicit boundary, in a delimiter format matched to trust level and audience.
- [ ] Critical constraints are restated near generation on long or growing sessions, not stated once and assumed permanent.
- [ ] Filtering and reranking are two distinct steps in the pipeline, run in that order, with filtering deciding admission and reranking deciding order.

**Related:** [Relevance Filtering in Depth](/learn/context-engineering/relevance-filtering-in-depth), [Lost in the Middle, Explained](/learn/context-engineering/lost-in-the-middle-explained), [Ordering Context for Attention](/learn/context-engineering/ordering-context-for-attention), [Structured Context Injection](/learn/context-engineering/structured-context-injection-patterns), [Filtering vs. Reranking](/learn/context-engineering/filtering-vs-reranking)
