---
title: "Model comparison with correlated folds"
track: "machine-learning"
order: 506
status: live
summary: "Cross-validation folds share training data, so treat fold scores as dependent evidence rather than independent experimental replications."
duration: "14 min read"
updated: "2026-08-30"
---

## The short answer

Scores from ordinary cross-validation folds are correlated because their training sets overlap and because they reuse the same dataset. Average fold performance is useful for selection, but a naive t-test over fold scores is often overconfident. Compare models on the same folds, inspect per-unit differences, repeat the whole split process where possible, and confirm the selected choice on a locked holdout or future evaluation.

## Why this matters

Model dashboards often display five or ten fold scores as if they were ten independent studies. This can turn a negligible variation into a confident-sounding win and rewards unnecessary complexity. The most reliable protection is protocol design, not a single magic test.

## How it works

Use identical folds and seeds for all candidates. Calculate paired differences so case difficulty is shared. Treat cross-validation as a noisy ranking tool during development. If inference is necessary, use methods designed for repeated or corrected resampling with their assumptions made explicit, or better, collect a truly independent test period. For many model choices, nested cross-validation keeps hyperparameter selection inside the outer training partitions.

Record fold-level results, but also record the evaluation unit, group and temporal structure, training data overlap, and all search decisions. A large effect that is stable across meaningful slices can be more compelling than a tiny average lift with a decorative p-value.

## Worked examples and variations

### Example 1: five-fold tuning

Tune regularization using five folds, then evaluate the selected model once on a time-forward holdout. Do not calculate a standard independent-sample test across the five fold scores.

### Example 2: paired losses

For each held-out customer in each fold, retain baseline and candidate loss. Pairing reveals whether the candidate helps the same customers or merely benefits from a different split.

### Example 3: nested validation

Outer folds estimate the performance of the entire process; inner folds choose features and hyperparameters. This costs compute but prevents inner selection from leaking into outer evaluation.

### Example 4: repeated group splits

When enough groups exist, repeat group-aware partitions with different assignments and report the distribution of group-level differences. It is still not equivalent to an unrelated population.

### Boundary case: one feasible split

With a small number of hospitals or regions, robust uncertainty estimates may be impossible. Be frank, use qualitative review, and prioritize an external validation or staged rollout.

### Counterexample: the fold-score t-test

Treating ten overlapping-fold scores as ten independent observations understates uncertainty. Its narrow interval can be an artifact of duplicated training information.

## Two ways to see it

In statistical terms, reuse creates dependence that changes the sampling distribution. In engineering terms, cross-validation is an internal development tool, whereas a future holdout is the closest rehearsal for the release decision.

## Hands-on

Evaluate two models with identical repeated group folds and save per-group losses. Compare a naive fold-score interval with a paired group-bootstrap interval. Deliberately shuffle fold assignments independently for each model, observe why pairing is lost, then reset to shared folds. Finish with one final evaluation that no tuning code has read.

## Checkpoint

- [ ] Candidates were evaluated on identical partitions.
- [ ] Fold dependence is not being ignored in an inferential claim.
- [ ] The full selection process has a separate confirmation step.

## What this does not solve

Even perfect accounting for fold dependence does not establish that the data distribution, labels, or deployment behavior will remain stable.

## Continue, go deeper, apply it

Continue with error analysis as a research loop. Go deeper with nested validation and external validation design. Apply this by making fold assignments a versioned project asset.
