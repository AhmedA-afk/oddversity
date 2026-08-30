---
title: "Implement Rotary Position Embeddings in Numpy"
track: "llm-foundations"
status: live
summary: "Rotate query and key vectors by a position-dependent angle in about 15 lines, then prove numerically that only their relative offset matters."
duration: "8 min read"
---

[RoPE](/learn/llm-foundations/rotary-position-embeddings) claims a striking property: the attention score between two tokens depends only on how far apart they are, never on where they sit in the absolute sequence. This lesson builds the rotation and checks that claim against actual numbers.

## What we're building

Two pieces: a function that computes one rotation frequency per pair of vector dimensions, and a function that rotates a vector's pairs by a position-dependent angle. Then a direct numerical test: rotate a query at position 2 and a key at position 5, take their dot product; rotate the same query at position 7 and the same key at position 10 — same offset, different absolute positions — and confirm the dot product comes out the same.

## Setup

```python
import numpy as np
```

That's the whole dependency list. RoPE is pure arithmetic — no learned parameters, per [sinusoidal vs learned vs RoPE vs ALiBi](/learn/llm-foundations/sinusoidal-vs-learned-vs-rope-vs-alibi).

### Step 1: Choose one rotation frequency per dimension pair

```python
def rope_angles(dim, base=10000.0):
    i = np.arange(dim // 2)
    return base ** (-2 * i / dim)
```

> **Why this step?** RoPE operates on pairs of dimensions, rotating each pair as its own 2D plane. Early pairs get a fast-changing angle (frequency close to 1 per position step); later pairs get a much slower one — the same multi-frequency idea sinusoidal encoding uses, here controlling a rotation instead of an additive wave. For `dim=4`, this gives `[1.0, 0.01]`: pair 0 rotates a full radian per position, pair 1 barely moves.

### Step 2: Rotate a vector's pairs by a position-dependent angle

```python
def rotate(vec, position, thetas):
    pairs = vec.reshape(-1, 2)
    angles = position * thetas
    cos, sin = np.cos(angles), np.sin(angles)
    x1, x2 = pairs[:, 0], pairs[:, 1]
    rotated = np.stack([x1 * cos - x2 * sin,
                         x1 * sin + x2 * cos], axis=1)
    return rotated.reshape(-1)
```

> **Why this step?** This is a standard 2D rotation matrix applied independently to each `(x_2i, x_2i+1)` pair, by angle `position * thetas[i]`. Reshaping a length-`dim` vector into `(dim/2, 2)` is what turns "rotate the whole vector" into "rotate each of these small 2D planes by its own frequency" — the mechanism that makes different dimension-pairs sensitive to different scales of positional distance.

### Step 3: Apply the rotation to queries and keys before the dot product

```python
q = np.array([1., 0., 1., 0.])
k = np.array([0., 1., 0., 1.])
thetas = rope_angles(dim=4)

def rope_score(q, k, m, n, thetas):
    return np.dot(rotate(q, m, thetas), rotate(k, n, thetas))
```

> **Why this step?** This is exactly what happens inside every attention head using RoPE: rotate the query by its position, rotate the key by its position, then take the dot product as usual. Nothing else about attention changes — RoPE only touches how `q` and `k` are prepared beforehand.

## Run it

Test the same relative offset (`m - n = -3`) at two different absolute positions, then test a different offset for contrast:

```python
print(rope_score(q, k, m=2, n=5, thetas=thetas))    # offset -3
print(rope_score(q, k, m=7, n=10, thetas=thetas))   # offset -3, shifted +5
print(rope_score(q, k, m=2, n=3, thetas=thetas))    # offset -1
```

```
-0.1711
-0.1711
-0.8515
```

The first two calls use completely different absolute positions — `(2, 5)` versus `(7, 10)` — but the *same* relative offset, and they return the identical score. Shift both positions by the same amount and nothing changes, because rotating both vectors by an equal additional angle is itself just another rotation, and rotation matrices satisfy `R(a)ᵀR(b) = R(b - a)` — the extra shared rotation cancels out of the dot product entirely. The third call changes the relative offset from `-3` to `-1` and the score changes substantially, confirming the mechanism is actually sensitive to relative distance, not simply ignoring position altogether.

This is the numeric core of the claim in [RoPE, explained](/learn/llm-foundations/rotary-position-embeddings): absolute position is invisible to the attention score; relative position is the only thing that survives into it.

## Harden it

A few gaps between this version and a production implementation:

- **Pairing convention differs across codebases.** This version pairs adjacent dimensions (`x0` with `x1`, `x2` with `x3`). Many real implementations (including the common `rotate_half` pattern) instead pair the first half of the vector with the second half (`x0` with `x_{dim/2}`, and so on). Both are mathematically valid RoPE — they just permute which dimensions share a rotation plane — but mixing the two conventions when loading a checkpoint trained with one and running inference with the other silently produces wrong attention scores with no error thrown.
- **Precompute the cosines and sines once.** A real model calls `rotate` on every query and key, at every layer, for every generated token — recomputing `rope_angles` and the trig functions from scratch each time is wasted work. Production code builds a `(max_position, dim/2)` cache of angles up front and indexes into it.
- **RoPE plays directly with the KV cache.** A cached key already has its rotation baked in for the position it was computed at, so decoding a new token only needs to rotate the new query and the new key — nothing about previously cached keys needs to be touched or recomputed, which is exactly why RoPE composes so cleanly with [the KV cache](/learn/llm-foundations/the-kv-cache).

## Extend it

- Implement the `rotate_half` pairing convention alongside this one and confirm both give the same relative-offset invariance property, just with a permuted dimension order.
- Plug `rotate` into the query and key computation from [implement multi-head attention](/learn/llm-foundations/implement-multi-head-attention) and confirm the combined pipeline still produces the same relative-offset invariance across full multi-head attention, not just a single pair of vectors.
- Push `m` and `n` far outside the range used here and watch the score behavior get noisier — a hands-on preview of why naive extrapolation degrades, picked up in [context extrapolation and RoPE scaling](/learn/llm-foundations/context-extrapolation-and-rope-scaling).

**Related:** [RoPE: Rotary Position Embeddings, Explained](/learn/llm-foundations/rotary-position-embeddings), [Sinusoidal vs Learned vs RoPE vs ALiBi](/learn/llm-foundations/sinusoidal-vs-learned-vs-rope-vs-alibi), [Context Extrapolation and RoPE Scaling](/learn/llm-foundations/context-extrapolation-and-rope-scaling), [The KV Cache](/learn/llm-foundations/the-kv-cache)
