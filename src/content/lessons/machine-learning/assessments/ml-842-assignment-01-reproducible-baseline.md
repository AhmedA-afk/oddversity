---
title: "Assignment 1: frame a decision and ship a reproducible baseline"
track: "machine-learning"
order: 842
status: live
summary: "Turn an ambiguous decision into a data card, baseline, evaluation plan, and reproducible experiment."
duration: "8–12 hours"
updated: "2026-08-30"
---

## Scenario

Choose a public tabular dataset with a real decision behind it: screening, retention, demand, credit, or operations. Do not begin with a model. State who takes an action, what happens after a positive prediction, the cost of each error, and when the prediction is available.

## Required work

1. Write a two-page data card: provenance, licence, unit of observation, collection period, target construction, sensitive attributes, known gaps, and intended/non-intended uses.
2. Define a split that prevents leakage. Explain why random, grouped, temporal, or geographic validation is appropriate.
3. Implement a naive baseline and one transparent model in a single executable pipeline. The preprocessing fit must occur inside each training fold.
4. Select a primary metric and two guardrail metrics from decision consequences. Report uncertainty across folds or bootstrap resamples.
5. Inspect five errors and two meaningful slices. Make one evidence-backed next-step recommendation.

## Submission artefacts

Submit a Git repository containing `README.md`, environment lock file, `src/`, `data/README.md` (or download script), one command that reproduces results, immutable seed/config, and a results table. Include `data-card.md`, `experiment.md`, and a 5-minute screen recording that reruns the pipeline from a clean environment. Never commit restricted data or credentials.

## Rubric (100 points)

| Criterion | Points | Full-credit evidence |
| --- | ---: | --- |
| Decision framing and data card | 20 | Action, harms, target, provenance, limits, and intended use are concrete. |
| Split and leakage defence | 20 | Availability timeline and a justified split are testable. |
| Reproducible baseline | 20 | Clean rerun recreates metrics and artefacts. |
| Metrics and uncertainty | 15 | Metrics reflect the decision; uncertainty is reported. |
| Error/slice analysis | 15 | Examples lead to a constrained conclusion, not a story. |
| Communication and risk | 10 | Claim scope, privacy, and next step are proportionate. |

## Self-check

- Delete outputs, rerun the documented command, and compare result hashes.
- Replace the target with shuffled labels: performance should collapse.
- Remove one suspicious feature and report the change.
- Ask: could an operator act on this result safely today?

## Common failure modes

Feature scaling before the split, an accuracy-only report for imbalance, a baseline labelled “bad” without a decision benchmark, and random splitting of repeated entities each lose substantial credit. Bigger models do not compensate for these defects.
