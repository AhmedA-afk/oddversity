---
title: "Reproduction study: AdaBoost weight updates and noise sensitivity"
track: "machine-learning"
order: 882
status: "live"
summary: "Reimplement AdaBoost, inspect its evolving example weights, and test a bounded claim under controlled label noise."
duration: "100 min study + 5–7 hr project"
updated: "2026-08-30"
---

## Research question

**Executable project package:** [student starter, deterministic fixture, and public checks](/classical-ml-projects/reproductions/adaboost-noise-sensitivity/).

When decision stumps are weak learners, can you reproduce AdaBoost’s adaptive reweighting mechanism, and how does its behaviour change under deliberately injected label noise? The goal is an auditable experiment, not a claim that boosting is universally better than any competitor.

## Primary source and claim

Use Freund and Schapire’s [*A Decision-Theoretic Generalization of On-Line Learning and an Application to Boosting*](https://www.sciencedirect.com/science/article/pii/S002200009791504X) (1997). Their AdaBoost construction repeatedly forms a distribution over labelled examples, obtains a weak rule with low weighted error, and combines rules with data-dependent weights. Reproduce this algorithmic claim: after each round, examples misclassified by the selected weak learner receive relatively more weight than correctly classified examples, provided the learner has weighted error below one half.

This project does not reproduce every reported experiment in the paper. It tests the mechanism and a clearly limited robustness question under a disclosed modern protocol.

## Fixed experimental protocol

Use the [UCI Breast Cancer Wisconsin Diagnostic dataset](https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic). Remove the identifier; predict diagnosis from the provided measurements. Use a seed-20260830 stratified 60/20/20 train/validation/test split. Standardisation is unnecessary for stumps, but document any preprocessing.

Implement binary AdaBoost from scratch with depth-one CART stumps. At each round save: the chosen feature and threshold, weighted error, learner weight, training exponential loss, validation balanced accuracy, and the full training-weight distribution. Run exactly 200 rounds. Pre-register three training-set conditions: no injected noise, 5% label flips, and 15% label flips. Flip labels only after splitting, only in the training set, with independently recorded seeds 11, 22, and 33. Validation and test labels must remain untouched.

Compare against one stump, a majority-class classifier, and a regularised logistic-regression baseline. Pick the number of rounds using validation balanced accuracy; report one locked test result per condition.

## Data and provenance plan

Create a data card with source URL, retrieval date, checksum, original row count, class counts, excluded identifier, split file, and the exact label-noise generator. Medical-looking datasets are not clinical validation data. Their provenance, class definition, collection context, and potential dataset artefacts must be discussed before any performance statement.

Keep an index file mapping every output figure to the raw-data hash, split hash, implementation commit, and configuration. Your project must run offline once the source snapshot has been saved.

## Required plots and tables

- A round-by-round plot of weighted training error, exponential loss, and validation balanced accuracy for each noise condition.
- Histograms or Lorenz-style cumulative plots of training weights at rounds 1, 25, 100, and the selected round.
- A table listing the ten highest-weight examples at the selected round, including whether each was intentionally flipped. Do not publish patient-identifying fields.
- Test confusion matrices, ROC-AUC only as a secondary metric, balanced accuracy, sensitivity, specificity, and calibration warning.
- A table comparing AdaBoost, one stump, majority class, and logistic regression across all three conditions.

## Calculations to show

For labels in `{-1, +1}`, derive the update proportional to `w_i * exp(-alpha_t y_i h_t(x_i))`. Calculate one complete update on a four-example toy set by hand. Explain why a weak learner with error exactly one half contributes no useful signed vote, and specify your implementation’s safe stop condition for error at or above one half.

## Statistical caveats

Injected random label noise is a model of one failure mode, not a proxy for real diagnostic label error. A single split is not enough to rank methods reliably; repeat the full pre-registered protocol over 20 split seeds and report paired differences with a confidence interval or bootstrap interval. Do not use the test set to choose the number of rounds. Because multiple rounds and models are inspected, narrative claims about a visible curve should be labelled exploratory unless pre-registered.

## Replication rubric

| Criterion | Evidence | Points |
| --- | --- | ---: |
| Algorithm fidelity | hand check, weight normalisation, stop rules, unit tests | 25 |
| Experimental integrity | frozen splits, noise only in training, baseline parity | 20 |
| Mechanism visibility | saved weights and required learning curves | 20 |
| Statistical honesty | seed distribution, no selected test round, caveats | 20 |
| Scientific critique | dataset limits and an explanation of observed failures | 15 |

## Extension and critique

Repeat with depth-two trees and with robust loss or early stopping. Ask whether extra learner capacity concentrates even more mass on noisy points. Critique the word “robust”: the source gives an algorithm and theoretical perspective, while your finite dataset/noise design can only support a conditional empirical statement. Describe the cases in which your implementation should refuse to continue.
