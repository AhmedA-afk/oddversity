---
title: "Mixture of Experts: Routing"
track: "llm-foundations"
status: live
summary: "The actual arithmetic a router runs to pick which experts see a token, and why the unchosen experts do zero work for it."
duration: "6 min read"
---

[Mixture of Experts, Explained](/learn/llm-foundations/mixture-of-experts-explained) covers the big idea: swap the single feed-forward network in a transformer block for many parallel experts, and let a router send each token to only a few of them. This lesson is about what the router actually computes.

## What it is

The router is a small linear layer: it takes a token's hidden state x and produces one logit per expert, `logits = x @ W_router`. Those logits go through a softmax to get a probability-like weight per expert, and then only the top-k highest-weighted experts are kept — everyone else is discarded. The kept weights are renormalized to sum to 1 (since they no longer represent the full probability mass), and the token's output is the weighted sum of just those top-k experts' outputs. Every expert not in the top-k does not run at all for that token — no forward pass, no compute spent.

## The mental model

Think of the router as a dispatcher looking at one token at a time and asking "of all my available specialists, which two should look at this?" — not "let's have everyone weigh in and average their opinions." The softmax over all experts is really just a scoring step; the top-k selection is where the actual sparsity comes from. This is different from an ensemble, where every model runs and their outputs get combined — here, most of the "ensemble" never gets consulted for a given token.

## Why it works this way

The gate weights need to come from *somewhere* differentiable so the router itself can be trained by gradient descent — hence the softmax, which is smooth and gives every expert a well-defined score. But actually running every expert to get those scores would defeat the entire point of the architecture, so the top-k cutoff is applied *after* scoring, and only the survivors get a forward pass. The renormalization step matters for the same reason it would in any weighted average: if you discard some of the probability mass without rescaling the rest, the kept weights no longer sum to 1, and the combined output would be systematically shrunk relative to what a single, fully-weighted expert output would look like.

## A concrete example

Say a router produces these logits for one token, across 4 experts:

```
logits = [2.1, 0.3, -1.0, 1.8]
```

Softmax over all four (exponentiate, normalize by the sum):

```
exp(logits)      ≈ [8.17, 1.35, 0.37, 6.05]      (sum ≈ 15.93)
softmax(logits)  ≈ [0.513, 0.085, 0.023, 0.380]
```

Top-2 by weight are expert 0 (0.513) and expert 3 (0.380). Renormalize just those two so they sum to 1:

```
0.513 / (0.513 + 0.380) ≈ 0.574
0.380 / (0.513 + 0.380) ≈ 0.426
```

The token's output is `0.574 × Expert0(x) + 0.426 × Expert3(x)`. Experts 1 and 2 never run — their weights (0.085 and 0.023) are simply thrown away, along with the compute their forward passes would have cost. Every token in a batch runs this same process independently, and typically ends up with a different pair of chosen experts.

## Where it shows up

This exact top-k-then-renormalize pattern is the routing mechanism behind Mixtral, DeepSeek-MoE, and the Switch Transformer / GShard lineage covered conceptually in [Mixture of Experts, Explained](/learn/llm-foundations/mixture-of-experts-explained). [A Toy MoE Router in Numpy](/learn/llm-foundations/toy-moe-router-in-numpy) implements this end-to-end, and [Why MoE Buys Capacity Without Proportional Compute](/learn/llm-foundations/why-moe-buys-capacity-without-compute) builds the intuition for why this routing pattern changes a model's scaling economics.

## Watch out for

- **Thinking routing happens per-sequence.** It's per-token. Two adjacent tokens in the same sentence can, and often do, route to completely different pairs of experts.
- **Expecting the chosen experts to correspond to human categories** — "the code expert," "the math expert." As covered in [Mixture of Experts, Explained](/learn/llm-foundations/mixture-of-experts-explained), real trained routers tend to specialize on shallower statistical patterns, not tidy semantic domains.
- **Forgetting the router itself has to be trained.** It's a real parameterized layer (`W_router`) that learns via backpropagation like everything else — and getting it to route *usefully*, rather than collapsing onto a favorite few experts, is its own problem, covered in [MoE Load Balancing and Its Failure Modes](/learn/llm-foundations/moe-load-balancing-and-failure-modes).

## Where next

[A Toy MoE Router in Numpy](/learn/llm-foundations/toy-moe-router-in-numpy) turns this exact computation into runnable code across a batch of tokens, including a look at how unevenly the load can fall across experts even with a fresh, untrained router.

**Related:** [Mixture of Experts, Explained](/learn/llm-foundations/mixture-of-experts-explained), [Why MoE Buys Capacity Without Proportional Compute](/learn/llm-foundations/why-moe-buys-capacity-without-compute), [The Feed-Forward Block](/learn/llm-foundations/the-feed-forward-block), [MoE Load Balancing and Its Failure Modes](/learn/llm-foundations/moe-load-balancing-and-failure-modes)
