---
title: "Paper reproduction: margins and kernels"
track: "machine-learning"
order: 882
status: live
summary: "Compare linear and radial-basis SVMs under a pre-registered split and explain when the kernel gain is evidence versus validation overfit."
duration: "2–4 week assessed project"
updated: "2026-08-30"
---

## Question and evidence boundary

Compare linear and radial-basis SVMs under a pre-registered split and explain when the kernel gain is evidence versus validation overfit.

Authoritative starting source: Cortes and Vapnik, “Support-Vector Networks” (1995), https://link.springer.com/article/10.1007/BF00994018

## Protocol

Use a small fixed benchmark, standardise within training folds, tune C and bandwidth in inner folds, and retain a final test set. Report support-vector count, calibration behaviour, latency, decision boundary visualisation, and failure cases.

Freeze the dataset version, split definition, preprocessing boundary, random seeds, metric code, and plot/table specification before tuning. Maintain a changelog explaining every deviation from the protocol.

## Required artefacts

- data card with provenance, licence/access, unit, time coverage, missingness, and known defects;
- reproducible environment and one-command runner;
- baseline, comparison models, and a locked evaluation result;
- error/slice analysis and a deliberately induced failure;
- written claim, limitations, and a decision/release recommendation.

## Grading rubric

Reproducibility and data provenance 25%; valid comparison and calculations 30%; interpretation and limitations 25%; clarity, tests, and artefacts 20%. A result without a fixed split or a claim beyond the data receives no higher than a pass threshold.

## Critical reflection

Do not report invented leaderboard results. Compare the reproduced observation with the stated claim, then explain plausible threats: version drift, selection, preprocessing leakage, compute constraints, dependence, measurement error, and external validity.

