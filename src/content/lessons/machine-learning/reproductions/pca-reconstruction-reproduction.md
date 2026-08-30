---
title: "Paper reproduction: low-rank reconstruction"
track: "machine-learning"
order: 883
status: live
summary: "Reproduce the variance/reconstruction trade-off of PCA and challenge whether components preserve the task-relevant signal."
duration: "2–4 week assessed project"
updated: "2026-08-30"
---

## Question and evidence boundary

Reproduce the variance/reconstruction trade-off of PCA and challenge whether components preserve the task-relevant signal.

Authoritative starting source: Turk and Pentland, “Eigenfaces for Recognition” (1991), https://doi.org/10.1162/jocn.1991.3.1.71

## Protocol

Use a permitted low-dimensional image or tabular dataset. Fit mean and components on training data only; plot reconstruction error and retained variance against k; inspect errors by slice; compare a downstream baseline with and without PCA.

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

