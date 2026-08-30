---
title: "Evaluate recommender ranking objectives offline"
track: "machine-learning"
order: 408
status: live
summary: "Match ranker losses and top-k metrics to the product objective while accounting for historical exposure bias."
duration: "18 min read"
updated: "2026-08-30"
---

## The short answer

Recommenders rank a small candidate set, so optimise and report top-k behaviour: recall, precision, NDCG, calibration, coverage, and harm constraints. Offline gains are conditional on the old system's exposure policy and require online confirmation.

## Why this matters

Accuracy over all items is mostly irrelevant to a screen that shows ten. A model can improve NDCG while worsening long-term satisfaction, creator concentration, or safety because logs contain only what users were allowed to see.

## How it works

Pointwise losses estimate event probability; pairwise losses ask positive items to outrank sampled negatives; listwise losses optimise a whole list surrogate. Evaluate chronological held-out interactions at `k`, use candidate sets that reflect serving, and segment by new users, inventory age, and providers. Instrument impressions and positions for later causal estimates.

## Worked examples and variations (4–6, include boundary and counterexample)

1. **Search-like feed:** NDCG weights an early relevant result more than a late one.
2. **Shopping cart:** recall at 20 measures candidate retrieval before ranking.
3. **Music discovery:** catalogue coverage prevents a strong but repetitive top-k list.
4. **Boundary:** precision at 1 may suit one costly recommendation, not an infinite feed.
5. **Counterexample:** a model looks better offline by recommending already-overexposed popular items.

## Two ways to see it

Ranking is constrained utility maximisation over positions. Evaluation is an observational study of behaviour under a previous policy.

## Hands-on

Create a time-sorted interaction log with impression position. Compare popularity and a factor model on recall at 20, NDCG at 10, coverage, and new-user slices. Deliberately evaluate only clicked impressions and note the biased conclusion. Reset with explicit impression denominators and propose an A/B guardrail.

## Checkpoint

- [ ] Metric, cutoff, and candidate stage match the product surface.
- [ ] Chronological splits and exposure logging are used.
- [ ] Diversity, safety, and subgroup guardrails accompany relevance.

## What this does not solve

No offline score proves a policy will improve users' experience. Interference, novelty, and feedback loops require monitored experiments.

## Continue, go deeper, apply it

Continue to recommender feedback loops and experimental design. Apply this scorecard before approving a ranking launch.

