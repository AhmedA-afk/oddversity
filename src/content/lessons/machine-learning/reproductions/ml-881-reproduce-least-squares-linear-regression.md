---
title: "Reproduction study: least-squares linear regression"
track: "machine-learning"
order: 881
status: "live"
summary: "Rebuild ordinary least squares from the historical method, verify its geometry, and report when its assumptions fail."
duration: "90 min study + 4–6 hr project"
updated: "2026-08-30"
---

## Research question

**Executable project package:** [student starter, deterministic fixture, and public checks](/classical-ml-projects/reproductions/least-squares/).

Can you reproduce the defining behaviour of ordinary least squares (OLS): among linear predictions, it chooses coefficients whose residual vector is orthogonal to every included feature? This is a reproduction of a mathematical claim and an empirical workflow, not a promise that a particular dataset will produce a particular score.

## Primary source and claim

Adrien-Marie Legendre introduced the method of least squares in *Nouvelles méthodes pour la détermination des orbites des comètes* (1805). A digitised primary edition is available from the [Bibliothèque nationale de France](https://gallica.bnf.fr/ark:/12148/bpt6k965753). The modern matrix statement to reproduce is: for a full-column-rank design matrix `X`, the minimiser of the residual sum of squares satisfies `X^T(y - X beta_hat) = 0`; therefore fitted residuals have zero sample correlation with every included column of `X` (up to numerical tolerance).

Do not claim that the original astronomical results have been replicated. Your project reproduces the estimator and tests its stated finite-sample properties on a documented modern dataset.

## What you will build

Implement OLS twice: (1) solve the normal equations only as a diagnostic, and (2) solve by QR or SVD as the reference implementation. Compare both with a library implementation only after your own checks pass. Your report must distinguish numerical agreement from causal validity: a low residual sum of squares does not make a coefficient an intervention effect.

## Fixed experimental protocol

Use the UCI [Auto MPG dataset](https://archive.ics.uci.edu/dataset/9/auto+mpg), downloaded once and stored with its SHA-256 hash. Predict `mpg` from cylinders, displacement, horsepower, weight, acceleration, model year, and origin. Treat the literal missing horsepower marker as missing before converting types. Do not use car name as a feature.

1. Freeze a 70/15/15 train/validation/test split with seed 20260830, stratifying model year into coarse bins.
2. Fit imputation and standardisation on training rows only. Add an intercept after standardising numerical columns.
3. Fit three pre-registered specifications: all listed features; all features plus `weight^2`; and all features with displacement removed.
4. Choose one specification using validation RMSE. Touch the test set once, at the end.
5. On the selected model, report train/validation/test RMSE and MAE, coefficient table, residual diagnostics, and `max(abs(X^T residual))` on the training design matrix.
6. Repeat the entire split-and-fit procedure over 30 declared seeds. Report the distribution of test RMSE; do not select the best seed.

The fixed protocol is intentionally more specific than the historic source. That is a replication design choice, not an attribution to Legendre.

## Data and provenance plan

Commit a `data-card.md` beside your notebook or repository. Record dataset URL, retrieval date, license/terms, checksum, row count before and after cleaning, missing-value rule, feature dictionary, and why the target is appropriate. Preserve the raw file read-only; write a separate cleaned artifact. If the source becomes unavailable, use a cached copy whose hash matches your report and say so.

The dataset is observational and historically bounded. It is suitable for prediction practice, not for statements such as “reducing vehicle weight by one unit causes MPG to change by this coefficient.” Note possible manufacturer clustering, changing emissions standards, and measurement conventions.

## Required plots and tables

- A table of split sizes, missingness, and preprocessing fit scope.
- A coefficient table with units, standardised coefficient, and a bootstrap percentile interval.
- Predicted-versus-observed and residual-versus-fitted plots, each labelled by split.
- A Q–Q plot of residuals and a leverage/Cook’s-distance diagnostic, with interpretation rather than automatic deletion.
- A 30-seed dot/violin plot for test RMSE across the three specifications.
- A numerical table comparing normal equations, QR/SVD, and the library solver: coefficients, condition number, residual norm, and orthogonality error.

## Calculations to show

Derive the gradient of `||y - X beta||^2` and show why setting it to zero produces the normal equations. Then construct a near-collinear two-feature toy dataset. Demonstrate that normal equations become unstable as the condition number rises, while QR/SVD gives a more stable solution. Explain why stability does not resolve omitted-variable bias.

## Statistical and reproducibility caveats

Repeated random splits estimate sensitivity to this resampling scheme, not a confidence interval for deployment performance. Bootstrap intervals around coefficients require assumptions and do not cure misspecification. Residual normality is not required for OLS to minimise squared error; it matters for some classical uncertainty interpretations. A standard IID split can also be too optimistic if similar vehicles or years cross the boundary.

Set every random seed, pin package versions, save the exact command, and include an environment export. Do not report p-values without stating the model, hypothesis family, and whether analysis choices were made before looking at results.

## Replication rubric

| Criterion | Evidence | Points |
| --- | --- | ---: |
| Provenance and leakage control | data card, immutable split, train-only preprocessing | 20 |
| Correct implementation | QR/SVD reference, normal-equation diagnostic, unit tests | 20 |
| Faithful claim test | residual orthogonality and numerical-stability experiment | 20 |
| Honest empirical report | all planned metrics/seeds, no cherry-picked split | 20 |
| Interpretation and limits | observational caveat, diagnostics, reproducibility bundle | 20 |

## Extension and critique

Replace the random split with a forward-in-time split by model year and compare the conclusion. Then fit ridge regression with its penalty selected on validation data. Critique the historical claim’s modern limits: least squares is an optimisation rule, not a guarantee that linearity, independent noise, stable data-generating processes, or causal interpretation hold. State which conclusion survived the extension and which was protocol-dependent.
