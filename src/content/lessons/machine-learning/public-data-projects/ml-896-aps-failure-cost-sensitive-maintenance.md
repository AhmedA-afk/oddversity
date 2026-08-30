---
title: "Public-data project: APS failure triage with asymmetric maintenance costs"
track: machine-learning
order: 896
status: live
summary: "Build a cost-sensitive failure-triage study without confusing a benchmark label with a maintenance decision."
duration: "10–14 hours"
updated: "2026-08-30"
---

## Project brief

**Executable project package:** [student starter, deterministic fixture, and public checks](/classical-ml-projects/public-data/aps-failure/).

Use [UCI APS Failure at Scania Trucks](https://archive.ics.uci.edu/dataset/421/aps%2Bfailure%2Bat%2Bscania%2Btrucks) for a highly imbalanced classification and missing-data project. The positive class denotes failures of one APS-system component; negative-class records involve failures of components not related to APS. Frame the model as a **review-prioritisation exercise**, not a replacement for inspection, diagnosis, or safety engineering.

The source describes 60,000 training instances, 171 attributes (including histogram variables), `na` missing-value markers, and an official train/test division. The benchmark’s stated asymmetric error-cost context is useful for analysis but is not a universal maintenance policy.

## Authoritative source, licence, and provenance

Use the UCI landing page and its supplied files. Cite UCI’s DOI and retain both its stated **CC BY 4.0** listing and the source materials/attribution included with the data. Because the page also reproduces source copyright/licence text, preserve the original notices and document any uncertainty rather than simplifying them. Record exact input filenames, hash/checksum where available, parser treatment of `na`, and the official split status.

## Data card

| Field | Required statement |
| --- | --- |
| Unit | A truck operational record, with semantics deliberately anonymised. |
| Target | APS-component failure versus a failure unrelated to APS. |
| Features | 171 anonymised sensor/statistical attributes, including histogram-derived variables. |
| Missingness | Literal `na`, potentially systematic and operationally meaningful. |
| Population limitation | A historic, anonymised industrial benchmark; feature semantics and fleet process are not supplied. |
| Intended use | Imbalance, cost-sensitive evaluation, robust preprocessing, and review-triage learning. |
| Prohibited use | Vehicle release, autonomous maintenance action, safety certification, or claims about actual fleet reliability. |

## Leakage, missingness, and split hazards

Respect the official training/test files: use the training data for cross-validated development and open the official test only once. Do not tune imputation, scaling, feature selection, resampling, calibration, threshold, or class weight on the official test. Preserve missingness indicators; compare a simple train-fitted imputation plus indicators against a model that can handle missingness natively if available.

The dataset’s anonymisation blocks causal interpretation. Do not name sensors, diagnose root causes, or say a feature “causes” failure. Avoid SMOTE before cross-validation: resampling belongs within each training fold. Check whether duplicate/near-duplicate rows or histogram columns create implementation mistakes, and document every shape transformation.

## Decision and evaluation design

Treat probability calibration as a prerequisite to any threshold policy. Report PR-AUC, ROC-AUC, log loss/Brier score, recall/precision at a review-capacity budget, confusion matrix, calibration curve, and expected cost under an explicitly stated benchmark-style cost matrix. Include a sensitivity analysis over several cost ratios rather than claiming that one arbitrary ratio is operational truth.

Use repeated stratified cross-validation or a fixed validation split *within* the training file for selection. Keep all transformations fold-local. Once the model and threshold are frozen, evaluate once on the official test and label it final.

## Required model comparisons

1. Always-negative, prevalence, and simple rule/score baselines.
2. Regularised logistic regression with imputation and missingness indicators.
3. A non-linear tree ensemble with class weighting or an explicitly tuned cost strategy.
4. A calibrated selected model with a capacity-limited review policy.

Report metric uncertainty or fold variation. Include an ablation removing missingness indicators, and explain whether that change is a performance finding, a stability risk, or both. Include one invalid pre-cross-validation resampling experiment in an appendix and explain the leakage route.

## Deliverables

- Licence/provenance file and a complete data card.
- Parsing/data-quality report for `na`, class imbalance, and histogram columns.
- Fold-safe pipelines, model-comparison table, and calibration artefacts.
- A cost/capacity decision memo with sensitivity analysis and a “do not automate” boundary.
- Final locked-test report and reproducible environment/commands.

## Rubric (100 points)

| Criterion | Points |
| --- | ---: |
| Provenance, licence handling, and data card | 15 |
| Missingness/imbalance treatment and fold safety | 25 |
| Baselines, model comparisons, and calibration | 20 |
| Cost/capacity evaluation and sensitivity analysis | 20 |
| Limits, safety framing, and error analysis | 10 |
| Reproducibility | 10 |

## Responsible-use constraints

This project must never recommend a vehicle be released, grounded, or serviced autonomously. Treat scores as hypothetical queue-prioritisation inputs whose false negatives and false positives both require safety-engineering, human inspection, and process-level accountability beyond what this dataset can support.
