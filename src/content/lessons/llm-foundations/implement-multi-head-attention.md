---
title: "Implement Multi-Head Attention"
track: "llm-foundations"
status: live
summary: "Build full multi-head attention in numpy end to end, tracking every reshape so the split into heads never gets scrambled."
duration: "9 min read"
---

Single-head attention from [Scaled Dot-Product Attention in Numpy](/learn/llm-foundations/scaled-dot-product-attention-in-numpy) is most of the work. This lesson wraps it with the projections, the head split, and the output projection that turn it into the real thing — with shape assertions at every join so a reshape mistake fails loudly instead of silently.

## What we're building

Full multi-head attention: project an input sequence into Q, K, V; split each into `h` heads; run masked scaled dot-product attention independently per head; concatenate; apply one more learned projection back to `d_model`.

## Setup

```python
import numpy as np

def softmax(x, axis=-1):
    x = x - np.max(x, axis=axis, keepdims=True)
    e = np.exp(x)
    return e / np.sum(e, axis=axis, keepdims=True)

def attention(Q, K, V, mask=None):
    d_k = Q.shape[-1]
    scores = Q @ np.swapaxes(K, -1, -2) / np.sqrt(d_k)
    if mask is not None:
        scores = np.where(mask, -np.inf, scores)
    weights = softmax(scores, axis=-1)
    return weights @ V, weights
```

This is the same function from [Scaled Dot-Product Attention in Numpy](/learn/llm-foundations/scaled-dot-product-attention-in-numpy), generalized with `np.swapaxes` so it works whether `Q`/`K` are 2D (`seq_len, d_k`) or have a leading heads dimension (`heads, seq_len, d_k`) — the last two axes are always the ones being multiplied.

We'll use `d_model = 4`, `h = 2` heads, so each head gets `head_dim = 2`, on the same 4-token toy sequence.

```python
seq_len, d_model, h = 4, 4, 2
head_dim = d_model // h
assert d_model % h == 0, "d_model must divide evenly by the number of heads"

rng = np.random.default_rng(0)
x = rng.standard_normal((seq_len, d_model))   # toy input embeddings

W_q = rng.standard_normal((d_model, d_model)) * 0.1
W_k = rng.standard_normal((d_model, d_model)) * 0.1
W_v = rng.standard_normal((d_model, d_model)) * 0.1
W_o = rng.standard_normal((d_model, d_model)) * 0.1
```

## Build it

### Step 1: project to Q, K, V

```python
Q = x @ W_q   # (seq_len, d_model)
K = x @ W_k   # (seq_len, d_model)
V = x @ W_v   # (seq_len, d_model)
assert Q.shape == (seq_len, d_model)
```

Nothing head-specific has happened yet — this is one linear projection over the full width, same as single-head attention.

### Step 2: split into heads

```python
def split_heads(t, h, head_dim):
    seq_len = t.shape[0]
    t = t.reshape(seq_len, h, head_dim)     # (seq_len, h, head_dim)
    return np.transpose(t, (1, 0, 2))        # (h, seq_len, head_dim)

Qh = split_heads(Q, h, head_dim)   # (2, 4, 2)
Kh = split_heads(K, h, head_dim)
Vh = split_heads(V, h, head_dim)
assert Qh.shape == (h, seq_len, head_dim)
```

> **Why this order?** `reshape(seq_len, h, head_dim)` only works correctly because the last axis of `Q` (width `d_model`) is laid out as `h` contiguous chunks of `head_dim` each — reshape never moves data, it only reinterprets the existing memory layout. The `transpose` that follows then moves the heads axis to the front *without* touching which values belong to which token or which head. Reshaping into `(seq_len, h, head_dim)` and transposing, in that order, is what keeps every token's data attached to the right position across the split — do the transpose first, or reshape with axes in a different order, and you scramble which slice of the embedding each head actually sees.

### Step 3: run attention per head, with the causal mask

```python
mask = np.triu(np.ones((seq_len, seq_len), dtype=bool), k=1)   # from Causal Masking Mechanics
# broadcasts across the leading heads axis: same mask, every head
head_outputs, head_weights = attention(Qh, Kh, Vh, mask=mask)
assert head_outputs.shape == (h, seq_len, head_dim)
assert head_weights.shape == (h, seq_len, seq_len)
```

Because `attention` uses `np.swapaxes(K, -1, -2)` on the *last two* axes, it operates independently on each head's `(seq_len, head_dim)` slice without any extra looping — numpy broadcasts the leading `(h,)` dimension automatically. Each head produces its own `(seq_len, seq_len)` attention matrix; nothing is shared between heads at this step.

### Step 4: concatenate heads back together

```python
def merge_heads(t, h, head_dim, seq_len):
    t = np.transpose(t, (1, 0, 2))          # (seq_len, h, head_dim)
    return t.reshape(seq_len, h * head_dim)  # (seq_len, d_model)

merged = merge_heads(head_outputs, h, head_dim, seq_len)
assert merged.shape == (seq_len, d_model)
```

This is `split_heads` run in reverse, in the exact reverse order: transpose the heads axis back behind the sequence axis, *then* reshape the last two axes back into one `d_model`-wide axis. Reshaping before transposing here would silently interleave different heads' values into the same token's vector — a scrambling bug covered in [Transformer Block Wiring Bugs](/learn/llm-foundations/transformer-block-wiring-bugs).

### Step 5: the output projection

```python
output = merged @ W_o
assert output.shape == (seq_len, d_model)
```

`W_o` is what lets information from head 1 and head 2 actually interact — without it, every downstream layer would receive the two heads' outputs sitting side by side, untouched, with no way to combine a signal from one with a signal from the other.

## Run it

```python
def multi_head_attention(x, W_q, W_k, W_v, W_o, h, mask=None):
    seq_len, d_model = x.shape
    head_dim = d_model // h
    Q, K, V = x @ W_q, x @ W_k, x @ W_v
    Qh, Kh, Vh = (split_heads(t, h, head_dim) for t in (Q, K, V))
    out, weights = attention(Qh, Kh, Vh, mask=mask)
    merged = merge_heads(out, h, head_dim, seq_len)
    return merged @ W_o, weights

result, weights = multi_head_attention(x, W_q, W_k, W_v, W_o, h, mask=mask)
assert result.shape == x.shape   # the round trip back to d_model is exact
```

That last assertion is the one to internalize: whatever `h` and `head_dim` you choose, multi-head attention's output shape always matches its input shape, `(seq_len, d_model)`. That shape-preservation is what [Assemble One Full Transformer Block](/learn/llm-foundations/assemble-one-full-transformer-block) depends on to stack blocks — a block that changed shape couldn't be stacked on top of itself.

## Harden it

- **Assert `d_model % h == 0` up front**, as done in setup — a head count that doesn't divide the model dimension evenly is a configuration error, not something to silently truncate or pad around.
- **Check the mask broadcasts to the right shape.** A `(seq_len, seq_len)` mask broadcasts cleanly across a leading `(h, seq_len, seq_len)` scores tensor because numpy aligns trailing dimensions — but if you batch across multiple sequences too, you'll need `(batch, 1, seq_len, seq_len)` so the mask also broadcasts over the batch axis.
- **Assert head_weights rows sum to 1** per head (`np.allclose(head_weights.sum(-1), 1.0)`) as a running sanity check — a violated assertion here catches a masking or reshape bug immediately instead of letting it propagate silently into training.

## Extend it

Try changing `h` from 2 to 4 (with `d_model = 4`, giving `head_dim = 1`) and rerun — every head degenerates to a single scalar query/key comparison, and you can watch what happens to expressiveness at the extreme. Then compare against [What Different Attention Heads Learn](/learn/llm-foundations/what-different-heads-learn) to see what actual trained heads specialize in once you're past this toy scale, and against [Grouped-Query and Multi-Query Attention](/learn/llm-foundations/grouped-query-attention) for how production models cut the per-head K/V memory cost this implementation doesn't yet worry about.

**Related:** [Multi-Head Attention: Why Many Heads](/learn/llm-foundations/multi-head-attention-why-many-heads), [Scaled Dot-Product Attention in Numpy](/learn/llm-foundations/scaled-dot-product-attention-in-numpy), [Transformer Block Wiring Bugs](/learn/llm-foundations/transformer-block-wiring-bugs), [Assemble One Full Transformer Block](/learn/llm-foundations/assemble-one-full-transformer-block)
