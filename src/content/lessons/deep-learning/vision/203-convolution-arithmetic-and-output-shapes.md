---
title: "Convolution arithmetic: padding, stride, and output shapes"
track: "deep-learning"
status: live
order: 203
summary: "Predict spatial dimensions exactly and prevent silent geometry bugs."
duration: "22 min read"
---

For one spatial dimension, (L_{out}=lfloor(L+2P-D(K-1)-1)/Sfloor+1),
where (K,S,P,D) are kernel, stride, padding, and dilation. Never rely on an
intuition of “same” padding without checking the framework's convention.

## Calculations

An input of 32, (K=3,P=1,S=1,D=1) yields 32. With stride 2 it yields
(lfloor31/2floor+1=16). With (K=3,D=2,P=2,S=1), the effective kernel is
5 and output remains 32. For a 224 image, 7x7 stride-2 padding-3 gives 112:
(lfloor(224+6-6-1)/2floor+1=112).

Scenario: an odd 225-pixel input can produce an off-by-one skip-connection mismatch.
Scenario: valid padding loses border context, which is costly when lesions sit at the
edge. Scenario: excessive zero padding creates an artificial black-frame cue.

```python
def out_len(L, K, S=1, P=0, D=1):
    return (L + 2*P - D*(K-1) - 1) // S + 1
assert out_len(32, 3, 2, 1) == 16
```

## Diagnostic protocol

Print shapes after every stage and test a one-pixel impulse at each border. Unit test
the formula for odd/even dimensions and compare your result to the tensor output. For
segmentation, assert that logits and masks align before computing loss; resizing a
mask with bilinear interpolation corrupts class IDs.

## Assignment

Design a five-stage encoder that maps 512x512 images to a 16x16 feature map. Give the
shape table, effective stride, and padding assumptions. Then repair a deliberately
broken U-Net skip merge with 65x65 and 64x64 tensors, explaining whether crop, pad, or
input-size constraints best preserve the task semantics.


## Advanced studio: calculation, implementation, and decision evidence

The compact explanation above is only a starting point. To master **convolution arithmetic and output shapes**, make
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
