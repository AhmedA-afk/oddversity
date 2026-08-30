---
title: "The Lost-in-the-Middle Effect"
track: "llm-foundations"
status: live
summary: "Attention across a long context isn't flat — start and end get retrieved more reliably than the middle, for three separate, stackable reasons."
duration: "9 min read"
---

*Optional depth: [context window mechanics and limits](/learn/llm-foundations/context-window-mechanics-and-limits) covers what determines whether content fits in the window at all. This lesson is about a separate, subtler failure — content that fits comfortably and still doesn't get used well.*

A context window is not a uniform reading surface. Put the fact a question depends on at the start or the end of a long prompt and a model finds it reliably; bury the identical fact in the middle of the same prompt and retrieval measurably degrades. This is the lost-in-the-middle effect, and it has a mechanism, not just a name.

## The shape of the effect

Picture a long document — say, several thousand tokens of retrieved passages — with one specific fact planted at a controlled position, and a question that requires that fact to answer correctly. Vary only where the fact sits (start, 25%, middle, 75%, end) and hold everything else constant. The recall-versus-position curve this produces is U-shaped, not flat and not monotonically declining:

| Fact position in context | Illustrative relative recall (shape only — not measured data) |
|---|---|
| Very start | High |
| ~25% through | Moderate |
| Middle | Lowest |
| ~75% through | Moderate |
| Very end | High |

Two things are worth noticing about that shape before getting into why it happens. First, it's genuinely a *U*, not a ramp — both ends do well, which rules out "the model just prefers recent information" as the whole story, since the start of a long context is about as far from "recent" (from the generation point's perspective) as content can be. Second, the dip is a real degradation relative to the same fact placed at either edge, not a binary failure — a fact in the middle is still sometimes retrieved, just less reliably than the identical fact would be at the start or end.

## Mechanism one: attention sinks give the start a structural anchor

Every token attends to the first few tokens of a sequence by virtue of the causal mask alone — they're visible to every later position, no exceptions. Empirically, transformer attention heads tend to allocate a disproportionate share of attention weight to these earliest tokens regardless of their actual content, a pattern often called an "attention sink." One explanation: softmax always has to distribute a full unit of probability mass across the tokens it's allowed to see, even when none of them are a strong semantic match for the current query — and the first tokens, being visible from every position in the sequence, become a stable, low-cost place to park that leftover mass across many heads and layers. The practical effect is that content near the very start of a context tends to receive attention that has little to do with whether it's actually relevant to the current step — it's structurally favored, not just semantically favored.

## Mechanism two: positional schemes bias toward recency

[RoPE](/learn/llm-foundations/rotary-position-embeddings) and [ALiBi](/learn/llm-foundations/sinusoidal-vs-learned-vs-rope-vs-alibi) both encode *relative* distance between tokens, and both build in an implicit or explicit preference for closer pairs over distant ones — ALiBi does this directly, subtracting a penalty proportional to distance from every attention score before softmax; RoPE's rotational encoding produces a similar effect indirectly, with the expected alignment between query and key vectors decaying as their distance grows for many of the rotation frequencies involved. Either way, a token far from the current generation position starts out at a structural disadvantage in the attention competition, purely from how far away it sits — independent of how relevant its content actually is.

This mechanism alone would predict a straight decline with distance, favoring only the *end* of a long context (since generation happens at the end, closer tokens there are more recent). It doesn't by itself explain why the *start* also does well — that's mechanism one's contribution, stacking on top of this one rather than replacing it.

## Mechanism three: training-length distributions leave the true middle under-practiced

Most training documents are shorter than a model's maximum supported context length, and within typical documents, the information a reader needs is disproportionately near the beginning (introductions, headers, topic sentences) or the end (conclusions, summaries) — that's simply how humans write. A model trained on that natural distribution of text sees comparatively few examples where the single fact that matters for a later prediction is buried deep in the interior of a very long, otherwise-irrelevant span. There's less gradient signal, over the course of training, specifically shaping "retrieve precisely from far-interior positions of long sequences" compared to "retrieve from the start or end" — and behavior a model has practiced less is behavior it does less reliably at inference time. This connects directly to why context extrapolation is hard in the first place, covered in [context extrapolation and RoPE scaling](/learn/llm-foundations/context-extrapolation-and-rope-scaling): a position range a model saw rarely during training is a position range it handles rarely well, whether the question is "can it attend there at all" or "does it attend there accurately."

## Why the three mechanisms stack into a U, not a ramp

Mechanism one (attention sinks) pulls reliability up specifically at the start, independent of recency. Mechanism two (positional decay) pulls reliability up at the end, specifically because it's recent. Mechanism three (training-length distribution) reinforces both, since real documents concentrate important information at exactly those two positions and a model has had the most practice retrieving from precisely there. The middle benefits from none of the three: it isn't the structurally-favored start, it isn't the recency-favored end, and it's the position range with the least training practice behind it. None of these three needs to be large on its own — they compound.

## Implications for prompt placement

If a fact, instruction, or retrieved passage genuinely matters, don't place it in the arithmetic middle of a long prompt and trust the model to find it as reliably as it would at an edge. Concretely:

- **Put the most decision-critical instructions at the very start or very end of a long system prompt**, not sandwiched between less important context.
- **In RAG pipelines, rerank retrieved passages so the most relevant ones land first or last**, not wherever similarity search happened to rank them — a passage the retriever correctly scored as most relevant still loses some of that advantage if it ends up positioned in the middle of the assembled context.
- **For long documents where one fact matters most, consider stating it twice** — once near the top as a preview or summary, once in its natural position — rather than relying on a single placement in an unfavorable spot.
- **Don't treat "it's inside the context window" as equivalent to "the model will use it well."** [Context window mechanics and limits](/learn/llm-foundations/context-window-mechanics-and-limits) covers what determines whether something fits; this effect governs something different — how reliably the model actually draws on what fits.

## The one thing this doesn't mean

This isn't evidence that middle-positioned content is *invisible* — it's evidence of a reliability gradient, not a hard cutoff. A single, extremely salient fact can still be retrieved from the middle of a long context; what degrades is the aggregate reliability across many trials and many kinds of queries, which is exactly why it shows up as a curve in careful evaluation rather than as an outright failure anyone would immediately notice from a handful of casual tests.

**Related:** [Context Window Mechanics and Limits](/learn/llm-foundations/context-window-mechanics-and-limits) · [Context Window Mechanics](/learn/llm-foundations/context-window-mechanics) · [Rotary Position Embeddings](/learn/llm-foundations/rotary-position-embeddings) · [Sinusoidal vs Learned vs RoPE vs ALiBi](/learn/llm-foundations/sinusoidal-vs-learned-vs-rope-vs-alibi) · [Context Extrapolation and RoPE Scaling](/learn/llm-foundations/context-extrapolation-and-rope-scaling) · [In-Context Learning Mechanics](/learn/llm-foundations/in-context-learning-mechanics)
