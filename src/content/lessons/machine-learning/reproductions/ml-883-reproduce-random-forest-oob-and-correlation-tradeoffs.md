---
title: "Reproduction study: random forests, OOB estimates, and correlation"
track: "machine-learning"
order: 883
status: "live"
summary: "Recreate a random forest experiment with out-of-bag evaluation and test the strength-versus-correlation trade-off."
duration: "100 min study + 6–8 hr project"
updated: "2026-08-30"
---

## Research question

**Executable project package:** [student starter, deterministic fixture, and public checks](/classical-ml-projects/reproductions/random-forest-oob-correlation/).

Can a learner reproduce the two mechanisms that define Breiman’s random forests—bootstrap samples and random feature selection—and measure how feature subsampling changes tree correlation, tree strength, and out-of-bag (OOB) performance?

## Primary source and claim

Read Leo Breiman’s openly hosted paper, [*Random Forests*](https://www.stat.berkeley.edu/~breiman/randomforest2001.pdf) (2001). Its central practical claim is conditional: the forest’s error depends on the strength of individual trees and their correlation, and randomly restricting split candidates can reduce correlation. Reproduce the mechanism and test whether that pattern appears under the protocol below. Do not state that your result validates a general theorem or reproduces Breiman’s full collection of datasets.

## Fixed experimental protocol

Use the [UCI Covertype dataset](https://archive.ics.uci.edu/dataset/31/covertype), whose official source describes a multiclass cartographic classification task. Download a versioned snapshot, record its checksum, and split chronologically only if source order has a meaningful time interpretation; otherwise use a fixed seed-20260830 stratified 70/15/15 split.

Train 500 fully grown classification trees under four pre-registered `max_features` conditions: 1, square-root of feature count, one-third of feature count, and all features. Use the same bootstrapped training rows and tree seed stream for matched conditions where feasible. For each tree record its bootstrap in-bag mask, OOB rows, OOB prediction, validation prediction, depth, and feature usage.

Use OOB balanced accuracy to select `max_features`; evaluate the chosen setting once on the held-out test set. Compare it with a single unrestricted tree and an ExtraTrees-style random-split baseline. Do not tune depth, class weights, or number of trees beyond the declared protocol.

## Data and provenance plan

The dataset is large enough that an inexpensive local run may use a pre-registered stratified subsample of 80,000 training candidates. State whether you used the full data or subsample, why, and how the subsample was sampled. Document the dataset version, license/terms, feature groups, class counts, software version, compute limits, and whether duplicate/near-duplicate rows might violate independence.

Cartographic labels are not a neutral “ground truth” abstraction. Explain what a model prediction could and could not mean in a land-management context, including spatial autocorrelation and cost asymmetry.

## Required plots and tables

- OOB and validation balanced accuracy versus number of trees for all four settings.
- A table of final OOB, validation, and locked-test metrics with fit time and peak memory.
- Pairwise tree-prediction correlation distributions measured on the validation set.
- Mean individual-tree balanced accuracy (strength proxy), correlation summary, and forest accuracy in one table.
- Per-class recall/confusion matrix for the selected forest and spatial/provenance caveat.
- Permutation importance with a correlated-feature warning; never present it as causal importance.

## Calculations to show

Derive why a bootstrap sample of size `n` leaves roughly a nonzero fraction of unique training rows out of a given tree. On a tiny synthetic dataset, create three bootstrapped trees by hand, enumerate their OOB rows, and show that OOB predictions for an example must use only trees that did not train on that example. Implement an assertion that prevents in-bag predictions leaking into the OOB aggregate.

## Statistical caveats

OOB estimates are convenient, not an excuse to repeatedly tune against them without accounting for selection. Correlation measured from finite validation predictions is itself noisy. Spatially related examples can make random splits overly optimistic; include a blocked-region sensitivity analysis if coordinate or region proxies are available. Report class-weight and metric choices before observing the test results.

## Replication rubric

| Criterion | Evidence | Points |
| --- | --- | ---: |
| Source fidelity | bootstrap and split-level feature sampling correctly implemented | 20 |
| OOB integrity | stored masks and an exclusion test | 20 |
| Trade-off analysis | matched settings, correlation/strength/error figures | 25 |
| Data and compute transparency | data card, resource table, deterministic configuration | 15 |
| Interpretation | class/slice analysis, spatial and importance limits | 20 |

## Extension and critique

Run a blocked geographical split or a group split constructed from a declared feature group. Compare its result with the IID split without treating either as universally correct. Critique the source’s strength/correlation story: it is useful guidance, but measured proxies depend on your loss, sampling scheme, tree hyperparameters, and data dependence. Explain how an OOB estimate could become misleading in your setting.
