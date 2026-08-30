---
title: "Newton, quasi-Newton, and coordinate-descent methods"
track: "maths-foundations"
status: live
summary: "Newton’s method uses gradient and Hessian curvature to propose θnew=θ−H⁻¹g, often reaching a quadratic optimum quickly near a well-behaved solution."
duration: "5 min read"
---

## The short answer

Newton’s method uses gradient and Hessian curvature to propose `θ_new=θ−H⁻¹g`, often reaching a quadratic optimum quickly near a well-behaved solution. Quasi-Newton methods approximate curvature, trading memory and computation for fewer Hessian operations. Coordinate descent optimises one parameter or block at a time and is useful when each subproblem is cheap, especially with sparse penalties. Non-convexity, singular curvature, and large dimension require safeguards.

## Why this matters

First-order methods use slope only; curvature-aware methods can avoid zig-zagging in poorly conditioned bowls. The price is solving systems, storing matrices or histories, and handling indefinite or noisy curvature. Method choice is a workload and stability decision, not a leaderboard.

**Small incident (illustrative):** Newton’s method took a large step toward a saddle on a non-convex objective. The local quadratic model was informative but not globally trustworthy; damping and line search were missing.

## How it works

Taylor expansion gives `J(θ+δ)≈J(θ)+gᵀδ+.5δᵀHδ`. Setting its derivative to zero gives `Hδ=−g`. Newton solves this linear system rather than explicitly forming H⁻¹. Quasi-Newton updates an approximation to H or its inverse from successive parameter and gradient differences. Coordinate descent fixes all but one coordinate and minimises the resulting one-dimensional or block objective.

### Assumptions and derivation

Quadratic convergence needs a sufficiently smooth objective, a nonsingular appropriate Hessian, and a start near a suitable minimiser. If H is indefinite, the raw Newton direction need not descend; damped steps, trust regions, or modified curvature are needed. Coordinate descent’s guarantees depend on convexity/regularity and on solving coordinate subproblems accurately.

## AI use

Use Newton or quasi-Newton for smaller smooth convex problems, calibration layers, or offline fitting where curvature memory is affordable. Use coordinate/proximal descent for sparse linear models. For large stochastic neural networks, first-order methods are often more practical, but curvature diagnostics still explain behaviour.

## Worked examples and variations

### Example A — smallest happy path

**Input:** J(w)=.5·4w², gradient=4w, Hessian=4, start w=3. **Mechanism:** Newton step δ=−(4w)/4=−w. **Output:** w_new=0 in one step. **Inspect:** exact quadratic curvature is constant. **Next decision:** recognise why Newton is fast on a well-scaled quadratic.

### Example B — meaningful variation

**Input:** J(x,y)=.5(x²+100y²), gradient at (1,1)=(1,100), H=diag(1,100). **Mechanism:** solve Hδ=−g, giving δ=(−1,−1). **Output:** reach the minimum in one exact Newton step while fixed-step GD zig-zags. **Inspect:** the method used curvature, not a huge global η. **Next decision:** compare solve cost with iteration savings.

### Example C — boundary case

**Input:** H is singular because two features are duplicates. **Mechanism:** Hδ=−g has no unique Newton solution. **Output:** direct solve fails or chooses an unstable direction. **Inspect:** rank and condition number. **Next decision:** regularise, remove redundancy, use a pseudoinverse carefully, or choose another method.

### Example D — tempting counterexample

**Input:** J(w)=w⁴−w² at w=0.1. **Mechanism:** local curvature can point toward a non-global structure and a full step can overshoot. **Output:** non-monotone or divergent iterates. **Inspect:** objective along the proposed direction and use line search. **Next decision:** add damping/trust-region safeguards.

### Example E — coordinate descent

**Input:** L1-regularised two-feature regression. **Mechanism:** hold one coefficient fixed and solve the other with soft-thresholding, then alternate. **Output:** sparse coefficients when the penalty dominates weak signals. **Inspect:** coordinate order, objective decrease, and stopping residual. **Next decision:** use when coordinate subproblems are cheap and the solution is stable.

## Computation and interpretation

```python
import numpy as np

H = np.diag([1., 100.])
g = np.array([1., 100.])
delta = np.linalg.solve(H, -g)
print(delta, np.array([1., 1.]) + delta)
```

Use `solve`, not an explicit inverse. The one-step result depends on the exact quadratic and positive-definite H. For a general objective, log whether the proposed step decreases the objective before accepting it.

## Two ways to see it

### Builder view

Newton builds a local quadratic, solves for its minimiser, and then checks the step. Quasi-Newton stores a compact history; coordinate descent changes one axis at a time.

### Systems view

Curvature is computational state and risk. Memory, linear solves, noisy gradients, singularity, and rollback matter as much as the local convergence story.

## Hands-on

Compare GD, exact Newton, and coordinate descent on the two-dimensional quadratic. **Failure fixture:** make H singular with duplicate columns and call `np.linalg.inv(H)`. **Test:** the lab must use a solve, detect singular/ill-conditioned curvature, and avoid claiming a unique Newton direction. **Reset:** restore positive-definite H and the original start point.

## Checkpoint

- [ ] Derive the Newton step from a second-order Taylor model.
- [ ] Explain why solving Hδ=−g is preferable to forming H⁻¹.
- [ ] Name two safeguards for indefinite or unreliable curvature.
- [ ] Give a setting where coordinate descent is a reasonable choice.

## What this does not solve

Curvature-aware methods do not guarantee global convergence on non-convex objectives, remove bad data, or make a singular model identifiable. Exact Hessians can be expensive and noisy; approximate curvature can be wrong. Every step still needs objective and finite-value checks.

## Continue, go deeper, apply it

- Continue: Objectives, losses, empirical risk, and constraints
- Go deeper: Regularisation geometry
- Apply it: Optimisation, loss, and gradient descent
