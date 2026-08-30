---
title: "A Toy MoE Router in Numpy"
track: "llm-foundations"
status: live
summary: "A runnable top-2-of-4 router that scores, selects, renormalizes, and combines expert outputs, with per-expert load printed at the end."
duration: "7 min read"
---

[Mixture of Experts: Routing](/learn/llm-foundations/mixture-of-experts-routing) worked through the router's arithmetic for one token by hand. This lesson builds the same thing as runnable code, over a batch, and exposes the load-balance question that arithmetic alone doesn't show you.

## What we're building

A top-2 router over 4 experts, applied to a small batch of token vectors: compute gate logits, softmax over all experts, keep the top-2, renormalize, run only those two experts, and combine their outputs by gate weight — then count how many tokens each expert actually received.

## Setup

Just numpy. Each "expert" here is a single linear layer standing in for a full feed-forward block — small enough to read in one screen, but the routing logic around it is exactly what a real MoE layer does.

```python
import numpy as np

d_model = 4
num_experts = 4
top_k = 2
batch_size = 6

W_gate = np.random.randn(d_model, num_experts) * 0.5   # the router
expert_W = np.random.randn(num_experts, d_model, d_model) * 0.5  # one weight matrix per expert

def expert_forward(e, x):
    return np.maximum(x @ expert_W[e], 0)   # linear + ReLU, standing in for a full FFN

X = np.random.randn(batch_size, d_model)   # a batch of 6 token vectors
```

## Build it

### Step 1 — compute gate logits

```python
logits = X @ W_gate   # shape (batch_size, num_experts)
```

**Why this step?** The router is just a linear projection from the token's hidden state to one score per expert — cheap relative to running even one expert's full forward pass, which is exactly why it's affordable to run for every token even though most experts it scores will never actually execute.

### Step 2 — softmax over all experts

```python
def softmax(z):
    z = z - z.max(axis=-1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=-1, keepdims=True)

probs = softmax(logits)   # shape (batch_size, num_experts), rows sum to 1
```

**Why this step?** This turns raw logits into a proper probability distribution over all 4 experts per token — the scoring step that top-k selection will then cut down.

### Step 3 — pick the top-2 and renormalize

```python
topk_idx = np.argsort(-probs, axis=-1)[:, :top_k]              # indices of top-2 experts per token
topk_probs = np.take_along_axis(probs, topk_idx, axis=-1)       # their raw softmax weights
gate_weights = topk_probs / topk_probs.sum(axis=-1, keepdims=True)  # renormalize to sum to 1
```

**Why this step?** After discarding 2 of the 4 experts' probability mass, the two survivors' weights no longer sum to 1. Renormalizing keeps the eventual combination a proper weighted average of exactly the experts that actually ran — matching the hand-worked example in [Mixture of Experts: Routing](/learn/llm-foundations/mixture-of-experts-routing).

### Step 4 — run only the selected experts and combine

```python
output = np.zeros_like(X)
for i in range(batch_size):
    for k in range(top_k):
        e = topk_idx[i, k]
        output[i] += gate_weights[i, k] * expert_forward(e, X[i])
```

**Why this step?** This loop is the literal meaning of sparse activation: for token `i`, `expert_forward` is only ever called for the two chosen experts. The other two experts are never touched for that token — no wasted compute, but also no contribution to the output, chosen or not.

### Step 5 — print per-expert load

```python
load = np.zeros(num_experts, dtype=int)
for i in range(batch_size):
    for k in range(top_k):
        load[topk_idx[i, k]] += 1

for e in range(num_experts):
    print(f"expert {e}: {load[e]} tokens")
```

**Why this step?** Total assignments across all experts must equal `batch_size × top_k` = 6 × 2 = 12, so a perfectly even split would be 3 tokens per expert. Printing the actual counts is how you'd notice, in a real system, whether the router is spreading load evenly or funneling most tokens toward a favorite few.

## Run it

Running the full script prints something like:

```
expert 0: 2 tokens
expert 1: 5 tokens
expert 2: 1 tokens
expert 3: 4 tokens
```

The exact numbers depend on the random seed and initialization, but the pattern is the point: the counts must sum to 12, yet with only 6 tokens and a freshly initialized, untrained router, don't expect anything close to an even 3/3/3/3 split. Run it yourself and check — some experts will likely see more traffic than others purely from how the random gate weights happen to fall, which is a small-scale preview of a much bigger problem at real training scale, covered next in [MoE Load Balancing and Its Failure Modes](/learn/llm-foundations/moe-load-balancing-and-failure-modes).

## Harden it

- **Real experts are full FFN blocks**, not a single linear layer — typically two linear layers with a nonlinearity between them, matching the [feed-forward block](/learn/llm-foundations/the-feed-forward-block) used elsewhere in the transformer, just duplicated per expert.
- **`np.argsort` over the whole expert dimension is fine at num_experts = 4**, but at real scale (dozens to hundreds of experts) production routers use a proper partial top-k selection rather than a full sort, since you only need the top few, not a total ordering.
- **This toy version has no capacity limit** — an expert can receive any number of tokens in a batch with no cap. Real systems impose a capacity factor per expert and drop or reroute tokens beyond it, which is where dropped-token behavior in [MoE Load Balancing and Its Failure Modes](/learn/llm-foundations/moe-load-balancing-and-failure-modes) comes from.

## Extend it

Two natural next steps: add the auxiliary load-balancing loss term that penalizes uneven `load` counts during training (conceptually introduced in the next lesson), and replace the double Python loop in Step 4 with a batched, per-expert gather — group all tokens routed to expert `e` into a single matrix, run one batched matmul through that expert, then scatter the weighted results back to their original positions. That gather-batch-scatter pattern is exactly how real MoE kernels get their efficiency, since a Python loop over individual tokens would erase the compute savings this whole architecture is built to capture.

**Related:** [Mixture of Experts: Routing](/learn/llm-foundations/mixture-of-experts-routing), [Why MoE Buys Capacity Without Proportional Compute](/learn/llm-foundations/why-moe-buys-capacity-without-compute), [MoE Load Balancing and Its Failure Modes](/learn/llm-foundations/moe-load-balancing-and-failure-modes), [The Feed-Forward Block](/learn/llm-foundations/the-feed-forward-block)
