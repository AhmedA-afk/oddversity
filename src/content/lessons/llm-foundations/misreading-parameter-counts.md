---
title: "Misreading Parameter Counts"
track: "llm-foundations"
status: live
summary: "Five real ways people miscount or misread model size, from MoE multiplication errors to quantized file sizes read as parameter counts."
duration: "7 min read"
---

"How big is this model?" sounds like a simple question with a simple number for an answer. In practice, that number gets computed wrong constantly — usually in one of these five ways.

### "8x7B is 56B parameters"

**Why it's wrong.** Multiplying the number of experts by one expert's stated size assumes every part of the model is duplicated per expert. It isn't: in a mixture-of-experts model, only the feed-forward blocks are duplicated per expert (see [Mixture of Experts: Routing](/learn/llm-foundations/mixture-of-experts-routing)) — the attention layers, the token embeddings, and the unembedding matrix are shared across all experts and exist exactly once in the whole model. "7B" describes a complete model including all of those shared components; multiplying it by 8 double-counts everything except the FFN.

**Symptom.** A stated "8×7B" model gets casually referred to as "56B," and that number then gets used to estimate memory footprint or compared directly against other models' published parameter counts.

**Fix.** Look up the actual published total — Mixtral 8x7B's real total is roughly 47B parameters, not 56B, precisely because of the shared components above. When you can't find a published total, the honest move is to say "8 experts of ~7B-equivalent FFN size, actual total lower than the naive product" rather than stating a number you haven't verified.

### Treating an MoE model's total parameter count as its inference cost

**Why it's wrong.** Per-token compute and latency track *active* parameters — the experts actually selected by the router (see [Why MoE Buys Capacity Without Proportional Compute](/learn/llm-foundations/why-moe-buys-capacity-without-compute)) — not the total parameter count sitting in memory. Two models can have wildly different total sizes and similar inference cost, or similar total sizes and very different inference cost, depending on how sparse the routing is.

**Symptom.** A comparison like "Model A has more total parameters than Model B, so it must be slower and more expensive to run" — stated without checking whether either model is a dense or MoE architecture.

**Fix.** Ask for both numbers before comparing: total parameters (what has to be stored and loaded) and active parameters per token (what governs compute and latency). Mixtral's own published figures — around 47B total, roughly 13B active per token — are a concrete illustration of how far apart these two numbers can be for the same model.

### Assuming embedding parameters are negligible

**Why it's wrong.** The intuition that "params ≈ depth × width, roughly" holds reasonably well for large models, but breaks down for small ones, where the token embedding table and unembedding matrix (see [The Embedding Lookup Table](/learn/llm-foundations/the-embedding-lookup-table) and [The Vocabulary and the Unembedding](/learn/llm-foundations/the-vocabulary-and-the-unembedding)) can be a large fraction of the total.

**Symptom.** Take a small model with a 32,000-token vocabulary and a 512-dimensional hidden size: the embedding matrix alone is `32,000 × 512 = 16,384,000` parameters — about 16.4M. If the unembedding matrix is untied (a separate matrix rather than reusing the embedding weights), that's another ~16.4M, for roughly 32.8M in embedding and unembedding parameters combined. If the rest of the model — a handful of small transformer blocks — totals only 20–30M parameters, the two embedding tables alone can be *comparable to or larger than* the entire rest of the network, even though embedding lookups are cheap (a memory read, not a matmul) despite being large in parameter count.

**Fix.** For small models especially, separate "total parameters" from "parameters that do most of the FLOPs-heavy work." A model's size in parameters and its size in compute cost per token are related but distinct quantities, and the gap between them is largest exactly where people are least likely to check it — small models.

### Inferring parameter count from a quantized file's size

**Why it's wrong.** File size on disk reflects `parameter count × bytes per parameter`, and quantization changes the second term without touching the first. A 7B-parameter model quantized to 4-bit occupies roughly 3.5 GB, not because it has fewer parameters than a 7B model stored at fp16 (which would be roughly 14 GB), but because each parameter is stored in fewer bits. Backing out a parameter count from file size using the wrong assumed bytes-per-parameter gives a wrong answer in either direction.

**Symptom.** "This is only a 4 GB file, so it can't be a 7B-parameter model" — or the reverse, overestimating a model's size because it was assumed to be stored at full precision when it was actually quantized.

**Fix.** Check the stated precision or quantization scheme before converting file size to a parameter estimate — see [Quantization and Inference Serving](/learn/llm-foundations/quantization-and-inference-serving) for what different quantization levels actually store per parameter. File size answers "how much storage or memory bandwidth does this need," which is a different — if related — question from "how many parameters does this model have."

### Comparing two models' sizes using different counting conventions

**Why it's wrong.** Not every published parameter count is computed the same way. One model card's number might include the embedding and unembedding matrices; another might report only the transformer blocks. One might count a tied embedding/unembedding pair once (since it's genuinely one set of weights used twice); another might report an untied pair as two separate components. None of these conventions is "wrong" in isolation, but comparing two numbers computed under different conventions produces an apples-to-oranges result that looks precise while being meaningless.

**Symptom.** Two models described as "13B" and "13B" get treated as equivalent in size, when one figure excludes embeddings and the other includes them — or a size comparison that seems to show one model is meaningfully larger than another, when the gap is actually just a difference in what got counted.

**Fix.** Before comparing two stated parameter counts, check what each one includes — this is exactly the kind of detail [Reading a Real Model Config](/learn/llm-foundations/reading-a-real-model-config) teaches you to verify directly from a model's own configuration rather than trusting a headline number.

## Pre-flight checklist

Before quoting or comparing a parameter count, check:

- **Total or active?** For any MoE model, both numbers exist and mean different things — total for memory, active for compute.
- **Shared or per-expert?** Don't multiply a per-expert size by expert count without confirming what's actually duplicated.
- **Embedding-inclusive?** Especially for small models, check whether the embedding and unembedding matrices are counted, and whether they're tied.
- **Precision-adjusted?** A parameter count is not the same thing as a file size — confirm the bytes-per-parameter before converting between them.
- **Same convention on both sides?** When comparing two models, make sure both numbers were computed the same way before treating the comparison as meaningful.

**Related:** [Mixture of Experts: Routing](/learn/llm-foundations/mixture-of-experts-routing), [Why MoE Buys Capacity Without Proportional Compute](/learn/llm-foundations/why-moe-buys-capacity-without-compute), [The Vocabulary and the Unembedding](/learn/llm-foundations/the-vocabulary-and-the-unembedding), [Reading a Real Model Config](/learn/llm-foundations/reading-a-real-model-config), [Quantization and Inference Serving](/learn/llm-foundations/quantization-and-inference-serving)
