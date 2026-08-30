---
title: "Public-data project: MovieLens recommendation"
track: "machine-learning"
order: 895
status: live
summary: "Build and evaluate a recommendation pipeline while accounting for exposure, cold start, and ranking feedback."
duration: "2–4 week assessed project"
updated: "2026-08-30"
---

## Question and evidence boundary

Build and evaluate a recommendation pipeline while accounting for exposure, cold start, and ranking feedback.

Authoritative starting source: https://grouplens.org/datasets/movielens/

## Protocol

Record version/licence, construct time-aware user-item splits, compare popularity and matrix-factorisation baselines, measure ranking metrics, and write a feedback-loop and fairness risk review.

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

