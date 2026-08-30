---
title: "A4 · Derivative and gradient audit"
track: "maths-foundations"
status: live
summary: "This lab audits one derivative three ways: derive it, estimate it with central finite differences, and ask an autodiff system to compute it."
duration: "7 min read"
---

## The short answer

This lab audits one derivative three ways: derive it, estimate it with central finite differences, and ask an autodiff system to compute it. You will test both a vector-valued residual Jacobian and a scalar loss gradient, then diagnose an intentional sign bug and shape bug. Agreement is evidence that the implementation matches the stated function; it is not proof that the function itself is the right AI objective.

## Why this matters

Gradient errors often look like optimiser problems. A sign error sends descent uphill; a transpose error can be hidden by broadcasting or only appear when dimensions change. A small deterministic audit isolates calculus and shape contracts before a long training run.

## Lab contract

Submit one reproducible notebook or Python script containing:

1. the problem statement in your own words;
2. assumptions, shapes, and fixed random/library versions;
3. a hand derivation for the vector Jacobian and scalar gradient;
4. analytic, central finite-difference, and autodiff values in a labelled table;
5. the intentional sign/shape failure, its diagnostic, and the repaired result; and
6. a 150–300 word decision memo saying whether the gradient implementation is ready to use and what the audit cannot establish.

Use NumPy for the model and finite differences. Use a fixed autodiff verifier such as PyTorch with `float64`; record `np.__version__` and `torch.__version__` in the artifact.

## How it works

Let `θ∈R³`, `W∈R⁴ˣ³`, `c∈R⁴`, and define a vector residual:

```text
r(θ) = Wθ + c                  shape (4,)
L(θ) = ½ mean(r(θ)²)           scalar
```

The vector function's Jacobian is `Jᵣ=W`. For a perturbation `dθ`, `dr=W dθ`.

```text
dL = (1/4) rᵀ dr
   = (1/4) rᵀ W dθ
   = [(1/4) Wᵀr]ᵀ dθ
```

Therefore the analytic scalar gradient is `∇L=(Wᵀr)/4`. The factor `1/4` is the mean reduction and is part of the contract.

Use this deterministic fixture:

```python
import numpy as np

W = np.array([
    [ 1.0, -2.0,  0.5],
    [ 0.3,  1.2, -1.0],
    [-0.7,  0.4,  1.5],
    [ 1.1, -0.6,  0.2],
], dtype=np.float64)
c = np.array([0.2, -0.1, 0.3, -0.4], dtype=np.float64)
theta = np.array([0.25, -0.5, 0.75], dtype=np.float64)

def residual(theta):
    return W @ theta + c

def loss(theta):
    r = residual(theta)
    return 0.5 * np.mean(r * r)

def analytic_jacobian(theta):
    return W.copy()

def analytic_gradient(theta):
    return W.T @ residual(theta) / residual(theta).size
```

## Worked examples and variations

### Case A: vector-valued Jacobian

**Input:** `θ=[0.25,−0.5,0.75]`. **Mechanism:** perturb one coordinate at a time and fill `J_num[:,j]=(r(θ+h eⱼ)−r(θ−h eⱼ))/(2h)`. **Output:** `J_num` should match `W`, with shape `(4,3)`. **Inspect:** rows are residual outputs and columns are parameter inputs. **Decision:** do not continue to the scalar check if the Jacobian orientation is wrong.

### Case B: scalar loss gradient

**Input:** the same fixture. **Mechanism:** compare `W.T @ r / 4` to the coordinate-wise central difference of `loss`. **Expected:** `r=[1.825,−1.375,1.05,0.325]`, `L≈0.803671875`, and `∇L≈[0.25875,−1.26875,0.981875]`. **Inspect:** the reduction factor is visible in every coordinate. **Decision:** accept only when relative error is below the chosen tolerance.

### Boundary case: a near-zero coordinate gradient

**Input:** modify `c` or `θ` so one component of `W.T @ r` is near zero. **Mechanism:** relative error can become unstable when both reference values are tiny. **Output:** a large relative ratio may coexist with a harmless absolute error. **Inspect:** report both absolute error and a symmetric relative error with `ε`. **Decision:** use an absolute tolerance fallback for near-zero coordinates.

### Counterexample: intentional sign and shape bugs

**Input:** the same fixture. **Mechanism:** test these mutants one at a time:

```python
sign_bug = -(W.T @ residual(theta)) / residual(theta).size
shape_bug = W @ residual(theta) / residual(theta).size
```

**Output:** `sign_bug` has the right `(3,)` shape but disagrees in direction; `shape_bug` is invalid because `(4,3)@(4,)` has incompatible inner dimensions. **Inspect:** report the first failing assertion, not merely “gradient check failed.” **Decision:** restore `W.T`, the positive sign, and the mean divisor.

## Three independent checks

Implement central differences without using an autodiff result as the reference:

```python
def central_gradient(fun, x, h=1e-5):
    out = np.empty_like(x)
    for j in range(x.size):
        plus, minus = x.copy(), x.copy()
        plus[j] += h
        minus[j] -= h
        out[j] = (fun(plus) - fun(minus)) / (2.0 * h)
    return out

def symmetric_relative_error(a, b, eps=1e-12):
    return 2.0 * np.abs(a - b) / (np.abs(a) + np.abs(b) + eps)
```

For autodiff, recreate the scalar function in PyTorch and request both a scalar gradient and a residual Jacobian. Keep `W`, `c`, and `θ` in `torch.float64`; the NumPy function must remain the independent reference for finite differences.

Record a table with columns:

```text
quantity | analytic shape | finite-difference shape | autodiff shape | max abs error | max relative error | decision
```

## Two ways to see it

### Builder view

The audit is a contract test: equation → shape ledger → independent implementation → tolerance → decision. A failing test should identify whether the issue is value, sign, shape, reduction, step size, or nondifferentiability.

### Systems or numerical view

Three agreeing computations can still agree on the same wrong data pipeline or wrong objective. Finite differences also depend on step size, while autodiff differentiates the graph it receives, including any hidden detach or branch.

## Hands-on

1. Print the fixture, residual, loss, shapes, and library versions.
2. Derive and implement `Jᵣ` and `∇L` by hand.
3. Compute central-difference Jacobian and gradient with `h∈{10⁻³,10⁻⁴,10⁻⁵}`.
4. Compute the corresponding PyTorch autodiff values.
5. Run the correct implementation through assertions.
6. activate `sign_bug`, then `shape_bug`, and capture each failure.
7. Restore the correct code and rerun the full table.

**Deliberate failure:** the sign mutant should fail direction/alignment even though its shape passes; the shape mutant should fail before comparison with a clear dimension message.

**Test:** for the repaired smooth fixture, require all shapes to match and `max symmetric relative error < 1e-5` for both the scalar gradient and vector Jacobian. **Reset:** restore the original fixture and implementation, rerun from a clean process, and confirm identical outputs.

## Checkpoint

- [ ] Explain why `Jᵣ` is `(4,3)` while `∇L` is `(3,)`.
- [ ] Show where the batch/mean divisor enters the scalar gradient.
- [ ] Identify the sign mutant from a direction or dot-product test.
- [ ] Explain why a kink, stochastic state, or poor `h` can invalidate a numerical comparison.
- [ ] Attach a 150–300 word decision memo with a limitation.

## Acceptance tests

- [ ] Fixed fixture and `float64` versions are recorded.
- [ ] Analytic, central finite-difference, and autodiff values are all present.
- [ ] Vector Jacobian and scalar gradient shapes are asserted.
- [ ] Correct smooth case passes `1e-5` symmetric relative error.
- [ ] Sign bug is caught despite having a valid shape.
- [ ] Shape bug is caught before a misleading numerical comparison.
- [ ] Clean reset reproduces the passing table.

## Rubric

| Criterion | Weight | Full-credit evidence |
|---|---:|---|
| Mathematical model | 25% | correct residual/Jacobian/gradient derivation, shapes, and mean factor |
| Computation | 20% | reproducible NumPy, finite-difference, and autodiff implementations |
| Interpretation | 20% | gradient agreement connected to an AI training/debugging decision |
| Diagnostics | 20% | sign/shape mutants, tolerance reasoning, and reset evidence |
| Communication | 15% | labelled comparison table, readable plots or traces, 150–300 word memo |

## What this does not solve

Passing this audit does not prove that the loss is appropriate, the data are valid, the model will converge, or the production graph matches the fixture. It is local evidence about one deterministic implementation and its derivative contract.

## Continue, go deeper, apply it

- Continue: Reverse-mode autodiff and backpropagation
- Go deeper: Gradient checking and debugging
- Apply it: A5 · Backpropagation from scratch
