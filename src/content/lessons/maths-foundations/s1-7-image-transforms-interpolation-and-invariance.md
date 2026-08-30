---
title: "Image transforms, interpolation, and invariance"
track: "maths-foundations"
status: live
summary: "An image transform changes coordinates or values; interpolation estimates pixels at new coordinates."
duration: "4 min read"
---

## The short answer

An image transform changes coordinates or values; interpolation estimates pixels at new coordinates. Data augmentation is justified only when the label should remain stable under that transform: `y(Tx)=y(x)`. Rotation, crop, flip, and colour changes therefore require task-specific assumptions. A visually plausible augmentation can still change the label, erase evidence, or introduce interpolation artefacts.

## Why this matters

Transforms affect both training and evaluation. A classifier trained on mirrored
text, a segmentation mask resized with bilinear interpolation, or a medical
image rotated without preserving orientation may learn a broken task. The math
turns “augmentation seems reasonable” into a testable invariance claim.

## How it works

Represent a pixel centre by homogeneous coordinate `p=[x,y,1]^T` and transform
it with matrix `T`; the output grid asks for source intensity at `T^{-1}p`.
Nearest-neighbour chooses one source value; bilinear interpolation forms a
weighted average of four neighbours. For discrete labels, averaging class IDs is
not meaningful, so masks typically use nearest-neighbour. An invariant task has
`f(Tx)=f(x)`; an equivariant output, such as a mask, should transform as
`f(Tx)=T f(x)` instead.

## Worked examples and variations

### Example A: horizontal flip of animal photos

**Input:** dog image with label “dog”. **Mechanism:** mirror coordinates; object
identity stays the same. **Output:** same class label. **Inspect:** check that
the crop remains visible. **Decision:** use flips if left/right orientation is
not itself the target.

### Example B: crop for object classification

**Input:** a centred object and a random crop. **Mechanism:** remove some pixels;
the class may remain if enough evidence survives. **Output:** same label for a
safe crop, ambiguous for an aggressive one. **Inspect:** measure object-visible
fraction. **Decision:** make crop severity conditional on label and task.

### Boundary case: resizing a segmentation mask

**Input:** mask values `{0,1}` resized from 2×2 to 4×4. **Mechanism:** bilinear
interpolation creates values such as `0.5`. **Output:** invalid class IDs or a
shifted thresholded boundary. **Inspect:** assert mask values stay in the label
set. **Decision:** use nearest-neighbour for categorical masks and an explicit
policy for soft targets.

### Counterexample: flipping text or laterality

**Input:** an image containing “6” or a left/right anatomical marker. **Mechanism:**
horizontal flip changes the semantic class or clinical orientation. **Output:**
the original label becomes false. **Inspect:** include orientation-sensitive
fixtures. **Decision:** reject the augmentation or transform the label too.

## An illustrative story

An illustrative OCR model receives mirrored training text and gains visual
variety but loses character direction. Aggregate accuracy may hide that only
right-to-left scripts or characters such as `b/d` fail. A label-invariance review
would have rejected the transform before training.

## Two ways to see it

### Builder view

For every transform, record geometry, interpolation, fill mode, probability,
and the label action: unchanged, transformed, or reject. Test the transformed
artifact, not only the source image.

### Statistical view

Augmentation changes the training distribution. It can encode a useful prior and
reduce variance, but it can also create examples outside deployment or make the
model invariant to a feature that actually matters.

## Hands-on

Create a 4×4 categorical mask, an image with an arrow pointing left, and a small
text image. Apply flip, rotate, crop, nearest-neighbour resize, and bilinear
resize. Save before/after images and a table of whether the label stayed valid.

**Failure state:** resize the mask bilinearly and leave the class label unchanged
after flipping the laterality marker. **Test:** assert all mask values are in
`{0,1}` and that an orientation-sensitive fixture is either rejected or has an
updated label. **Reset:** restore nearest-neighbour and the explicit label policy.

## Checkpoint

- [ ] State the difference between invariant and equivariant outputs.
- [ ] Choose interpolation for a categorical segmentation mask and explain why.
- [ ] Give one transform that is safe for object identity but unsafe for orientation.
- [ ] List the metadata needed to reproduce an augmentation pipeline.

## What this does not solve

Invariance to a transform does not imply robustness to all real-world shifts.
Interpolation cannot reconstruct detail lost by a crop or aliasing, and more
augmentation can hurt when it overwhelms the original data distribution.

## Continue, go deeper, apply it

- Continue: Vision/audio case study
- Go deeper: Discrete signals, sampling, and aliasing
- Apply it: Privacy, fairness, and accessibility
