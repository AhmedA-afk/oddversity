---
title: "The Embedding Lookup Table"
track: "llm-foundations"
status: live
summary: "The embedding matrix is one giant table, one row per token — and the 'lookup' is mathematically just a one-hot matrix multiply."
duration: "6 min read"
---

[What are embeddings](/learn/llm-foundations/what-are-embeddings) covers what the resulting vectors mean geometrically. This lesson is about the object that produces them: a specific matrix, with a specific shape, doing one specific operation.

## What it is

The embedding layer is a matrix, usually called `E`, with shape `(vocab_size, d_model)` — one row for every entry in the [tokenizer's](/learn/llm-foundations/tokenization-explained) vocabulary, and each row a vector of `d_model` numbers (commonly a few thousand). A vocabulary of 100,000 tokens and a model dimension of 4,096 means `E` has 100,000 rows of 4,096 numbers each — about 410 million individual parameters, before the model has done a single layer of actual computation.

"Looking up" a token's embedding means taking its integer ID and grabbing that row. Token ID 3 gets row 3. That's the entire operation — no computation, no transformation, just indexing into a table that was built ahead of time.

## The mental model

Picture a spreadsheet with `vocab_size` rows and `d_model` columns. Every possible token gets exactly one row, assigned once when the vocabulary was built (during [BPE training](/learn/llm-foundations/build-bpe-from-scratch), the assignment of IDs to tokens is arbitrary and fixed early). The numbers filling that row aren't there yet at that point — they're what training solves for.

Tokenization decides *which row* a piece of text points to. The embedding table decides *what's in that row*. Those are two separate, sequential jobs: one is a fixed, deterministic algorithm applied at inference time; the other is a matrix of parameters shaped entirely by gradient descent.

## Why it works this way

You could imagine computing a representation for each token on the fly from its characters — a small network that reads `d-o-g` and outputs a vector. Production LLMs don't do this, and the reason is efficiency, not principle: a lookup table trades a large but *one-time* memory cost (one row per vocabulary entry, however large the vocabulary) for an essentially free runtime cost (an index operation) on every forward pass, for every token, for the entire life of the model. Computing an equivalent vector from scratch per token would be slower and would give the model no stable, per-token identity to accumulate learned associations onto across millions of training examples. A fixed table lets every occurrence of the same token ID, anywhere in a massive training corpus, contribute to shaping the exact same row.

## A concrete example (shown)

Suppose a toy vocabulary has 6 tokens and `d_model = 4`. The embedding matrix is a 6×4 array:

```python
import numpy as np

E = np.array([
    [0.10, -0.20, 0.05, 0.30],   # id 0
    [0.44,  0.12, -0.08, 0.01],  # id 1
    [-0.15, 0.33, 0.20, -0.10],  # id 2
    [0.02,  0.09, 0.41, 0.18],   # id 3
    [-0.30, -0.05, 0.12, 0.27],  # id 4
    [0.19,  0.22, -0.31, 0.06],  # id 5
])
```

Looking up token ID 3 is literally `E[3]`, giving `[0.02, 0.09, 0.41, 0.18]`. But "lookup" and "matrix multiply" are the same operation here, not just similar ones. Represent token 3 as a one-hot vector — all zeros except a 1 in position 3 — and multiply:

```python
one_hot_3 = np.array([0, 0, 0, 1, 0, 0])
one_hot_3 @ E
# array([0.02, 0.09, 0.41, 0.18])   -- identical to E[3]
```

A one-hot vector times a matrix zeros out every row except the one matching the 1, then sums — which, with only one nonzero entry, just returns that row unchanged. This equivalence isn't a coincidence used only for teaching: it's *why* embedding layers are describable as a linear layer at all, and it's the exact operation that runs in reverse at the output end of the model, where the final hidden state is multiplied against a similarly-shaped matrix — the [vocabulary and the unembedding](/learn/llm-foundations/the-vocabulary-and-the-unembedding) — to produce a score for every possible next token.

## Where it shows up

Every token that enters a transformer passes through this exact lookup before anything else happens — it's the very first operation in [the forward pass as a stack of blocks](/learn/llm-foundations/the-forward-pass-as-a-stack-of-blocks). The resulting vector then immediately gets combined with a positional signal (see [why order needs positional encoding](/learn/llm-foundations/why-order-needs-positional-encoding)) before the first attention layer ever runs. And because `E` is a parameter matrix like any other, it's counted directly in [parameters, activations, and data](/learn/llm-foundations/parameters-activations-and-data) — for smaller models, the embedding table can be a surprisingly large fraction of total parameter count.

## Watch out for

- **The rows are learned, not assigned by meaning.** Nobody decides "dog" gets values `[0.44, 0.12, ...]" — those numbers start random and are shaped entirely by [pretraining](/learn/llm-foundations/pretraining-explained), the same gradient updates that shape every other weight in the model. Row *position* (which token ID gets which row index) is arbitrary and fixed at vocabulary-build time; row *content* is the only part that's learned.
- **Vocabulary size is a direct multiplier on this matrix's size**, not a minor detail — doubling vocabulary size doubles the embedding table's parameter count outright, which is the parameter-cost side of [the vocab-size vs sequence-length tradeoff](/learn/llm-foundations/vocab-size-vs-sequence-length-tradeoff).
- **Many models tie the input embedding and output unembedding matrices together** (literally the same weights, used once as a lookup and once as a projection) to save parameters — don't assume they're always two independent matrices just because they play two different roles.

## Where next

The lookup gives you a vector; what that vector's position relative to other vectors actually means is the geometric question taken up next in [what lives in embedding space](/learn/llm-foundations/what-lives-in-embedding-space), and made concrete with real numbers in [finding nearest neighbors in an embedding matrix](/learn/llm-foundations/nearest-neighbors-in-an-embedding-matrix).

**Related:** [What Are Embeddings](/learn/llm-foundations/what-are-embeddings), [The Vocabulary and the Unembedding](/learn/llm-foundations/the-vocabulary-and-the-unembedding), [Build Byte-Pair Encoding From Scratch](/learn/llm-foundations/build-bpe-from-scratch), [Parameters, Activations, and Data](/learn/llm-foundations/parameters-activations-and-data)
