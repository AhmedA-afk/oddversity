---
title: "Problem Set 5: Ensembles and Uncertainty"
track: "machine-learning"
order: 825
status: live
summary: "Quantify voting, boosting updates, bootstrap uncertainty, and ensemble failure modes."
duration: "90–120 min"
updated: "2026-08-30"
---

## Questions

1. Three independent classifiers each have accuracy 0.7. Compute the majority-vote accuracy for an odd ensemble of three.
2. Two classifiers each have error rate 0.3 but always make errors on exactly the same examples. What is majority-vote error? Contrast question 1.
3. In AdaBoost, a weak learner has weighted error (e=0.2). Compute (\alpha=\frac12\log((1-e)/e)). By what multiplicative factor are misclassified observations upweighted before normalization?
4. A regression random forest produces predictions [10, 12, 11, 15, 12] for one case. Compute mean and sample standard deviation. Why is this not automatically a calibrated prediction interval?
5. Explain bagging’s effect on variance and bias for an unstable tree learner. What assumption about base learners makes averaging useful?
6. A gradient boosting model improves validation log loss for 40 rounds, then worsens it. Specify a valid early-stopping protocol that does not leak the final test set.
7. Debug: a team trains 200 boosting rounds, picks the best round using test AUC, then reports that AUC as final performance. Identify both invalid uses of the test set.
8. A credit model’s ensemble disagreement rises sharply after a policy change, while mean score is unchanged. List three hypotheses and the first two diagnostic checks.

---

## Fully worked solutions

1. Correct majority requires exactly two or three correct: (3(.7)^2(.3)+(.7)^3=.784).
2. Error remains .3: correlated mistakes do not cancel. The gain in question 1 came from independence, not from the number of model files.
3. (\alpha=\frac12\log4\approx0.6931). Misclassified weights multiply by (e^{\alpha}=2) before normalization; correctly classified weights multiply by (e^{-\alpha}=0.5).
4. Mean (=12). Deviations are (-2,0,-1,3,0), squared sum 14, sample SD (=\sqrt{14/4}\approx1.871). Tree spread measures algorithmic variation under this ensemble, not all aleatoric uncertainty, shift, or calibration error.
5. Averaging decorrelated unstable trees reduces variance; it may slightly increase bias relative to fully grown individual trees. It is useful when base errors are not perfectly correlated and each learner contains signal.
6. Split training/validation before fitting. Train only on the training partition, monitor a predeclared validation metric each round, select the best round with patience, refit according to a documented policy, and use the untouched test set once.
7. Selecting the round on test data tunes to test noise; reporting the same selected score is then selection-biased. Keep a validation set (or inner CV) for round selection and reserve test evaluation.
8. Possible causes: covariate shift, a changed feature pipeline, or models relying on different proxies under the new policy. First inspect schema/missingness/range drift and compare prediction distributions and disagreements by key slices/time; then trace feature lineage before retraining.

## Grading rubric

35 points: ensemble probability and boosting arithmetic; 25 points: uncertainty interpretation; 25 points: validation and test-set discipline; 15 points: production diagnosis.

## Common misconceptions

- More estimators do not help when their errors are perfectly correlated.
- Bootstrap/tree variation is not a complete uncertainty statement.
- Early stopping is hyperparameter selection and needs validation isolation.

## Extension problems

Derive the variance of the mean of (m) identically distributed predictors with pairwise correlation (\rho). Use it to explain why random feature subsampling can improve a forest.
