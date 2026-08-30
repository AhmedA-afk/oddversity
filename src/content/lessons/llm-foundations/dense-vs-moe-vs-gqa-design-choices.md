---
title: "Dense vs MoE vs GQA: Reading Real Design Choices"
track: "llm-foundations"
status: live
summary: "How dense full-attention, dense GQA, dense MQA, and sparse MoE architectures trade training cost, serving memory, and quality — mapped to released models."
duration: "8 min read"
---

Every technique in this module is a lever a design team can pull. Real released models are just specific combinations of those levers. This lesson reads four real combinations back out of their design choices.

## Dense + full multi-head attention

**How it works.** Every query head keeps its own private key and value head — no sharing, the architecture covered in [Multi-Head Attention](/learn/llm-foundations/multi-head-attention) with nothing added to compress it.

**When it wins.** Maximum attention quality per parameter, with the simplest possible attention implementation — nothing to tune about how heads share, because they don't.

**Failure mode.** The full KV cache cost from [KV Cache Memory: MHA vs GQA vs MQA](/learn/llm-foundations/kv-cache-memory-mha-vs-gqa) — the most expensive option to serve at long context or high concurrency, for a quality gain over GQA that's usually small.

**Relative cost.** Highest serving memory of the options here; training cost is comparable to any dense model at the same parameter count. This was the norm for large language models before KV-cache pressure at long-context, high-concurrency serving became a first-order design concern — and it's part of why some early large dense model families used plain MHA at every size, and later families migrated to GQA as serving cost became more central.

## Dense + GQA

**How it works.** Query heads are split into a handful of groups (commonly 8), each sharing one key/value pair — the middle-of-the-spectrum design from [Multi-Query and Grouped-Query Attention](/learn/llm-foundations/multi-query-and-grouped-query-attention).

**When it wins.** This is the closest thing to a modern default: it recovers nearly all of full MHA's quality while cutting KV cache memory by the group-count ratio, which is usually worth far more in practice than the small quality gap it gives up.

**Failure mode.** Still a dense model — every parameter runs on every token, so total training and inference compute scales with total parameter count the way it does for any dense architecture. GQA saves memory and bandwidth, not FLOPs.

**Relative cost.** Training cost is unchanged from an equivalent full-MHA dense model of the same size; serving memory drops by the group-count ratio (commonly 4x–8x). Llama 2's family is a clean real illustration of the transition: its smaller variants use plain multi-head attention, while its largest (70B) variant switches to GQA — because KV cache pressure scales with model width and context length together, and it's the largest model, serving the heaviest load, where that cost bites hardest. Mistral's 7B model and Llama 3 across its released sizes both ship with GQA as the default rather than reserving it only for the largest configuration.

## Dense + MQA

**How it works.** All query heads collapse to a single shared key/value pair — the far end of the GQA spectrum, group count = 1.

**When it wins.** Serving cost is the overriding constraint and the workload can tolerate MQA's somewhat larger quality gap relative to full MHA — the biggest possible KV-cache reduction (proportional to the total head count) for a given model size.

**Failure mode.** Of the three attention configurations here, this gives up the most attention quality, since every head is now limited to the exact same retrieval pool with no grouping to preserve any diversity.

**Relative cost.** Same training cost as any dense model at this size; the smallest serving memory footprint of the dense options — Falcon and PaLM are documented examples that shipped with MQA specifically for this reason.

## Sparse MoE (with GQA in attention)

**How it works.** The feed-forward block is replaced with many parallel experts and a top-k router, as covered in [Mixture of Experts: Routing](/learn/llm-foundations/mixture-of-experts-routing) — while the attention mechanism itself is a separate, independent choice, and most released MoE models pair it with GQA rather than full MHA, since the two techniques attack completely different costs and combine without conflict.

**When it wins.** When you want a much larger total parameter budget — and therefore more model capacity — without a proportional rise in per-token inference compute, as built up in [Why MoE Buys Capacity Without Proportional Compute](/learn/llm-foundations/why-moe-buys-capacity-without-compute). Mixtral 8x7B is a real, published instance of exactly this design: 8 experts per MoE layer, top-2 routing, GQA in the attention layers, with a total parameter count (around 47B, once shared attention and embedding layers are correctly accounted for) noticeably smaller than the naive "8×7B = 56B" reading and an active parameter count per token far smaller still (Mistral's own published figure is roughly 13B active).

**Failure mode.** All the experts must be loaded into memory or spread across devices regardless of how many actually run per token — MoE saves compute, not memory footprint. It also inherits the load-balancing fragility from [MoE Load Balancing and Its Failure Modes](/learn/llm-foundations/moe-load-balancing-and-failure-modes): getting the training dynamics right is a genuinely harder problem than training an equivalent dense model.

**Relative cost.** Training and inference compute track *active* parameters, which can be much smaller than total parameters; memory footprint (for weights) tracks the full total parameter count, same as a dense model that size. This is the one axis where MoE and GQA aren't substitutes for each other: GQA saves the *activation* memory that scales with context and concurrency (the KV cache), while MoE's memory cost is in the *weights* themselves — the two savings stack rather than compete.

## Decision table

| Approach | Training compute | Serving memory (weights) | Serving memory (KV cache) | Quality ceiling | Example |
|---|---|---|---|---|---|
| Dense + full MHA | Standard for its size | Standard for its size | Highest | Highest per-parameter | Early large dense models; smaller Llama 2 sizes |
| Dense + GQA | Standard for its size | Standard for its size | Cut by group ratio (4x–8x typical) | Near full-MHA | Llama 2 70B, Llama 3, Mistral 7B |
| Dense + MQA | Standard for its size | Standard for its size | Cut by head count (largest reduction) | Below GQA | Falcon, PaLM |
| Sparse MoE (+ GQA) | Tracks active params (much lower than total) | Tracks total params (higher than an equivalent-active dense model) | Cut by group ratio, same as any GQA model | High, from large total capacity | Mixtral 8x7B |

## How to choose

If you're training a model from scratch and serving cost at long context or high concurrency is a real constraint — which it is for almost anyone shipping a production model today — GQA is close to a free lunch relative to full MHA, and there's little reason not to default to it. MQA is worth reaching for only when serving cost is so dominant a concern that the extra quality gap versus GQA is an acceptable trade, since GQA already captures most of the memory win at a smaller quality cost. Reaching for sparse MoE is a different kind of decision entirely — it isn't a serving-memory optimization the way GQA is, it's a way to buy more total model capacity without paying its full compute cost, at the price of a genuinely harder training process and a memory footprint that doesn't shrink just because fewer experts run per token. In practice, these choices aren't mutually exclusive: as Mixtral shows, GQA and MoE solve different problems and are routinely combined in the same model.

**Related:** [Multi-Query and Grouped-Query Attention](/learn/llm-foundations/multi-query-and-grouped-query-attention), [Mixture of Experts: Routing](/learn/llm-foundations/mixture-of-experts-routing), [KV Cache Memory: MHA vs GQA vs MQA](/learn/llm-foundations/kv-cache-memory-mha-vs-gqa), [Misreading Parameter Counts](/learn/llm-foundations/misreading-parameter-counts)
