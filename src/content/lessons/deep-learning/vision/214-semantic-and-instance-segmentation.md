---
title: "Semantic, instance, and panoptic segmentation"
track: "deep-learning"
status: live
order: 214
summary: "Learn dense prediction with correct mask geometry, losses, and boundary-aware evaluation."
duration: "27 min read"
---

Semantic segmentation labels each pixel by class; instance segmentation separates
objects of the same class; panoptic segmentation combines countable things and
amorphous stuff. Pixel accuracy can be misleading on dominant background. Dice is
(2|P\cap G|/(|P|+|G|)); if prediction has 80 pixels, truth 100, overlap 70,
Dice is (140/180=0.778).

Cross-entropy supports multiclass masks. Dice/Tversky losses emphasize overlap in
imbalance, but must handle empty masks explicitly. Scenario: a 1-pixel line is ruined
by a resize mismatch. Scenario: a tumour task cares about boundary uncertainty, not
just bulk overlap. Scenario: instance masks merged into one semantic region hide an
inventory-counting failure.

```python
logits = model(image)
assert logits.shape[-2:] == mask.shape[-2:]
loss = F.cross_entropy(logits, mask.long())
```

## Diagnostics

Display image, label, prediction, and disagreement map at native resolution. Inspect
per-class IoU, Dice, boundary F-score, and empty-class behavior. Never interpolate
class IDs bilinearly; use nearest-neighbor for masks and transform image/mask with the
same random geometry.

## Assignment

Implement Dice with epsilon and test empty-empty, empty-nonempty, and partial-overlap
cases. Compare a shallow encoder-decoder and a U-Net with skips on thin structures.
Submit 20 overlays and a failure taxonomy. Propose an uncertainty-review workflow for
ambiguous boundaries rather than forcing a false precise label.


## Advanced studio: calculation, implementation, and decision evidence

The compact explanation above is only a starting point. To master **semantic and instance segmentation**, make
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

+### Architecture decision extension

+Before changing this component, make a stage table with input/output shape, effective
+stride, receptive field or token count, parameter count, activation memory, and measured
+latency. A local improvement can move the bottleneck elsewhere: preserving resolution
+raises decoder memory, adding channels increases bandwidth, and reducing FLOPs can hurt
+real hardware utilization. Compare a minimal baseline with one isolated intervention;
+hold seed, crop policy, optimizer, training budget, and evaluation slices fixed.

+For a numerical check, choose one representative input resolution and calculate the
+dominant term in memory or compute. Recalculate after doubling spatial resolution and
+after halving channels or token density. Do not assume those changes have linear cost:
+feature maps scale with area and global attention scales with the square of tokens. Use
+the calculation to set an explicit batch-size and latency test, then verify it on the
+target runtime rather than a workstation-only profiler.

+Run a counterfactual ablation. Replace the component by its simplest valid alternative,
+not an unrelated new backbone, and inspect the examples where the two systems disagree.
+Report whether the change affects small objects, boundaries, rare classes, confidence,
+or only aggregate score. Include three examples: one clear gain, one neutral result,
+and one regression. Promote the more complex architecture only when it improves an
+acceptance criterion that matters in the intended operating domain and its shape,
+memory, and failure behavior remain testable. If the benefit appears only on the
+development set, retain the baseline and investigate split or tuning leakage.
