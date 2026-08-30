---
title: "Fine-Tuning vs Prompting vs RAG: When to Use What"
track: "llm-foundations"
status: live
summary: "Four adaptation strategies compared on cost, freshness, and control, with a rule-of-thumb table for picking one before you build it wrong."
duration: "7 min read"
---

Every team that's shipped an LLM feature has, at some point, reached for the wrong adaptation strategy — fine-tuning a model to memorize facts that change weekly, or prompting a model with the same 2,000-token style guide on every single call instead of baking it in once. The three (really four) strategies below solve different problems, and they don't substitute for each other cleanly.

## Prompting (zero-shot and few-shot)

**How it works:** instructions and, optionally, examples go straight into the context window at inference time — no weight changes, no training run. The model adapts its behavior for this one call using [in-context learning](/learn/llm-foundations/in-context-learning-mechanics), then forgets everything about it the moment the response ends.

**When it wins:** you need to iterate fast, requirements are still moving, the task is within the model's existing general capability, or the cost of training infrastructure isn't justified by the volume yet. It's also the correct starting point for nearly everything — see [few-shot vs. zero-shot: worked prompts](/learn/llm-foundations/few-shot-vs-zero-shot-worked) for how much a well-constructed prompt alone can do.

**Failure mode:** every instruction and example gets re-sent, and re-billed, on every single call — cost scales with volume in a way the other strategies don't. It can't add knowledge the model wasn't trained on or that isn't in the current prompt, and highly idiosyncratic behavior (a very specific output format, deep domain jargon) can require an unwieldy amount of prompt real estate to pin down reliably.

**Relative cost:** lowest upfront cost by far — no training run, no infrastructure. Highest *marginal* cost per call once instructions and examples get long, and cheapest of all four to change (edit a string, ship immediately).

## RAG (retrieval-augmented generation)

**How it works:** a retrieval step — typically embedding the query and searching a vector store for semantically similar passages, see [embeddings and semantic similarity](/learn/rag/embeddings-and-semantic-similarity) — pulls relevant documents into the prompt at query time, and the model conditions its answer on that retrieved text instead of (or alongside) its parametric memory.

**When it wins:** the knowledge changes often — a product catalog, live documentation, a policy that gets updated — and retraining every time it changes isn't practical. It also buys traceability: a RAG answer can point at the specific passage it's grounded in, which a fine-tuned model's answer generally can't.

**Failure mode:** the whole system is bottlenecked by retrieval quality — a bad retrieval (irrelevant chunk, missing document) produces a bad or hallucinated answer regardless of how good the generation model is. RAG changes what facts the model has access to; it does nothing to change the model's *style*, tone, or output format on its own.

**Relative cost:** moderate — no training compute, but real infrastructure to build and maintain (an ingestion pipeline, a vector store, a retrieval-quality eval loop). Incremental knowledge updates are cheap once that infrastructure exists.

## Fine-tuning (full or parameter-efficient)

**How it works:** additional gradient-based training on a curated dataset updates the model's weights — either all of them, or a small adapter subset via a parameter-efficient method like LoRA — to persistently shift behavior, tone, or format. See [supervised fine-tuning mechanics](/learn/llm-foundations/supervised-fine-tuning-mechanics) for the mechanism.

**When it wins:** you need a specific writing style or persona to hold reliably without spending prompt tokens re-explaining it every call, you need an output format that's hard to pin down through instructions alone, or you're at high enough query volume that a shorter fine-tuned prompt's savings outweigh the one-time training cost.

**Failure mode:** real risk of catastrophic forgetting — improving the target behavior can quietly regress unrelated capabilities the model had before, covered in [fine-tuning mistakes: forgetting](/learn/llm-foundations/fine-tuning-mistakes-forgetting). It's also the wrong tool for fast-changing facts: baking today's product catalog into the weights just means retraining every time the catalog changes, which is strictly worse than RAG for that specific problem.

**Relative cost:** highest upfront cost — curated training data, a training run, and a real evaluation pass to confirm nothing regressed. Lowest marginal cost per query afterward, since the behavior no longer needs to be re-specified in every prompt.

## Combined: RAG + fine-tuning

**How it works:** fine-tune for the parts that are stable and stylistic (voice, format, how to phrase a citation, how to handle an out-of-scope question), and use RAG for the parts that change (facts, current data). A common variant fine-tunes the model specifically to use retrieved context well — following citations faithfully, refusing cleanly when retrieval comes back empty — rather than to memorize any facts directly.

**When it wins:** you need both a reliable persona/format *and* access to knowledge that changes — a support agent that must sound like your brand and also answer from live order data is the canonical case, needing style control RAG alone doesn't give and fact freshness fine-tuning alone can't provide.

**Failure mode:** two systems' failure modes compound instead of cancel — you can still get a hallucinated answer on a retrieval miss, and you can still get a forgetting-related regression from the fine-tune, now debugged as one system instead of two independent ones. It's also the most engineering-heavy option to build and maintain.

**Relative cost:** highest overall — you pay the fine-tuning cost and the RAG infrastructure cost. Justified mainly once you're past the point where either alone is failing in a way the other doesn't fix.

## Decision table

| Dimension | Prompting | RAG | Fine-tuning | RAG + fine-tuning |
|---|---|---|---|---|
| **Cost to change behavior** | Lowest — edit and ship | Low for facts, none for style | High — needs a training run | High — pays both costs |
| **Data freshness** | Only what fits in-prompt | Excellent — reindex and it's live | Poor — frozen at training time | Excellent for facts, frozen for style |
| **Control over style/format** | Moderate, must be re-asserted every call | Weak on its own | Strong and persistent | Strong and persistent |
| **Typical failure mode** | Prompt bloat, inconsistent adherence | Bad retrieval → bad or hallucinated answer | Forgetting, staleness on facts | Compounded failure surface |
| **Infra to build** | None | Vector store, ingestion pipeline | Training + eval pipeline | Both |

## How to choose

Ask two questions, in order:

1. **Is the problem knowledge, or is it behavior?** If the model doesn't know something (or knows an outdated version of it), that's a knowledge problem — reach for RAG. If the model knows enough but won't reliably say it the way you need (tone, structure, refusal behavior), that's a behavior problem — reach for fine-tuning.
2. **Is it worth solving with training infrastructure at all yet?** Always try prompting first, even for a problem you suspect needs more — [few-shot vs. zero-shot: worked prompts](/learn/llm-foundations/few-shot-vs-zero-shot-worked) shows how much can be pinned down without touching weights or a vector store, and it's the cheapest way to discover you actually need one of the heavier options before you build it.

A changing product catalog is a knowledge-freshness problem — RAG, not fine-tuning, and not an ever-growing prompt. A fixed writing style or output contract that must hold across thousands of calls is a behavior problem worth the fine-tuning cost, since the alternative is paying prompt tokens to re-assert it forever. A niche domain is the case that actually needs the two-question test: niche *vocabulary and behavior* (how a specialist phrases things, what format their reports take) points at fine-tuning; niche *facts and documents* (an internal wiki, a narrow technical corpus) points at RAG; needing both at once is when the combined approach earns its extra cost.

**Related:** [In-Context Learning Mechanics](/learn/llm-foundations/in-context-learning-mechanics), [Embeddings and Semantic Similarity](/learn/rag/embeddings-and-semantic-similarity), [Supervised Fine-Tuning Mechanics](/learn/llm-foundations/supervised-fine-tuning-mechanics), [Fine-Tuning Mistakes: Forgetting](/learn/llm-foundations/fine-tuning-mistakes-forgetting), [Few-Shot vs Zero-Shot: Worked Prompts](/learn/llm-foundations/few-shot-vs-zero-shot-worked)
