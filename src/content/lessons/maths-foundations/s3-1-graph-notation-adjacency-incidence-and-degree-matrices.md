---
title: "Graph notation, adjacency, incidence, and degree matrices"
track: "maths-foundations"
status: live
summary: "A graph represents entities as nodes and relationships as edges."
duration: "4 min read"
---

## The short answer

A graph represents entities as nodes and relationships as edges. The adjacency matrix records which nodes connect; the degree matrix records each node’s total incident weight; the incidence matrix records which edges touch which nodes, with signs when orientation matters. Pick the representation from the operation you need, and make direction, self-loops, weights, and node ordering explicit.

## Why this matters

Graph ML pipelines often fail before message passing: an edge is reversed, node
IDs are reordered without reordering features, or a weighted graph is silently
converted to binary. Matrix notation makes these errors inspectable and creates
the objects used by random walks, Laplacians, spectral methods, and GNN layers.

## How it works

For nodes `V={1,…,n}`, an adjacency matrix `A` has `A_ij=w(i→j)`; for an
undirected unweighted graph it is symmetric with zeros on the diagonal unless
self-loops are allowed. The degree matrix is diagonal,
`D_ii=Σ_j A_ij` for the chosen in/out convention. For an oriented edge `e=(u,v)`,
an incidence column can place `+1` at `u` and `−1` at `v`; orientation is a
bookkeeping choice, not a change to the underlying undirected edge.

## Worked examples and variations

### Example A: a three-node path

**Input:** edges `1—2` and `2—3`. **Mechanism:** encode neighbors in `A`.
**Output:** `A=[[0,1,0],[1,0,1],[0,1,0]]`, `D=diag(1,2,1)`. **Inspect:** row
sums equal degrees. **Decision:** preserve node order beside the feature matrix.

### Example B: weighted and directed edges

**Input:** `1→2` weight 3 and `2→1` weight 1. **Mechanism:** use ordered pairs
for `A`; choose out-degree for row-normalized transitions. **Output:** a
non-symmetric `A` and different in/out degrees. **Inspect:** do not symmetrize
unless the task permits losing direction. **Decision:** state the convention.

### Boundary case: a self-loop

**Input:** node 2 has a self-loop weight 1. **Mechanism:** `A_22=1`; its degree
includes the loop according to the selected graph convention. **Output:** a
message-passing layer can retain its own feature. **Inspect:** compare loop
counting in the library and hand matrix. **Decision:** add loops deliberately.

### Counterexample: binary adjacency for weighted trust

**Input:** edges 1—2 weight .1 and 1—3 weight 10. **Mechanism:** replacing both
by one erases relationship strength. **Output:** equal neighbor influence in a
later average. **Inspect:** compare weighted and binary propagation. **Decision:**
retain weights or justify thresholding with a sensitivity test.

## An illustrative story

An illustrative fraud graph stores customer–device edges but sorts node features
alphabetically after exporting the adjacency matrix. The model still receives
valid dimensions, yet every feature belongs to the wrong node. A stable node-ID
map and a diagonal feature/adjacency alignment test catch this class of failure.

## Two ways to see it

### Matrix view

Rows and columns are indexed by the same node ordering; matrix multiplication
turns topology into aggregation. The ordering is part of the data contract.

### Relationship view

An edge list is often easiest to author and audit, while matrices are efficient
for algebra. Convert between them only with explicit handling for direction,
weights, and loops.

## Hands-on

Create a four-node weighted graph as an edge list. Produce `A`, `D`, and a signed
incidence matrix `B`; verify row/column meanings with a small diagram. Reorder
nodes and correctly permute both `A` and node features.

**Failure state:** reverse one directed edge, drop weights, or permute features
without permuting `A`. **Test:** assert `D.sum()==A.sum()` for the selected
degree convention, `B` has two nonzero entries per ordinary undirected edge, and
the node-ID alignment round-trips. **Reset:** restore the explicit mapping and
rerun the matrix checks.

## Checkpoint

- [ ] Build adjacency and degree matrices for a three-node path.
- [ ] Explain how direction changes an adjacency matrix.
- [ ] State what an oriented incidence sign means and why orientation is arbitrary.
- [ ] Name one graph-data alignment test that does not depend on model accuracy.

## What this does not solve

A matrix representation does not tell you whether an edge is meaningful, causal,
current, or complete. Dense matrices can be expensive, and the wrong graph can
make every downstream mathematical operation precise but irrelevant.

## Continue, go deeper, apply it

- Continue: Random walks and transition operators
- Go deeper: Graph Laplacians and smoothness
- Apply it: Message passing and oversmoothing
