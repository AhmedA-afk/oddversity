---
title: "Problem Set 3: Regularization and Model Selection"
track: "machine-learning"
order: 823
status: live
summary: "Calculate shrinkage, reason about validation, and diagnose selection leakage."
duration: "90–120 min"
updated: "2026-08-30"
---

## Questions

1. For an orthonormal design (X^TX=I) and (X^Ty=[3,-1]^T), compute ridge estimates for (\lambda=1) under objective (\lVert y-X\beta\rVert^2+\lambda\lVert\beta\rVert^2).
2. Under the same design and objective (\frac12\lVert y-X\beta\rVert^2+\lambda\lVert\beta\rVert_1), compute the lasso estimate for (\lambda=1).
3. Explain why standardizing predictors before lasso is normally necessary. Give a counterexample involving kilograms and grams.
4. Five-fold CV errors for models A and B are A: [0.20, 0.22, 0.19, 0.23, 0.21], B: [0.18, 0.20, 0.27, 0.19, 0.21]. Compute means. Which choice is less certain, and why?
5. A team chooses among 400 hyperparameter configurations using the same validation set and reports its best score. Identify the optimism mechanism and give a correct nested-validation workflow.
6. Derive the ridge normal equations for the objective in question 1. State what changes when an intercept is excluded from the penalty.
7. A sparse lasso fit changes selected variables when two nearly identical features are swapped. Is this necessarily a bug? Give a stable alternative and a reporting practice.
8. Debug this pipeline: impute missing values and standardize all rows; split into folds; cross-validate a classifier. Name the leakage and write the safe ordering.

---

## Fully worked solutions

1. Ridge is ((I+I)^{-1}[3,-1]=[1.5,-0.5]).
2. Soft thresholding gives ([\operatorname{sign}(3)(3-1),\operatorname{sign}(-1)(1-1)]=[2,0]).
3. The ℓ1 penalty penalizes coefficient magnitude, whose required scale depends on units. A 1 kg feature becomes 1000 grams and needs a coefficient one-thousandth as large, changing its penalty without standardization. Standardize using training-fold statistics only.
4. Means are A (=0.21), B (=0.21). B has wider variation (including 0.27), so its apparent tie needs uncertainty analysis and fold-level investigation rather than a winner declaration.
5. Reusing validation for selection makes the minimum of noisy estimates optimistically biased. In nested CV, each outer training fold runs its own inner CV to choose settings; evaluate that chosen pipeline once on the held-out outer fold and aggregate outer scores.
6. Set derivative (2X^T(X\beta-y)+2\lambda\beta=0), yielding ((X^TX+\lambda I)\beta=X^Ty). With an unpenalized intercept, use a penalty matrix with zero in the intercept position, not (I).
7. No. Lasso selection is unstable under collinearity because many nearly equivalent sparse representations exist. Elastic net can retain correlated groups; report selection stability over resamples and avoid causal language.
8. This learns imputation means and scaling parameters from validation rows. Split first; inside each training fold fit imputer and scaler, transform that training part and its validation part, then fit/evaluate the model.

## Grading rubric

35 points: ridge/lasso mathematics; 25 points: scaling and collinearity reasoning; 25 points: CV/model-selection validity; 15 points: leakage diagnosis and precision.

## Common misconceptions

- A zero lasso coefficient is not proof a feature has no relationship with the target.
- Cross-validation does not automatically make every preprocessing operation valid.
- The best validation score is not an unbiased estimate after extensive tuning.

## Extension problems

Implement nested CV for elastic net with a reproducible split seed. Compare the minimum-error rule with a one-standard-error rule and justify a choice for a high-cost deployment.
