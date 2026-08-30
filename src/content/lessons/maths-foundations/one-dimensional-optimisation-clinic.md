---
title: "One-dimensional optimisation clinic"
track: "maths-foundations"
status: live
summary: "To minimise a differentiable scalar loss L(x), move against its derivative: x₊=x−ηL'(x)."
duration: "3 min read"
---

## The short answer

To minimise a differentiable scalar loss `L(x)`, move against its derivative: `x₊=x−ηL'(x)`. A line search or backtracking test chooses `η` by checking actual loss decrease. Plotting the iteration trace exposes convergence, stalling, and overshooting. In AI, this is the one-parameter laboratory for understanding learning rates before adding many parameters.

## Why this matters

An update can be mathematically downhill at the current point but still cross a narrow valley, leave the valid domain, or amplify noise. A reliable clinic logs the whole trajectory and has a rollback path, rather than trusting the final scalar.

## How it works

The first-order model is `L(x−ηg)≈L(x)−ηg²`, where `g=L'(x)`. For sufficiently small positive `η`, the predicted change is non-positive. Backtracking starts with a candidate step and shrinks it until a sufficient-decrease condition such as `L(x−ηg)≤L(x)−cηg²` holds.

For `L(x)=½kx²`, `g=kx` and the update is `x₊=(1−ηk)x`. It converges for `0<ηk<2`, oscillates at `ηk=2`, and diverges for `ηk>2`.

## Worked examples and variations

### Example A: stable quadratic descent

**Input:** `L(x)=½x²`, `x₀=4`, `η=0.5`. **Mechanism:** `x₊=0.5x`, so the sequence is `4,2,1,0.5,...`. **Output:** loss decreases geometrically. **Inspect:** both distance and loss shrink. **Decision:** retain the rate only after checking more than one starting point.

### Example B: backtracking on an asymmetric loss

**Input:** `L(x)=exp(x)+(x−2)²`, start `x=2`. **Mechanism:** try a large downhill step, evaluate the actual loss, then halve `η` until the decrease test passes. **Output:** a safe step may differ across the domain. **Inspect:** record rejected candidates, not just accepted points. **Decision:** use line search when curvature varies sharply.

### Boundary case: constrained domain

**Input:** `L(x)=−log(x)` with `x>0`, start `x=0.1`. **Mechanism:** an update that crosses zero is invalid even if the algebraic direction seems downhill. **Output:** the step must be clipped, rejected, or reparameterised. **Inspect:** evaluate the domain before the loss. **Decision:** treat constraints as part of the optimiser contract.

### Counterexample: overshooting

**Input:** `L(x)=½·10x²`, `x₀=1`, `η=0.25`. **Mechanism:** `ηk=2.5`, so `x₊=−1.5x`; magnitudes grow. **Output:** loss diverges while the sign alternates. **Inspect:** plot `x` and `L`, not only the last value. **Decision:** reduce `η` or use a line search.

## Two ways to see it

### Builder view

Use an iteration table: step, `x`, loss, derivative, proposed `η`, accepted/rejected, and reason. Keep the best-known point so a failed run can roll back.

### Systems or numerical view

Loss decrease on one fixture does not prove generalisation or convergence on a noisy high-dimensional objective. Optimiser state, stochastic batches, and stopping tolerances create additional failure modes.

## Hands-on

Implement gradient descent with optional backtracking for a quadratic and one non-quadratic loss. Plot the trace and save the best point.

**Failure state:** run the quadratic with `ηk>2`, and allow a log-loss step to cross zero. **Test:** assert divergence is flagged and invalid-domain proposals are rejected before evaluation. **Reset:** reload the saved best point, lower `η`, and rerun.

## Checkpoint

- [ ] Derive the update for `½kx²`.
- [ ] State the stable range for `η` in that quadratic.
- [ ] Explain what backtracking tests before accepting a step.
- [ ] Design a reset path for an invalid-domain update.

## What this does not solve

One-dimensional descent does not guarantee success in non-convex, stochastic, or constrained high-dimensional training. It teaches the observable mechanics; gradients, Hessians, and system-level evaluation add the remaining evidence.

## Continue, go deeper, apply it

- Continue: Partial derivatives and coordinate-wise sensitivity
- Go deeper: Hessians, curvature, and saddle points
- Apply it: Optimisation, loss, and gradient descent
