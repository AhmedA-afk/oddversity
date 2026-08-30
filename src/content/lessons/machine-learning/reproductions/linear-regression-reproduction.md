---
title: "Paper reproduction: least squares, shrinkage, and prediction"
track: "machine-learning"
order: 885
status: live
summary: "Reproduce a linear baseline, ridge path, and error analysis on a documented public dataset without turning coefficients into causal claims."
duration: "2–4 week assessed project"
updated: "2026-08-30"
---

## Question and evidence boundary

Reproduce a linear baseline, ridge path, and error analysis on a documented public dataset without turning coefficients into causal claims.

Authoritative starting source: Hoerl and Kennard, “Ridge Regression: Biased Estimation for Nonorthogonal Problems” (1970), https://doi.org/10.1080/00401706.1970.10488634

## Protocol

Create an as-of feature table, compare mean, least-squares, and ridge baselines, show coefficient paths and residual plots, and report one meaningful range where the model should abstain from extrapolation.

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

