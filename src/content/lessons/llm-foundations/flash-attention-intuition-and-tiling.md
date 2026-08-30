---
title: "FlashAttention: The Tiling and Online-Softmax Idea"
track: "llm-foundations"
status: live
summary: "Build a tiled attention implementation that never materializes the full score matrix, and confirm it's numerically identical to the naive version."
duration: "8 min read"
---

FlashAttention gets described as a speed trick, which makes it sound like an approximation. It isn't one — it computes exactly the same output as ordinary attention, just without ever holding the full n × n score matrix in memory at once.

## What we're building

A small numpy implementation of causal, tiled attention using the "online softmax" trick: instead of computing the whole score matrix and then softmaxing it, we process the keys and values in blocks, keeping a running maximum, a running sum, and a running weighted output that get corrected as each new block arrives. We'll check it against a naive full-matrix implementation on a tiny example to confirm the outputs match exactly. This is the mechanism behind why [the quadratic attention bottleneck](/learn/llm-foundations/the-quadratic-attention-bottleneck) is a *memory-traffic* problem that FlashAttention solves, rather than a FLOPs problem it reduces.

## Setup

You need only numpy. We'll work with a single attention head over a short sequence — 8 tokens with a head dimension of 4 — small enough to read every intermediate value, but the recurrence below is exactly what real kernels run per (batch, head) pair, just at much larger block sizes chosen to fit GPU on-chip memory.

```python
import numpy as np
np.random.seed(0)

n, d = 8, 4
Q = np.random.randn(n, d)
K = np.random.randn(n, d)
V = np.random.randn(n, d)
```

## Build it

### Step 1 — the naive baseline

This is standard [scaled dot-product attention](/learn/llm-foundations/scaled-dot-product-attention-in-numpy) with [causal masking](/learn/llm-foundations/causal-masking-mechanics): build the full n × n score matrix, mask, softmax, multiply by V.

```python
def naive_attention(Q, K, V, causal=True):
    d = Q.shape[-1]
    scores = Q @ K.T / np.sqrt(d)          # full n x n matrix, materialized
    if causal:
        n = Q.shape[0]
        mask = np.triu(np.ones((n, n)), k=1).astype(bool)
        scores = np.where(mask, -np.inf, scores)
    scores = scores - scores.max(axis=-1, keepdims=True)
    weights = np.exp(scores)
    weights = weights / weights.sum(axis=-1, keepdims=True)
    return weights @ V
```

> **Why this step?** We need ground truth to check our tiled version against. Notice the full `n x n` `scores` matrix exists in memory here — for n = 8 that's trivial, but it's exactly this array that becomes the 64 GiB monster at 128k context described in [The Quadratic Attention Bottleneck](/learn/llm-foundations/the-quadratic-attention-bottleneck).

### Step 2 — the tiled, online-softmax version

Process one query at a time, and for that query, sweep through keys and values in blocks. Keep three running values per query: `m` (the running maximum score seen so far, for numerical stability), `l` (the running sum of exponentiated scores), and `acc` (the running unnormalized weighted sum of V). Each new block *corrects* the previous running values rather than starting over.

```python
def flash_attention(Q, K, V, block_size=3, causal=True):
    n, d = Q.shape
    out = np.zeros((n, d))
    for i in range(n):
        q_i = Q[i]
        m_i = -np.inf        # running max score
        l_i = 0.0            # running sum of exp(score - m_i)
        acc = np.zeros(d)    # running weighted sum of V, unnormalized
        limit = i + 1 if causal else n   # causal: only keys 0..i are visible
        for start in range(0, limit, block_size):
            end = min(start + block_size, limit)
            K_blk, V_blk = K[start:end], V[start:end]

            s = q_i @ K_blk.T / np.sqrt(d)       # scores for THIS block only
            m_new = max(m_i, s.max())
            correction = np.exp(m_i - m_new)     # rescales everything accumulated so far
            p = np.exp(s - m_new)                # unnormalized weights for this block

            l_i = l_i * correction + p.sum()
            acc = acc * correction + p @ V_blk
            m_i = m_new
        out[i] = acc / l_i
    return out
```

> **Why this step?** At no point does this function hold more than one query vector and one block of keys/values at a time — never the full sequence, never the full score matrix. The `correction` term is the trick: because softmax's max-subtraction is just for numerical stability, and the max can change as new, larger scores arrive, each new block rescales the running total to what it *would have been* if this new block's max had been known from the start. Provided the arithmetic is right, this produces a bit-for-bit-equivalent (up to floating point rounding) result to computing the whole row of scores at once.

## Run it

```python
out_naive = naive_attention(Q, K, V)
out_flash = flash_attention(Q, K, V, block_size=3)
print(np.allclose(out_naive, out_flash, atol=1e-8))   # True
```

This should print `True`: the tiled version, processing keys three at a time, produces the same output as computing the full 8×8 score matrix in one shot. Try changing `block_size` to 1, 2, or 8 — the result doesn't move, because block size only changes *how* the computation is chunked, never *what* it computes. That's the exactness guarantee: FlashAttention is IO-aware (it minimizes how much data moves between slow and fast memory), not approximate.

## Harden it

A few things a production kernel does that this toy version simplifies away:

- **Tile Q as well as K/V.** Real implementations process blocks of queries together, not one query at a time, so the outer loop is also blocked — this is what lets the whole thing run as dense matrix multiplications on hardware rather than one vector-matrix product per token.
- **Recompute instead of store, in the backward pass.** Training needs gradients, which normally requires the forward pass's attention weights. Instead of storing the full n × n matrix for backward (defeating the whole point), FlashAttention recomputes the needed blocks during the backward pass, trading a bit of extra compute for the memory savings.
- **Keep accumulators in higher precision.** Even if Q, K, V are stored in fp16 or bf16, the running `m`, `l`, and `acc` values should accumulate in fp32 — the online-softmax correction involves repeated multiplication by `correction` factors, and low-precision accumulation here would compound rounding error across blocks.

## Extend it

Try vectorizing the outer `for i in range(n)` loop so an entire block of queries is processed against each key block simultaneously with matrix operations instead of a Python loop per row — that's the real shape of a GPU kernel. You could also skip fully-masked blocks entirely under causal masking (a block of keys that's entirely in the future for a given query block can be skipped without computing any scores for it at all), which is a real optimization in causal FlashAttention implementations.

It's worth being precise about what this technique does and doesn't buy you: it does not reduce the number of floating-point operations attention performs — the same Q·Kᵀ dot products still happen. What it reduces is memory traffic: the full score matrix never gets written to and read back from slow memory, only small blocks pass through fast on-chip memory at a time. That's a different lever from [Sparse, Sliding-Window, and Linear Attention](/learn/llm-foundations/sparse-sliding-and-linear-attention), which changes *which* token pairs get computed at all, or [Multi-Query and Grouped-Query Attention](/learn/llm-foundations/multi-query-and-grouped-query-attention), which changes how much needs to be cached and re-read across generation steps.

**Related:** [The Quadratic Attention Bottleneck](/learn/llm-foundations/the-quadratic-attention-bottleneck), [Scaled Dot-Product Attention in Numpy](/learn/llm-foundations/scaled-dot-product-attention-in-numpy), [Causal Masking: Mechanics](/learn/llm-foundations/causal-masking-mechanics), [The KV Cache: How LLMs Avoid Recomputing the Past](/learn/llm-foundations/the-kv-cache)
