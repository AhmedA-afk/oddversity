---
title: "Sequences, recurrences, polynomials, quadratics, and growth rates"
track: "maths-foundations"
status: live
summary: "A sequence is an ordered list; a recurrence specifies how to get the next value."
duration: "5 min read"
---

## The short answer

A sequence is an ordered list; a recurrence specifies how to get the next value
from earlier values. Unrolling it reveals whether an iterative algorithm settles,
oscillates, or grows. Linear and quadratic polynomials provide simple models for
trend, curvature, loss surfaces, and compute. Inspect the first terms, the growth
factor, and the long-run behaviour before trusting a short run of improvements.

## Why this matters

Training updates, running metrics, queues, forecasts, retry counts, and compute
budgets all evolve step by step. An iteration that improves its first few values
can later diverge. A quadratic can have a minimum, a maximum, or no finite
minimum depending on its leading coefficient. Recurrences give a compact way to
name the update and test its stability before using a larger model or dataset.

## How it works

For a first-order affine recurrence,

```text
xₜ₊₁ = a xₜ + b
```

the fixed point, when `a ≠ 1`, is `x* = b/(1-a)`. Subtracting it from both sides
gives `xₜ₊₁ - x* = a(xₜ - x*)`, so the distance from the fixed point is scaled by
`a` each step. Thus `|a|<1` contracts, `|a|>1` grows, and negative `a` can
alternate signs. The cases `a=1` and `a=-1` are boundaries rather than ordinary
convergence cases.

A quadratic `q(x)=ax²+bx+c` has a shape controlled by `a`: positive `a` opens
upward, negative `a` opens downward, and `a=0` is linear. In a loss, an upward
quadratic can model a local basin; the recurrence still determines whether an
algorithm reaches it.

## Worked examples and variations

### Example A: arithmetic sequence from a fixed increment

**Illustrative.** **Input:** `x₀=2` and `xₜ₊₁=xₜ+3`. **Mechanism:** add the same increment each
step. **Output:** `2, 5, 8, 11, ...`, with closed form `xₜ=2+3t`.
**Inspect:** the first difference is always `3`. **Decision:** use a linear
growth model when the increment, not the percentage change, is stable.

### Example B: a contracting affine recurrence

**Illustrative.** **Input:** `x₀=0`, `xₜ₊₁=0.5xₜ+2`. **Mechanism:** the fixed point is
`2/(1-0.5)=4`; the distance to `4` halves on each step. **Output:**
`0, 2, 3, 3.5, 3.75, ...`. **Inspect:** the error sequence is `-4, -2, -1,
-0.5, ...`. **Decision:** expect convergence toward `4`, but use a tolerance and
iteration cap in code.

### Example C: a quadratic as a loss surface

**Illustrative.** **Input:** `q(x)=x²-4x+5`. **Mechanism:** complete the square:
`q(x)=(x-2)²+1`. **Output:** the lowest value is `1` at `x=2`.
**Inspect:** the positive coefficient means the curve opens upward; evaluating
`q(0)=5` and `q(4)=5` shows symmetry around `2`. **Decision:** use this as a
hand-check fixture for an iterative optimiser or a plotted loss curve.

### Boundary case: unit and sign growth factors

**Illustrative.** **Input:** `xₜ₊₁=a xₜ` with `x₀=1`. **Mechanism:** `a=1` stays constant,
`a=-1` alternates `1,-1,1,-1`, and `a=0` reaches zero after one update.
**Output:** no ordinary contraction for `|a|=1`. **Inspect:** a short prefix can
look stable while it never settles. **Decision:** classify the boundary explicitly
instead of reporting “converged” from a small change in one step.

### Counterexample: early improvement does not prove convergence

**Illustrative.** **Input:** `x₀=8` and `xₜ₊₁=2xₜ`. **Mechanism:** the magnitude doubles every
step. **Output:** `8, 16, 32, 64, ...`, even if a separately logged score looked
better during the first iteration. **Inspect:** track the state, objective, and
finite-value status together. **Decision:** reject a run when the recurrence's
growth factor is outside the stable region; do not infer convergence from one
improving metric.

### Variation: polynomial versus exponential compute growth

**Illustrative.** **Input:** a pairwise routine over `n` records versus a branching process that
creates two tasks per level. **Mechanism:** the first has roughly `n²` pair
checks, while the second has roughly `2ᵈ` nodes at depth `d`. **Output:** both may
fit a tiny fixture but diverge in cost at scale. **Inspect:** plot work against
`n` or `d` on a log axis and state the measured region. **Decision:** include
growth rate in an architecture choice, not only the current benchmark.

## Two ways to see it

### Builder view

Write an iterative component as a recurrence with initial state, update rule,
termination condition, and failure threshold. Generate a small table of terms
before vectorising or optimising the implementation. This makes a wrong sign,
step size, or reset policy visible.

### Systems view

The recurrence is a contract for state over time. Stability is not only a math
property: delayed feedback, stale data, clipping, retries, and changing inputs
can make the real system differ from the toy recurrence. Monitor the assumptions
that justified the growth analysis.

## Hands-on

Implement a deterministic recurrence runner that records `t`, `x_t`, the update
parameters, and a `finite` flag. Use it for the contracting affine fixture and
the quadratic `q(x)`; plot or tabulate the first ten values.

**Failure fixture:** model a gradient-style update on the quadratic with
`xₜ₊₁ = (1 - 2η)xₜ`, start at `x₀=4`, and choose `η=1.1`, giving a multiplier
`-1.2`. **Test:** assert that the safe fixture `η=0.1` reduces `|x|` within ten
steps, while the failure fixture is flagged as non-convergent because its
magnitude grows. Also assert an iteration cap and finite values. **Reset:** set
`η=0.1`, rerun from the same `x₀=4`, and compare the recorded sequence with the
hand-derived multiplier `0.8`.

## Checkpoint

- [ ] Unroll `x₀=1`, `xₜ₊₁=2xₜ+1` for four terms.
- [ ] Find the fixed point of `xₜ₊₁=0.25xₜ+3` and state whether it contracts.
- [ ] Complete the square for `x²+6x+10` and identify its minimum.
- [ ] Explain why an early decrease in loss is not enough to establish convergence.

## What this does not solve

A simple recurrence or quadratic is a diagnostic model, not a full proof about a
nonlinear, stochastic, changing-data system. Stability in the toy equation can
fail when gradients, inputs, delays, or constraints change. Growth-rate analysis
also omits constants, memory pressure, and implementation details that matter in
real deployments.

## Continue, go deeper, apply it

- Continue: Batch gradient descent and learning-rate choice
- Go deeper: Algebra for model equations
- Apply it: Time series and temporal validation
