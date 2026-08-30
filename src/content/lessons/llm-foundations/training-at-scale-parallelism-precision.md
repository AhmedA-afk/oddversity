---
title: "Training at Scale: Parallelism and Precision"
track: "llm-foundations"
status: live
summary: "How a model too big for one GPU gets split across many: data, tensor, and pipeline parallelism, plus bf16 precision and gradient checkpointing."
duration: "9 min read"
---

A frontier model's parameters, gradients, and optimizer state don't fit in one GPU's memory, let alone the activations from a forward pass. Before warmup schedules or batch sizes matter at all, someone has to answer a harder question: how do you split one training step across hundreds or thousands of chips without breaking the math?

> **Optional depth.** You can understand what pretraining optimizes ([The Pretraining Objective and Its Loss](/learn/llm-foundations/the-pretraining-objective-and-loss)) and how the optimizer updates weights ([Optimization Mechanics](/learn/llm-foundations/optimization-mechanics-adam-warmup)) without this lesson. This is the engineering underneath a large run — worth knowing so "trained on many GPUs" means something concrete.

## Why one GPU isn't enough

During training, memory has to hold parameters, gradients (the same size as parameters), and AdamW's optimizer state — two more tensors the same size as the parameters, for the first and second moment estimates. Before counting a single activation, that's already several times the raw parameter footprint. Add activations from the forward pass, kept around for the backward pass, scaling with batch size, sequence length, and depth. Past a few billion parameters, this total exceeds a single accelerator's memory, so the work has to be split.

## The three axes of parallelism

### Data parallelism

Each GPU (or group of GPUs) holds a full copy of the model and processes a different slice of the batch. Gradients are computed independently, then averaged across copies before the shared update is applied. This scales throughput cleanly as long as the model itself fits on one device — it doesn't help at all if a single copy is already too big.

### Tensor parallelism

Splits individual weight matrices — inside attention or [the feed-forward block](/learn/llm-foundations/the-feed-forward-block-role) — across multiple GPUs, so no single device needs a full copy of the largest layers; each device computes a shard of a matrix multiply and results are combined via communication within the layer. This directly addresses "the model doesn't fit," but needs fast interconnect between participating GPUs, since they communicate on every layer, not once per step.

### Pipeline parallelism

Splits the model by depth: different GPUs own different consecutive blocks of [transformer layers](/learn/llm-foundations/the-transformer-architecture), and a batch is chopped into micro-batches that flow through the stages like an assembly line, with multiple micro-batches in flight simultaneously so no GPU sits idle waiting for one micro-batch to clear stage one.

In practice, large runs combine all three — often called 3D parallelism — plus data parallelism across whole replicated groups, because each axis hits a different bottleneck (memory, compute, or communication bandwidth), and combining them lets teams tune around all three at once.

## Precision: bf16 and mixed precision

Doing every operation in 32-bit floating point roughly doubles memory and compute cost versus 16-bit, for little benefit in most of the network. Modern training uses **bf16** (bfloat16) for most matrix multiplies — it keeps the same exponent range as fp32 (so it doesn't suffer the overflow and underflow issues an older fp16 format could hit), trading mantissa precision per number for roughly half the memory and often faster compute on hardware built for it. Certain numerically sensitive spots — some reductions, the loss computation itself — are often still kept in fp32 to avoid accumulating rounding error. That mix is precisely what "mixed precision" means: the bulk of computation in lower precision, specific accumulations kept in higher precision.

## Gradient checkpointing

Normally, every layer's activations from the forward pass are kept in memory so they're available for the backward pass. Gradient checkpointing instead discards most intermediate activations and recomputes them on the fly during the backward pass from a smaller set of saved checkpoints — trading extra compute (a partial second forward pass) for a large reduction in peak memory. That's often exactly the trade a team needs to fit a bigger model, or a longer context window, on the same hardware.

## A mental model of the hardware layout

Picture a cluster of many nodes, each node holding several GPUs connected by very fast intra-node links, with nodes connected to each other by a slower — but still fast — network fabric. Tensor parallelism, which communicates the most per layer, is usually kept *within* a node, over the fastest links. Pipeline parallelism spans nodes, since it only communicates at stage boundaries. Data parallelism spans the whole cluster, since it only needs to communicate once per step, for the gradient average. This is a general shape, not a specific published configuration — exact GPU counts and topologies vary by run and by organization.

## Tradeoffs to hold in tension

- Tensor parallelism needs the fastest interconnect but gives diminishing memory savings per GPU added past a point; pipeline parallelism is more communication-efficient across slower links but introduces idle "bubble" time unless enough micro-batches are in flight.
- Gradient checkpointing trades compute for memory — worth it when memory, not compute, is the binding constraint, which is common for very deep models or long [context windows](/learn/llm-foundations/context-window-mechanics-and-limits).
- Lower precision saves memory and often speeds up compute, but pushes more responsibility onto safeguards — loss scaling, selective higher-precision accumulation — to avoid silently degraded training.

## Where next

**Related:** [Optimization Mechanics: AdamW, Warmup, and Schedules](/learn/llm-foundations/optimization-mechanics-adam-warmup), [The Transformer Architecture](/learn/llm-foundations/the-transformer-architecture), [The Feed-Forward Block's Role](/learn/llm-foundations/the-feed-forward-block-role), [Counting the FLOPs of One Token](/learn/llm-foundations/counting-the-flops-of-one-token), [Parameters, Activations, and Data](/learn/llm-foundations/parameters-activations-and-data)
