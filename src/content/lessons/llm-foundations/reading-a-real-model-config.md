---
title: "Reading a Real Model's Config and Counting Its Parameters"
track: "llm-foundations"
status: live
summary: "Hand-computing a real GPT-2-sized parameter count from four config numbers, layer by layer."
duration: "8 min read"
---

Every parameter in a transformer can be attributed to a handful of matrices whose sizes are set entirely by five numbers. Here's the full arithmetic, worked against a real published config.

## The setup

GPT-2-small's published configuration is four numbers and a context length:

```json
{
  "vocab_size": 50257,
  "n_ctx": 1024,
  "n_layer": 12,
  "n_head": 12,
  "n_embd": 768
}
```

Every parameter in the model can be attributed to one of three places using nothing but these five numbers: the embeddings, the attention projections, and the feed-forward network inside each of the 12 blocks (the architecture behind these is [the forward pass as a stack of blocks](/learn/llm-foundations/the-forward-pass-as-a-stack-of-blocks)).

## Step by step

### 1. Embeddings

```text
token embedding:      vocab_size × n_embd  = 50257 × 768  ≈ 38.6M
positional embedding:    n_ctx  × n_embd  =  1024 × 768  ≈  0.79M
                                                     total ≈ 39.4M
```

> **Why this step?** These two tables don't depend on depth at all — they scale with vocabulary size and context length, set once, before any transformer block runs.

### 2. Attention, per block

Each block needs four `(n_embd, n_embd)` projections — query, key, value, and the output projection that combines heads back together:

```text
4 × n_embd²  =  4 × 768²  =  4 × 589,824  ≈ 2.36M parameters per block
```

> **Why this step?** [Multi-head attention](/learn/llm-foundations/multi-head-attention) splits `n_embd` across `n_head` heads internally, but the total parameter count for Q, K, V, and the output projection doesn't care how many heads it's divided into — it's still four dense `768 × 768` matrices either way.

### 3. Feed-forward network, per block

The standard design expands to 4x the hidden size, then projects back down:

```text
up:    n_embd × (4 × n_embd)  =  768 × 3072  ≈ 2.36M
down:  (4 × n_embd) × n_embd  =  3072 × 768  ≈ 2.36M
                                       total ≈ 4.72M parameters per block
```

> **Why this step?** [The feed-forward block](/learn/llm-foundations/the-feed-forward-block) is two big matrices, not one — that 4x expansion is a deliberate design choice, and it's the single largest contributor to any one block's parameter count.

### 4. Total per block, then times 12

```text
attention (2.36M) + FFN (4.72M)  ≈ 7.08M per block
7.08M × 12 blocks               ≈ 84.9M
```

### 5. Grand total

```text
blocks (84.9M) + embeddings (39.4M)  ≈ 124.3M
```

> **Why this step?** GPT-2's published parameter count is ~124M — this back-of-envelope arithmetic lands right on it, because GPT-2 **ties** its unembedding weights to the input embedding matrix (see [the vocabulary and the unembedding head](/learn/llm-foundations/the-vocabulary-and-the-unembedding)), so there's no separate ~38.6M output projection to add.

### 6. Attribute the total

```text
FFN:         12 × 4.72M ≈ 56.6M   (~45.5%)
Attention:   12 × 2.36M ≈ 28.3M   (~22.8%)
Embeddings:            ≈ 39.4M   (~31.7%)
```

**FFN plus embeddings alone account for roughly 77% of every parameter in the model** — more than attention, despite attention getting most of the airtime in explanations of how transformers work. See [misreading parameter counts](/learn/llm-foundations/misreading-parameter-counts) for other ways this kind of estimate gets misquoted.

## Where it breaks (+ fix)

This estimate quietly assumes two things that aren't always true:

**Tied embeddings.** If a model doesn't tie its unembedding to its input embedding, add another `vocab_size × n_embd ≈ 38.6M` back in: `124.3M → ~163M`. Always check the model's config for a flag like `tie_word_embeddings` before trusting a from-scratch estimate.

**Biases ignored.** Each linear layer typically also has a small bias vector (size `n_embd` or `4 × n_embd`) — a few thousand parameters per block, utterly negligible next to the millions above, but technically missing from this count. Fine to ignore for an order-of-magnitude estimate; not fine if you're trying to match a published number to the last digit.

## Takeaways

- Four config numbers — `vocab_size`, `n_ctx`, `n_layer`, `n_head` (via `n_embd`, which `n_head` divides) — and `n_embd` are enough to hand-compute a transformer's full parameter count.
- The FFN, not attention, holds the largest share of weights inside each block — a `4x` expansion in two directions adds up fast.
- Embeddings alone can rival an entire model's worth of transformer blocks in parameter count, especially at large vocabulary sizes.
- Scaling this same arithmetic up to a 7B-parameter class model is the starting point for [counting the FLOPs of one token](/learn/llm-foundations/counting-the-flops-of-one-token), next in this module — parameter count is the `N` that lesson's compute estimate is built on.

**Related:** [The Forward Pass as a Stack of Blocks](/learn/llm-foundations/the-forward-pass-as-a-stack-of-blocks), [The Vocabulary and the Unembedding Head](/learn/llm-foundations/the-vocabulary-and-the-unembedding), [Misreading Parameter Counts](/learn/llm-foundations/misreading-parameter-counts)
