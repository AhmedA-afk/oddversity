---
title: "Gradient checking and debugging"
track: "maths-foundations"
status: live
summary: "Gradient checking compares an analytic or autodiff gradient with an independent finite-difference estimate on a small deterministic fixture."
duration: "3 min read"
---

## The short answer

Gradient checking compares an analytic or autodiff gradient with an independent finite-difference estimate on a small deterministic fixture. Use a relative error, inspect individual coordinates, and classify domain or non-smooth cases separately. It catches signs, shapes, missing factors, and reductions; it does not prove the full training system is correct.

## Why this matters

One wrong local derivative can poison thousands of updates. A small gradient check is cheap evidence before investing in a long training run, especially after changing a loss, reduction, layer, or custom operation.

## How it works

For scalar `L(θ)`, central difference at coordinate `j` is

```text
g_num[j] = [L(θ+h eⱼ)−L(θ−h eⱼ)]/(2h).
```

Compare with `g_ref` using `2|g_ref−g_num|/(|g_ref|+|g_num|+ε)`. Use a small but not microscopic `h`, freeze stochastic state, and test a few representative coordinates before expanding coverage.

## Worked examples and variations

### Example A: correct quadratic gradient

**Input:** `L(θ)=½||θ||²`, `θ=[2,−3]`. **Mechanism:** analytic gradient `[2,−3]`; central differences agree. **Output:** low relative error. **Inspect:** each coordinate is independently testable. **Decision:** use this as a harness smoke test.

### Example B: wrong sign

**Input:** `L(w)=½(w−4)²` at `w=1`. **Mechanism:** true gradient `−3`; implementation returns `+3`. **Output:** relative error is near 2, not a small tolerance miss. **Inspect:** a one-coordinate sign fixture makes the diagnosis obvious. **Decision:** fix the derivative before tuning the optimiser.

### Boundary case: a kink

**Input:** `L(w)=|w|` at `w=0`. **Mechanism:** symmetric central difference returns 0 while one-sided slopes are −1 and 1. **Output:** a failed classical check is expected. **Inspect:** the point is non-differentiable. **Decision:** test away from the kink or use a subgradient policy.

### Counterexample: missing mean reduction

**Input:** batch loss is intended as a mean over four rows, but gradient code returns the sum. **Mechanism:** every coordinate is four times too large. **Output:** direction may look right while scale is wrong. **Inspect:** compare batch sizes 1 and 4. **Decision:** make reduction an explicit test dimension.

## Two ways to see it

### Builder view

The check is a contract test: fixed input, fixed state, reference derivative, numerical probe, tolerance, and failure classification. Print the worst coordinates and their intermediate values.

### Systems or numerical view

A passing check can coexist with a wrong label, data leak, or poorly chosen objective. A failing check can be numerical noise, a kink, stochasticity, or an invalid domain. Diagnosis needs context.

## Hands-on

Write a checker for a small affine-plus-squared-loss model. Test a correct implementation, a sign bug, and a reduction bug.

**Failure state:** check at `|w|`'s kink and use an unseeded random augmentation. **Test:** label them `nondifferentiable` and `nondeterministic` rather than flattening both into `gradient-wrong`. **Reset:** choose a smooth point and freeze the fixture.

## Checkpoint

- [ ] Write the central-difference formula for one parameter.
- [ ] Explain why relative error needs an epsilon or an absolute-error fallback.
- [ ] Diagnose a sign error from a one-dimensional fixture.
- [ ] Name three non-mathematical reasons a check can fail.

## What this does not solve

Gradient checks are local and sampled. They do not cover every branch, prove training convergence, or validate data semantics and production distributions.

## Continue, go deeper, apply it

- Continue: Non-smooth optimisation and subgradients
- Go deeper: Finite differences and numerical derivative checks
- Apply it: Datasets, rubrics, and judges
