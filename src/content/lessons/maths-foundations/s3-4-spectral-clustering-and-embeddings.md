---
title: "Spectral clustering and embeddings"
track: "maths-foundations"
status: live
summary: "Spectral clustering embeds nodes using selected eigenvectors of a graph Laplacian, then clusters those coordinates."
duration: "3 min read"
---

## The short answer

Spectral clustering embeds nodes using selected eigenvectors of a graph Laplacian, then clusters those coordinates. The second-smallest eigenvector—the Fiedler vector—often exposes a bottleneck separating two groups. Normalize according to the graph convention and inspect eigenvalue multiplicity, disconnected components, and scaling before trusting the resulting clusters.

## Why this matters

Raw node features may not show community structure, while connectivity does. A
spectral embedding converts global graph geometry into a small Euclidean space
where k-means or a similar method can operate. The method is powerful precisely
because it imports a graph assumption; incorrect edges and unbalanced degrees can
dominate the embedding.

## How it works

For a symmetric graph, form `L=D−A` or a normalized variant. The constant vector
is a zero-eigenvector for each connected component. Select the eigenvectors for
the smallest nontrivial eigenvalues, stack them as node rows, optionally
row-normalize, then cluster the rows. For two connected groups, the Fiedler
vector tends to have opposite signs across a weak cut. The eigen-gap can help
choose a dimension, but it is diagnostic, not a universal model-selection rule.

## Worked examples and variations

### Example A: two weakly connected groups

**Input:** two triangles joined by one low-weight edge. **Mechanism:** the Fiedler
vector changes sign at the bottleneck. **Output:** two separated one-dimensional
coordinates. **Inspect:** list node coordinates and cut edge. **Decision:** use
the sign or cluster the embedding, then compare with graph semantics.

### Example B: unequal group sizes

**Input:** a dense group of 20 nodes and a group of 3 with one weak link.
**Mechanism:** normalization changes degree influence. **Output:** normalized and
unnormalized embeddings can assign different geometry. **Inspect:** compare both
with the same clustering seed. **Decision:** report the normalization choice.

### Boundary case: disconnected graph

**Input:** three disconnected components. **Mechanism:** `L` has three zero
eigenvalues; “the second vector” is not a unique meaningful separator. **Output:**
the embedding reflects component basis choices. **Inspect:** count components and
zero eigenvalues. **Decision:** use components directly or define how they should
be connected.

### Counterexample: bad feature/graph scale

**Input:** one edge weight is 1,000 while all other informative edges are 1.
**Mechanism:** the heavy edge dominates `D` and `L`. **Output:** clusters follow
that weight rather than the intended pattern. **Inspect:** sensitivity to clipping
or rescaling weights. **Decision:** justify weights before spectral analysis.

## An illustrative story

An illustrative fraud graph produces two clean spectral clusters. Investigation
shows the split is simply “data source A versus data source B,” caused by an
ingestion boundary. The embedding is mathematically valid but operationally
irrelevant; cluster interpretation must return to node and edge provenance.

## Two ways to see it

### Eigenvector view

Small-eigenvalue directions vary slowly along strong edges and change across weak
cuts. They are graph-adapted coordinates.

### Clustering view

Spectral clustering is a two-stage pipeline: graph-to-coordinates, then ordinary
clustering. Each stage has its own diagnostics and failure modes.

## Hands-on

Create two triangles with a weak bridge, compute the two smallest nontrivial
eigenvectors of `L`, plot node coordinates, and run k-means. Repeat after removing
the bridge, changing its weight, and adding an isolated component.

**Failure state:** assume the second eigenvector always gives a unique cut, or
run k-means on unnormalized coordinates while comparing it to a normalized
reference. **Test:** report connected components, eigenvalue gaps, normalization,
and cluster stability across seeds; the disconnected fixture must trigger a
warning. **Reset:** restore the bridge and documented normalization.

## Checkpoint

- [ ] Explain why Laplacian eigenvectors can reveal a weak graph cut.
- [ ] State what multiple zero eigenvalues indicate.
- [ ] Separate the embedding step from the final clustering step.
- [ ] Give one graph-weight failure that can change the clusters.

## What this does not solve

Spectral clusters are not ground truth communities, causal groups, or guaranteed
stable assignments. Eigenvector signs and bases can be non-unique, and large
graphs require approximations whose numerical error must be checked.

## Continue, go deeper, apply it

- Continue: Message passing and oversmoothing
- Go deeper: Graph Laplacians and smoothness
- Apply it: Clustering and k-means
