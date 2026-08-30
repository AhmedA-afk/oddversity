---
title: "Reverse-mode autodiff and backpropagation"
track: "maths-foundations"
status: live
summary: "Reverse-mode autodiff starts with an output sensitivity and propagates adjoints backward, computing a vector–Jacobian product."
duration: "3 min read"
---

## The short answer

Reverse-mode autodiff starts with an output sensitivity and propagates adjoints backward, computing a vector–Jacobian product. One reverse pass gives the gradient of a scalar loss with respect to many parameters, which is why it fits neural-network training. It trades saved forward intermediates and graph traversal for that efficiency.

## Why this matters

Backpropagation is not a special neural-network trick; it is reverse-mode chain rule. Understanding its local products explains parameter gradients, gradient accumulation, memory use, and bugs such as missing reductions.

## How it works

For `y=f(x)` with Jacobian `J`, a row adjoint `ȳ` propagates as `x̄=ȳJ`. For `L=(x+y)²`, start `L̄=1`, propagate through square to `ū=2u`, then through addition to `x̄=ȳ=ū`. Each node's adjoint is the sum of downstream contributions.

## Worked examples and variations

### Example A: scalar loss with many inputs

**Input:** `L=(x+y)²` at `(2,1)`. **Mechanism:** `u=3`, `ū=6`, then both input adjoints are 6. **Output:** gradient `(6,6)` in one reverse traversal. **Inspect:** one output seed drives all parameter sensitivities. **Decision:** this is the common training shape.

### Example B: affine layer

**Input:** `z=Wx+b`, loss adjoint `g`. **Mechanism:** reverse local products yield `W̄=gxᵀ`, `b̄=g`, and `x̄=Wᵀg`. **Output:** all gradients have expected shapes. **Inspect:** this is the backprop formula used repeatedly in a network. **Decision:** test the layer independently.

### Boundary case: vector output

**Input:** `F:R²→R²` and request the full Jacobian. **Mechanism:** reverse mode with one seed computes one row/Jᵀ product; multiple seeds are needed for all rows. **Output:** reverse mode is not magically a full matrix in one pass. **Inspect:** count output seeds. **Decision:** choose products rather than materialising unnecessary matrices.

### Counterexample: overwrite rather than accumulate

**Input:** a shared parameter used in two branches. **Mechanism:** reverse contributions from both branches must add. **Output:** overwriting returns only the last branch's gradient. **Inspect:** compare a graph with a repeated parameter to a finite difference. **Decision:** use additive adjoint updates.

## Two ways to see it

### Builder view

Implement a topological reverse traversal with `value`, `parents`, and an adjoint accumulator. Retain only the forward values required by local backward rules.

### Systems or numerical view

Reverse mode is efficient for scalar losses with many parameters but can be memory-heavy. Checkpointing, recomputation, batching, and graph mutation are engineering choices, not calculus identities.

## Hands-on

Build reverse mode for add, multiply, and square, then extend it to an affine layer. Compare gradients against forward mode and central differences.

**Failure state:** return only the last contribution at a shared node and request a vector-output Jacobian with one seed. **Test:** shared-branch and seed-count fixtures must fail. **Reset:** accumulate adjoints and provide the required output seeds.

## Checkpoint

- [ ] Explain the vector–Jacobian product in words and shapes.
- [ ] Derive the affine-layer reverse pass.
- [ ] State why scalar losses favour reverse mode.
- [ ] Identify when multiple reverse seeds are needed.

## What this does not solve

Backpropagation differentiates a programmed computation; it does not validate the objective, data, or update rule. Memory and numerical issues remain, and non-smooth points need explicit treatment.

## Continue, go deeper, apply it

- Continue: Gradient checking and debugging
- Go deeper: Forward-mode automatic differentiation
- Apply it: Loss, gradients, and optimisation
