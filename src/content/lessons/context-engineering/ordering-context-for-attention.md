---
title: "Ordering Context for Attention"
track: "context-engineering"
status: live
summary: "A head-and-tail placement pass that puts decision-critical content where attention actually is, tested against random order."
duration: "8 min read"
---

Filtering decides what survives. Ordering decides whether the survivors actually get read the way you need them to. This lesson builds the pass that does the second job: given a set of context pieces you've already decided to keep, arrange them so the ones that matter most sit where attention is strongest.

## What we're building

A function that takes a list of scored context pieces (already filtered — see [What to Include vs. What to Cut](/learn/context-engineering/what-to-include-vs-what-to-cut)) and returns them reordered so the highest-value pieces sit at the head and tail of the window, and lower-value filler is pushed toward the middle — the position [Lost in the Middle, Explained](/learn/context-engineering/lost-in-the-middle-explained) shows is the weakest spot for recall. We'll test it against a fixed random order on a small multi-fact question and look at the difference.

## Setup

Assume each piece of context already has a relevance or importance score attached — output of your filtering step, not something this pass computes. The ordering pass doesn't decide what's relevant; it decides layout.

```python
from dataclasses import dataclass

@dataclass
class ContextPiece:
    id: str
    text: str
    score: float   # relevance/importance, already computed upstream
    tokens: int
```

## Build it

### Step 1: sort by importance, descending

Start from a ranked list — highest-value piece first. This ranking is the input the placement step redistributes; it is not the final order.

```python
def rank_pieces(pieces: list[ContextPiece]) -> list[ContextPiece]:
    return sorted(pieces, key=lambda p: p.score, reverse=True)
```

> **Why this step?** You can't place things by importance until you know the importance order. Everything downstream assumes `ranked[0]` is the single most decision-critical piece you have.

### Step 2: fill head and tail first, alternating

Take the ranked list and deal pieces alternately to the front and back of the final sequence — most important to the very front, second most important to the very back, third most important to just after the front, and so on. Only once you run out of "edge" slots does anything land in the middle.

```python
def head_tail_order(ranked: list[ContextPiece]) -> list[ContextPiece]:
    head, tail = [], []
    for i, piece in enumerate(ranked):
        if i % 2 == 0:
            head.append(piece)
        else:
            tail.insert(0, piece)
    return head + tail
```

> **Why this step?** This is the direct, mechanical answer to the U-shaped curve: instead of hoping randomness happens to put your best content at an edge, you force it there. Alternating between head and tail (rather than filling the whole head first) means both edges — the primacy-advantaged start and the recency-advantaged end — get some of your best material, instead of the tail being an afterthought.

### Step 3: label what landed in the middle

Anything that falls into the middle by construction is, definitionally, your lowest-ranked surviving content. That's a signal worth surfacing, not hiding — if the middle is carrying real decision-critical weight, that's a sign your filtering step let too much through.

```python
def describe_layout(ordered: list[ContextPiece]) -> dict:
    n = len(ordered)
    middle_start, middle_end = n // 3, 2 * n // 3
    return {
        "head_ids": [p.id for p in ordered[:middle_start]],
        "middle_ids": [p.id for p in ordered[middle_start:middle_end]],
        "tail_ids": [p.id for p in ordered[middle_end:]],
    }
```

> **Why this step?** Ordering isn't "fire and forget." Logging which pieces landed in the weak zone lets you catch, at build time, a case where your filter admitted eight pieces of near-equal importance — meaning five of them are about to sit in the worst-recall part of the window no matter how you shuffle them. That's a filtering problem ordering can't fully paper over; see [Relevance Filtering in Depth](/learn/context-engineering/relevance-filtering-in-depth).

## Run it

Take a multi-fact question — say, an agent needs three facts from three different retrieved documents to answer correctly: the account's plan tier (doc A), a plan-specific rate limit (doc B), and an override the user negotiated (doc C) — plus five lower-value supporting documents that add context but aren't strictly required for a correct answer.

**Fixed random order:** the eight documents land in whatever order the retriever happened to return them. Say doc C (the negotiated override — arguably the most decision-critical fact, since it overrides the default) lands at position 5 of 8, dead center. Doc A and doc B land at positions 1 and 7 — reasonably well-placed by luck.

**Head-tail ordered:** rank the three critical docs highest, run `head_tail_order`. Doc C — ranked most critical — goes to position 1. Doc A (second) goes to the very last position. Doc B (third) goes to position 2. All three of the facts the answer depends on now sit in the two positions with the best recall properties; the five supporting documents fill the middle, exactly where their lower stakes matter least.

The random order put one of three necessary facts in the worst position in the window purely by chance of retrieval order. The head-tail pass didn't get lucky — it made that outcome structurally impossible for anything ranked in your top few.

## Harden it

- **Don't alternate blindly on a tie.** If several pieces have identical or near-identical scores, break ties by something meaningful — recency of the source, or a secondary confidence score — rather than retrieval order, which is often arbitrary.
- **Cap how much goes to the tail.** The tail is also where you're about to put the current turn's instruction (see [Recency and Primacy Effects](/learn/context-engineering/recency-and-primacy-effects)) — don't let head-tail placement of retrieved content crowd out the space right before generation that the actual task instruction needs.
- **Re-run per query, not once per session.** Importance scores are query-dependent; a document that's decision-critical for one question can be filler for the next. Caching a single "good order" across turns silently breaks this.

## Extend it

Combine this with [Structured Context Injection](/learn/context-engineering/structured-context-injection) so each placed piece is also labeled and bounded — placement solves *where*, delimiting solves *how the model knows what it's looking at* once it's there. For a from-scratch measurement of how much the U-curve actually costs you at your context lengths before you decide how much ordering effort is worth it, see [Reproducing Lost in the Middle Yourself](/learn/context-engineering/reproducing-lost-in-the-middle).

**Related:** [Lost in the Middle, Explained](/learn/context-engineering/lost-in-the-middle-explained), [What to Include vs. What to Cut](/learn/context-engineering/what-to-include-vs-what-to-cut), [Recency and Primacy Effects](/learn/context-engineering/recency-and-primacy-effects), [Structured Context Injection](/learn/context-engineering/structured-context-injection)
