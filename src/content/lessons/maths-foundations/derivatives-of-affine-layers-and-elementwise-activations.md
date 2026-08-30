---
title: "Derivatives of affine layers and elementwise activations"
track: "maths-foundations"
status: live
summary: "For an affine layer z=Wx+b with upstream sensitivity g=∂L/∂z, the parameter derivatives are ∂L/∂W=gxᵀ, ∂L/∂b=g, and ∂L/∂x=Wᵀg."
duration: "3 min read"
---

## The short answer

For an affine layer `z=Wx+b` with upstream sensitivity `g=∂L/∂z`, the parameter derivatives are `∂L/∂W=gxᵀ`, `∂L/∂b=g`, and `∂L/∂x=Wᵀg`. Elementwise activations multiply that upstream signal by their local slopes: sigmoid `p(1−p)`, tanh `1−t²`, and ReLU 0 or 1 away from its kink.

## Why this matters

These formulas are the reusable unit of a neural network backward pass. They also explain saturation, dead ReLUs, and the shape of parameter updates. A correct layer derivative needs both local calculus and a clear upstream convention.

## How it works

With `z=Wx+b`, `dz=dW x+W dx+db`. If `dL=gᵀdz`, collect coefficients:

```text
dL = gᵀdW x + gᵀW dx + gᵀdb
```

so the three gradients above follow. For `a=φ(z)`, `da=φ'(z)⊙dz`; hence `∂L/∂z=g_a⊙φ'(z)`.

## Worked examples and variations

### Example A: one affine layer

**Input:** `W=[[2,−1],[0,3]]`, `x=[1,2]`, upstream `g=[4,−1]`. **Mechanism:** `∂L/∂W=gxᵀ=[[4,8],[-1,-2]]`, `∂L/∂b=g`, and `∂L/∂x=Wᵀg=[8,−7]`. **Output:** all shapes match their variables. **Inspect:** the first row is scaled by the first output sensitivity. **Decision:** verify with a perturbation before batching.

### Example B: sigmoid local slope

**Input:** `z=0`, `p=0.5`, upstream `g_a=2`. **Mechanism:** `p(1−p)=0.25`, so `g_z=0.5`. **Output:** the activation halves this signal. **Inspect:** the slope is largest at the centre. **Decision:** keep the activation derivative separate from the loss derivative.

### Boundary case: ReLU at zero

**Input:** `a=max(0,z)` at `z=0`. **Mechanism:** left slope is 0 and right slope is 1; no unique classical derivative exists. **Output:** an implementation must choose a convention. **Inspect:** record the convention in tests. **Decision:** do not call the chosen value a theorem.

### Counterexample: bias gradient as a matrix

**Input:** a batch with upstream matrix `G∈R^{n×m}` for row-wise examples. **Mechanism:** bias adds to each row, so `∂L/∂b` is the reduction of `G` over the batch axis, not `G` itself. **Output:** forgetting the reduction creates a shape or update error. **Inspect:** batch and single-example cases. **Decision:** state the batch reduction.

## Two ways to see it

### Builder view

Write a layer card with input/output shapes, forward cache, local derivative, upstream shape, and reduction axis. Unit-test one layer before composing it.

### Systems or numerical view

Activation slopes change signal flow. Saturation can look like a broken gradient; a dead ReLU can be data- or initialisation-dependent. Monitor activation and gradient distributions, not only final loss.

## Hands-on

Implement a two-output affine layer followed by sigmoid, with manual forward and backward functions. Compare gradients to finite differences.

**Failure state:** omit the bias batch reduction and use a wrong ReLU slope at zero. **Test:** single-example and batch fixtures must differ only by the declared reduction, and the kink must be labeled convention-dependent. **Reset:** restore the reduction and chosen kink policy.

## Checkpoint

- [ ] Derive the three affine-layer gradients.
- [ ] Compute the sigmoid derivative at `p=0.5`.
- [ ] State what is ambiguous about ReLU at zero.
- [ ] Explain why a batch bias gradient reduces an axis.

## What this does not solve

Layer derivatives do not guarantee a well-trained network, useful representations, or stable long chains. Composition, autodiff checks, and optimisation still matter.

## Continue, go deeper, apply it

- Continue: Computational graphs and local derivatives
- Go deeper: Non-smooth optimisation and subgradients
- Apply it: Neural networks and representations
