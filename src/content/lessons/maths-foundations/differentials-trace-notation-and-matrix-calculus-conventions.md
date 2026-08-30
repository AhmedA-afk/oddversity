---
title: "Differentials, trace notation, and matrix-calculus conventions"
track: "maths-foundations"
status: live
summary: "Use differentials to state first-order changes without hiding shapes: df=∇fᵀdx, and for a matrix expression use dL plus trace identities to collect."
duration: "3 min read"
---

## The short answer

Use differentials to state first-order changes without hiding shapes: `df=∇fᵀdx`, and for a matrix expression use `dL` plus trace identities to collect the coefficient of `dW`. Conventions differ on row versus column gradients, so shapes and the scalar differential are the authority. This discipline prevents silent transposes in linear-layer derivatives.

## Why this matters

Matrix calculus notation is compact enough to conceal orientation mistakes. If `W` is `m×n`, `x` is `n×1`, and `y` is `m×1`, the derivative with respect to `W` must also be `m×n`; a result with `n×m` may be the transpose convention, not necessarily the desired update.

## How it works

Let `r=Wx−y` and `L=½rᵀr`. Then

```text
dL = rᵀdr
   = rᵀ(dW x)
   = tr(rᵀ dW x)
   = tr(x rᵀ dW).
```

Using `dL=tr((∂L/∂W)ᵀdW)`, identify `∂L/∂W=r xᵀ`. Shapes are `r(m×1)xᵀ(1×n)=m×n`.

## Worked examples and variations

### Example A: scalar linear prediction

**Input:** `L=½(wx−y)²`, residual `r=wx−y`. **Mechanism:** `dL=r x dw`; derivative is `rx`. **Output:** at `w=2,x=3,y=10`, gradient is `−12`. **Inspect:** residual and input both contribute. **Decision:** preserve the input unit in the derivative.

### Example B: matrix shape derivation

**Input:** `W∈R^{2×3}`, `x∈R³`, `y∈R²`. **Mechanism:** `r∈R²`, `rxᵀ∈R^{2×3}`. **Output:** valid parameter gradient matches `W`. **Inspect:** each output residual scales one row. **Decision:** assert shapes before applying updates.

### Boundary case: batch reduction

**Input:** a batch of `n` samples. **Mechanism:** sum gradients then divide by `n` only if the loss is a mean. **Output:** sum and mean have the same direction but different scale. **Inspect:** batch-size changes otherwise alter the effective learning rate. **Decision:** name the reduction in both equation and code.

### Counterexample: transposed update

**Input:** a computed `n×m` array for an `m×n` weight matrix. **Mechanism:** it may arise from choosing a row-gradient convention and forgetting to transpose at the update boundary. **Output:** broadcasting or a silent wrong update. **Inspect:** compare `shape`, `dL` reconstruction, and a finite difference. **Decision:** choose one convention and test it.

## Two ways to see it

### Builder view

Use a shape ledger beside every symbol and verify `dL` numerically by reconstructing `tr((∂L/∂W)ᵀdW)` for a random small `dW`.

### Systems or numerical view

A mathematically equivalent transpose convention can be operationally incompatible across libraries. Interoperability needs an explicit contract, not visual familiarity with notation.

## Hands-on

Implement the affine least-squares loss for one sample and a batch. Compare the matrix-calculus gradient with finite differences over each weight.

**Failure state:** transpose the gradient and average a sum loss twice. **Test:** shape assertions and relative-error checks must expose both issues. **Reset:** restore `rxᵀ` and the declared batch reduction.

## Checkpoint

- [ ] Derive `∂(½||Wx−y||²)/∂W` with shapes.
- [ ] Explain why trace notation helps collect `dW`.
- [ ] Distinguish sum and mean gradient scale.
- [ ] State how you would resolve row/column convention ambiguity.

## What this does not solve

Notation cannot correct a wrong objective, data shape, or model semantics. It only makes the derivative contract explicit enough to test.

## Continue, go deeper, apply it

- Continue: Derivatives of affine layers and elementwise activations
- Go deeper: Reverse-mode autodiff and backpropagation
- Apply it: Linear regression
