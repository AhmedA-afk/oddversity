---
title: "Paper reproduction: random forests and out-of-bag evidence"
track: "machine-learning"
order: 884
status: live
summary: "Reproduce variance reduction through decorrelated trees and compare out-of-bag estimates with a valid held-out test."
duration: "2–4 week assessed project"
updated: "2026-08-30"
---

## Question and evidence boundary

Reproduce variance reduction through decorrelated trees and compare out-of-bag estimates with a valid held-out test.

Authoritative starting source: Breiman, “Random Forests” (2001), https://doi.org/10.1023/A:1010933404324

## Protocol

Fix the dataset and split, vary tree count and feature sampling, record out-of-bag and test metrics, then inspect whether their difference changes under grouped or temporal dependence. Submit a reproducible experiment manifest and interpretation.

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

