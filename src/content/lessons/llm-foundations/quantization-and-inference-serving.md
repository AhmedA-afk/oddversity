---
title: "Quantization and Inference Serving"
track: "llm-foundations"
status: live
summary: "Five production levers — INT8, INT4/GPTQ, AWQ, continuous batching, and paged attention — compared on what they actually change and what they cost."
duration: "10 min read"
---

Model weights don't have to stay in the precision they were trained in to run inference, and requests don't have to be served one at a time. These five techniques are the standard toolkit for raising tokens-per-second-per-dollar without touching the model's architecture.

## INT8 quantization

**How it works.** Store each weight as an 8-bit integer instead of a 16-bit float, with a scale factor (and sometimes a zero-point) per tensor or per channel that maps the integer range back to the original float range at compute time. The arithmetic itself: fp16 uses 2 bytes per parameter; INT8 uses 1 byte — an exact halving of weight memory, since this is just counting bytes, not a claim about speed or quality. A 7-billion-parameter model's weights go from roughly 14 GB in fp16 to roughly 7 GB in INT8.

**When it wins.** The most conservative quantization step — the precision drop is small enough that post-training INT8 quantization (no retraining required) preserves output quality closely enough for most production use, while immediately halving the memory footprint and letting more of the model, or more concurrent requests, fit on the same accelerator.

**Failure mode.** Some weight distributions have a few outlier values with much larger magnitude than the rest, and a single scale factor calibrated to cover those outliers wastes most of the 8-bit range on values that never get that large — degrading precision for the typical weight to accommodate the rare one. Per-channel scaling mitigates this but adds bookkeeping.

**Relative cost.** Low — one calibration pass to determine scale factors, no gradient updates, no retraining.

## INT4 quantization (GPTQ)

**How it works.** Push further to 4 bits per weight — a quarter of fp16's footprint, roughly 3.5 GB for that same 7B model. Naive 4-bit rounding loses noticeably more quality than INT8 because the representable range per weight is so much coarser. GPTQ (Generative Pre-trained Transformer Quantization) fixes this by quantizing layer by layer, and within each layer, choosing each weight's rounded value not independently but in a way that accounts for the error already introduced by previously-quantized weights in that layer — using second-order information (an approximation of the loss's curvature) to figure out which weights can absorb rounding error with the least damage to the layer's output, and adjusting the remaining unquantized weights slightly to compensate for error already introduced.

**When it wins.** Memory-constrained deployment where INT8 still doesn't fit — running a large model on a single consumer GPU, or maximizing how many model instances fit on a fixed cluster. The error-compensation scheme is specifically what makes 4-bit practical at all; naive 4-bit rounding without it degrades quality much more sharply.

**Failure mode.** Even with error compensation, 4 bits is a real precision cut, and quality degradation is more noticeable than INT8's — particularly on tasks sensitive to precise numeric or logical reasoning, where small cumulative errors across many layers can compound. It also requires a calibration dataset representative of real usage; a poor calibration set can quantize well on paper and underperform on actual traffic.

**Relative cost.** Moderate — the layer-by-layer calibration process is more involved than INT8's single scale-factor pass, but it's still a one-time, post-training cost with no full retraining required.

## AWQ (Activation-aware Weight Quantization)

**How it works.** Instead of treating every weight as equally important to preserve, AWQ starts from a different observation: a small fraction of weight channels matter disproportionately to output quality, and which ones matter can be identified by looking at the *activations* that flow through them on real data — channels that consistently see large activation magnitudes are the ones whose precision most affects the final output. AWQ protects those salient channels (through a combination of selective scaling and precision handling) while quantizing the rest of the weights aggressively, rather than spending precision budget uniformly across weights that don't equally deserve it.

**When it wins.** Similar deployment targets to GPTQ — aggressive memory reduction — but AWQ's activation-aware approach tends to hold up better on tasks where a small number of weight channels genuinely carry most of the signal, and it doesn't require the same per-layer second-order calibration machinery GPTQ does, which can make it simpler and faster to quantize a new model with.

**Failure mode.** It depends on calibration activations being representative of real deployment traffic, same as GPTQ — if the activation statistics used to identify "salient" channels don't match production usage, the wrong channels get protected. It's also a newer, less universally-tooled technique than GPTQ, so ecosystem and hardware kernel support can lag.

**Relative cost.** Moderate — requires running calibration data through the model to collect activation statistics, comparable in effort to GPTQ's calibration pass.

## Continuous batching

**How it works.** Traditional (static) batching groups a fixed set of requests together and waits for every one of them to finish generating before starting the next batch — so a batch's throughput is capped by whichever request in it happens to generate the most tokens, and the GPU sits idle waiting for stragglers. Continuous batching (also called in-flight or dynamic batching) instead operates at the level of individual decode steps: at every single token-generation step, any request that has finished leaves the batch and any new request waiting in the queue joins it, so the batch composition changes token-by-token rather than staying fixed for an entire generation.

**When it wins.** Any real production traffic pattern, where requests arrive continuously and vary wildly in how many tokens they'll generate — which is essentially all serving workloads. This directly targets the arithmetic-intensity problem from [prefill vs decode: why inference is memory-bound](/learn/llm-foundations/prefill-vs-decode-memory-bound): a fuller, more consistently-packed batch means each expensive weight-read from memory is amortized across more concurrent tokens, keeping the GPU closer to its compute ceiling instead of sitting memory-bound and half-idle.

**Failure mode.** It's a serving-infrastructure technique, not a model change, so it doesn't reduce memory footprint or improve any individual request's raw latency — a request in a very full, well-utilized batch can see marginally higher per-token latency than it would running alone, in exchange for far better aggregate throughput across all concurrent requests.

**Relative cost.** This is an engineering investment in the serving stack rather than a per-model cost — most modern inference servers (vLLM, TensorRT-LLM, and others) implement it as a core scheduling feature rather than something applied per deployment.

## PagedAttention (vLLM)

**How it works.** The KV cache for a single request has to live somewhere in GPU memory, and naive implementations reserve one large contiguous memory block per request, sized for the maximum sequence length it might ever reach — which wastes enormous amounts of memory on requests that finish far short of that maximum, and fragments memory as requests of different lengths start and stop. PagedAttention, the mechanism behind the vLLM serving engine, borrows the idea of virtual memory paging from operating systems: it splits each request's KV cache into small, fixed-size blocks that don't need to be contiguous in physical memory, and maintains a lookup table mapping each request's logical sequence positions to wherever their blocks actually live.

**When it wins.** Any deployment where maximizing concurrent request throughput per GPU matters — which, again, is most production serving. By eliminating the waste from over-reserved contiguous blocks, more requests' KV caches fit in the same physical memory at once, which directly raises how large a batch continuous batching has available to work with.

**Failure mode.** It's a memory-management technique specifically for the KV cache — it doesn't reduce the model's own weight memory (that's quantization's job) and doesn't change per-token compute. It also adds a layer of indirection (the block lookup table) that a from-scratch naive implementation doesn't need to reason about, though this is squarely the serving engine's concern, not something most users of an inference API ever touch directly.

**Relative cost.** Implemented once inside a serving engine and then largely free to benefit from — like continuous batching, it's infrastructure, not a per-request or per-model tradeoff you make each time.

## Decision table

| Approach | Best when | Avoid when | Relative cost |
|---|---|---|---|
| INT8 | Want a safe, well-supported memory halving | Every last bit of quality matters and memory isn't tight | Low |
| INT4 (GPTQ) | Memory is the binding constraint, need aggressive reduction | Task is highly sensitive to precise numeric/logical output | Moderate |
| AWQ | Similar memory targets to GPTQ, want activation-aware precision allocation | Tooling/hardware kernel support for your target stack is immature | Moderate |
| Continuous batching | Serving real, bursty, variable-length traffic | Running one-off, single-request local inference | Infrastructure (built into serving engines) |
| PagedAttention | Maximizing concurrent requests per GPU, long or variable-length contexts | You're not memory-constrained on the KV cache side at all | Infrastructure (built into serving engines) |

## How to choose

These aren't mutually exclusive alternatives — production stacks typically combine all five, because they act on different resources. Work through it as a stack of independent decisions, not a single choice:

1. **Weight memory too large for your target hardware?** Start with INT8 — it's the safest quality/memory tradeoff and the most broadly supported. Move to INT4 (GPTQ or AWQ) only once INT8 genuinely isn't enough, and validate quality on your actual task afterward rather than assuming the calibration process generalizes.
2. **Choosing between GPTQ and AWQ specifically?** If your model and hardware kernels have mature GPTQ tooling already, that's the lower-friction choice; if you're optimizing for simpler calibration and your stack has good AWQ kernel support, it's a reasonable alternative — the two aren't dramatically different in what they achieve, just how they get there.
3. **Serving concurrent production traffic at all?** Continuous batching should be the default, not an optimization you consider later — nearly every modern serving engine provides it, and there's little reason to run a decode loop without it once more than one request needs to be served.
4. **Concurrent requests with variable-length contexts, or KV-cache memory feels like the binding constraint?** PagedAttention (or an equivalent block-based cache manager) is what raises the batch size continuous batching has to work with — the two compound rather than substitute for each other.

None of these five techniques change what the model computes at the level of sampling settings or [speculative decoding](/learn/llm-foundations/speculative-decoding-mechanics) — they're a separate, stackable layer underneath the decoding strategy, aimed purely at getting more tokens out of the same hardware for the same dollar.

**Related:** [Prefill vs Decode: Why Inference Is Memory-Bound](/learn/llm-foundations/prefill-vs-decode-memory-bound) · [The KV Cache: What It Is and Why It Exists](/learn/llm-foundations/the-kv-cache-what-and-why) · [Speculative Decoding Mechanics](/learn/llm-foundations/speculative-decoding-mechanics) · [Speculative Decoding: An Acceptance Walkthrough](/learn/llm-foundations/speculative-decoding-acceptance-walkthrough) · [Grouped-Query Attention](/learn/llm-foundations/grouped-query-attention) · [Training Time vs Inference Time](/learn/llm-foundations/training-time-vs-inference-time)
