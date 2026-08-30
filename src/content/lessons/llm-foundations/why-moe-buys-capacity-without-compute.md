---
title: "Why MoE Buys Capacity Without Proportional Compute"
track: "llm-foundations"
status: live
summary: "The hospital-staff analogy for why total parameters and active parameters can diverge so far in a mixture-of-experts model."
duration: "6 min read"
---

## The analogy

A large hospital keeps a huge staff of specialists on payroll — cardiologists, neurologists, oncologists, dozens of subspecialties covering every condition the hospital might see. But any single patient who walks in doesn't see the whole staff. They see one or two relevant doctors. The hospital's total payroll reflects its full capacity to handle *any* patient it might encounter; the cost of treating *this* patient reflects only the couple of specialists actually consulted. That gap — enormous total capacity, small cost per case — is exactly the gap between total and active parameters in a mixture-of-experts model.

## Walking through it

Take a mixture-of-experts feed-forward layer with 8 experts, top-2 routing, where each expert is the same size as one ordinary [feed-forward block](/learn/llm-foundations/the-feed-forward-block) — call that size P parameters.

- **Total FFN parameters in this layer:** 8 experts × P = 8P. This is what has to be stored in memory, on disk, or across devices — every expert exists and takes up space, whether or not it's ever selected for a given token.
- **Active FFN parameters per token:** only the top-2 chosen experts run, so a single token's forward pass touches 2P worth of feed-forward parameters — plus the router itself, which is tiny by comparison.

The ratio here — 8 experts, 2 active — gives a compute discount factor of num_experts / top_k = 8 / 2 = 4x. You get 8P worth of representational capacity in the model (eight distinct feed-forward transformations it could apply, learned independently) while paying compute for only 2P of it on any given token. Scale the expert count up — 64 experts, top-2 — and the discount factor grows to 32x: the total capacity keeps climbing, but the per-token compute cost barely moves. This is the lever that changes the scaling economics: you can grow total parameters, and therefore the model's total capacity, largely independently of the compute cost of running it.

Mixtral's actual public architecture is a real instance of exactly this shape: 8 experts, top-2 routing per token, in every MoE layer.

## The wrong intuition this corrects

The natural (and wrong) reading of "8 experts, each the size of a 7B model" is "this must be a 56B model that costs 8x what one 7B model costs to run." Both halves of that are wrong, for related but distinct reasons.

The parameter count is wrong because attention layers, embeddings, and the unembedding matrix are shared across all experts — only the feed-forward block is duplicated per expert. Multiplying expert count by a single expert's total size double-counts everything that isn't the FFN. [Misreading Parameter Counts](/learn/llm-foundations/misreading-parameter-counts) works through exactly this arithmetic error and what the real total looks like.

The compute claim is wrong because "8 experts" doesn't mean 8 experts run — it means 8 *exist*, and top-k routing (see [Mixture of Experts: Routing](/learn/llm-foundations/mixture-of-experts-routing)) determines how many actually process each token, typically 1 or 2. The per-token compute cost tracks the *active* parameter count, not the total — which is why an MoE model with a large total parameter count can have latency closer to a much smaller dense model than its total size would suggest.

## Where the analogy breaks

The hospital picture is useful, but it oversells three things that don't carry over cleanly.

First, it implies the specialists are meaningfully specialized by domain — a cardiologist versus an oncologist. Real trained routers, as covered in [Mixture of Experts, Explained](/learn/llm-foundations/mixture-of-experts-explained), tend to split on shallower statistical patterns rather than anything a human would recognize as a clean topic boundary.

Second, a hospital doesn't have to pay to keep an idle specialist in the building — but an MoE model does. Every expert has to be loaded into memory (or spread across devices) regardless of whether it's ever selected for a particular token, so MoE buys compute savings, not memory savings. The "capacity without compute" trade in this lesson's title very specifically does not extend to "capacity without memory."

Third, a well-run hospital has a scheduling system that keeps caseloads balanced across its specialists. A freshly initialized MoE router has no such guarantee — left untrained, it can drift toward funneling most tokens to a small favorite subset of experts, leaving the rest chronically underused. That failure mode, and what training does to prevent it, is the subject of [MoE Load Balancing and Its Failure Modes](/learn/llm-foundations/moe-load-balancing-and-failure-modes).

**Related:** [Mixture of Experts: Routing](/learn/llm-foundations/mixture-of-experts-routing), [Mixture of Experts, Explained](/learn/llm-foundations/mixture-of-experts-explained), [Misreading Parameter Counts](/learn/llm-foundations/misreading-parameter-counts), [MoE Load Balancing and Its Failure Modes](/learn/llm-foundations/moe-load-balancing-and-failure-modes)
