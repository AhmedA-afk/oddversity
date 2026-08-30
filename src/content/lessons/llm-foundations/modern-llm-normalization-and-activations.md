---
title: "The Modern LLM Stack: RMSNorm, SwiGLU, and No Biases"
track: "llm-foundations"
status: live
summary: "Why RMSNorm, gated SwiGLU feed-forward blocks, and dropped bias terms replaced the 2017 transformer's original defaults."
duration: "8 min read"
---

*This is a deep-dive that assumes you already know why [pre-norm and RMSNorm](/learn/llm-foundations/why-pre-norm-won-and-rmsnorm) and [RoPE](/learn/llm-foundations/rotary-position-embeddings) work individually — those lessons cover each mechanism in depth. This one is about the pattern across all of these changes together: nearly every default choice in the original 2017 transformer has been replaced, and it's worth asking why each replacement stuck.*

## The 2017 baseline, for reference

The original transformer used LayerNorm (mean-centered, with learned scale and bias) in a post-norm arrangement, a feed-forward block of two linear layers with a GeLU or ReLU nonlinearity between them, sinusoidal positional encodings added once at the input, and bias terms on essentially every linear and normalization layer — the standard defaults for a linear layer at the time. A near-universal modern recipe — used across most current open-weight LLM families — instead pairs pre-norm RMSNorm, a SwiGLU-gated feed-forward block, rotary position embeddings, and no bias terms anywhere. None of these four swaps happened in isolation; each was justified empirically, and together they define what "a modern transformer block" means today.

## Swap 1: LayerNorm to RMSNorm

LayerNorm re-centers activations to zero mean and rescales to unit variance before applying a learned scale and shift. RMSNorm drops the re-centering step entirely and rescales only by the root-mean-square of the activations — one fewer statistic to compute, and empirically no meaningful quality loss from dropping it. Combined with the shift from post-norm to pre-norm placement (normalizing *before* each sub-layer rather than after), this is the single change with the most direct effect on training stability at depth. The full mechanism and the empirical case for it are covered in [Why Pre-Norm Won, and RMSNorm](/learn/llm-foundations/why-pre-norm-won-and-rmsnorm) — this lesson treats it as one piece of the larger pattern rather than re-deriving it.

## Swap 2: GeLU feed-forward to SwiGLU gated feed-forward

This is the swap most worth deriving carefully, since it's not covered elsewhere in this track.

The original feed-forward block is two linear layers with a nonlinearity between them:

```
FFN(x) = W2 · GeLU(W1·x)
```

A gated variant, SwiGLU, adds a third weight matrix and a multiplicative gate instead of a single nonlinearity:

```
FFN_SwiGLU(x) = W2 · (Swish(W1·x) ⊙ (W3·x))
```

where `Swish(z) = z · sigmoid(z)` (also called SiLU) and `⊙` is elementwise multiplication. `W1·x` is passed through the Swish nonlinearity to act as a *gate*, and it's multiplied elementwise against a second, separate linear projection `W3·x` of the same input — so the network can learn, per feature and per position, how much of that second projection to let through, rather than applying one fixed nonlinearity uniformly.

**The parameter-count wrinkle.** SwiGLU needs three weight matrices (`W1`, `W2`, `W3`) instead of two, so keeping the same hidden width as a plain FFN would grow the parameter count by roughly 50%. To keep the comparison fair, the convention (used in LLaMA's published configs, among others) is to shrink the feed-forward hidden dimension to compensate. Setting parameter counts equal: a plain FFN with hidden width `d_ff = 4·d_model` costs roughly `2 · d_model · d_ff = 8 · d_model²` parameters (ignoring biases); matching that with three matrices means `3 · d_model · d_ff_swiglu = 8 · d_model²`, giving `d_ff_swiglu ≈ (8/3) · d_model` — around two-thirds of the original hidden width. This is why SwiGLU feed-forward blocks in practice use a noticeably narrower hidden dimension than the "4x" rule of thumb from the original architecture, at roughly matched total parameter count.

**Why it stuck.** Gated linear units — of which SwiGLU is one variant — were shown to reduce loss at matched parameter count across model scales, compared to the plain GeLU/ReLU FFN. There isn't a fully settled theoretical account of exactly why; the working intuition is that the multiplicative gate gives the network a learned, per-position, per-feature "how much of this to let through" control, similar in spirit to the gating mechanisms in LSTMs, but applied within a single feed-forward layer rather than recurrently across time steps. It's one of the empirical findings in this space that simply held up as models scaled, without a single, fully agreed-upon theoretical explanation. See [The Feed-Forward Block](/learn/llm-foundations/the-feed-forward-block) and [FFN as Key-Value Memory](/learn/llm-foundations/ffn-as-key-value-memory) for what this layer is doing more broadly — the gating change alters *how* the transformation happens, not the memory-lookup role it plays.

## Swap 3: sinusoidal or learned positions to RoPE

Recap only: the original transformer added a fixed sinusoidal (or, in later variants, a learned) position signal once, at the input embedding. Rotary position embeddings instead rotate the query and key vectors inside every attention layer by an angle that depends on token position, which bakes relative position directly into the attention score rather than into the input representation. This has become close to universal in current models because it generalizes better to sequence lengths beyond what was seen in training and composes naturally with the dot-product structure of attention itself. The full mechanics and how RoPE compares to the alternatives are in [Rotary Position Embeddings](/learn/llm-foundations/rotary-position-embeddings) and [Sinusoidal vs. Learned vs. RoPE vs. ALiBi](/learn/llm-foundations/sinusoidal-vs-learned-vs-rope-vs-alibi).

## Swap 4: dropping bias terms

The original architecture includes a bias term on essentially every linear projection and normalization layer — standard practice for feed-forward networks generally at the time. Modern large models typically drop these biases entirely: no bias in the QKV or output projections, none in the feed-forward matrices, none in the normalization layers. The empirical case reported by teams training at this scale (the PaLM paper is a documented example) is that removing bias terms had negligible effect on quality while measurably improving training stability at large scale — fewer terms that can drift or interact awkwardly with the optimizer and with distributed-training setups, for a small saving in parameter count as a side benefit. This is a case where the change is justified almost entirely by "we tried it at scale and it worked better," rather than a derivation from first principles — worth being honest about, since not every modern default has a clean theoretical story behind it.

## Putting it together

```python
# 2017 block
def transformer_block_2017(x):
    x = layer_norm(x + self_attention(x))     # post-norm, LayerNorm
    x = layer_norm(x + ffn_gelu(x))           # post-norm, GeLU FFN, biases throughout
    return x

# modern block
def transformer_block_modern(x):
    x = x + self_attention(rms_norm(x))       # pre-norm, RMSNorm, RoPE applied inside attention
    x = x + ffn_swiglu(rms_norm(x))           # pre-norm, SwiGLU FFN, no biases anywhere
    return x
```

Every one of these four swaps is individually a small change. Stacked across dozens of layers in a large model, they compound into a materially more stable, slightly cheaper, and empirically better-performing default — which is why "modern transformer" now quietly means this specific recipe rather than the original 2017 paper's choices, even though the block-and-residual skeleton from [The Transformer Architecture](/learn/llm-foundations/the-transformer-architecture) hasn't changed at all.

**Related:** [Why Pre-Norm Won, and RMSNorm](/learn/llm-foundations/why-pre-norm-won-and-rmsnorm), [Rotary Position Embeddings](/learn/llm-foundations/rotary-position-embeddings), [The Feed-Forward Block](/learn/llm-foundations/the-feed-forward-block), [Residual Stream and Layer Norm](/learn/llm-foundations/residual-stream-and-layer-norm)
