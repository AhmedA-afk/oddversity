---
title: "Bellman expectation equations"
track: "maths-foundations"
status: live
summary: "The Bellman expectation equation says a policy’s value equals its expected immediate reward plus the discounted value of the next state."
duration: "3 min read"
---

## The short answer

The Bellman expectation equation says a policy’s value equals its expected immediate reward plus the discounted value of the next state: `vπ(s)=Σ_aπ(a|s)Σ_{s',r}p(s',r|s,a)[r+γvπ(s')]`. It is a self-consistency equation. The bootstrap term reuses a successor estimate, allowing local updates instead of waiting for a complete episode.

## Why this matters

Bellman equations connect path-level returns to state-level values. They power
dynamic programming, temporal-difference learning, policy evaluation, and many
debugging checks. A sign error, wrong action probability, or terminal value can
make every value wrong while each individual loop looks plausible.

## How it works

Start with `G_t=R_{t+1}+γG_{t+1}`. Taking conditional expectation given `S_t=s`
and expanding over action, next state, and reward yields the equation above.
For a finite MDP, write `v=b+γPv` under a fixed policy, so
`(I−γP)v=b`. If `γ<1`, the Bellman operator is a contraction in the max norm,
which supports a unique fixed point and iterative convergence under standard
conditions.

## Worked examples and variations

### Example A: one-state loop

**Input:** one state, one action, reward 2 every step, `γ=.5`. **Mechanism:**
`v=2+.5v`, so `.5v=2`. **Output:** `v=4`. **Inspect:** matches `2/(1−.5)`.
**Decision:** use this as a unit test for reward timing and discounting.

### Example B: two-state policy evaluation

**Input:** `A→B` with reward 1, `B→B` with reward 2, `γ=.5`. **Mechanism:**
`v_B=2+.5v_B=4`; `v_A=1+.5v_B=3`. **Output:** values `[3,4]`. **Inspect:**
substitute both into their equations. **Decision:** verify residuals, not only
the solver’s returned vector.

### Boundary case: terminal successor

**Input:** state `s` transitions to terminal with reward 5. **Mechanism:** terminal
future value is zero. **Output:** `v(s)=5`, not `5+γ·5`. **Inspect:** include
terminal mask in the transition. **Decision:** use one terminal convention end to
end.

### Counterexample: averaging the wrong quantity

**Input:** a stochastic policy chooses action A with .9 and B with .1. **Mechanism:**
value is the weighted average of action values, not the max and not an unweighted
mean. **Output:** `v=.9q(A)+.1q(B)` after transition expectation. **Inspect:**
change policy probabilities and see value change. **Decision:** distinguish
expectation under policy from optimality.

## An illustrative story

An illustrative value table is updated from a copied spreadsheet and appears to
converge. Residual checks show every state has a small positive offset because the
terminal reward was counted twice. The fixed-point residual is more informative
than a visually flat iteration curve.

## Two ways to see it

### Equation view

Each state value is a weighted equation whose unknowns are other state values.
Solving the system is policy evaluation.

### Update view

The target `r+γV(s')` is a one-step forecast of return. Bootstrapping trades a
shorter feedback loop for dependence on the current estimate.

## Hands-on

Represent the two-state example as transition rows. Build `P` and reward vector
`b`, solve `(I−γP)v=b`, then run iterative updates. Report the max Bellman
residual after each iteration and compare with hand values.

**Failure state:** set `v(terminal)=reward` instead of zero, or use an unweighted
mean over actions. **Test:** the terminal and two-state fixtures must satisfy all
Bellman residuals below `1e−9`; the broken version must fail. **Reset:** restore
terminal value zero and policy-weighted sums, then rerun both solvers.

## Checkpoint

- [ ] Derive the one-step Bellman decomposition from the return definition.
- [ ] Solve `v=2+.5v` without a library.
- [ ] Explain what the bootstrap term is and what it assumes.
- [ ] Define a Bellman residual and use it to check a value table.

## What this does not solve

Bellman consistency does not prove that the policy is good, the reward is aligned,
or the state is Markov. Approximate models and function approximators can have
small sampled residuals while failing on unvisited states.

## Continue, go deeper, apply it

- Continue: Bellman optimality and value iteration
- Go deeper: Temporal-difference learning
- Apply it: Markov decision processes
