---
title: "Convex sets, convex functions, and guarantees"
track: "maths-foundations"
status: live
summary: "A set is convex when every line segment between two points in it stays inside."
duration: "5 min read"
---

## The short answer

A set is convex when every line segment between two points in it stays inside. A function is convex when its graph lies below every chord, equivalently when `f(tx+(1−t)y) ≤ t f(x)+(1−t)f(y)`. For a convex objective over a convex feasible set, every local minimum is global. Neural-network training is generally non-convex, so this guarantee does not transfer automatically.

## Why this matters

Convexity tells you when an optimiser’s endpoint has a strong interpretation and when initialisation or local traps can matter. It is a guarantee about a mathematical problem, not a promise attached to a library or an algorithm name.

**Small incident (illustrative):** a team assumed that a decreasing training loss meant it had found the best model. The loss was non-convex and two seeds reached different solutions; the missing diagnostic was multi-start comparison.

## How it works

The line-segment definition captures “no bowl-shaped valley that dips below a chord.” A differentiable convex function satisfies `f(y) ≥ f(x)+∇f(x)ᵀ(y−x)`, so every tangent is a global lower bound. If a differentiable point has zero gradient in an unconstrained convex problem, it is globally optimal.

### Assumptions and derivation

The local-to-global statement requires both the objective and feasible set to be convex and the point to satisfy the relevant optimality conditions. A convex function can have a flat set of global minima and need not be strictly convex. Constraints, numerical error, stochastic gradients, and approximate stopping still affect the returned solution.

## AI use

Recognise convex least squares, logistic regression with convex regularisation, and some allocation problems as settings with stronger guarantees. Recognise neural networks, matrix factorisation, and many latent-variable objectives as non-convex. Use the distinction to choose diagnostics, restarts, and claims.

## Worked examples and variations

### Example A — smallest happy path

**Input:** interval set [0,1], points x=0.2 and y=.8. **Mechanism:** every convex combination lies in [0,1]. **Output:** a convex feasible set. **Inspect:** check endpoints and the segment, not only a pair of grid points. **Next decision:** convex constraints can support global optimisation theory.

### Example B — meaningful variation

**Input:** f(x)=x². **Mechanism:** `f(tx+(1−t)y)≤t f(x)+(1−t)f(y)` follows from the nonnegative second derivative. **Output:** unique global minimum at x=0. **Inspect:** tangent at any point is a lower bound. **Next decision:** gradient descent has a global target on this unconstrained problem.

### Example C — boundary case

**Input:** f(x)=|x|. **Mechanism:** f is convex but not differentiable at zero. **Output:** zero is still a global minimum; subgradients handle the kink. **Inspect:** an implementation requiring a derivative everywhere needs a special case. **Next decision:** use subgradient or proximal reasoning.

### Example D — tempting counterexample

**Input:** f(x)=x⁴−x². **Mechanism:** the double-well shape is non-convex. **Output:** a stationary point at zero is a local maximum, while two lower minima exist. **Inspect:** evaluate curvature or plot the function. **Next decision:** do not use convex guarantees.

### Example E — convex loss, non-convex training

**Input:** a deep network with squared loss. **Mechanism:** the loss may be convex in the final layer while the composition with hidden weights is non-convex. **Output:** layerwise convexity does not imply whole-model convexity. **Inspect:** vary initialisation and inspect trajectories. **Next decision:** scope the guarantee to the variables it actually covers.

## Computation and interpretation

```python
def convexity_gap(f, x, y, t):
    return t * f(x) + (1 - t) * f(y) - f(t * x + (1 - t) * y)

print(convexity_gap(lambda z: z*z, -2, 3, .4))
print(convexity_gap(lambda z: z**4 - z**2, -1, 1, .5))
```

Nonnegative gaps support convexity for the tested pair; a finite test cannot prove global convexity. A negative gap is a concrete counterexample.

## Two ways to see it

### Builder view

Convexity is a testable property of the objective, domain, and parameterisation. Write the exact problem before repeating an optimiser claim.

### Systems view

Guarantees are scoped evidence. “Convex loss” says nothing about data leakage, label quality, latency, or whether the model class used in production is the same one analysed.

## Hands-on

Test the Jensen gap for f(x)=x² and the double-well function on a fixed grid. **Failure fixture:** sample only points near zero for the non-convex function and claim it is convex. **Test:** include the pair x=−1, y=1, t=.5; the negative gap must fail the convexity assertion. **Reset:** restore the grid and report the result as a finite diagnostic, not a proof.

## Checkpoint

- [ ] Define a convex set and a convex function.
- [ ] State why a stationary point is globally optimal under the right convex assumptions.
- [ ] Give a convex but nondifferentiable example.
- [ ] Explain why neural-network training is not covered by a convex-loss guarantee in general.

## What this does not solve

Convexity does not guarantee fast convergence, good data, or useful objectives. Numerical implementations can still diverge or stop early. Non-convexity does not prove an algorithm will fail; it changes the strength of the claim.

## Continue, go deeper, apply it

- Continue: Batch gradient descent and learning-rate choice
- Go deeper: Optimisation diagnostics and second-order perspective
- Apply it: Optimisation, loss, and gradient descent
