---
title: "Convolution and correlation"
track: "maths-foundations"
status: live
summary: "Convolution slides a reversed kernel across a signal and sums products; correlation slides a kernel without reversing it."
duration: "4 min read"
---

## The short answer

Convolution slides a reversed kernel across a signal and sums products; correlation slides a kernel without reversing it. Both measure local agreement, but the distinction controls edge detection, template matching, and learned layers. Before comparing implementations, write the index convention, padding, stride, and kernel orientation. A library named “convolution” may implement cross-correlation by convention.

## Why this matters

A one-pixel shift, an asymmetric edge detector, or a time-reversed audio motif
can change the output when the kernel is not symmetric. This is a classic silent
failure: shapes look right and the code runs, but the detector responds to a
left edge when the design intended a right edge. CNN terminology often calls the
cross-correlation operation convolution, so tests must define behavior.

## How it works

For finite sequences, the full discrete convolution is

```text
(x * h)[n] = Σ_k x[k] h[n-k].
```

The `n-k` reverses `h` as it slides. Cross-correlation can be written as
`(x ⋆ h)[n] = Σ_k x[k] h[k+n]` (with a convention-dependent shift). If `h` is
even/symmetric, reversal changes nothing. Convolution is associative and
commutative; correlation is generally neither. In linear systems, convolution
also arises because a sum of shifted impulse responses gives the response to
any input.

## Worked examples and variations

### Example A: full convolution by hand

**Input:** `x=[1,2]`, `h=[3,4]`. **Mechanism:** overlap produces
`[1·3, 1·4+2·3, 2·4]`. **Output:** `[3,10,8]`. **Inspect:** output length is
`2+2−1=3`. **Decision:** use full mode when boundary response is part of the
question; crop only with a stated alignment.

### Example B: a moving average

**Input:** `x=[2,4,8,10]`, symmetric `h=[1/2,1/2]`. **Mechanism:** reversal has
no effect; adjacent values are averaged. **Output:** interior values represent
local smoothing. **Inspect:** compare full, same, and valid padding. **Decision:**
select padding based on whether invented boundary values are acceptable.

### Boundary case: an impulse

**Input:** `x=δ=[0,0,1,0]`. **Mechanism:** `δ*h` is a shifted copy of `h`.
**Output:** the kernel shape is visible directly. **Inspect:** use impulses to
test offset, reversal, and stride independently of a real signal. **Decision:**
keep an impulse fixture in every custom filtering implementation.

### Counterexample: asymmetric edge kernel

**Input:** row `[0,0,1,1]`, kernel `h=[-1,1]`. **Mechanism:** correlation and
convolution use opposite orientation for this asymmetric kernel. **Output:** a
positive response appears on opposite edge conventions. **Inspect:** compare a
manual index calculation, not only two library calls. **Decision:** document the
orientation expected by the downstream label or visualization.

## An illustrative story

An illustrative image team may report “the edge filter is broken” after swapping
from a hand-written routine to a deep-learning layer. The actual difference is
that the new layer performs cross-correlation. If the learned filters are free
to adapt, accuracy may not change; if weights are imported from a fixed filter
bank, orientation becomes a real regression.

## Two ways to see it

### Builder view

Convolution is a local weighted sum with a contract: kernel, flip rule, padding,
stride, dilation, and output alignment. An impulse and an asymmetric kernel give
small, decisive tests.

### Signal-processing view

Convolution composes a signal with a linear time-invariant system; correlation
asks where two patterns agree. One is an operator model, the other a similarity
measurement, even though their loops look nearly identical.

## Hands-on

Implement `full_conv(x,h)` with nested loops and compare it with
`scipy.signal.convolve(x,h, mode="full")`. Also implement correlation without
calling a correlation helper. Print each output index and the contributing
products.

**Failure state:** remove the kernel reversal from `full_conv`, then test with
`h=[-1,2,1]` and a shifted impulse. **Test:** the implementation must match the
reference for the asymmetric kernel and the impulse offset; the broken version
must fail. **Reset:** restore `h[n-k]`, rerun the asymmetric and symmetric cases,
and retain the test as a regression fixture.

## Checkpoint

- [ ] Expand one output index of `(x*h)[n]` and identify the reversed kernel.
- [ ] Explain why symmetric kernels make convolution and correlation agree.
- [ ] Predict the full output length for inputs of lengths 5 and 3.
- [ ] Name two tests that reveal a padding or orientation mismatch.

## What this does not solve

Convolution does not automatically denoise, detect semantics, or preserve all
boundaries. A learned kernel can exploit dataset shortcuts, and a visually
pleasant filtered signal can still erase the feature needed by a task.

## Continue, go deeper, apply it

- Continue: Discrete convolution in CNNs
- Go deeper: Frequency filtering and the convolution theorem
- Apply it: Vision/audio case study
