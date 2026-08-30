---
title: "MoE Load Balancing and Its Failure Modes"
track: "llm-foundations"
status: live
summary: "Why routers collapse onto a favorite few experts without help, and the precise mechanics of the auxiliary loss and capacity factor that fix it."
duration: "9 min read"
---

*This is a deep-dive into the training mechanics beneath [Mixture of Experts: Routing](/learn/llm-foundations/mixture-of-experts-routing). If you just need the practical picture, the summary is: MoE routers need active intervention to stay balanced, or they quietly waste most of the capacity you paid for. Come back here when you're actually training or debugging one.*

## The failure mode: expert collapse

[A Toy MoE Router in Numpy](/learn/llm-foundations/toy-moe-router-in-numpy) showed that even a freshly initialized router doesn't split load evenly by default. Left alone during training, this tends to get worse, not better, through a self-reinforcing loop: if one expert randomly receives slightly more tokens early in training, it gets slightly more gradient updates, which makes it slightly better at handling generic tokens, which makes the router — itself being trained to reduce loss — favor it even more on the next batch. This is a rich-get-richer dynamic, and left unchecked it converges toward **expert collapse**: the router funnels most tokens through one or two experts while the rest sit essentially untrained, contributing almost nothing to the model's output despite occupying just as much memory as the popular ones.

This is expensive in a way that's easy to miss from the training loss curve alone — a collapsed model can still show a *reasonable* loss, because the few experts doing all the work are getting plenty of practice. The waste shows up as **unused capacity you paid to store and serve**, not as an obvious spike in the loss. That's why monitoring per-expert load directly (as in the toy router's load printout) matters — the aggregate loss doesn't tell you this is happening.

## The fix: an auxiliary load-balancing loss

Training adds a second loss term, alongside the main task loss, whose only job is to penalize uneven expert usage. A standard formulation, used in the Switch Transformer line of work, defines two quantities per expert i, over a batch of N tokens and E experts:

- **fᵢ** — the fraction of tokens in the batch that were actually routed to expert i (a hard count, based on the top-k selection).
- **Pᵢ** — the average router probability mass assigned to expert i across the batch (the soft, differentiable softmax output, before top-k cutoff).

The auxiliary loss is then:

```
L_aux = E × Σᵢ (fᵢ × Pᵢ)
```

with a small coefficient (published recipes commonly use something on the order of 0.01) scaling `L_aux` before it's added to the main task loss.

**Why this specific formula.** Both `f` and `P` are distributions over experts that sum to 1. Their dot product, scaled by `E`, is minimized exactly when both are uniform — every expert getting `1/E` of the tokens and `1/E` of the average probability mass. You can see this with a tiny 2-expert example:

```
Uniform:  f = [0.5, 0.5], P = [0.5, 0.5]
          Σ fᵢPᵢ = 0.25 + 0.25 = 0.5   →  L_aux = 2 × 0.5 = 1.0

Skewed:   f = [0.9, 0.1], P = [0.9, 0.1]
          Σ fᵢPᵢ = 0.81 + 0.01 = 0.82  →  L_aux = 2 × 0.82 = 1.64
```

The skewed split produces a loss 64% higher than the balanced one — the training objective directly rewards spreading tokens evenly and directly penalizes concentration, using `P` (which gradients can flow through) to influence `f` (the hard, non-differentiable selection) indirectly.

## Capacity factors and token dropping

Even with a load-balancing loss nudging things toward even, real systems still enforce a hard limit per expert, because experts are typically implemented as fixed-size batched matrix operations that need to know their input size in advance. Each expert is given a **capacity**:

```
capacity = capacity_factor × (tokens_per_batch / num_experts)
```

A `capacity_factor` of 1.0 means each expert can take exactly its even share and no more. In practice, systems usually set it a bit above 1 (commonly around 1.25) to leave slack for the routing not being perfectly even even with the auxiliary loss helping.

Work through a small example: 100 tokens in a batch, top-1 routing, 4 experts, `capacity_factor` = 1.25. Each expert's capacity is `1.25 × 100 / 4 = 31.25`, rounded down to 31 tokens. If the router sends 40 tokens to expert 0 in this batch, only the first 31 (by whatever tie-breaking order the implementation uses) are actually processed by that expert — the remaining 9 are **dropped**: they pass through that layer without that expert's transformation applied at all (commonly just added to the residual stream unchanged, contributing nothing from this MoE layer).

## What the fixes cost

None of this is free, which is why MoE training has a reputation for being finicky to get right.

- **The auxiliary loss is a soft tax on the main objective.** Weight it too lightly and load stays uneven; weight it too heavily and you're optimizing for balance at the expense of the task loss the model actually needs to minimize. Finding the right coefficient is itself a tuning problem.
- **Raising the capacity factor to reduce dropped tokens costs memory and compute, even for capacity that goes unused.** Because each expert is provisioned for its worst-case load, not its average load, a higher capacity factor means every expert's buffer is sized larger — and most of that extra buffer sits empty on any given batch where routing happens to be close to even. You're paying for slack you need only some of the time.
- **Dropped tokens are a real, silent quality cost.** A token that gets dropped from its top choice doesn't get an error — it just doesn't receive that layer's expert transformation, which can degrade quality for exactly the tokens that happened to land in an oversubscribed expert on an unlucky batch.

Taken together, this is why deploying MoE well means treating load balance as something to actively monitor and tune, not a detail that resolves itself once the top-k routing mechanism from [Mixture of Experts: Routing](/learn/llm-foundations/mixture-of-experts-routing) is in place. It's also one more axis, alongside training and serving cost, that shows up when comparing MoE against denser alternatives — see [Dense vs MoE vs GQA: Reading Real Design Choices](/learn/llm-foundations/dense-vs-moe-vs-gqa-design-choices).

**Related:** [Mixture of Experts: Routing](/learn/llm-foundations/mixture-of-experts-routing), [A Toy MoE Router in Numpy](/learn/llm-foundations/toy-moe-router-in-numpy), [Why MoE Buys Capacity Without Proportional Compute](/learn/llm-foundations/why-moe-buys-capacity-without-compute), [Dense vs MoE vs GQA: Reading Real Design Choices](/learn/llm-foundations/dense-vs-moe-vs-gqa-design-choices)
