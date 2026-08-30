---
title: "Images, tensors, and data contracts"
track: "deep-learning"
status: live
order: 201
summary: "Represent visual data precisely before asking a model to learn from it."
duration: "18 min read"
---

## Learning objective

Translate an image collection into tensors with an explicit contract for shape, dtype,
range, channel order, labels, split membership, and provenance. Most vision failures
begin here, long before a convolution is wrong.

## Tensor model and worked calculations

An RGB batch has shape (B 	imes C 	imes H 	imes W) in PyTorch convention.
For 32 images of size 224 by 224, float32 storage is
(32cdot3cdot224cdot224cdot4=19,267,584) bytes, about 18.4 MiB. A uint8
camera file uses one quarter of that; converting to float is deliberate, not free.

Scenario 1: a grayscale radiograph is (1	imes H	imes W), not RGB with three
copied channels unless a pretrained encoder requires it. Scenario 2: an RGBA PNG has
an alpha channel; silently treating alpha as a fourth colour channel leaks rendering
metadata. Scenario 3: satellite scenes may be multispectral, so discarding bands is a
modelling decision rather than preprocessing.

## Implementation sketch

```python
def validate(batch, labels):
    assert batch.ndim == 4 and batch.shape[1] in {1, 3}
    assert batch.dtype == torch.float32
    assert torch.isfinite(batch).all()
    assert -4 <= batch.min() and batch.max() <= 4  # after normalization
    assert labels.shape[0] == batch.shape[0]
```

Record whether normalization is (x/255), ((x-mu)/sigma), or model-specific.
Fit (mu,sigma) on training images only. Store deterministic split IDs, the
annotation version, and the exact resize/crop policy.

## Diagnostics

- Render a de-normalized batch with labels and sample IDs.
- Count labels and image dimensions per split; find duplicates across splits.
- Compute per-channel means before and after normalization.
- Inspect the highest-loss examples, not only random examples.

## Hands-on assignment

Write a dataset audit that rejects invalid ranges, mixed channel conventions, duplicate
hashes across train/test, and missing annotation IDs. On a 12-image toy set, calculate
memory for uint8, float16, and float32. Submit the audit, a montage, and a one-page data
contract explaining one decision that could change measured accuracy.


## Advanced studio: calculation, implementation, and decision evidence

The compact explanation above is only a starting point. To master **images tensors and data contracts**, make
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
