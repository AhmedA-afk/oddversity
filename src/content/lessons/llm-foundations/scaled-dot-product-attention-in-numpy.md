---
title: "Scaled Dot-Product Attention in Numpy"
track: "llm-foundations"
status: live
summary: "Build attention from scratch on a 4-token toy example and print every intermediate shape and number."
duration: "8 min read"
---

Every explanation of attention eventually points at the same formula. This lesson makes you type it out, run it on numbers small enough to check by hand, and watch the attention matrix come out the other side.

## What we're building

A single scaled dot-product attention function — the operation from [Attention as a Soft, Differentiable Lookup](/learn/llm-foundations/attention-as-soft-lookup) — applied to a toy 4-token sequence with hand-verifiable numbers, so you can trust every step instead of taking the shapes on faith.

## Setup

We'll use `d_k = 2` (the query/key dimension) and `d_v = 4` (the value dimension) — deliberately tiny and mismatched from each other, to make it obvious that `d_k` and `d_v` don't have to match. Four tokens stand in for the sentence "The cat sat down."

```python
import numpy as np

# Q and K live in a 2-dim space; each row is one token's vector
Q = np.array([
    [1.0,  0.0],   # "The"
    [0.0,  1.0],   # "cat"
    [1.0,  1.0],   # "sat"
    [-1.0, 1.0],   # "down"
])
K = Q.copy()  # for this toy example, keys equal queries token-for-token

# V is one-hot in a 4-dim space, so the output is directly readable as weights
V = np.eye(4)
```

Setting `K = Q` and `V = np.eye(4)` isn't how a real model looks — Q, K, and V come from three separate learned projections. It's chosen here so every number in this lesson can be checked with pen and paper, and so the final output is literally the attention weights themselves.

## Build it

### Step 1: raw scores

```python
scores = Q @ K.T
print(scores)
# [[ 1.  0.  1. -1.]
#  [ 0.  1.  1.  1.]
#  [ 1.  1.  2.  0.]
#  [-1.  1.  0.  2.]]
```

`scores[i, j]` is `Q_i · K_j` — how well token `i`'s query matches token `j`'s key. Shape: `(4, 2) @ (2, 4) -> (4, 4)`. Every entry so far is an unbounded real number, which is exactly the problem softmax exists to fix.

### Step 2: scale by sqrt(d_k)

```python
d_k = Q.shape[-1]          # 2
scaled_scores = scores / np.sqrt(d_k)
print(scaled_scores)
# [[ 0.7071  0.      0.7071 -0.7071]
#  [ 0.      0.7071  0.7071  0.7071]
#  [ 0.7071  0.7071  1.4142  0.    ]
#  [-0.7071  0.7071  0.      1.4142]]
```

> **Why this step?** Dot products grow in magnitude with the dimension being summed over. At `d_k = 64` (a common real head size) unscaled scores can swing far enough to push softmax into a near-one-hot, near-zero-gradient regime. Dividing by `sqrt(d_k)` keeps the scale sane regardless of dimension. [Why Divide by the Square Root of d_k](/learn/llm-foundations/why-divide-by-sqrt-dk) works through exactly why `sqrt(d_k)` and not some other constant.

### Step 3: softmax each row

```python
def softmax(x, axis=-1):
    x = x - np.max(x, axis=axis, keepdims=True)  # subtract max for numerical stability
    e = np.exp(x)
    return e / np.sum(e, axis=axis, keepdims=True)

weights = softmax(scaled_scores, axis=-1)
print(np.round(weights, 4))
# [[0.3655 0.1802 0.3655 0.0889]
#  [0.1412 0.2863 0.2863 0.2863]
#  [0.2212 0.2212 0.4486 0.1091]
#  [0.0646 0.2657 0.1310 0.5388]]
```

> **Why this step?** `axis=-1` is not a detail — it's the whole point. Softmax runs *per row*, over the key dimension, so each token's weights over all four keys sum to exactly 1. Softmax over the wrong axis is one of the [wiring bugs](/learn/llm-foundations/transformer-block-wiring-bugs) that silently produces a plausible-looking but meaningless matrix. Check: every row above sums to 1.0.

Read row 3 (index 2, "sat"): weight 0.4486 on itself, 0.2212 each on "The" and "cat," 0.1091 on "down." "sat" attends most to itself and fairly evenly to the earlier words — nothing here is masked yet, so it can also see "down," which comes after it.

### Step 4: weighted sum of values

```python
output = weights @ V
print(np.round(output, 4))
# [[0.3655 0.1802 0.3655 0.0889]
#  [0.1412 0.2863 0.2863 0.2863]
#  [0.2212 0.2212 0.4486 0.1091]
#  [0.0646 0.2657 0.1310 0.5388]]
```

Because `V` is the identity matrix, `output` is numerically identical to `weights` — this is the one-hot trick from [Attention as a Soft, Differentiable Lookup](/learn/llm-foundations/attention-as-soft-lookup) paying off: you can see, with no decoding step, exactly how much of "The," "cat," "sat," and "down" got mixed into each output position.

## Run it

Wrap the four steps into one function and confirm shapes end to end:

```python
def attention(Q, K, V):
    d_k = Q.shape[-1]
    scores = Q @ K.T / np.sqrt(d_k)
    weights = softmax(scores, axis=-1)
    return weights @ V, weights

out, w = attention(Q, K, V)
assert out.shape == (4, 4)   # (seq_len, d_v)
assert w.shape == (4, 4)     # (seq_len, seq_len)
assert np.allclose(w.sum(axis=-1), 1.0)   # every row is a valid distribution
```

Note the shape contract: attention takes `(seq_len, d_k)` queries and keys, `(seq_len, d_v)` values, and returns `(seq_len, d_v)` — the *same* shape as `V`, regardless of what `d_k` was. This is why `d_k` and `d_v` are allowed to differ: the query/key dimension only ever affects the comparison step, never the shape of what comes out.

## Harden it

Two things this toy version glosses over that a real implementation can't:

- **Numerical stability.** The `x - np.max(x, ...)` subtraction in `softmax` before exponentiating isn't optional at scale — without it, large logits overflow `np.exp` and produce `nan`. It doesn't change the mathematical result (softmax is shift-invariant), only its numerical behavior.
- **Batching.** Real code runs this over a batch of sequences and (per [Multi-Head Attention](/learn/llm-foundations/multi-head-attention-why-many-heads)) a heads dimension too, so `Q`, `K`, `V` are typically 4D tensors of shape `(batch, heads, seq_len, d_k)`, and the matrix multiplies above become batched `matmul` operations broadcasting over the leading dimensions. The math per `(seq_len, d_k)` slice is unchanged.

## Extend it

This function has no notion of the future being off-limits — token "The" (row 1) is free to attend to "down" (column 4), which is exactly what you don't want during autoregressive training. [Watching the Mask Change the Softmax](/learn/llm-foundations/watching-the-mask-change-the-softmax) takes this identical score matrix and reruns steps 2 through 4 with a causal mask inserted, so you can compare the two outputs side by side on the same numbers. From there, [Implement Multi-Head Attention](/learn/llm-foundations/implement-multi-head-attention) wraps this exact `attention` function to run several times in parallel over subspaces of a larger embedding.

**Related:** [Attention as a Soft, Differentiable Lookup](/learn/llm-foundations/attention-as-soft-lookup), [Why Divide by the Square Root of d_k](/learn/llm-foundations/why-divide-by-sqrt-dk), [Watching the Mask Change the Softmax](/learn/llm-foundations/watching-the-mask-change-the-softmax), [Implement Multi-Head Attention](/learn/llm-foundations/implement-multi-head-attention)
