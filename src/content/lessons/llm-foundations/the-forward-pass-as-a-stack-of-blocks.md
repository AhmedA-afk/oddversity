---
title: "The Forward Pass as a Stack of Identical Blocks"
track: "llm-foundations"
status: live
summary: "The architectural skeleton behind every LLM: embed, repeat one block N times, norm, unembed."
duration: "6 min read"
---

GPT-2 has 12 of them. GPT-3 has 96. A frontier model might have well over a hundred. In every case, "more layers" means the exact same block, copied and stacked — not new kinds of machinery.

## What it is

The forward pass of an LLM has a skeleton simple enough to draw on one page:

```text
tokens
  │
  ▼
embedding + positional encoding        shape: (seq_len, d_model)
  │
  ▼
┌──────────────────────┐
│  Transformer Block 1  │             shape in = shape out = (seq_len, d_model)
└──────────────────────┘
  │
  ▼
        ⋮  (N − 2 more identical blocks) ⋮
  │
  ▼
┌──────────────────────┐
│  Transformer Block N  │
└──────────────────────┘
  │
  ▼
final layer norm                        (seq_len, d_model)
  │
  ▼
unembedding  (linear → vocab_size)       (seq_len, vocab_size)
```

Everything between "embedding" and "final norm" is the same block, repeated `N` times with independently learned weights.

## The mental model

Think of it like a bucket brigade of identical workers, not a pipeline of specialists. Worker 1 doesn't do "grammar" while worker 12 does "reasoning" — every worker performs the exact same two operations (attention, then a feed-forward network), on whatever the previous worker handed them, with their own set of learned weights. Depth in a transformer is not architectural variety, it's the same transformation applied over and over, each application getting to look at a slightly more refined version of the sequence than the last.

## Why it works this way

Repetition of one block, rather than a hand-designed sequence of different modules, is what makes transformers scale so cleanly: doubling `N` just means stacking twice as many identical, well-understood pieces, with no new architecture to design. It also means whatever a single block is good at — mixing information across positions (attention) and transforming each position's representation independently (the FFN) — gets to compound: the output of block 3 is already a richer representation than raw embeddings, and block 4 gets to refine *that*, not the original tokens.

## A concrete example (shown)

A GPT-2-small-shaped model processing 5 tokens: `d_model = 768`, `N = 12` blocks. The tensor shape at the block boundary is `(5, 768)` — before block 1, after block 1, after block 6, after block 12, all identical. Only the *values* inside that fixed-shape tensor change as it passes through more blocks. This is the exact shape trace used in [the whole-game walkthrough](/learn/llm-foundations/whole-game-one-token-end-to-end) — this lesson is that walkthrough's step 4 and step 5, zoomed in.

## Where it shows up

This is why you'll see model variants described almost entirely by a handful of numbers — `n_layer`, `n_head`, `n_embd` — rather than by architectural diagrams: once you fix the block's design, a model in this family *is* those numbers. It's also the premise behind [reading a real model's config and counting its parameters](/learn/llm-foundations/reading-a-real-model-config): if every block is identical, the total parameter count is just "cost of one block, times `N`, plus embeddings."

## Watch out for

- **Assuming different layers specialize the way a human org chart would** (layer 1 = syntax, layer 12 = reasoning). There's rough truth to *early layers tending toward more local, syntactic patterns and later layers toward more abstract ones*, but it's a statistical tendency observed after training, not a design choice baked into the architecture — every block starts out capable of the same thing.
- **Confusing "a block" with "the whole model."** A block is [attention](/learn/llm-foundations/attention-mechanism-explained) plus [an FFN](/learn/llm-foundations/the-feed-forward-block) plus the residual/norm plumbing; the model is `N` of those stacked, plus the embedding and unembedding on the ends.
- **Expecting the shape to change as you go deeper.** It doesn't, until the very last unembedding step — `(seq_len, d_model)` in, `(seq_len, d_model)` out, every single block, all the way through.

## Where next

The internals of one block — what attention actually computes, why the FFN sits after it, why residual connections and layer norm are non-negotiable — start with [the transformer architecture](/learn/llm-foundations/the-transformer-architecture), then [attention, explained](/learn/llm-foundations/attention-mechanism-explained) and [the feed-forward block](/learn/llm-foundations/the-feed-forward-block). What happens after the last block — turning `(seq_len, d_model)` into logits — is [the vocabulary and the unembedding head](/learn/llm-foundations/the-vocabulary-and-the-unembedding), next in this module.

**Related:** [The Transformer Architecture](/learn/llm-foundations/the-transformer-architecture), [Residual Connections and Layer Norm](/learn/llm-foundations/residual-connections-and-layer-norm), [Reading a Real Model's Config](/learn/llm-foundations/reading-a-real-model-config)
