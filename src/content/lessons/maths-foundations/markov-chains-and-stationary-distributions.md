---
title: "Markov chains and stationary distributions"
track: "maths-foundations"
status: live
summary: "A Markov chain is a sequence of states whose next-state distribution depends on the current state, not the full past: P(S{t+1}|St,…)=P(S{t+1}|St)."
duration: "5 min read"
---

## The short answer

A Markov chain is a sequence of states whose next-state distribution depends on the current state, not the full past: `P(S_{t+1}|S_t,…)=P(S_{t+1}|S_t)`. A transition matrix moves a state distribution forward. A stationary distribution `π` satisfies `πP=π`; convergence to it requires structural conditions such as irreducibility and aperiodicity.

## Why this matters

User journeys, queue states, browsing paths, and simple planning models evolve
over time. The Markov property is a state-design claim: if relevant history is
omitted, transition probabilities change with that history. Stationary behaviour
can be useful for long-run load estimates, but an absorbing or periodic chain
may never converge to the distribution you expect.

## How it works

With row-vector convention, `P[i,j]=P(S_{t+1}=j|S_t=i)`, every row is
non-negative and sums to one, and `p_{t+1}=p_tP`. Multi-step transitions are
`P^k`; the `(i,j)` entry gives the probability of moving from `i` to `j` in
`k` steps.

A stationary row vector has non-negative entries summing to one and solves
`πP=π`. In a finite irreducible, aperiodic chain, the distribution from any
initial state converges to the unique stationary distribution. If the chain has
multiple closed classes or cycles, stationary distributions may be non-unique
or convergence may fail. These are properties of the transition graph, not just
of the matrix’s average.

**Derivation:** condition on the current state and sum over it:
`P(S_{t+2}=j|S_t=i)=Σ_k P(S_{t+2}=j|S_{t+1}=k)P(S_{t+1}=k|S_t=i)`.
This is matrix multiplication, so repeated conditioning gives `P^m` and
`p_{t+m}=p_tP^m`.

### Numerical and visual perspective

Draw states as nodes and transition probabilities as arrows. Plot each state’s
probability over time from a chosen initial distribution and overlay `π`. Always
declare row versus column convention; transposing a valid matrix changes the
dynamics.

### An illustrative story

A workflow forecast used a long-run state mix even though one failure state was
absorbing. The stationary calculation existed, but the operational chain could
eventually remain in failure. This is illustrative; inspect reachability and
recovery edges before using a long-run average.

## Worked examples and variations

### Example A: two-state chain

**Input:** `P=[[.8,.2],[.3,.7]]`, initial distribution `p₀=[1,0]`.
**Mechanism:** `p₁=p₀P=[.8,.2]`; `p₂=p₁P=[.70,.30]`. **Output:** two-step
state probabilities. **Inspect:** each distribution sums to one. **Decision:**
use matrix powers or repeated updates with a declared orientation.

### Example B: stationary solution

**Input:** same `P`, let `π=[q,1-q]`. **Mechanism:** `q=.8q+.3(1-q)` gives
`q=.6`. **Output:** `π=[.6,.4]`; multiplying verifies `πP=π`.
**Inspect:** stationarity is an equation, not necessarily the distribution at
time zero. **Decision:** compare finite-horizon and long-run quantities.

### Example C: a three-state workflow

**Input:** states `draft,review,published`, with transitions that move forward
but allow `review→draft`. **Mechanism:** build a row-stochastic matrix and
propagate a starting mix. **Output:** a probability over workflow states at each
step. **Inspect:** rows describe current-state conditionals, not destination
frequencies. **Decision:** log transitions by source state.

### Boundary case: absorbing states

**Input:** `P=[[1,0],[.2,.8]]`. **Mechanism:** state 0 cannot leave; mass
eventually accumulates there from state 1. **Output:** stationary distribution
`[1,0]` is possible, but a chain started at state 0 is already there.
**Inspect:** the graph’s closed class. **Decision:** add recovery transitions
if the system is supposed to return.

### Counterexample: transpose convention error

**Input:** use `P` above but multiply a row vector by `Pᵀ`.
**Mechanism:** rows no longer represent outgoing probabilities; the update can
produce a vector that does not sum to one or describes the reverse graph.
**Output:** a plausible-looking but wrong forecast. **Inspect:** check row sums,
orientation, and a hand-computed one-step transition. **Decision:** standardise
the convention in code and documentation.

## Two ways to see it

### Builder view

Keep a state vocabulary, transition table, orientation, initial distribution,
and horizon. Test one-step rows and one hand-computed multi-step path before
optimising matrix operations.

### Systems view

Ask whether the state contains enough history and whether rare or absorbing
states matter. A stationary average can hide startup transients, non-ergodicity,
or a dangerous state that has too few observations.

## Hands-on

Implement the two-state chain, calculate `p₁`, `p₂`, and solve/verify `π`. Draw
the transition graph and plot probabilities over 20 steps. Add the absorbing
chain as a separate fixture.

**Deliberate failure:** use `P.T` in the update and accept any output without
checking sums. **Test:** the one-step vector must match `[.8,.2]` from `[1,0]`
and every probability vector must sum to one. **Reset:** restore row-vector
updates and rerun. **No-code route:** follow labelled state tokens through the
arrows for three steps.

## Checkpoint

- [ ] State the Markov property in conditional-probability notation.
- [ ] Propagate a distribution with a transition matrix.
- [ ] Solve and verify a stationary distribution.
- [ ] Identify an absorbing or non-convergent structural case.

## What this does not solve

A Markov chain does not prove the state is sufficient, transitions are stable,
or long-run behaviour is safe. Estimated matrices can be sparse and drift. The
chain also does not automatically represent decisions or rewards; those require
a policy or reward model.

## Continue, go deeper, apply it

- Continue: Importance sampling and weighted estimates
- Go deeper: Search and planning
- Apply it: Likelihood, priors, and sampling assignment
