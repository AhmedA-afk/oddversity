---
title: "Paper reproduction: AdaBoost and the training-error bound"
track: "machine-learning"
order: 881
status: live
summary: "Reproduce the core AdaBoost claim on a controlled classification task, then test its sensitivity to label noise."
duration: "2–4 week assessed project"
updated: "2026-08-30"
---

## Question and evidence boundary

Reproduce the core AdaBoost claim on a controlled classification task, then test its sensitivity to label noise.

Authoritative starting source: Freund and Schapire, “A Decision-Theoretic Generalization of On-Line Learning and an Application to Boosting” (1997), https://doi.org/10.1006/jcss.1997.1504

## Protocol

Implement decision stumps, weighted error, alpha updates, and weighted resampling or direct weights. Plot training and validation error by round; repeat after corrupting a fixed fraction of labels. Submit code, seed, dataset card, plot, and a claim limited to the observed setup.

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

