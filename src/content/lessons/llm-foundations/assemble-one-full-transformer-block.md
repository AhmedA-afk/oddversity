---
title: "Assemble One Full Transformer Block"
track: "llm-foundations"
status: live
summary: "Wire masked multi-head attention, the FFN, and pre-norm residuals into one block, stack two, and verify the shape holds."
duration: "9 min read"
---

Every piece is built: masked attention from [Watching the Mask Change the Softmax](/learn/llm-foundations/watching-the-mask-change-the-softmax), the multi-head split from [Implement Multi-Head Attention](/learn/llm-foundations/implement-multi-head-attention), the FFN from [The Feed-Forward Block and Its Role](/learn/llm-foundations/the-feed-forward-block-role), and pre-norm residuals from [Why Pre-Norm Won, and What RMSNorm Changes](/learn/llm-foundations/why-pre-norm-won-and-rmsnorm). This lesson bolts them together into one working block and proves the property that makes [the transformer architecture](/learn/llm-foundations/the-transformer-architecture) work at all: stacking.

## What we're building

One complete pre-norm transformer block — `x = x + MHA(RMSNorm(x))` then `x = x + FFN(RMSNorm(x))` — plus a two-block stack run on a toy input, with an explicit shape check confirming the output matches the input.

## Setup

```python
import numpy as np

def softmax(x, axis=-1):
    x = x - np.max(x, axis=axis, keepdims=True)
    e = np.exp(x)
    return e / np.sum(e, axis=axis, keepdims=True)

def rms_norm(x, gamma, eps=1e-6):
    # from Why Pre-Norm Won, and What RMSNorm Changes
    return x / np.sqrt(np.mean(x**2, axis=-1, keepdims=True) + eps) * gamma

def attention(Q, K, V, mask=None):
    d_k = Q.shape[-1]
    scores = Q @ np.swapaxes(K, -1, -2) / np.sqrt(d_k)
    if mask is not None:
        scores = np.where(mask, -np.inf, scores)
    weights = softmax(scores, axis=-1)
    return weights @ V

def split_heads(t, h, head_dim):
    seq_len = t.shape[0]
    return np.transpose(t.reshape(seq_len, h, head_dim), (1, 0, 2))

def merge_heads(t, h, head_dim, seq_len):
    return np.transpose(t, (1, 0, 2)).reshape(seq_len, h * head_dim)

def gelu(x):
    return 0.5 * x * (1.0 + np.tanh(np.sqrt(2 / np.pi) * (x + 0.044715 * x**3)))
```

Every function here was built and shape-checked in earlier lessons in this module — nothing new is introduced except the composition.

## Build it

### Step 1: multi-head attention as one callable

```python
def multi_head_attention(x, W_q, W_k, W_v, W_o, h, mask):
    seq_len, d_model = x.shape
    head_dim = d_model // h
    Q, K, V = x @ W_q, x @ W_k, x @ W_v
    Qh, Kh, Vh = (split_heads(t, h, head_dim) for t in (Q, K, V))
    out = attention(Qh, Kh, Vh, mask=mask)
    merged = merge_heads(out, h, head_dim, seq_len)
    return merged @ W_o
```

Identical to [Implement Multi-Head Attention](/learn/llm-foundations/implement-multi-head-attention), just packaged as one function that takes `x` and returns something the same shape as `x`.

### Step 2: the feed-forward block

```python
def feed_forward(x, W1, W2):
    return gelu(x @ W1) @ W2
```

`W1` is `(d_model, 4 * d_model)`, `W2` is `(4 * d_model, d_model)` — the expand-then-contract shape from [The Feed-Forward Block and Its Role](/learn/llm-foundations/the-feed-forward-block-role). Note that `feed_forward` takes and returns `(seq_len, d_model)` too: same shape contract as attention.

### Step 3: one transformer block, pre-norm

```python
def transformer_block(x, params, h, mask):
    attn_out = multi_head_attention(
        rms_norm(x, params["ln1_gamma"]),
        params["W_q"], params["W_k"], params["W_v"], params["W_o"],
        h, mask,
    )
    x = x + attn_out                                    # residual add #1

    ff_out = feed_forward(rms_norm(x, params["ln2_gamma"]), params["W1"], params["W2"])
    x = x + ff_out                                       # residual add #2
    return x
```

> **Why this order?** Norm goes *inside* each branch, applied to a copy of `x` before it enters the sublayer — never to `x` itself before the `+`. That's the pre-norm placement from [Why Pre-Norm Won, and What RMSNorm Changes](/learn/llm-foundations/why-pre-norm-won-and-rmsnorm): the raw, unnormalized `x` is what actually gets added back, keeping the residual path clean of any normalization Jacobian. Two independent norms — `ln1_gamma` for attention's branch, `ln2_gamma` for the FFN's branch — because each sublayer needs its own learned rescaling, tuned to what that specific sublayer expects to see.

### Step 4: initialize parameters for one block

```python
def init_block_params(rng, d_model, h):
    d_ff = 4 * d_model
    scale = 0.1
    return {
        "W_q": rng.standard_normal((d_model, d_model)) * scale,
        "W_k": rng.standard_normal((d_model, d_model)) * scale,
        "W_v": rng.standard_normal((d_model, d_model)) * scale,
        "W_o": rng.standard_normal((d_model, d_model)) * scale,
        "W1":  rng.standard_normal((d_model, d_ff)) * scale,
        "W2":  rng.standard_normal((d_ff, d_model)) * scale,
        "ln1_gamma": np.ones(d_model),
        "ln2_gamma": np.ones(d_model),
    }
```

### Step 5: stack two blocks

```python
def stacked_blocks(x, block_params_list, h, mask):
    for params in block_params_list:
        x = transformer_block(x, params, h, mask)
    return x
```

Each block gets its *own* set of parameters — two blocks means two independent `init_block_params(...)` calls, not the same weights reused twice. Nothing about `transformer_block` changes to support stacking; it already takes `(seq_len, d_model)` and returns `(seq_len, d_model)`, so calling it again on its own output is the whole trick.

## Run it

```python
rng = np.random.default_rng(0)
seq_len, d_model, h = 4, 8, 2
x = rng.standard_normal((seq_len, d_model))          # toy input, e.g. "The cat sat down"
mask = np.triu(np.ones((seq_len, seq_len), dtype=bool), k=1)

blocks = [init_block_params(rng, d_model, h) for _ in range(2)]
output = stacked_blocks(x, blocks, h, mask)

assert output.shape == x.shape        # (4, 8) in, (4, 8) out
assert output.shape == (seq_len, d_model)
print(f"input shape:  {x.shape}")
print(f"output shape: {output.shape}")
```

`output.shape == x.shape` is the property that makes stacking possible at all: because a transformer block's output is a valid input to another transformer block, you can chain `N` of them — 2 here, 96 in a large model — without any adapter, reshaping, or dimension-matching logic between blocks. If `transformer_block` changed `d_model` on the way through, stacking would need a projection at every junction; it doesn't, so it doesn't.

## Harden it

- **Assert the shape invariant after every block, not just at the end**, while developing — a bug introduced in block 1 is much easier to trace to its source before it's propagated through block 2's own transformation.
- **Give each block independent parameters, and verify it.** A subtle setup bug is initializing one `params` dict and reusing it for every block in the list — `assert blocks[0]["W_q"] is not blocks[1]["W_q"]` catches that immediately.
- **Check the mask is built once and shared, not rebuilt per block with different logic.** All blocks in a real model attend over the same sequence positions with the same causal constraint; the mask is a property of the sequence, not of any individual block.

## Extend it

Two natural next steps once this runs: swap the mask for `None` and watch every position gain access to the future (this is the encoder-style, non-causal variant mentioned in [Causal Masking Mechanics](/learn/llm-foundations/causal-masking-mechanics)); or increase the block count to 8 or 16 and confirm the same shape assertion still holds at any depth — depth is a `for` loop, not a change to the block's internals. From here, [Transformer Block Wiring Bugs](/learn/llm-foundations/transformer-block-wiring-bugs) catalogs exactly what breaks if any one of the wiring choices in `transformer_block` above gets flipped, and [The Forward Pass as a Stack of Blocks](/learn/llm-foundations/the-forward-pass-as-a-stack-of-blocks) zooms out to where this stack sits inside a full model, from embeddings in to logits out.

**Related:** [The Transformer Architecture](/learn/llm-foundations/the-transformer-architecture), [Implement Multi-Head Attention](/learn/llm-foundations/implement-multi-head-attention), [Why Pre-Norm Won, and What RMSNorm Changes](/learn/llm-foundations/why-pre-norm-won-and-rmsnorm), [Transformer Block Wiring Bugs](/learn/llm-foundations/transformer-block-wiring-bugs)
