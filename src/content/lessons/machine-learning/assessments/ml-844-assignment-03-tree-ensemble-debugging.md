---
title: "Assignment 3: compare trees and ensembles through a debugging clinic"
track: "machine-learning"
order: 844
status: live
summary: "Diagnose overfit, leakage, instability, and misleading importance in tree-based modelling."
duration: "12–16 hours"
updated: "2026-08-30"
---

## Brief

Build a single decision tree, random forest, and gradient-boosted tree for the same decision problem. Treat model selection as an experiment: each claim needs a controlled comparison and an artefact that could falsify it.

## Required work

Construct a pipeline with leakage-safe encoding and cross-validation. Run a capacity sweep for depth/minimum leaf size and a learning-rate/number-of-trees sweep. Produce learning curves and train-versus-validation diagnostics. Deliberately introduce one failure—target leakage, duplicate entities, or a misleading high-cardinality feature—then demonstrate the detection and repair. Compare impurity, permutation, and at least one local explanation; describe where each can mislead.

## Submission artefacts

Submit code, fixed configs, run table, figures, `debugging-log.md`, a model card, and a 1,000-word technical report. The debugging log must contain the injected defect, detection signal, root cause, patch, and post-patch comparison.

## Rubric (100 points)

| Criterion | Points |
| --- | ---: |
| Controlled experimental design | 20 |
| Capacity/boosting diagnostics | 20 |
| Deliberate failure and convincing repair | 20 |
| Evaluation, calibration, and slice outcomes | 15 |
| Importance/explanation caveats | 15 |
| Reproducible reporting | 10 |

## Self-check

- Can a reviewer reproduce every row in the run table from one config?
- Does performance survive a time/group holdout?
- Do shuffled-label and feature-ablation checks behave as expected?
- Is “important” separated from “causal,” “actionable,” and “fair”?

## Common failure modes

Never compare models trained on different splits. Do not report test performance during hyperparameter selection. A single feature-importance chart is not an explanation audit; correlated features, proxies, and distribution shift must be addressed.
