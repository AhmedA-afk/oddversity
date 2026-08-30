---
title: "Lost in the Middle, Explained"
track: "context-engineering"
status: live
summary: "The U-shaped recall curve isn't folklore — it follows from how causal attention weights early and recent tokens."
duration: "7 min read"
---

If a model's context window truly gave every token equal consideration, position wouldn't matter — a fact at token 50 and a fact at token 50,000 would be equally retrievable. They aren't. This lesson grounds *why*, not just *that*, position changes recall.

## What it is

"Lost in the middle" names a specific, repeatable shape: plot answer accuracy against where the answer-bearing passage sits in a long context, and you get a U — high near the start, high near the end, lower in between. It shows up across retrieval-style question answering, multi-document reasoning, and long conversation histories, and it shows up even in models marketed on huge context windows. A bigger window changes how deep the dip can get and how wide the middle is, not whether the shape exists at all — see [Lost in the Middle: Why Position Beats Presence](/learn/context-engineering/lost-in-the-middle) for the broader picture and [Reproducing Lost in the Middle Yourself](/learn/context-engineering/reproducing-lost-in-the-middle) if you want to measure it on your own setup.

## The mental model

Picture the model generating its answer token by token, at the very end of the sequence. To use a fact, the model's attention mechanism has to route information from wherever that fact sits back to the position where it's generating. Two positions get privileged treatment for structural reasons:

- **The start** gets attended to disproportionately because early tokens are visible to *every* later token — a causal (left-to-right) attention mask means position 1 is in every subsequent token's attention window, so patterns anchored early get reinforced repeatedly across the whole sequence.
- **The end** gets privileged because it's *closest* to the generation step. Attention over recent tokens doesn't have to be routed as far, and recent content is what's most immediately "in mind" when the model commits to its next token.

Content in the middle has neither advantage: it isn't seen by as many downstream tokens as the earliest content, and it isn't close to generation the way the tail is. It's not invisible — the model does process it — it's just structurally less reinforced than either edge.

## Why it works this way

This isn't a training bug that a bigger model fixes; it's a consequence of how causal self-attention distributes information. Every layer of attention lets a token look back at everything before it, but *how much* weight it assigns to each prior position is learned, and training data has a real skew toward the idea that important information tends to appear near the start (topic sentences, headers, instructions) or right before a response (the most recent turn in a conversation, the last line before an answer). The model isn't applying a rule that says "ignore the middle" — it's applying learned attention patterns that happen to favor the positions where important content statistically tends to live, and mid-context retrieval passages don't match that learned prior as strongly.

This is also why the effect gets worse with more distractors around the target, not just more raw length: each additional plausible-looking passage is competing for the same limited attention budget, and a middle position with fifteen distractors around it has to fight harder for weight than a middle position with two. See [Signal-to-Noise in the Window](/learn/context-engineering/signal-to-noise-in-context) for the mechanism behind why more competing content hurts even when nothing overflows the window.

## A concrete example (shown)

Say you build a 4,000-token context from eight retrieved chunks, and the one chunk with the actual answer to the user's question is chunk 4 — dead center. Compare three placements of that same chunk, context length held constant:

| Position of the answer chunk | Rough recall behavior you'd expect |
|---|---|
| Position 1 (first of eight) | High — reinforced by every later token attending back to it |
| Position 4 (middle of eight) | Lower — competing with three chunks before and four after it for weight |
| Position 8 (last of eight) | High — closest to generation |

The content of chunk 4 never changed across these three arrangements. What changed is purely where it sits relative to the start and the point of generation — which is the entire argument for [Ordering Context for Attention](/learn/context-engineering/ordering-context-for-attention): if you control assembly order, the placement decision is worth as much attention as the filtering decision.

## Where it shows up

Any pipeline that concatenates multiple sources into one prompt is exposed: RAG systems stacking retrieved chunks, agents replaying a long tool-call history, and multi-turn conversations where an early system instruction competes with everything said since — see [Recency and Primacy Effects](/learn/context-engineering/recency-and-primacy-effects) for how this plays out specifically across conversation turns rather than static documents.

## Watch out for

- **Assuming a bigger context window fixes it.** A larger window can widen the "safe" zone at the edges, but it doesn't remove the dip — measure at the lengths you actually run, per [Reproducing Lost in the Middle Yourself](/learn/context-engineering/reproducing-lost-in-the-middle).
- **Blaming the retriever when the retriever was right.** A pipeline that retrieves the correct chunk but places it at position 5 of 9 can look like a retrieval failure in an eval when it's actually a placement failure — check ordering before you re-tune retrieval.
- **Fixing this by cutting nothing and hoping ordering alone saves you.** Ordering helps, but it works better alongside filtering, not instead of it — a shorter, cleaner context has a shallower dip to begin with.

## Where next

[Ordering Context for Attention](/learn/context-engineering/ordering-context-for-attention) turns this into an actual assembly algorithm — where to put what. [Reproducing Lost in the Middle Yourself](/learn/context-engineering/reproducing-lost-in-the-middle) walks the experiment that generates the U-curve directly, so you're not taking the shape on faith.

**Related:** [Lost in the Middle: Why Position Beats Presence](/learn/context-engineering/lost-in-the-middle), [Signal-to-Noise in the Window](/learn/context-engineering/signal-to-noise-in-context), [Recency and Primacy Effects](/learn/context-engineering/recency-and-primacy-effects), [Ordering Context for Attention](/learn/context-engineering/ordering-context-for-attention)
