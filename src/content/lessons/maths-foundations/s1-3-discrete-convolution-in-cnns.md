---
title: "Discrete convolution in CNNs"
track: "maths-foundations"
status: live
summary: "A CNN layer applies learned local weighted sums across spatial positions and input channels."
duration: "4 min read"
---

## The short answer

A CNN layer applies learned local weighted sums across spatial positions and input channels. For input height `H`, width `W`, kernel `K`, padding `P`, stride `S`, and dilation `D`, each output size is `floor((H+2P−D(K−1)−1)/S)+1`. Track channels and receptive fields explicitly; most “mysterious” CNN bugs are shape, padding, or boundary mistakes.

## Why this matters

The word convolution hides a four-dimensional tensor contraction. A layer may
have the right parameter count but produce a feature map one pixel too small,
discard a border, or use a stride that skips a small object. Understanding the
shape equation lets you design a network and audit a claimed receptive field
without trusting a diagram.

## How it works

For input `X[c,i,j]`, output channel `o` at position `(p,q)` is approximately

```text
Y[o,p,q] = b[o] + Σ_c Σ_u Σ_v W[o,c,u,v] X[c, pS+uD−P, qS+vD−P],
```

where out-of-range indices use the chosen padding rule. The operation is
usually cross-correlation despite the name. Parameter count is
`C_out·C_in·K_h·K_w + C_out`; activation shape is independent of that count.
With stride one and no dilation, a stack of `L` valid `3×3` layers has receptive
field `1+2L`; stride or dilation expands it faster.

## Worked examples and variations

### Example A: one channel, valid layer

**Input:** `H=W=5`, `C_in=1`, `K=3`, `P=0`, `S=1`, `C_out=2`.
**Mechanism:** each 3×3 window is summed by two kernels. **Output:** spatial
shape `3×3×2`; parameter count `2·1·3·3+2=20`. **Inspect:** count border
positions and weights. **Decision:** use valid padding only when losing one-pixel
edges is acceptable.

### Example B: padding preserves spatial size

**Input:** `H=W=32`, `K=3`, `P=1`, `S=1`, `C_in=3`, `C_out=16`.
**Mechanism:** one zero border balances the kernel radius. **Output:**
`32×32×16`; parameters `16·3·9+16=448`. **Inspect:** the edge sees zeros,
not a real neighboring pixel. **Decision:** assess whether boundary artifacts
affect labels.

### Boundary case: stride two

**Input:** `7×7`, `K=3`, `P=1`, `S=2`. **Mechanism:**
`floor((7+2−3)/2)+1=4`. **Output:** `4×4`; neighboring output windows overlap
but centers are two pixels apart. **Inspect:** mark sampled centers on a grid.
**Decision:** do not call stride “just a speed setting”; it changes resolution and
small-object recall.

### Counterexample: dilation and receptive field

**Input:** `K=3`, `D=2`, `S=1`, `P=2`, `H=W=10`. **Mechanism:** effective kernel
size is `D(K−1)+1=5`, so output remains `10×10`, but five-spaced support is
used. **Output:** larger context with nine weights, not a dense 5×5 kernel.
**Inspect:** enumerate touched coordinates. **Decision:** check whether holes
between samples miss fine texture.

## An illustrative story

Consider an illustrative defect detector for a 4-pixel-wide crack. A stride-two
first layer can make the crack disappear before a later layer sees it. The model
may still score well on large defects, creating an aggregate metric that hides a
resolution-dependent failure. A shape and small-object slice catches it.

## Two ways to see it

### Builder view

Treat a layer as a typed function from `(batch, channels, height, width)` to a
new shape. Write the equation beside the code and annotate padding values,
parameter count, and effective receptive field.

### Representation view

Weight sharing gives translation-shaped inductive bias and reduces parameters;
locality limits what one layer can see. Depth composes local evidence into a
larger context, while stride trades detail for compute.

## Hands-on

Build a tiny NumPy layer with shape `(C_in,H,W)`, two 3×3 kernels, explicit zero
padding, stride, and dilation. Compare output shapes with a reference framework
on four configurations. Draw the receptive-field coordinates for one output
pixel.

**Failure state:** use `H_out=(H+2P−K)//S+1` even when `D>1`, or silently crop
the remainder. **Test:** a fixture with `K=3,D=2,P=2,S=1` must produce `H×W` and
touch a 5×5 support; assert shape, parameter count, and support coordinates.
**Reset:** restore the effective-kernel formula and rerun all four shape cases.

## Checkpoint

- [ ] Compute the output shape for `H=28,K=5,P=2,S=2,D=1`.
- [ ] Separate activation shape from parameter count.
- [ ] Explain why CNN “convolution” is often cross-correlation in implementation.
- [ ] Draw the receptive field after two valid 3×3 stride-one layers.

## What this does not solve

Receptive field is not effective use of context: learned weights may ignore
parts of it. CNN locality does not provide rotation, scale, or domain invariance,
and correct shapes do not guarantee useful or fair representations.

## Continue, go deeper, apply it

- Continue: Fourier bases and the DFT
- Go deeper: Losses, gradients, and optimisation
- Apply it: Vision/audio case study
