---
title: "Jacobians for vector-valued functions"
track: "maths-foundations"
status: live
summary: "The Jacobian of F:Rⁿ→Rᵐ is the m×n matrix of output partial derivatives, Jᵢⱼ=∂Fᵢ/∂xⱼ. It is the best first-order linear map: F(x+Δ)≈F(x)+JΔ."
duration: "3 min read"
---

## The short answer

The Jacobian of `F:Rⁿ→Rᵐ` is the `m×n` matrix of output partial derivatives, `Jᵢⱼ=∂Fᵢ/∂xⱼ`. It is the best first-order linear map: `F(x+Δ)≈F(x)+JΔ`. Rows correspond to outputs and columns to inputs. Writing that orientation down prevents a common transpose and shape error in autodiff and sensitivity code.

## Why this matters

Preprocessing, neural layers, coordinate transforms, and vector losses all map vectors to vectors. A Jacobian describes how one input movement changes every output together; it also makes the dimensions of forward- and reverse-mode derivatives concrete.

## How it works

For `F(x,y)=(x+y,xy)`, differentiate each output with respect to each input:

```text
J(x,y) = [[1, 1], [y, x]].
```

At `(2,3)`, a movement `Δ=(0.1,−0.2)` predicts `JΔ=(−0.1,−0.1)`. The first component uses the first row; the second uses the second row.

## Worked examples and variations

### Example A: affine map

**Input:** `F(x)=Ax+b`, with `A=[[2,1],[-1,3]]`. **Mechanism:** every output partial is constant, so `J=A`. **Output:** the linear approximation is exact. **Inspect:** `F(x+Δ)−F(x)=AΔ`. **Decision:** use the layer matrix directly, with output-by-input shape.

### Example B: nonlinear coordinate transform

**Input:** `F(x,y)=(x², sin(y))` at `(2,0)`. **Mechanism:** `J=[[4,0],[0,1]]`. **Output:** an x perturbation affects only the first output locally; a y perturbation affects only the second. **Inspect:** off-diagonal zeros are local decoupling, not a global independence claim. **Decision:** inspect the Jacobian at multiple operating points.

### Boundary case: scalar output

**Input:** `f:R³→R`. **Mechanism:** the Jacobian is `1×3`, conventionally the gradient as a row. **Output:** `JΔ` is a scalar. **Inspect:** code may store gradients as column vectors. **Decision:** convert explicitly at API boundaries.

### Counterexample: transposed multiplication

**Input:** `J` is `2×3` and `Δ` is `3×1`. **Mechanism:** `JΔ` is valid `2×1`; `ΔJ` is invalid. **Output:** a transpose inserted to “make it work” changes the map. **Inspect:** label input and output shapes before multiplication. **Decision:** fix orientation, not only the exception.

## Two ways to see it

### Builder view

Create a table whose rows are outputs and columns are inputs. Test one-hot perturbations: column `j` should match the output change from changing input `j`.

### Systems or numerical view

Full Jacobians can be too large to materialise. Products such as `Jv` or `uᵀJ` often carry the needed information more cheaply; this motivates forward and reverse autodiff.

## Hands-on

Build the Jacobian for `F(x,y)=(x+y,xy)` by hand and compare `JΔ` to an actual small perturbation for several `Δ` values.

**Failure state:** swap rows and columns, then use a `2×3` Jacobian with a `2×1` input move. **Test:** shape assertions must identify orientation and input-length errors. **Reset:** restore output rows/input columns and a length-3 perturbation.

## Checkpoint

- [ ] Construct the Jacobian of `(x²,sin y)`.
- [ ] Explain what `JΔ` approximates.
- [ ] State the shape of a scalar-output Jacobian with three inputs.
- [ ] Give one reason not to materialise a huge Jacobian.

## What this does not solve

A Jacobian is local and first-order. It does not capture curvature, global invertibility, or whether an input perturbation is feasible or meaningful.

## Continue, go deeper, apply it

- Continue: Hessians, curvature, and saddle points
- Go deeper: Forward-mode automatic differentiation
- Apply it: Linear algebra for ML
