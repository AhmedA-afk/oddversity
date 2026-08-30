---
title: "Vision systems capstone: evidence from data to deployment"
track: "deep-learning"
status: live
order: 230
summary: "Integrate visual modelling, evaluation, robustness, and operations into one defensible project."
duration: "35 min read"
---

Choose one of: small-object detection, boundary-sensitive segmentation, visual
retrieval, or edge classification. Your goal is not a leaderboard score; it is a
reproducible decision system with a stated operating domain and a credible failure
response.

## Required milestones

1. Write the data contract, provenance, consent/license constraints, split unit, and
   label audit before modelling.
2. Establish a simple baseline, then a justified CNN or ViT model. Derive one shape,
   parameter, loss, or latency calculation from your own system.
3. Report primary metrics, calibration, class/size/site slices, 30 visual errors, and
   one ablation.
4. Run corruption/OOD stress tests and inspect at least one explanation technique with
   a faithfulness caveat.
5. Package preprocessing parity tests, inference benchmark, monitoring plan, and
   rollback/abstention policy.

## Worked planning scenarios

A defect detector may choose high recall plus review; a wildlife classifier may use
top-k suggestions; a segmentation aid may surface uncertain boundaries. These are
different products even when they share an encoder. Quantify one cost: for example,
at 20 requests/s and 120 ms average latency, estimate (L=2.4) in-flight requests;
then state the p99 requirement and review capacity.

```text
data report -> baseline -> locked evaluation -> stress review -> shadow deployment -> monitored release
```

## Grading rubric

Data/splits and reproducibility (20%), mathematical/technical correctness (15%),
evaluation and error analysis (25%), robustness/safety judgement (20%), and clear
deployment evidence (20%). A project cannot pass if it reports only aggregate
accuracy, leaks identities across splits, or lacks a documented limitation. Present a
15-minute defense: show one success, one dangerous failure, evidence for your chosen
threshold, and the exact condition under which the system should defer to a human.


## Advanced studio: calculation, implementation, and decision evidence

The compact explanation above is only a starting point. To master **vision capstone and mastery check**, make
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
