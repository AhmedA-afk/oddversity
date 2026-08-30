---
title: "Assignment 4: unsupervised learning without inventing stories"
track: "machine-learning"
order: 845
status: live
summary: "Use clustering, dimensionality reduction, or anomaly detection responsibly when labels are incomplete."
duration: "10–14 hours"
updated: "2026-08-30"
---

## Brief

Choose one of three tracks: customer/operational segmentation, anomaly triage, or exploratory representation analysis. The central question is not “what clusters exist?” but “what decision can this representation improve, and what evidence would refute the interpretation?”

## Required work

Create a feature eligibility table that excludes outcomes, post-event information, and unjustified proxies. Compare at least two methods (for example k-means/GMM, isolation forest/robust distance, PCA/UMAP for exploration). Stress-test scale, seed, sample, and feature choices. Where labels or later outcomes exist, evaluate downstream utility without retroactively leaking them into training. Interview or simulate an expert review protocol for ten selected cases.

## Submission artefacts

Include a data card, preprocessing rationale, seed-stability report, plots with honest uncertainty, a `review-queue.csv` containing ten selected cases and reasons, and `interpretation-boundaries.md`. State explicitly what a cluster/anomaly score does **not** mean.

## Rubric (100 points)

| Criterion | Points |
| --- | ---: |
| Decision framing and feature eligibility | 20 |
| Method comparison and mathematical rationale | 20 |
| Stability and sensitivity analysis | 20 |
| Human-review or downstream-utility protocol | 20 |
| Interpretation discipline and risk assessment | 10 |
| Reproducible artefacts | 10 |

## Self-check

- Standardise only after deciding whether scale carries business meaning.
- Rerun with several seeds and bootstrap samples; report instability.
- Check whether a rare group is labelled anomalous merely because it is rare.
- Show one plot that supports and one result that weakens your preferred narrative.

## Common failure modes

Cluster labels are not natural kinds, PCA axes are not causes, and a silhouette score is not business value. Do not use UMAP/t-SNE distances as quantitative evidence. If no action follows, call the work exploration—not a deployed decision system.
