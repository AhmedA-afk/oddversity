---
title: "Non-smooth optimisation and subgradients"
track: "maths-foundations"
status: live
summary: "At a kink, a classical derivative may not exist, but a convex function can still have a subgradient: a slope g whose supporting line lies below."
duration: "3 min read"
---

## The short answer

At a kink, a classical derivative may not exist, but a convex function can still have a subgradient: a slope `g` whose supporting line lies below the function. For `|x|` at zero, every `g∈[−1,1]` is a subgradient. Optimisers can choose a valid convention, but gradient checks and convergence claims must acknowledge the non-smooth point.

## Why this matters

Absolute values, L1 penalties, ReLU, clipping, and piecewise policies are common. Treating a selected slope as the unique derivative hides a modelling choice; refusing to optimise at a kink is also unnecessary. The right question is whether the update and convention are explicit.

## How it works

For convex `f`, `g` is a subgradient at `x` if `f(z)≥f(x)+g(z−x)` for all `z`. For `f(x)=|x|` at zero, this requires `|z|≥gz` for every `z`, which holds exactly when `−1≤g≤1`. Away from zero, the subgradient is the ordinary sign.

## Worked examples and variations

### Example A: absolute-value minimisation

**Input:** `f(x)=|x−3|` at `x=1`. **Mechanism:** subgradient is −1, so a descent step moves right. **Output:** the update heads toward 3. **Inspect:** away from the kink, the rule is an ordinary derivative. **Decision:** use a step size that does not jump far past the target.

### Example B: L1 regularisation

**Input:** objective `L(w)=loss(w)+λ|w|`. **Mechanism:** penalty contributes `λ sign(w)` away from zero and a chosen value in `[−λ,λ]` at zero. **Output:** small coefficients are pulled toward zero. **Inspect:** the data gradient and penalty subgradient are separate. **Decision:** report λ and the zero policy.

### Boundary case: ReLU at zero

**Input:** `r(z)=max(0,z)` at 0. **Mechanism:** left and right slopes differ; a framework chooses a local convention. **Output:** zero, one, or another documented choice may be used operationally. **Inspect:** repeated inputs must produce the same policy. **Decision:** include the kink in tests, not in an ordinary smooth tolerance gate.

### Counterexample: central difference as the truth

**Input:** `|x|` at 0. **Mechanism:** central difference is 0, but 0 is one valid subgradient among many, not proof of a unique derivative. **Output:** a passing numerical check can conceal a convention. **Inspect:** compare one-sided values and the subgradient inequality. **Decision:** test the chosen optimisation rule directly.

## Two ways to see it

### Builder view

Mark non-smooth operations in the graph and attach a policy: subgradient selection, smoothing, or proximal update. Test the policy at and around each kink.

### Systems or numerical view

Subgradients support useful optimisation but do not make the objective smooth. Step-size behaviour, convergence rates, and autodiff semantics can differ from smooth cases.

## Hands-on

Implement subgradient descent for `|x−3|` and an L1-regularised quadratic. Plot trajectories from both sides of the kink.

**Failure state:** let a gradient checker demand one smooth derivative at zero and use an inconsistent ReLU policy. **Test:** the harness must classify the kink and verify the selected subgradient inequality. **Reset:** restore a documented policy and start from a non-kink fixture for smooth checks.

## Checkpoint

- [ ] Prove that `g∈[−1,1]` is a subgradient of `|x|` at zero.
- [ ] Explain how L1 adds a piecewise contribution to a gradient.
- [ ] Distinguish a chosen autodiff slope from a unique classical derivative.
- [ ] State one test appropriate for a non-smooth point.

## What this does not solve

Subgradients do not guarantee fast convergence, unique solutions, or a desirable sparse model. They also do not justify treating every discontinuity as optimisable.

## Continue, go deeper, apply it

- Continue: Constrained optimisation, Lagrange multipliers, and KKT intuition
- Go deeper: Regularisation and bias–variance
- Apply it: Gradient checking and debugging
