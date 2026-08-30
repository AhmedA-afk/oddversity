---
title: "Hypothesis tests, permutation tests, and effect sizes"
track: "machine-learning"
order: 503
status: live
summary: "A test can challenge a narrow no-difference model; effect sizes, uncertainty, and practical thresholds decide whether a change is worth using."
duration: "16 min read"
updated: "2026-08-30"
---

## The short answer

A hypothesis test asks whether observed data would be surprising under a stated null model; it does not prove that a model is useful. Pair the test with an effect size, an uncertainty interval, a prespecified decision threshold, and the validation design. Permutation tests are especially useful when a simple analytic distribution is doubtful but exchangeability is defensible.

## Why this matters

Large datasets can make trivial improvements look statistically striking, while small safety-critical datasets can miss meaningful harm. Treating a p-value as a product decision creates bad incentives. A practical decision needs magnitude, downside, cost, and replication.

## How it works

State a null hypothesis before looking at results, such as equal mean loss for two paired models. Pick a statistic, calculate it, and compare it with its distribution under the null. In a paired permutation test, randomly swap each case's two model outcomes many times; this builds the distribution expected if the model labels were interchangeable. The p-value is the fraction of null simulations at least as extreme as the observed statistic.

Effect size reports magnitude: a difference in recall, expected loss saved per case, or standardized difference when appropriate. Define a smallest practically important effect before the analysis. A non-significant result is not evidence that effects are exactly zero.

## Worked examples and variations

### Example 1: paired classification comparison

Compare two classifiers on the same held-out cases using the difference in average loss. A paired permutation test respects that easy and hard cases affect both models.

### Example 2: online conversion test

Report the conversion difference in percentage points and an interval, not only a p-value. A statistically detectable 0.02-point lift may not pay for implementation or added support load.

### Example 3: ranking evaluation

Compute per-user NDCG differences, then permute model labels within user. The unit is the user because user-level outcomes are correlated.

### Example 4: harm-oriented metric

For a medical triage aid, test and report the difference in false negatives at a fixed workload. Overall accuracy can hide the operational harm that determines acceptability.

### Boundary case: a p-value near a threshold

A result just below an arbitrary cutoff is not categorically different from one just above it. Examine the estimate, interval, protocol quality, and decision consequences.

### Counterexample: testing every metric until one wins

Testing many metrics, slices, and thresholds without correction inflates false discoveries. The apparent win may be a search artifact rather than a reproducible improvement.

## Two ways to see it

Frequentist testing calibrates behavior under a repeated-data null model. Decision-making uses the estimate and uncertainty to decide whether the expected benefit clears a real operational bar.

## Hands-on

On a held-out set, calculate per-case losses for a baseline and candidate. Run a paired permutation test, a paired bootstrap interval, and a practical-effect check. Deliberately replace paired outcomes with independently shuffled ones, observe how the answer changes, then reset to the paired analysis. Write the null, unit, statistic, and minimum useful effect before interpreting results.

## Checkpoint

- [ ] The null hypothesis and analysis unit were declared before interpretation.
- [ ] The reported effect has operational units and uncertainty.
- [ ] A test result is not being used as automatic proof or approval.

## What this does not solve

Tests depend on their sampling assumptions and cannot establish causation from a predictive validation set. They also do not select a business objective for you.

## Continue, go deeper, apply it

Continue with multiple comparisons and research degrees of freedom. Go deeper with sequential testing and Bayesian decision analysis. Apply this by adding a practical-effect threshold to experiment templates.
