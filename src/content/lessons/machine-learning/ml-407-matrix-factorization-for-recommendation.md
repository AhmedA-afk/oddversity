---
title: "Build recommender representations with matrix factorization"
track: "machine-learning"
order: 407
status: live
summary: "Learn user and item factors from sparse interactions while separating preference from exposure and popularity."
duration: "18 min read"
updated: "2026-08-30"
---

## The short answer

Matrix factorization approximates an interaction matrix with low-dimensional user and item vectors. A dot product estimates affinity, but observed clicks or ratings reflect exposure and interfaces as well as preference.

## Why this matters

Recommendations determine what people see, so their data is selectively observed. Treating every missing interaction as dislike makes popular, previously exposed items dominate and can narrow discovery.

## How it works

For explicit ratings, minimise observed-rating error plus regularisation. For implicit events, weight confidence by event strength and optimise a ranking objective such as Bayesian personalized ranking. Include biases for global, user, and item tendencies. Split by time, keep identities consistent, and define what a noninteraction means before training.

## Worked examples and variations (4–6, include boundary and counterexample)

1. **Movie ratings:** user and movie factors recover taste dimensions from sparse stars.
2. **Music plays:** confidence-weighted implicit feedback distinguishes one accidental play from repeated listening.
3. **Marketplace retrieval:** item factors provide a fast candidate set before a richer ranker.
4. **Boundary:** a brand-new user has no factor; use onboarding or content features.
5. **Counterexample:** “not clicked” after an item was never shown is not negative preference.

## Two ways to see it

Algebraically, this is low-rank matrix completion. Product-wise, it is a hypothesis about affinity under a biased logging policy.

## Hands-on

Fit a regularised explicit-feedback factor model and compare it with user/item means. Hold out only future interactions. Deliberately random-split interactions and observe over-optimism from future leakage. Reset to a temporal split, inspect cold-start users, and add a simple popularity fallback.

## Checkpoint

- [ ] Event, exposure, and missingness semantics are documented.
- [ ] Evaluation respects time and cold starts.
- [ ] Bias terms and regularisation are included.

## What this does not solve

Factorization does not know why an item was shown, whether it is safe, or whether diversity and provider fairness meet product requirements.

## Continue, go deeper, apply it

Next study ranking losses and counterfactual evaluation. Apply factors as candidate generators with explicit fallbacks.

