---
title: "Sinusoidal vs Learned vs RoPE vs ALiBi"
track: "llm-foundations"
status: live
summary: "Four ways to solve the same problem — telling attention where a token sits — with very different extrapolation and cost tradeoffs."
duration: "8 min read"
---

[Why order needs positional encoding](/learn/llm-foundations/why-order-needs-positional-encoding) established that something has to inject position — it didn't say what. Four schemes have actually shipped in production models, and they don't just differ in formula, they differ in *where in the computation* position gets injected at all.

## Sinusoidal (the original Transformer)

**How it works.** A fixed vector is computed directly from a token's position using sine and cosine waves at a range of frequencies, and added to the token embedding once, before the first attention layer. No parameters are learned — the function is entirely determined by position and dimension index, decided at design time. See [positional encoding, explained](/learn/llm-foundations/positional-encoding-explained) for the exact formula.

**When it wins.** Simplicity and zero parameter cost — useful in the original architecture and still a reasonable pedagogical baseline, or a choice when you specifically want a deterministic function with no extra weights to store or train.

**Failure mode.** It's an *additive* signal baked into the embedding at the input layer, so every downstream layer has to indirectly recover relative-position information from an absolute-position signal that's already been mixed into the content. In practice, generalization past trained sequence lengths is weaker than the "it's periodic, so it should extrapolate" intuition suggests — the specific frequency combinations that show up at very long positions were never seen in training.

**Relative cost.** Essentially free — a fixed function evaluated once per token, no extra parameters, negligible compute.

## Learned absolute positional embeddings (GPT-2, BERT, early GPT-3)

**How it works.** A second embedding table, shape `(max_sequence_length, d_model)`, learned the same way the token embedding table is learned. Position `i`'s row gets added to whatever token sits at position `i`, once, at the input.

**When it wins.** When sequence length is reliably short and fixed-ish (classification, short-form generation), and you'd rather let training find whatever positional signal works best than commit to a fixed mathematical form.

**Failure mode.** The table has a hard maximum size baked in at training time. There is no row for position 5,000 if `max_sequence_length` was 2,048 — the model has literally never seen, let alone learned anything about, positions beyond that cutoff. Extrapolation isn't just weaker here, it's structurally undefined past the trained maximum, which is precisely the problem [RoPE](/learn/llm-foundations/rotary-position-embeddings) and ALiBi were built to avoid.

**Relative cost.** An extra `max_sequence_length × d_model` parameters — for long trained context lengths this is a real, if usually modest, addition to total parameter count, on top of the token embedding table from [the embedding lookup table](/learn/llm-foundations/the-embedding-lookup-table).

## RoPE (Llama family, GPT-NeoX, PaLM, Mistral, most current open-weight models)

**How it works.** Instead of touching the embedding, RoPE rotates the query and key vectors — inside the attention computation, fresh at every layer — by an angle proportional to position. The payoff: the dot product between a rotated query at position `m` and a rotated key at position `n` depends only on the relative offset `m - n`, not on the absolute positions themselves. The full mechanism and derivation live in [RoPE: Rotary Position Embeddings, Explained](/learn/llm-foundations/rotary-position-embeddings) and get built from scratch in [implement RoPE in numpy](/learn/llm-foundations/implement-rope-in-numpy).

**When it wins.** Anywhere relative position matters more than absolute position — which is most of language — and especially where reasonable generalization somewhat past the trained context length matters, since the model has seen every relative offset constantly during training regardless of where in the sequence it occurred.

**Failure mode.** "Better extrapolation than absolute schemes" is not "unlimited extrapolation." Pushed far enough past the trained length, quality still degrades, because the rotation frequencies were tuned for a specific range of relative distances. Fixing this well past the trained range takes the scaling techniques covered in [context extrapolation and RoPE scaling](/learn/llm-foundations/context-extrapolation-and-rope-scaling), not RoPE alone.

**Relative cost.** No extra learned parameters — the rotation is a fixed geometric function of position and dimension. It does add a small amount of compute at every layer (rotating queries and keys before every attention call), rather than paying the cost once at the input, and it interacts directly with the [KV cache](/learn/llm-foundations/the-kv-cache), since cached keys carry their rotation baked in at their fixed position.

## ALiBi (BLOOM, MPT)

**How it works.** ALiBi touches neither the embedding nor the query/key vectors. It adds a fixed, position-dependent penalty directly to the raw attention scores before softmax — a bias proportional to the distance between the query and key positions, scaled by a fixed, per-head slope decided at architecture design time (not learned). Nearby tokens get little or no penalty; distant tokens get pushed down, making the model attend more locally by construction, everywhere, without any positional signal touching the tokens' actual representations.

**When it wins.** Contexts where robust "train short, generalize long" behavior is a priority — ALiBi was specifically built and evaluated for exactly that pattern: train on shorter sequences, then run inference at longer sequence lengths and still get reasonable behavior, without the model needing to have seen those lengths in training.

**Failure mode.** The fixed distance penalty is a strong, hard-coded prior toward locality, baked in independent of learned attention patterns — for tasks that genuinely need strong long-range dependencies between distant tokens rather than mostly-local attention, that built-in recency bias can work against the model rather than for it.

**Relative cost.** Extremely cheap — a static, precomputed bias matrix added to attention scores, with no rotation, no extra embedding table, and no learned parameters at all.

## Decision table

| Scheme | Where applied | Learned parameters | Encodes | Extrapolation |
|---|---|---|---|---|
| Sinusoidal | Added to embedding, once | None | Absolute position | Weak past trained length |
| Learned absolute | Added to embedding, once | `max_len × d_model` | Absolute position | None past trained length |
| RoPE | Rotates Q/K, every layer | None | Relative position | Moderate; strong with scaling |
| ALiBi | Bias on attention scores, every layer | None | Relative distance (via fixed penalty) | Strong by design |

## How to choose

If you're fine-tuning or prompting an existing model, this isn't your decision — the scheme is fixed by the architecture you loaded, and it's worth knowing which one so you know what to expect as you approach that model's trained context length. If you're designing a new model:

- Default to **RoPE** — it's the de facto standard across current open-weight and most production LLMs, composes cleanly with the [KV cache](/learn/llm-foundations/the-kv-cache), and pairs with well-understood scaling techniques to extend context after pretraining.
- Consider **ALiBi** specifically when robust generalization to sequence lengths well beyond training is the priority and you're comfortable with its built-in locality bias.
- Reach for **learned absolute embeddings** only when sequence length is small and fixed and simplicity outweighs any need for length flexibility.
- Treat **sinusoidal** as a historical baseline and teaching tool rather than a first choice for a new model today.

**Related:** [Why Order Needs Positional Encoding](/learn/llm-foundations/why-order-needs-positional-encoding), [RoPE: Rotary Position Embeddings, Explained](/learn/llm-foundations/rotary-position-embeddings), [Context Extrapolation and RoPE Scaling](/learn/llm-foundations/context-extrapolation-and-rope-scaling), [The KV Cache](/learn/llm-foundations/the-kv-cache)
