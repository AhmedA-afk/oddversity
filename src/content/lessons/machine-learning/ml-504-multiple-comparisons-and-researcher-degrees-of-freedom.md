---
title: "Multiple comparisons and researcher degrees of freedom"
track: "machine-learning"
order: 504
status: live
summary: "Every untracked choice creates another chance to find noise; limit, log, and correct the search before presenting a result as evidence."
duration: "15 min read"
updated: "2026-08-30"
---

## The short answer

If many models, metrics, slices, prompts, feature sets, stopping times, or thresholds are examined, some will look impressive by chance. Separate exploratory search from confirmatory evaluation. Predeclare the primary comparison where possible, track all choices, reserve untouched data, and use a correction or false-discovery procedure when a family of claims will be acted upon.

## Why this matters

Machine learning makes searching cheap. That is useful for discovery, but it invalidates the story that one observed winner arose from one planned comparison. Without records, teams cannot tell whether a result is repeatable or merely the best fluctuation encountered.

## How it works

Define a family of claims: perhaps ten candidate models on one primary metric, or twenty subgroup safety checks. Family-wise approaches such as Bonferroni control the probability of any false positive under stated assumptions and are conservative. False discovery rate approaches aim to control the expected proportion of false discoveries among selected findings. The most direct protection for model selection is a validation layer for search and a final test used once.

Researcher degrees of freedom include choices that happen after results are visible: filtering records, choosing a date range, changing a metric, excluding an inconvenient slice, or stopping when a graph looks good. A decision log turns those choices into reviewable evidence.

## Worked examples and variations

### Example 1: one hundred hyperparameter trials

Choose settings on cross-validation, then score the selected pipeline once on a locked holdout. Do not describe the holdout result as if the one chosen setting had been specified from the beginning.

### Example 2: twenty fairness slices

When examining error rates across many protected and operational groups, predefine the most consequential slices and flag all exploratory results as leads requiring follow-up rather than confirmations.

### Example 3: feature hunting

Trying dozens of external variables raises leakage and selection risk. Version every candidate feature and validate the full selection pipeline inside folds.

### Example 4: dashboard monitoring

Repeatedly checking an online experiment and stopping at the first attractive p-value changes the false-positive rate. Use a planned stopping rule or a valid sequential method.

### Boundary case: genuinely exploratory work

Exploration is not wrong. Label it clearly, preserve the search history, and seek new data or a future experiment before making a strong claim.

### Counterexample: correction after hiding the search

Applying a correction only to the final three comparisons while omitting the forty earlier attempts does not repair the evidence. The relevant family is the search that could have produced the claim.

## Two ways to see it

Mathematically, repeated chances increase the chance of extreme noise. Socially, transparent search history lets reviewers distinguish a hypothesis from a discovery.

## Hands-on

Simulate labels with no real signal and train many feature variants. Notice that the best validation score is usually above chance. Deliberately choose the winner after seeing the test set, then reset by selecting only with validation and evaluating once on a fresh holdout. Keep a compact ledger of every model, metric, date range, and exclusion you tried.

## Checkpoint

- [ ] The claim family and primary metric are explicit.
- [ ] Exploratory and confirmatory results are labeled differently.
- [ ] Search choices, including discarded trials, are recoverable.

## What this does not solve

Corrections do not make an unrepresentative dataset representative, nor do they replace domain review of harms and incentives. They only address part of selection-driven overstatement.

## Continue, go deeper, apply it

Continue with power analysis and sample size. Go deeper with preregistration and sequential methods. Apply this by making an experiment ledger a required project artifact.
