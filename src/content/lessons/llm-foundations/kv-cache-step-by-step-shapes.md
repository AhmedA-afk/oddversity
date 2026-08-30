---
title: "The KV Cache Step by Step"
track: "llm-foundations"
status: live
summary: "Four decode steps traced with real tensor shapes and hand-checkable arithmetic — the cache gains exactly one row per step, never more, never less."
duration: "8 min read"
---

Descriptions of the KV cache tend to stay abstract — "it stores past keys and values." Here it is concretely: real numbers, real shapes, growing one row at a time, with the actual dot products behind the first two steps worked by hand.

## The setup

One layer, one attention head, `head_dim = 2` — small enough to compute by hand, with the understanding that a real model repeats this identical machinery independently for every head (see [multi-head attention](/learn/llm-foundations/multi-head-attention)) and every layer, each with its own cache. The prompt is 3 tokens long, and we'll trace 4 decode steps after it, following exactly the storage rules from [the KV cache: what it is and why it exists](/learn/llm-foundations/the-kv-cache-what-and-why) — cache `K` and `V`, never `Q`.

Hand-picked key and value vectors for the 3 prompt tokens (chosen for clean arithmetic, not realism):

```python
import numpy as np

K_prompt = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])   # one row per prompt token
V_prompt = np.array([[10.0, 0.0], [0.0, 10.0], [5.0, 5.0]])
```

## Step by step

### Prefill: all 3 prompt tokens at once

```python
cache_K = K_prompt.copy()
cache_V = V_prompt.copy()
print("After prefill:", cache_K.shape, cache_V.shape)
```

```text
After prefill: (3, 2) (3, 2)
```

> **Why this step?** Prefill computes `K`, `V`, and `Q` for every prompt token in a single batched matrix multiply — all 3 rows at once, because the whole prompt is already known and there's no reason to process it one token at a time. This is the parallel phase: one big matmul over `(3, head_dim)` inputs instead of 3 sequential ones. Nothing about it resembles the decode steps that follow.

### Decode step 1: one new token, one appended row

```python
def attend(q, K, V):
    scores = (K @ q) / np.sqrt(K.shape[-1])
    weights = np.exp(scores - scores.max())
    weights /= weights.sum()
    return weights @ V, weights

k4, v4, q4 = np.array([2.0, 0.0]), np.array([8.0, 2.0]), np.array([1.0, 0.0])

cache_K = np.vstack([cache_K, k4])   # (4, 2) — one new row, nothing recomputed
cache_V = np.vstack([cache_V, v4])

out4, w4 = attend(q4, cache_K, cache_V)
print("Cache shape:", cache_K.shape)
print("Attention weights:", w4.round(3))
print("Output:", out4.round(3))
```

```text
Cache shape: (4, 2)
Attention weights: [0.221 0.109 0.221 0.449]
Output: [6.906 3.094]
```

Check the weights by hand: `q4 · K` gives raw scores `[1, 0, 1, 2]`; scale by `1/√2 ≈ 0.707` to get `[0.707, 0, 0.707, 1.414]`; softmax of that concentrates the most weight (0.449) on the 4th row — the token's own freshly-appended key — because it has the highest score. The output is the weighted sum of all 4 value rows using those weights: `0.221×[10,0] + 0.109×[0,10] + 0.221×[5,5] + 0.449×[8,2] ≈ [6.906, 3.094]`.

> **Why this step?** `q4` is computed once, used once, and never stored — it did its job (attending over the cache) and is gone. `k4` and `v4`, by contrast, get appended and will be read by every future query for the rest of this generation. This asymmetry — query is transient, key/value are permanent — is the entire content of "what's cached and what isn't" made concrete in code.

### Decode step 2: the cache is now 5 rows, the new query sees all of them

```python
k5, v5, q5 = np.array([0.0, 2.0]), np.array([3.0, 7.0]), np.array([1.0, 1.0])

cache_K = np.vstack([cache_K, k5])   # (5, 2)
cache_V = np.vstack([cache_V, v5])

out5, w5 = attend(q5, cache_K, cache_V)
print("Cache shape:", cache_K.shape)
print("Attention weights:", w5.round(3))
print("Output:", out5.round(3))
```

```text
Cache shape: (5, 2)
Attention weights: [0.124 0.124 0.251 0.251 0.251]
Output: [5.251 4.749]
```

`q5` attends over all 5 rows — the original 3 prompt tokens *and* the token generated in step 1 — with no distinction in the mechanism between "came from the prompt" and "came from a previous decode step." The cache doesn't know or care where a row came from; it's a flat, growing list of keys and values in position order.

> **Why this step?** This is the part that's easy to state and easy to miss the weight of: attending over 5 rows here cost exactly one new key/value computation (`k5`, `v5`) plus one dot product per cached row — it did *not* cost recomputing `k1` through `k4` from scratch. Compare that to what step 2 would cost if there were no cache at all: reprocessing all 5 tokens' worth of hidden states through the projection matrices, every single step, just to get back to keys and values you already had.

### Decode steps 3 and 4: the pattern, not the arithmetic

The same `attend()` call handles steps 3 and 4 identically — append one row, run one query against the now-larger cache:

```python
for k_new, v_new, q_new in [
    (np.array([1.0, 3.0]), np.array([6.0, 1.0]), np.array([0.5, 0.5])),
    (np.array([2.0, 1.0]), np.array([4.0, 4.0]), np.array([1.0, 0.0])),
]:
    cache_K = np.vstack([cache_K, k_new])
    cache_V = np.vstack([cache_V, v_new])
    print(cache_K.shape)
```

```text
(6, 2)
(7, 2)
```

Four decode steps, four new rows, cache shape going `(3,2) → (4,2) → (5,2) → (6,2) → (7,2)`. Every step's cost is one row of new work plus a dot product against a cache that's one row bigger than last time — linear growth in what's stored, not quadratic recomputation of what's already there.

## Where it breaks (+fix)

The failure mode that erases every benefit of this design is subtle because it can look correct: reprocessing the *entire* sequence from scratch at every decode step instead of appending to a cache.

```python
# WRONG — recomputes K, V for every token, every single step
def naive_decode_step(all_tokens_so_far, project_kv):
    K_all, V_all = project_kv(all_tokens_so_far)   # reprocesses tokens 1..t every time
    ...

# RIGHT — only the newest token gets projected; everything else is a lookup
def cached_decode_step(new_token, cache_K, cache_V, project_kv):
    k_new, v_new = project_kv(new_token)           # projects exactly one token
    cache_K = np.vstack([cache_K, k_new])
    cache_V = np.vstack([cache_V, v_new])
    ...
```

Both versions can produce identical output — the *values* in the cache are exactly what re-projecting the whole sequence would give you, since keys and values don't change once computed. The difference is purely in cost: the naive version does `O(t)` work at step `t`, so generating `n` tokens costs `O(n²)` total projection work; the cached version does `O(1)` work at every step, for `O(n)` total. This is easy to introduce by accident if you hand-roll a decoding loop without an explicit cache object — the model still "works," it's just quietly doing 10x, then 100x, more computation than it needs to as the sequence grows, exactly the growing-cost problem [the KV cache: what it is and why it exists](/learn/llm-foundations/the-kv-cache-what-and-why) opens with.

## Takeaways

- Prefill is one batched operation over the whole prompt at once — parallel, and the reason the very first token of a response takes longer to appear than every token after it.
- Decode is strictly serial and append-only: exactly one new key row and one new value row per step, per layer, per head — never a rewrite of anything already in the cache.
- The query is never cached. It's computed fresh, used immediately against the current cache, and discarded — only keys and values persist.
- Cache shape growth is linear in tokens generated (`+1` row per step), which is exactly what keeps per-step cost from growing — see [prefill vs decode: why inference is memory-bound](/learn/llm-foundations/prefill-vs-decode-memory-bound) for what that per-step cost actually consists of once you account for reading the whole cache back out of memory every step.

**Related:** [The KV Cache: What It Is and Why It Exists](/learn/llm-foundations/the-kv-cache-what-and-why) · [The KV Cache: How LLMs Avoid Recomputing the Past](/learn/llm-foundations/the-kv-cache) · [Multi-Head Attention](/learn/llm-foundations/multi-head-attention) · [Scaled Dot-Product Attention in NumPy](/learn/llm-foundations/scaled-dot-product-attention-in-numpy) · [Prefill vs Decode: Why Inference Is Memory-Bound](/learn/llm-foundations/prefill-vs-decode-memory-bound) · [Causal Masking](/learn/llm-foundations/causal-masking)
