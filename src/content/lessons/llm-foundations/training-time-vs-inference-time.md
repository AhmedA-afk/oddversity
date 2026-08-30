---
title: "Training Time vs Inference Time"
track: "llm-foundations"
status: live
summary: "Pretraining, fine-tuning, generation, and scoring are the same weights running in four different modes."
duration: "8 min read"
---

The exact same weights behave completely differently depending on which of four modes they're running in — and confusing "weights get updated" with "a forward pass happens" is where most training-vs-inference confusion starts.

## The four regimes

### 1. Pretraining

**How it works:** the model is shown a full sequence of real text and — via **teacher forcing** — is fed the true previous tokens at every position simultaneously, not its own guesses. A loss is computed in parallel at *every* position (predicted-next-token vs. actual-next-token), then backpropagation runs through the entire stack of blocks, updating every weight to make those predictions slightly better.

**When it wins:** this is the only regime where the weights actually get their values from data — it's the foundation everything else builds on. See [pretraining, explained](/learn/llm-foundations/pretraining-explained) for the objective and loss in full.

**Failure mode:** **exposure bias** — training always conditions on the *true* previous tokens, never on tokens the model generated itself, so the model never practices recovering from its own mistakes. At inference, a wrong early token becomes part of the conditioning the model has never actually trained on.

**Relative cost:** enormous. A backward pass costs roughly twice a forward pass, run over a training corpus of billions to trillions of tokens — this is where nearly all of an LLM's total compute budget is spent.

### 2. Fine-tuning

**How it works:** mechanically identical to pretraining — teacher forcing, a loss over all positions, backpropagation through every weight — just starting from already-pretrained weights and running over a smaller, more curated dataset (instructions, preferences, a narrow domain).

**When it wins:** adapting a general-purpose model to a task, tone, or domain without paying pretraining's full cost again.

**Failure mode:** **catastrophic forgetting** — pushing weights hard toward the fine-tuning set can quietly degrade capabilities the base model had that the fine-tuning data never touched. See [fine-tuning mistakes and forgetting](/learn/llm-foundations/fine-tuning-mistakes-forgetting).

**Relative cost:** far below pretraining (smaller dataset, fewer steps) but still requires backprop and gradient storage — meaningfully more expensive per token than either inference regime below.

### 3. Generation (standard decoding)

**How it works:** the loop from [the autoregressive generation loop](/learn/llm-foundations/the-autoregressive-generation-loop) — one forward pass produces a distribution over the next token, a token is sampled, appended, and the process repeats. No backward pass, no target to compare against; weights are frozen throughout.

**When it wins:** this is "using" the model in the ordinary sense — chat, completion, code generation, anything that produces new text.

**Failure mode:** exposure bias resurfaces from the other side here — an early low-probability sample can push the model into a part of its input space it rarely saw well-formed continuations for during training, compounding into a worse response.

**Relative cost:** cheap per token relative to training — no backward pass, no gradients kept around — though decoding is typically bottlenecked by memory bandwidth rather than raw arithmetic, a distinction covered in [prefill vs. decode](/learn/llm-foundations/prefill-vs-decode-memory-bound).

### 4. Scoring (teacher-forced inference / prefill)

**How it works:** looks like training's forward pass — a full, already-known sequence is fed in and processed in parallel across all positions, teacher-forced style — but nothing is sampled and no backward pass runs. Used to compute a sequence's log-likelihood or perplexity, or to process a long prompt in one batched pass before autoregressive decoding starts (the "prefill" phase your [KV cache](/learn/llm-foundations/the-kv-cache) gets built during).

**When it wins:** evaluating a model against a benchmark, scoring a candidate answer's probability, or ingesting a long prompt efficiently before generation begins.

**Failure mode:** it's easy to mistake this parallel, training-shaped forward pass for the model "reading and understanding" the prompt in some deliberative sense — mechanically it's still one ordinary batched forward pass producing logits, nothing more.

**Relative cost:** cheap per token like generation (no backward pass), but compute-bound rather than memory-bound, since the whole sequence is available and processed at once instead of one new token at a time.

## Decision table

| Regime | Weights updated? | Positions processed | Backward pass? | Typical use |
|---|---|---|---|---|
| Pretraining | Yes | All, in parallel (teacher-forced) | Yes | Learning the base model from raw text |
| Fine-tuning | Yes | All, in parallel (teacher-forced) | Yes | Adapting a pretrained model |
| Generation | No | One new position per step | No | Producing new text |
| Scoring / prefill | No | All, in parallel (teacher-forced) | No | Evaluating a known sequence, or ingesting a prompt |

## How to choose

You don't usually "choose" a regime the way you'd choose an algorithm — the regime is determined by what you're trying to do. Updating weights from data (from scratch or from a checkpoint) always means teacher forcing plus backprop — pretraining and fine-tuning are the same mechanics at different starting points and scales, not different techniques. Producing text you don't already have means the token-by-token generation loop. Already having the full sequence and just needing probabilities, a loss value, or to process a long prompt efficiently means scoring/prefill — same parallel shape as training's forward pass, but frozen. The one bit worth remembering across all four: **weights only ever move during pretraining and fine-tuning** — generation and scoring can run for as long as you like without changing a single number in the model. See the cross-track [training vs. inference](/learn/ai-foundations/training-vs-inference) page for the same distinction at a broader level, beyond just LLMs.

**Related:** [Parameters, Activations, and Data](/learn/llm-foundations/parameters-activations-and-data), [Pretraining, Explained](/learn/llm-foundations/pretraining-explained), [The KV Cache](/learn/llm-foundations/the-kv-cache)
