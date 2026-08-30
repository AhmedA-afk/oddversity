---
title: "Convolution, cross-correlation, and learned filters"
track: "deep-learning"
status: live
order: 202
summary: "Derive a convolution layer, count its parameters, and read its local computation."
duration: "24 min read"
---

## The operation

Most deep-learning libraries implement cross-correlation: for output channel (o),
(y_{o,i,j}=b_o+sum_{c,u,v}w_{o,c,u,v}x_{c,i+u,j+v}). The kernel is not
flipped, despite the conventional name “convolution.” This distinction matters when
matching a paper or hand calculation, not when learning weights end-to-end.

For a 3-channel input and 64 filters of size (7	imes7), parameters are
(64(3cdot7cdot7+1)=9,472). A dense layer mapping a 224x224 RGB image to 64
outputs would require (224cdot224cdot3cdot64+64=9,633,856) parameters.
Weight sharing encodes translation equivariance and makes visual learning feasible.

## Three worked scenarios

1. With input (egin{bmatrix}1&2&0\\0&1&3\\2&2&1end{bmatrix}) and
kernel (egin{bmatrix}1&0\\-1&1end{bmatrix}), the top-left correlation is
(1-2+1=0). Recompute it with a flipped kernel to see the convention difference.
2. An edge detector should respond similarly when a cat shifts two pixels; a fully
connected classifier need not.
3. A global watermark can fool a local filter bank because locality does not make a
model causal or robust.

## Minimal module

```python
layer = nn.Conv2d(3, 64, kernel_size=7, stride=2, padding=3, bias=False)
assert sum(p.numel() for p in layer.parameters()) == 64 * 3 * 7 * 7
```

## Diagnostics and practice

Inspect activation maps for blank, saturated, and real images. A map that is all zero
after ReLU may signal bad scaling, a dead channel, or simply a feature absent from that
image. Implement a single-channel correlation with loops, compare it to a library
layer, and test impulse, constant, and edge inputs. Explain why the three outputs
differ. Then derive the parameter count for a 1x1 convolution from 256 to 128 channels
and state what information it can and cannot mix.


## Advanced studio: calculation, implementation, and decision evidence

The compact explanation above is only a starting point. To master **convolution cross correlation and parameters**, make
every claim executable. Begin with a miniature dataset whose values can be inspected
without a plotting library: two to four examples, an explicit target, a stated tensor
layout, and a named unit for each quantity. Write the forward calculation on paper,
including each reduction, rounding rule, padding convention, and threshold. Compute a
baseline result, then change one control variable and recompute. This is where an
apparently harmless choice—channel order, stride, margin, temperature, interpolation,
or confidence threshold—becomes a measurable trade-off rather than folklore.

### Derivation and numerical check

Identify the central equation from this lesson and derive it from its primitive
operations: multiply, sum, normalization, distance, probability, or queueing delay.
Keep a table with columns for input shape/value, parameter, intermediate result, and
final output. Verify the table with a slow reference implementation before using a
framework operator. Then calculate three boundary cases: a neutral or constant input,
an extreme but valid input, and an awkward case such as an odd spatial size, empty
target, missing modality, rare class, or input at the maximum perturbation. State
whether the outcome is defined, rejected, routed for review, or intentionally clipped.

For a second calculation, connect the local result to an operational quantity. Convert
a feature-map stride into pixels of localization error, a probability threshold into
review volume, a token count into attention memory, a byte count into device memory, or
latency into a deadline violation. A model can be mathematically correct and still be
unsuitable when this second calculation fails. Record assumptions explicitly so another
reader can challenge them.

### Three distinct worked scenarios

**Controlled scenario.** Use an artificial sample designed to isolate the mechanism:
an impulse, edge, identical pair, empty mask, single box, or known logit vector. Predict
the output before executing code and explain any discrepancy.

**Distribution scenario.** Change capture conditions while preserving the nominal task:
resolution, illumination, device, crop, class frequency, or co-occurring metadata.
Measure the result by slice. Explain which training assumption has been violated and
whether more augmentation, data collection, calibration, or a revised operating domain
is appropriate.

**Decision scenario.** Make the error costly: a small missed object, uncertain boundary,
unknown class, queue overload, or misleading visual explanation. Define the harm, the
observable trigger, and the correct policy response. The answer may be abstention or
human review; it is not automatically another training run.

### Implementation and reproducibility protocol

```text
load a versioned sample and validate shape/range/label invariants
run a slow reference calculation and save expected intermediate values
run the production operator/model with identical preprocessing
assert numerical tolerance, shape, finite values, and required ordering
log slice metrics and save every failed sample with its transform/version IDs
```

Seed random generators, fix split membership, and version the image decoder and
transform chain. Keep the slow path in tests: it catches exported-model, mixed-precision,
or library-upgrade regressions that an aggregate score hides. Run at least one
CPU/device or batch-size parity check if deployment differs from training.

### Debug and error gallery

Build a gallery of twelve examples: four expected successes, four ordinary errors, and
four high-consequence errors. Show raw input, transformed input, target, output,
confidence/score, and the lesson-specific intermediate artifact. Classify each failure
as data/annotation defect, geometry/convention bug, numerical instability,
distribution shift, threshold-policy failure, or irreducible ambiguity. Probe constant
input, border/impulse input where meaningful, extreme valid values, and an unseen
capture condition. Trace the first invariant that fails; never repair a geometry or
data bug by merely retuning the final threshold.

### Graded practice rubric

Submit calculations for three cases, a reproducible script/notebook, public assertions,
the gallery, and a short decision memo. Grade **30% mathematical and shape correctness**,
**25% implementation and reproducibility**, **25% scenario-specific diagnostics**, and
**20% operational judgement**. A submission fails if it reports only one aggregate
metric, cannot reproduce a calculation, omits failed examples, or claims safety,
causality, or explanation beyond what the experiment establishes.
