---
title: "Batch gradient descent and learning-rate choice"
track: "maths-foundations"
status: live
summary: "Batch gradient descent repeatedly evaluates the gradient of the objective on all available training data and updates parameters by θ ← θ − η∇J(θ)."
duration: "4 min read"
---

## The short answer

Batch gradient descent repeatedly evaluates the gradient of the objective on all available training data and updates parameters by `θ ← θ − η∇J(θ)`. The learning rate η controls how far each step moves. Too small is slow; too large can oscillate or diverge. Use a controlled objective, record loss and gradient norms, and choose η from observed behaviour plus a predeclared budget.

## Why this matters

The update is simple enough to derive and rich enough to expose most optimisation failures. A loss curve that rises, plateaus, or becomes NaN carries information about scale, curvature, gradients, and the data—not just about “bad luck.”

**Small incident (illustrative):** a training run was made ten times longer after progress stalled, but the learning rate was ten times too small. More iterations repeated tiny steps; a short controlled sweep would have exposed the issue.

## How it works

For `J(w)=w²`, gradient is `2w`, so `w_{t+1}=(1−2η)w_t`. Convergence requires `|1−2η|<1`, hence `0<η<1` for this one-dimensional quadratic. At η=.25 the sign stays positive and shrinks; at η=.75 it alternates while shrinking; at η≥1 it fails to converge.

### Assumptions and derivation

The quadratic result generalises through curvature: for a positive-definite quadratic with Hessian eigenvalues between m and L, a fixed step must respect the largest curvature, with a common stable range `0<η<2/L`. The exact rate depends on the condition number. Real objectives may be non-convex, stochastic, constrained, or poorly scaled.

## AI use

Use batch GD as a diagnostic even when production training uses another optimiser. It isolates objective shape, gradient correctness, step-size stability, and data scaling. Log the objective definition, batch, seed, learning rate, gradient norm, and stopping condition.

## Worked examples and variations

### Example A — smallest happy path

**Input:** w₀=4, J=w², η=.25. **Mechanism:** gradient=8; update w₁=2; next w₂=1. **Output:** loss falls 16→4→1. **Inspect:** each update matches the hand calculation. **Next decision:** keep η when the curve decreases predictably.

### Example B — meaningful variation

**Input:** same objective, η=.75. **Mechanism:** w₁=−2, w₂=1, w₃=−.5. **Output:** alternating signs but shrinking magnitude. **Inspect:** oscillation is not automatically divergence. **Next decision:** measure loss and distance, not only parameter sign.

### Example C — boundary case

**Input:** η=1 for J=w². **Mechanism:** w₁=−w₀ and loss never decreases. **Output:** a two-cycle. **Inspect:** gradient is finite; step size is at the stability boundary. **Next decision:** reduce η or rescale the objective.

### Example D — tempting counterexample

**Input:** η=1.2. **Mechanism:** multiplier 1−2η=−1.4, so magnitude grows. **Output:** loss diverges. **Inspect:** values grow before any model-specific bug is blamed. **Next decision:** lower η and add an assertion for finite, decreasing-window loss.

### Example E — ill-conditioned variation

**Input:** J(x,y)=x²+100y² with one shared η. **Mechanism:** y curvature is 100 times larger, so a step safe for y is tiny for x. **Output:** zig-zag or slow progress. **Inspect:** coordinate scales and gradient components. **Next decision:** scale variables or use a method that accounts for conditioning.

## Computation and interpretation

```python
def run(w, eta, steps=8):
    history = []
    for _ in range(steps):
        history.append((w, w*w))
        w = w - eta * 2 * w
    return history

for eta in [.25, .75, 1.2]:
    print(eta, run(4.0, eta))
```

The table makes the learning-rate decision inspectable. A real training curve needs validation loss, gradient norms, and parameter statistics alongside the training objective.

## Two ways to see it

### Builder view

Gradient descent is a feedback controller: measure slope, move opposite it, measure again. The learning rate is the controller gain.

### Systems view

The objective surface may have different curvature in different directions. One global gain can be safe in one direction and destructive in another; logs are the evidence needed to tell which.

## Hands-on

Implement the quadratic update for η values `.25`, `.75`, `1.0`, and `1.2`, and plot loss versus step. **Failure fixture:** set η=1.2 and omit the finite-loss assertion. **Test:** the lab must classify the run as convergent, boundary/oscillating, or divergent from the loss sequence. **Reset:** restore η=.25 and the initial value w=4, then rerun the known trajectory.

## Checkpoint

- [ ] Derive the update for J(w)=w².
- [ ] State why η=1 is a boundary for this objective.
- [ ] Diagnose slow progress versus divergence from a curve.
- [ ] Explain why the largest curvature controls a stable fixed step.

## What this does not solve

Batch GD does not choose a correct objective, escape every non-convex issue, or guarantee useful generalisation. A decreasing training loss can coexist with leakage, overfit, bad calibration, or a broken deployment metric.

## Continue, go deeper, apply it

- Continue: Stochastic and mini-batch gradient descent
- Go deeper: Conditioning, scaling, initialisation, and normalisation
- Apply it: Optimisation, loss, and gradient descent
