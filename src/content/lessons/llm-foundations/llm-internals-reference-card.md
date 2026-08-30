---
title: "LLM Internals Reference Card"
track: "llm-foundations"
status: live
summary: "One printable page: forward-pass shapes, the core formulas, the training pipeline, and the decoding knobs — kept beside the capstone."
duration: "6 min read"
---

Everything else in this track expands one row of this page into a full lesson. Print this, keep it next to the [tiny-GPT capstone](/learn/llm-foundations/build-a-tiny-gpt-capstone), and use it to check your shapes and formulas without re-reading the derivations.

## Forward-pass shapes

For batch size `B`, sequence length `T`, model width `d_model`, `n_heads` heads of dimension `d_head = d_model / n_heads`, feed-forward width `d_ff`, and vocabulary size `V`:

| Stage | Shape | Notes |
|---|---|---|
| Input token IDs | `[B, T]` | integers, indices into the vocabulary |
| Token embeddings | `[B, T, d_model]` | lookup into the embedding table, `[V, d_model]` |
| + positional info | `[B, T, d_model]` | added (sinusoidal/learned) or applied via rotation (RoPE) — same shape either way |
| Q, K, V per head | `[B, n_heads, T, d_head]` | one linear projection each, then reshaped/split across heads |
| Attention scores | `[B, n_heads, T, T]` | `Q @ K^T`, before and after the causal mask and softmax |
| Attention output | `[B, T, d_model]` | weighted sum of V, heads concatenated back together |
| FFN hidden | `[B, T, d_ff]` | typically `d_ff ≈ 4 × d_model` (dense) or narrower with a gate (SwiGLU) |
| Logits | `[B, T, V]` | final hidden states projected through the unembedding matrix |

## Key formulas

**Softmax** (turns logits into a probability distribution):
```
softmax(z)_i = exp(z_i) / sum_j(exp(z_j))
```

**Scaled dot-product attention:**
```
Attention(Q, K, V) = softmax(Q @ K^T / sqrt(d_head) + mask) @ V
```
The `sqrt(d_head)` divisor keeps dot-product magnitudes from growing with dimension and pushing softmax into a near-one-hot, low-gradient regime. `mask` is `-inf` on disallowed (future) positions for causal attention.

**RoPE rotation** (applied to Q and K before the dot product, for position `p` and feature pair `(x_{2i}, x_{2i+1})`):
```
x'_{2i}   = x_{2i}   * cos(p * theta_i) - x_{2i+1} * sin(p * theta_i)
x'_{2i+1} = x_{2i}   * sin(p * theta_i) + x_{2i+1} * cos(p * theta_i)
```
`theta_i` shrinks geometrically across feature pairs so different pairs rotate at different frequencies — this is what makes the dot product between two rotated vectors depend on their *relative* position.

**Cross-entropy loss** (pretraining objective, per token):
```
loss = -(1/T) * sum_t log P(x_t | x_1, ..., x_{t-1})
```

**Perplexity** (loss in an interpretable unit — "effective number of equally-likely next tokens"):
```
perplexity = exp(loss)
```

## The pretraining-to-alignment pipeline

| Stage | Objective | Data | Produces |
|---|---|---|---|
| **Pretraining** | Next-token cross-entropy | Massive, broad web/code/book corpus | A base model — completes text, follows no instructions reliably |
| **SFT (supervised fine-tuning)** | Cross-entropy on curated (instruction, response) pairs | Smaller, high-quality, human- or model-written | An instruction-following model |
| **RLHF / DPO** | Maximize a learned or implicit preference signal | Human preference judgments between candidate responses | An aligned, "helpful and harmless" chat model |
| **Reasoning RL** *(optional, reasoning models)* | Reward on checkable task outcomes (math, code, logic) | Verifiable-answer problem sets | A model that benefits from longer chains of thought |

Full pipeline: [from base model to assistant](/learn/llm-foundations/from-base-model-to-assistant-pipeline).

## Decoding knobs

| Knob | What it does | Start here, then measure |
|---|---|---|
| **Temperature** | Divides logits before softmax — lower flattens the distribution toward the argmax, higher spreads probability mass out | `0.7`–`1.0` for open-ended generation, `0`–`0.3` for tasks with one right answer |
| **Top-p (nucleus)** | Samples only from the smallest set of tokens whose cumulative probability exceeds `p`, discarding the long unlikely tail | `0.9`–`0.95` as a default; lower it if outputs ramble |
| **Top-k** | Samples only from the `k` highest-probability tokens, regardless of their cumulative mass | Often layered with top-p rather than used alone; `k=40`–`50` is a common floor |
| **Repetition penalty** | Down-weights tokens already used recently in the output | Apply only if you observe looping — it's a patch, not a default |
| **Max tokens** | Hard stop on generation length | Set to the task's real expected length plus headroom, not a large default that lets runaway generations burn budget |

## Behavior quick facts

- **Compute identity:** `C ≈ 6 × N × D` (FLOPs ≈ 6 × parameters × training tokens). Compute-optimal split is roughly `D ≈ 20N` — see [scaling laws: what they predict](/learn/llm-foundations/scaling-laws-what-they-predict).
- **Emergence can be a metric artifact:** an exact-match score on a `k`-part task scales as `p^k` even when the underlying per-part accuracy `p` improves perfectly smoothly — see [emergent abilities and the mirage debate](/learn/llm-foundations/emergent-abilities-and-the-mirage-debate).
- **In-context learning's best-understood circuit is the induction head:** find the previous occurrence of the current token, copy what followed it — see [in-context learning mechanics](/learn/llm-foundations/in-context-learning-mechanics).
- **Hallucination traces back to the training objective, not a bug:** no reject option in next-token cross-entropy, and RLHF can push confident phrasing over honest hedging — see [why LLMs hallucinate](/learn/llm-foundations/why-llms-hallucinate).

## Capstone build checklist

The pieces the [tiny-GPT capstone](/learn/llm-foundations/build-a-tiny-gpt-capstone) assembles into one working model, each with its own from-scratch lesson earlier in this track:

- [ ] Tokenizer — build BPE from scratch
- [ ] Positional info — implement RoPE in numpy
- [ ] Attention — implement causally-masked multi-head attention
- [ ] A full block — attention + FFN + residuals + norm, assembled end to end
- [ ] Sampling — implement temperature, top-k, top-p

**Related:** [Build a Tiny GPT and Watch It Learn](/learn/llm-foundations/build-a-tiny-gpt-capstone), [Scaling Laws: What They Predict](/learn/llm-foundations/scaling-laws-what-they-predict), [Emergent Abilities and the Mirage Debate](/learn/llm-foundations/emergent-abilities-and-the-mirage-debate), [In-Context Learning Mechanics](/learn/llm-foundations/in-context-learning-mechanics), [Why LLMs Hallucinate](/learn/llm-foundations/why-llms-hallucinate), [From Base Model to Assistant: the Pipeline](/learn/llm-foundations/from-base-model-to-assistant-pipeline)
