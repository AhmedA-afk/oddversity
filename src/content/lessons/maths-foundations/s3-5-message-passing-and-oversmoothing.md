---
title: "Message passing and oversmoothing"
track: "maths-foundations"
status: live
summary: "Message passing updates each node from its own and neighbouring representations, for example H⁽ˡ⁺¹⁾=σ(ÃH⁽ˡ⁾W⁽ˡ⁾)."
duration: "3 min read"
---

## The short answer

Message passing updates each node from its own and neighbouring representations, for example `H⁽ˡ⁺¹⁾=σ(ÃH⁽ˡ⁾W⁽ˡ⁾)`. It gives a graph neural network local context and shared parameters. Repeated propagation can make nodes increasingly similar—oversmoothing—so depth, self-loops, normalization, and residual paths are design choices, not implementation trivia.

## Why this matters

GNNs can learn from relational context with fewer parameters than a separate
model per node. But a deep stack may erase the distinctions needed for node
classification. Shape-correct code can still collapse embeddings, especially on
dense or homophilous graphs.

## How it works

Let `Ã` be an adjacency matrix with self-loops and a chosen normalization, such
as `D̃⁻¹/²ÃD̃⁻¹/²`. A layer aggregates neighbours, applies a learnable transform
`W`, and a nonlinearity. After many linear normalized propagations, components
associated with dominant eigenvectors remain while high-frequency differences
decay. That spectral intuition explains why node representations converge toward
similar values; residuals, jumping knowledge, sampling, or limiting depth can
preserve distinctions.

## Worked examples and variations

### Example A: one aggregation layer

**Input:** path `1—2—3`, scalar features `[1,0,1]`, mean neighbour aggregation.
**Mechanism:** each node combines its local neighbourhood. **Output:** centre
receives information from both ends; endpoints receive centre information.
**Inspect:** write each row of `Ã`. **Decision:** confirm whether self-features
are included.

### Example B: self-loop and feature transform

**Input:** node features with two channels and a `2×3` weight matrix. **Mechanism:**
aggregate to two channels, then multiply by `W`. **Output:** node-by-three feature
matrix. **Inspect:** dimensions and parameter sharing. **Decision:** separate
topology normalization from channel projection in debugging.

### Boundary case: isolated node

**Input:** a node with no neighbours before self-loops. **Mechanism:** its normalized
row is undefined without a policy; adding a self-loop preserves its own feature.
**Output:** either NaN or an identity-like update. **Inspect:** zero-degree rows.
**Decision:** define isolated-node behavior explicitly.

### Counterexample: adding layers always adds information

**Input:** a graph with distinct one-hot node features and repeated normalized
aggregation without residuals. **Mechanism:** neighbour mixing contracts differences.
**Output:** embeddings become nearly identical after enough layers. **Inspect:**
pairwise variance or cosine similarity by depth. **Decision:** stop, skip, or
redesign the propagation before adding more depth.

## An illustrative story

An illustrative account graph gains training accuracy as layers are added but
loses test performance on rare nodes. Embedding variance shows collapse: the
network learned a graph-wide average. A residual connection and a depth slice
help, but neither repairs an incorrect edge set.

## Two ways to see it

### Tensor view

Each layer is a sparse matrix aggregation followed by a dense channel transform
and nonlinearity. Node order and feature shape must remain aligned.

### Spectral view

Propagation is a graph filter. Low-frequency, smooth components survive repeated
averaging; high-frequency distinctions can be attenuated.

## Hands-on

Implement mean message passing on a path and a two-cluster graph. Run 1–20 layers
with and without self-loops/residuals. Record feature variance, pairwise cosine
similarity, and a tiny node-label accuracy.

**Failure state:** normalize with a zero-degree row, or accidentally use `Aᵀ`
while interpreting rows as destination nodes. **Test:** output shapes, isolated
node behavior, and a monotonic oversmoothing diagnostic on the repeated-mean
fixture must be reported. **Reset:** restore the documented orientation and add
self-loops or a residual path, then rerun depth comparisons.

## Checkpoint

- [ ] Expand one node’s message-passing update from a small adjacency matrix.
- [ ] Explain why self-loops and normalization are separate choices.
- [ ] Describe oversmoothing in matrix or spectral terms.
- [ ] Name one diagnostic and one mitigation for depth-induced collapse.

## What this does not solve

Message passing does not guarantee long-range reasoning, causal edge use, or
robustness to missing/adversarial relationships. Residuals can preserve noise,
and a low-collision embedding can still encode a harmful shortcut.

## Continue, go deeper, apply it

- Continue: Probabilistic-research extensions
- Go deeper: Spectral clustering and embeddings
- Apply it: Neural networks and representations
