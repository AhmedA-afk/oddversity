---
title: "Reproduction study: support-vector machines and kernel choice"
track: "machine-learning"
order: 884
status: "live"
summary: "Compare linear and nonlinear SVMs with nested validation, margin diagnostics, and a disciplined kernel-selection report."
duration: "110 min study + 6–8 hr project"
updated: "2026-08-30"
---

## Research question

**Executable project package:** [student starter, deterministic fixture, and public checks](/classical-ml-projects/reproductions/kernel-svm-selection/).

Under an explicit selection procedure, when does a nonlinear kernel SVM outperform a linear SVM, and how do margin, support-vector count, and feature scaling change the answer? This is a comparison study, not a search for the most flattering kernel.

## Primary source and claim

Use Cortes and Vapnik’s [*Support-Vector Networks*](https://doi.org/10.1007/BF00994018) (1995), with an openly accessible [author-hosted copy](https://homepages.math.uic.edu/~lreyzin/papers/cortes95.pdf). The paper introduces the two-group support-vector network and explains the nonlinear mapping/linear separating-surface construction. Reproduce the bounded claim that the same maximum-margin machinery can operate through an inner-product kernel, yielding nonlinear decision boundaries in input space without explicitly computing every feature-space coordinate.

Your empirical result should say only what your protocol supports: for example, whether a selected RBF model had lower held-out loss than a selected linear model on this data and split family.

## Fixed experimental protocol

Use the [UCI Human Activity Recognition Using Smartphones dataset](https://archive.ics.uci.edu/dataset/240/human+activity+recognition+using+smartphones). Keep the official train/test participant partition as the final generalisation boundary. From the official training participants, make five group-aware folds by subject. Standardise features inside each training fold only.

Compare: linear SVM; polynomial kernel degrees 2 and 3; and RBF SVM. Use a nested group-aware validation loop. Pre-register candidate `C` values of 0.01, 0.1, 1, 10, and 100. For RBF use gamma values based on 1 divided by feature count multiplied by 0.1, 1, and 10. For polynomial kernels use only the stated degree and a documented coef0. Select one configuration per model family by inner-fold balanced accuracy, then compare family choices in outer folds. Refit selected families on all official training data and evaluate once on the official test partition.

Include multinomial handling explicitly: document one-vs-rest or one-vs-one behaviour and use macro metrics because the project is not a binary replica.

## Data and provenance plan

Record the official split, activity labels, subject identifiers used for grouping, feature-processing description supplied by the authors, source URL, retrieval date, and hash. Remove subject ID from the feature matrix. The dataset originates from a specific sensor protocol; conclusions should not be generalized to different devices, placements, populations, or free-living motion.

## Required plots and tables

- Nested-CV table: mean and standard deviation of macro F1 and balanced accuracy by family/configuration.
- Heatmap of RBF inner-fold performance over `C` and gamma, clearly labelled as validation rather than test.
- Support-vector counts, proportion of training rows used, and fit/prediction cost for selected models.
- For a two-class, two-feature PCA projection used only for visualisation, plot decision contours and margins. Do not mistake this projection for the actual training space.
- Official-test confusion matrix and per-class recall for the selected family.
- A scaling-ablation table: train the same linear and RBF protocols without standardisation, explain the change, and never select based on the held-out test set.

## Calculations to show

Write the primal soft-margin objective and identify the roles of `C`, margin, and slack variables. For a four-point separable toy problem, compute a candidate separating hyperplane’s signed margins. Then calculate a small RBF Gram matrix by hand and verify symmetry and positive diagonal entries. Explain why a valid kernel must induce a positive semidefinite Gram matrix; use numerical eigenvalues as a diagnostic, not a proof under floating-point rounding.

## Statistical caveats

Nested cross-validation reduces but does not eliminate selection optimism. Outer-fold scores are correlated because folds overlap in training data; do not treat them as independent clinical trials. The official test partition may differ by subjects, but it is still one finite benchmark. Kernel hyperparameter grids encode prior choices; widening them after seeing results turns confirmation into exploration.

## Replication rubric

| Criterion | Evidence | Points |
| --- | --- | ---: |
| Protocol fidelity | participant-aware nesting and train-only scaling | 25 |
| Algorithmic understanding | primal, margins, Gram-matrix calculation | 20 |
| Fair comparison | fixed grid, common metrics, cost/support-vector report | 20 |
| Honest reporting | one final official-test evaluation and uncertainty | 20 |
| Critique | deployment, population shift, and kernel-selection limits | 15 |

## Extension and critique

Add an approximate kernel method such as random Fourier features, with the same outer-fold protocol. Compare accuracy, memory, and latency. Critique the seductive “kernel trick” narrative: nonlinear representation can help, but it may raise cost, obscure feature effects, and overfit model-selection choices. State what evidence would be required before using this activity classifier beyond the benchmark population.
