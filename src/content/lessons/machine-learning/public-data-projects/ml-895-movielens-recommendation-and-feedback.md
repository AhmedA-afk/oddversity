---
title: "Public-data project: MovieLens recommendation with temporal and feedback-loop audits"
track: machine-learning
order: 895
status: live
summary: "Evaluate collaborative filtering honestly with time, cold-start, popularity, and representation constraints in view."
duration: "10–14 hours"
updated: "2026-08-30"
---

## Project brief

**Executable project package:** [student starter, deterministic fixture, and public checks](/classical-ml-projects/public-data/movielens/).

Build an offline recommender evaluation using the stable [MovieLens 25M dataset from GroupLens](https://grouplens.org/datasets/movielens/25m/). Choose either rating prediction or top-*k* ranking as the primary task; do not report one metric as proof of the other. Your report must explain why offline ratings from self-selected users cannot establish user satisfaction, platform value, or the effect of deploying recommendations.

## Authoritative source, licence, and provenance

Download from GroupLens, read and retain the dataset README and usage terms, and include the required acknowledgement/citation. GroupLens supplies specific use conditions; treat the README as controlling, especially for redistribution and commercial/revenue-bearing use. Do not commit or rehost the raw data unless the terms for your exact release permit it. Record the release, download date, checksum, selected files, and any filtering.

MovieLens ratings are volunteered interactions from MovieLens users, not a random sample of people, films, or exposure opportunities. User IDs are anonymised but remain potentially linkable when combined with external information; do not attempt re-identification or enrichment.

## Data card

| Field | Required statement |
| --- | --- |
| Unit | Explicit rating event with user, movie, rating, and timestamp. |
| Population | Self-selected MovieLens users and rated/tagged movies in the chosen release. |
| Outcome | A recorded rating or held-out interaction, not enjoyment after a recommendation. |
| Features | Historical user-item interactions and metadata supplied by the release. |
| Missingness | Unobserved ratings are not negative labels; they are mostly unknown exposure/preference. |
| Intended use | Offline recommender-method learning and evaluation design. |

## Leakage, missingness, and split hazards

Use a per-user temporal split: train on interactions before a cutoff, validate on later interactions, and lock a final later test. A random rating split leaks future taste/history and makes the task unrealistically easy. Ensure that all fitted encoders, normalisation, popularity features, and item representations are derived from training events only.

Do not treat missing ratings as zeros. Define cold-start handling: users/items absent from train must receive a stated fallback or be reported separately. Avoid using tags or external metadata with timestamps after the cutoff. Discuss feedback loops: popularity-based models learn logged exposure patterns, not necessarily relevance for an unbiased candidate set.

## Required model comparisons

1. Global mean, user mean, item mean, and popularity ranking baselines.
2. Neighbourhood collaborative filtering or a clearly specified item-similarity method.
3. Regularised matrix factorisation or another latent-factor model.
4. A ranking-aware evaluation for a chosen candidate protocol, plus rating RMSE/MAE only if rating prediction is the task.

For ranking, report Recall@K, NDCG@K, coverage, novelty/popularity distribution, and cold-start performance. State candidate-generation assumptions. Compare recommendations for several *synthetic or anonymised IDs* without presenting them as user profiles.

## Deliverables

- Source/terms note and non-redistribution decision.
- Data card, temporal split code, and cold-start protocol.
- Baseline, neighbour, and factor-model implementations with fixed seeds.
- Offline evaluation report with ranking/rating distinction, coverage, popularity, and temporal diagnostics.
- A feedback-loop memo: what logged feedback cannot identify and what an online experiment would need.

## Rubric (100 points)

| Criterion | Points |
| --- | ---: |
| Provenance, terms compliance, and data card | 15 |
| Temporal split and missing-not-negative reasoning | 25 |
| Baseline/model comparison | 20 |
| Ranking, cold-start, and coverage evaluation | 20 |
| Feedback-loop and responsible-use analysis | 10 |
| Reproducibility | 10 |

## Responsible-use constraints

Do not infer identity, demographics, or sensitive preferences. Do not describe offline metric gains as user benefit, and do not deploy or personalise from this data. Explicitly discuss popularity concentration, filter bubbles, and the absence of exposure/randomisation data.
