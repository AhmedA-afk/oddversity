---
title: "Implement Temperature, Top-k, and Top-p"
track: "llm-foundations"
status: live
summary: "Build the full decoding pipeline in numpy over one real logit vector, printing the surviving candidates after every filter."
duration: "8 min read"
---

Reading about temperature and top-p is one thing; watching a candidate pool shrink from eight tokens to three, in order, filter by filter, is what makes the mechanism stick. Here's the whole pipeline in about thirty lines of numpy.

## What we're building

A `decode_step()` function that takes a raw logit vector and returns a sampled token, implementing exactly the four-stage pipeline from [from logits to a chosen token](/learn/llm-foundations/from-logits-to-a-chosen-token): temperature scaling, top-k filtering, top-p filtering, renormalize, sample. We'll run it over one fixed vocabulary so every intermediate number is checkable, and print the surviving candidate set after each filter so the shrinkage is visible rather than implied.

## Setup

Just Python and numpy — no framework needed, since this is post-processing on a vector you'd get back from any model's final layer.

```bash
pip install numpy
```

We'll reuse the eight-token vocabulary from [from logits to a chosen token](/learn/llm-foundations/from-logits-to-a-chosen-token) throughout, so every number here matches that page's hand-worked arithmetic.

```python
import numpy as np

tokens = np.array(["salt", "pepper", "sugar", "garlic", "cinnamon", "love", "the", "xylophone"])
logits = np.array([4.0, 3.0, 2.0, 1.0, 0.5, 0.0, -1.0, -6.0])
```

## Build it

### 1. Softmax, as a standalone building block

Every stage below needs to turn scores into probabilities, so write it once and reuse it.

```python
def softmax(x):
    x = x - np.max(x)          # subtract max for numerical stability, doesn't change the result
    exp_x = np.exp(x)
    return exp_x / exp_x.sum()
```

Subtracting the max before exponentiating doesn't change the output — softmax is shift-invariant — but it stops `np.exp` from overflowing on large logits. Always do this in real code, not just here.

### 2. Temperature scaling

Divide the logits by `T` before anything else touches them.

```python
def apply_temperature(logits, T):
    if T <= 0:
        raise ValueError("temperature must be > 0")
    return logits / T
```

```python
scaled = apply_temperature(logits, T=1.0)
probs = softmax(scaled)
print(dict(zip(tokens, probs.round(3))))
```

```text
{'salt': 0.622, 'pepper': 0.229, 'sugar': 0.084, 'garlic': 0.031,
 'cinnamon': 0.019, 'love': 0.011, 'the': 0.004, 'xylophone': 0.0}
```

At `T = 1` this matches the hand-computed table from [from logits to a chosen token](/learn/llm-foundations/from-logits-to-a-chosen-token) exactly — that's the checkpoint before adding any filtering.

### 3. Top-k: keep a fixed count

```python
def top_k_filter(probs, k):
    kept_idx = np.argsort(probs)[-k:]          # indices of the k largest probabilities
    mask = np.zeros_like(probs, dtype=bool)
    mask[kept_idx] = True
    filtered = np.where(mask, probs, 0.0)
    return filtered, mask
```

```python
filtered, mask = top_k_filter(probs, k=3)
print("Survives top-k=3:", tokens[mask].tolist())
print(dict(zip(tokens, filtered.round(3))))
```

```text
Survives top-k=3: ['salt', 'pepper', 'sugar']
{'salt': 0.622, 'pepper': 0.229, 'sugar': 0.084, 'garlic': 0.0,
 'cinnamon': 0.0, 'love': 0.0, 'the': 0.0, 'xylophone': 0.0}
```

(`tokens[mask]` indexes with a boolean array, which preserves the original vocabulary order — salt, pepper, sugar — not the descending-probability order they were found in.)

Five candidates just got zeroed out. Note the array isn't renormalized yet — the surviving three still show their *original* probabilities, which don't sum to 1. That's deliberate: filtering and renormalizing are separate steps, and keeping them separate is what makes it possible to chain top-k and top-p without double-normalizing by accident.

### 4. Top-p: keep the smallest sufficient set

```python
def top_p_filter(probs, p):
    sorted_idx = np.argsort(probs)[::-1]        # descending
    sorted_probs = probs[sorted_idx]
    cumulative = np.cumsum(sorted_probs)
    cutoff = np.searchsorted(cumulative, p) + 1  # smallest count whose cumsum exceeds p
    kept_idx = sorted_idx[:cutoff]
    mask = np.zeros_like(probs, dtype=bool)
    mask[kept_idx] = True
    filtered = np.where(mask, probs, 0.0)
    return filtered, mask
```

```python
filtered_p, mask_p = top_p_filter(probs, p=0.9)
print("Survives top-p=0.9:", tokens[mask_p].tolist())
print("Cumulative mass kept:", filtered_p.sum().round(3))
```

```text
Survives top-p=0.9: ['salt', 'pepper', 'sugar']
Cumulative mass kept: 0.935
```

At `p = 0.9` this happens to keep the same three tokens as `top-k=3` did — but that's a coincidence of this particular distribution being sharply peaked, not a general rule. Try `p = 0.95` and watch the set adapt:

```python
filtered_p95, mask_p95 = top_p_filter(probs, p=0.95)
print("Survives top-p=0.95:", tokens[mask_p95].tolist())
```

```text
Survives top-p=0.95: ['salt', 'pepper', 'sugar', 'garlic']
```

Four tokens now, because `garlic` was needed to push cumulative mass past 0.95. This is the adaptive behavior [greedy, beam, nucleus, and min-p decoding](/learn/llm-foundations/greedy-beam-sampling-min-p) contrasts with top-k's fixed count.

### 5. Renormalize and sample

```python
def renormalize_and_sample(filtered_probs, rng):
    renorm = filtered_probs / filtered_probs.sum()
    return rng.choice(len(renorm), p=renorm), renorm
```

```python
rng = np.random.default_rng(seed=0)
idx, renorm = renormalize_and_sample(filtered_p, rng)
print(dict(zip(tokens, renorm.round(3))))
print("Sampled:", tokens[idx])
```

```text
{'salt': 0.665, 'pepper': 0.245, 'sugar': 0.09, 'garlic': 0.0,
 'cinnamon': 0.0, 'love': 0.0, 'the': 0.0, 'xylophone': 0.0}
Sampled: <one of salt/pepper/sugar — exactly which depends on the RNG draw>
```

Compare `0.665` here against the original `0.622` for salt — renormalizing after discarding 6.5% of the mass pushed every survivor's probability up proportionally. `Sampled` is the one genuinely random line in this whole pipeline; rerun it and it'll land on `salt` roughly two-thirds of the time, `pepper` roughly a quarter, `sugar` rarely — but it can never land on `garlic` or anything else that top-p already zeroed out.

### 6. Chain everything into one `decode_step`

```python
def decode_step(logits, T=1.0, k=None, p=None, rng=None):
    rng = rng or np.random.default_rng()
    scaled = apply_temperature(logits, T)
    probs = softmax(scaled)
    if k is not None:
        probs, _ = top_k_filter(probs, k)
    if p is not None:
        probs, _ = top_p_filter(probs, p)
    idx, _ = renormalize_and_sample(probs, rng)
    return tokens[idx]
```

```python
for _ in range(5):
    print(decode_step(logits, T=1.0, p=0.9, rng=rng))
```

```text
salt      # (or pepper, or sugar — the exact sequence depends on the RNG)
pepper
salt
salt
sugar
```

Five draws, only ever from the three-token top-p set — never `garlic`, `love`, or `xylophone`, no matter how many times you run it, because filtering happened before sampling ever got a chance. The *identities* that appear are random; the *set* they're drawn from is completely deterministic given `logits`, `T`, and `p`.

## Run it

Run the full script top to bottom. You should see the `T=1` distribution match [from logits to a chosen token](/learn/llm-foundations/from-logits-to-a-chosen-token)'s table exactly, `top-k=3` and `top-p=0.9` agree on the same three survivors, `top-p=0.95` pull in a fourth, and repeated `decode_step` calls never emit anything outside the filtered set. If any of those don't hold, the bug is almost always in the filter step returning probabilities that still include zeroed-out entries in the sum used for renormalization.

## Harden it

**`top_k_filter` breaks silently if `k` exceeds the vocabulary size.** `np.argsort(probs)[-k:]` with `k` larger than `len(probs)` just returns the whole array — no error, so you'll think you filtered when you didn't.

```python
def top_k_filter(probs, k):
    k = min(k, len(probs))   # clamp instead of silently no-opping past the array bound
    ...
```

**Ties in top-p can include one token too many or too few.** `np.searchsorted` on a cumulative sum with floating-point ties can land on either side of the boundary depending on tiny rounding differences. For anything production-facing, treat top-p's cutoff as "first index where cumulative mass is `>= p`," computed with an explicit loop or `np.searchsorted(cumulative, p, side='left')`, and test it against a distribution with genuine ties.

**`T` near 0 divides by a near-zero number.** `logits / 1e-8` produces enormous values that overflow `np.exp` even after max-subtraction, turning into `nan`. Clamp `T` to a small positive floor (like `1e-4`) rather than letting a caller pass `0.0001` and get garbage back with no error.

## Extend it

Add frequency and repetition penalties by subtracting a term from `logits` proportional to how many times each token already appears in the generated sequence, before the temperature step — that's the mechanism [repetition penalties and constrained decoding](/learn/llm-foundations/repetition-penalties-and-constrained-decoding) covers in depth, including a worked JSON-masking example that plugs into this same pipeline at the filter stage. Try implementing min-p — keep any token whose probability is at least some fraction of the top token's probability, `probs >= min_p_ratio * probs.max()` — and compare its surviving set against top-p's on a very confident distribution (`logits = [10, 0, 0, 0]`) versus a very uncertain one (`logits = [1, 0.9, 0.8, 0.7]`); [greedy, beam, nucleus, and min-p decoding](/learn/llm-foundations/greedy-beam-sampling-min-p) explains why they diverge exactly there.

**Related:** [From Logits to a Chosen Token](/learn/llm-foundations/from-logits-to-a-chosen-token) · [Sampling: Temperature, Top-k, and Top-p](/learn/llm-foundations/sampling-temperature-top-p) · [Temperature as Flattening the Distribution](/learn/llm-foundations/temperature-as-flattening) · [Greedy, Beam, Nucleus, and Min-p Decoding](/learn/llm-foundations/greedy-beam-sampling-min-p) · [Repetition Penalties and Constrained Decoding](/learn/llm-foundations/repetition-penalties-and-constrained-decoding) · [Logits to Probabilities, by Hand](/learn/llm-foundations/logits-to-probabilities-by-hand)
