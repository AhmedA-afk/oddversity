---
title: "Random walks and transition operators"
track: "maths-foundations"
status: live
summary: "A random walk moves from node to node according to a transition matrix."
duration: "3 min read"
---

## The short answer

A random walk moves from node to node according to a transition matrix. For an undirected weighted graph, row-normalising adjacency gives `P=D⁻¹A`; a row vector of node probabilities evolves as `p_{t+1}=p_tP`. A stationary distribution satisfies `πP=π`. Inspect sinks, disconnected components, and degree bias before interpreting walk frequency as importance or relevance.

## Why this matters

Random walks underlie graph ranking, diffusion, node embeddings, and message
passing. They translate topology into a stochastic process, but their conclusions
depend on the normalization and graph structure. A high visit count can mean
“high degree,” not “high semantic importance.”

## How it works

For nonnegative adjacency `A`, define `D_ii=Σ_jA_ij` and `P_ij=A_ij/D_ii`
when the degree is nonzero. Each row then sums to one. Starting distribution
`p_0` gives `p_t=p_0P^t`. A stationary distribution is a left eigenvector with
eigenvalue one. A unique limiting distribution needs conditions such as an
irreducible and aperiodic chain; adding a restart probability is one way ranking
systems handle traps and disconnected structure.

## Worked examples and variations

### Example A: a two-node walk

**Input:** nodes `1—2`, start `p_0=[1,0]`. **Mechanism:** each node has one
neighbor, so `P=[[0,1],[1,0]]`. **Output:** `p_1=[0,1]`, `p_2=[1,0]`.
**Inspect:** the chain is periodic. **Decision:** do not infer convergence from
two alternating steps.

### Example B: a three-node path

**Input:** `1—2—3`, start at node 2. **Mechanism:** middle node moves to each end
with probability .5; end nodes return to 2. **Output:** after one step, mass is
split across the ends; after two steps it is back at the middle. **Inspect:**
compute `pP` rather than treating degree as probability. **Decision:** distinguish
transient distribution from stationary behavior.

### Boundary case: isolated node

**Input:** node 4 has degree zero. **Mechanism:** `D⁻¹A` is undefined in its row.
**Output:** NaN or an arbitrary self-loop depending on implementation. **Inspect:**
check zero-degree rows. **Decision:** choose a self-loop, remove the node, or
define a restart policy explicitly.

### Counterexample: stationary frequency equals importance

**Input:** a high-degree hub connects unrelated communities. **Mechanism:** a
walk visits it often because many edges return there. **Output:** high stationary
mass. **Inspect:** compare mass with task labels and community structure.
**Decision:** treat walk frequency as a structural statistic, not a causal or
semantic ranking without validation.

## An illustrative story

An illustrative recommendation graph uses a random walk to surface popular
content. A dense bot-generated cluster traps the walk and dominates visits. A
restart, time filter, and abuse slice change the ranking; the original transition
operator was faithfully answering the wrong graph question.

## Two ways to see it

### Probability view

Each row of `P` is a conditional next-node distribution; matrix powers compose
steps. `π` is a long-run distribution only under stated chain conditions.

### Graph view

Transition mass diffuses along edges. Normalisation decides whether high-degree
nodes attract more mass or each node spreads influence equally.

## Hands-on

Implement a walk on a weighted four-node graph. Compute `P`, `p_t` for several
starts, estimate a stationary distribution by iteration, and compare it with
degree-normalised and uniform baselines.

**Failure state:** divide a zero-degree row by zero, or accidentally multiply
`Pp` while using a row vector. **Test:** every probability vector must sum to one;
the hand-computable two-node walk must alternate; isolated-node handling must be
explicit. **Reset:** restore row orientation and the selected isolated-node rule.

## Checkpoint

- [ ] Construct `P=D⁻¹A` for a small undirected graph.
- [ ] Compute one step of `p_{t+1}=p_tP`.
- [ ] Explain why periodicity can prevent pointwise convergence.
- [ ] State one reason a stationary distribution is not automatically a useful ranking.

## What this does not solve

Random walks do not infer missing edges, explain why a relationship exists, or
remove graph bias. Stationary distributions can be sensitive to time, weighting,
restart, and disconnected components.

## Continue, go deeper, apply it

- Continue: Graph Laplacians and smoothness
- Go deeper: Spectral clustering and embeddings
- Apply it: Message passing and oversmoothing
