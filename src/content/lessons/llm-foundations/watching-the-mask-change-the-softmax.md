---
title: "Watching the Mask Change the Softmax"
track: "llm-foundations"
status: live
summary: "One score matrix, softmaxed with and without the causal mask, side by side — where the probability actually goes."
duration: "6 min read"
---

Descriptions of causal masking tell you future positions get zeroed out. Numbers show you something more specific: where that zeroed-out probability *goes* instead. This lesson reuses the exact score matrix from [Scaled Dot-Product Attention in Numpy](/learn/llm-foundations/scaled-dot-product-attention-in-numpy) and reruns softmax twice.

## The setup

Same 4-token toy example as before ("The cat sat down"), same scaled scores, computed from `Q = K`:

```
scaled_scores =
[[ 0.7071  0.      0.7071 -0.7071]
 [ 0.      0.7071  0.7071  0.7071]
 [ 0.7071  0.7071  1.4142  0.    ]
 [-0.7071  0.7071  0.      1.4142]]
```

We already softmaxed this unmasked. Now we apply the triangular mask from [Causal Masking Mechanics](/learn/llm-foundations/causal-masking-mechanics) — every `(i, j)` with `j > i` set to `-inf` — and softmax the result too.

## Step by step

### Step 1: the unmasked softmax (baseline)

```python
weights_unmasked = softmax(scaled_scores, axis=-1)
# [[0.3655 0.1802 0.3655 0.0889]
#  [0.1412 0.2863 0.2863 0.2863]
#  [0.2212 0.2212 0.4486 0.1091]
#  [0.0646 0.2657 0.1310 0.5388]]
```

> **Why this step?** This is the reference point. Every row sums to 1, and every position can see every other position, including the future — row 1 ("The") puts real weight (0.0889) on row 4's key ("down"), a word that hasn't been generated yet in a left-to-right reading. That's the exact leak causal masking exists to close.

### Step 2: apply the mask, then softmax again

```python
mask = np.triu(np.ones((4, 4), dtype=bool), k=1)
masked_scores = np.where(mask, -np.inf, scaled_scores)
weights_masked = softmax(masked_scores, axis=-1)
# [[1.0000 0.     0.     0.    ]
#  [0.3303 0.6697 0.     0.    ]
#  [0.2482 0.2482 0.5036 0.    ]
#  [0.0646 0.2657 0.1310 0.5388]]
```

> **Why this step?** Softmax over a row where some entries are `-inf` normalizes *only* over the surviving finite entries — `exp(-inf) = 0`, so those terms drop out of both the numerator and the denominator's sum. The remaining weights are recomputed from scratch over a smaller set, which is why row 2's split (0.3303 / 0.6697) is a genuinely renormalized softmax over just two numbers, not the old four-way split with two entries chopped off.

### Step 3: put them side by side

| Position | Unmasked weights | Masked (causal) weights |
|---|---|---|
| 1 ("The") | `[0.3655, 0.1802, 0.3655, 0.0889]` | `[1.0000, 0, 0, 0]` |
| 2 ("cat") | `[0.1412, 0.2863, 0.2863, 0.2863]` | `[0.3303, 0.6697, 0, 0]` |
| 3 ("sat") | `[0.2212, 0.2212, 0.4486, 0.1091]` | `[0.2482, 0.2482, 0.5036, 0]` |
| 4 ("down") | `[0.0646, 0.2657, 0.1310, 0.5388]` | `[0.0646, 0.2657, 0.1310, 0.5388]` |

Three things worth reading directly off this table:

- **Row 1 collapses to certainty.** With no earlier tokens to see, "The" has exactly one legal choice — itself — so masked weight is `1.0` on position 1 and nothing else. There was no other option; the "distribution" isn't really a choice at all.
- **Rows 2 and 3 redistribute, they don't just shrink.** Row 3's masked weight on position 3 itself goes *up*, from 0.4486 to 0.5036 — the probability that used to leak out to position 4 (0.1091 in the unmasked row) gets redistributed among the *remaining* legal positions in proportion to their original relative scores, not deleted from the total. This is the direct consequence of renormalizing over fewer terms, and it's exactly why masking before softmax (dividing by a smaller sum) differs from masking after softmax (which would just delete the 0.1091 and leave the row summing to 0.8909).
- **Row 4 is identical in both columns.** The last position in the sequence has nothing ahead of it to mask in the first place, so causal masking is a no-op there. This is a useful sanity check when debugging a real implementation: if masking changes your *last* row's output, something is wired wrong.

## Where it breaks (and the fix)

A common near-miss: masking with `k=0` instead of `k=1` in `np.triu`, which additionally masks the diagonal — a token would be prevented from attending to *itself*. Row 1 above would then have no legal keys at all, and softmax over an all `-inf` row produces `nan` (0/0 in the softmax ratio), which typically shows up downstream as the whole model's loss going to `nan` within the first few training steps.

```python
# wrong: masks the diagonal too, position 1 has zero legal keys
bad_mask = np.triu(np.ones((4, 4), dtype=bool), k=0)

# right: diagonal stays visible, k=1 excludes only strictly-future positions
mask = np.triu(np.ones((4, 4), dtype=bool), k=1)
```

The fix is the `k=1` offset: it excludes the diagonal from the masked region, so every position always has at least itself as a legal attention target.

## Takeaways

- Masking before softmax doesn't just remove entries — it forces a full renormalization, and the probability that used to point at now-illegal positions gets reallocated among the legal ones, proportional to their original scores.
- The first position in any causally-masked sequence always attends entirely to itself; the last position is never affected by the mask at all. Both are useful sanity checks on a real implementation.
- Get the triangle's offset wrong by one (`k=0` instead of `k=1`) and you mask the diagonal, which produces an all-`-inf` row and `nan` outputs — a concrete instance of the wiring bugs cataloged in [Transformer Block Wiring Bugs](/learn/llm-foundations/transformer-block-wiring-bugs).

**Related:** [Causal Masking Mechanics](/learn/llm-foundations/causal-masking-mechanics), [Scaled Dot-Product Attention in Numpy](/learn/llm-foundations/scaled-dot-product-attention-in-numpy), [Transformer Block Wiring Bugs](/learn/llm-foundations/transformer-block-wiring-bugs)
