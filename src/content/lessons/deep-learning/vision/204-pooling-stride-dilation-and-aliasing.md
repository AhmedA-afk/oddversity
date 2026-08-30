---
title: "Pooling, stride, dilation, and aliasing"
track: "deep-learning"
status: live
order: 204
summary: "Choose downsampling operations with a signal-processing view of information loss."
duration: "23 min read"
---

Max pooling retains the strongest local response; average pooling estimates local
mean energy. A stride-2 convolution learns both filtering and subsampling. All three
can alias high-frequency patterns: two distinct inputs become indistinguishable after
sampling too coarsely.

A 3x3 dilation-2 kernel has effective width (1+(3-1)2=5), while still learning
only nine weights. On a checkerboard, take every second pixel after no low-pass filter:
the sampled pattern can become constant, an extreme aliasing example. On tiny objects,
stride can erase the evidence entirely. On aerial imagery, dilation expands context
without early loss of resolution but may create gridding artifacts.

```python
# Blur before decimation when shift stability matters.
x = gaussian_blur(x, sigma=1.0)
x = x[:, :, ::2, ::2]
```

## Diagnostics

Measure accuracy after shifting validation images by one pixel. Visualize feature maps
before/after a downsampling stage. If a detector misses small objects, compare feature
map stride to object size in pixels rather than merely adding layers. If dilation makes
segmentation masks checkerboard-like, mix dilation rates or add dense features.

## Hands-on work

Create three 1-D signals (smooth wave, checkerboard, isolated spike), downsample each
with and without blur, and plot the result. Build two classifiers identical except for
max pooling versus strided convolution. Report clean accuracy, one-pixel-shift accuracy,
parameter count, and an error gallery. Argue which failure is acceptable for a barcode
reader and which is unacceptable for pedestrian detection.


## Advanced studio: calculation, implementation, and decision evidence

The compact explanation above is only a starting point. To master **pooling stride dilation and aliasing**, make
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

### Geometry stress-test extension

Treat spatial arithmetic as a contract, not an implementation detail. Make a table for
three input sizes—one even, one odd, and one near the production maximum—and record
every output shape, effective stride, border convention, and retained feature location.
For each row, place a one-pixel impulse at the centre and at all four corners. The
observed output support should match the hand calculation; otherwise a crop, padding,
or interpolation assumption has changed the model's meaning.

Next compare the geometry under two task conditions. In a classifier, a one-pixel
translation may be tolerable if the decision remains stable. In a detector or
segmentation system, the same displacement can shift a box or boundary enough to fail
an acceptance criterion. Test both cases, show the overlays, and state the largest
misalignment the downstream user can accept. This turns shape arithmetic into a
measurable release gate instead of a post-hoc debugging note.

Finally, profile the high-resolution path. Increasing image side length doubles each
spatial axis and approximately quadruples feature-map storage. Confirm which layer
becomes the memory bottleneck and whether a stride/dilation change moves the failure to
small objects or to aliasing. Keep the smallest architecture that satisfies the stated
spatial requirement.
