---
title: "Deep lecture: Regularisation and model selection as controlled generalisation"
track: "machine-learning"
order: 902
status: live
summary: "Derive ridge and lasso penalties, quantify validation uncertainty, and select models without leaking the test set."
duration: "100 min lecture + 3 hr lab"
updated: "2026-08-30"
---

# Regularisation and model selection: choosing complexity without fooling yourself

Training error answers a narrow question: how well can this fitted function reproduce rows it has already seen? Generalisation asks about new draws from the same operational population. Regularisation is the deliberate preference for some functions over others; model selection is the experimental discipline used to decide how strong that preference should be. Neither is a magic “overfitting switch.”

Let `L(beta)` be average training loss. Penalised estimation solves `min_beta L(beta) + lambda Omega(beta)`. `lambda` sets the exchange rate between fit and complexity. `Omega` is a structural prior in optimisation clothing: ridge says many small coefficients are plausible; lasso says sparse representations are plausible; early stopping says paths reached quickly by the optimiser are preferred. The appropriate choice depends on geometry, measurement, stability, and downstream use—not a leaderboard habit.

## Ridge regression as shrinkage and a Gaussian prior

With centred predictors and response, ridge solves

```text
min_beta ||y-X beta||^2 + lambda ||beta||^2.
gradient: 2X^T X beta - 2X^T y + 2lambda beta = 0.
beta_ridge = (X^T X + lambda I)^(-1) X^T y.
```

The added `lambda I` makes singular directions invertible. In an SVD `X=U D V^T`, the OLS component along singular value `d_j` is multiplied by one; ridge multiplies it by `d_j^2/(d_j^2+lambda)`. Weakly identified directions shrink most. Bayesian language gives the same objective under Gaussian residuals and independent `beta_j ~ Normal(0, tau^2)`, with `lambda=sigma^2/tau^2` up to scaling conventions.

### Calculation 1: ridge in one dimension

For `x=[1,2]`, `y=[1,3]`, no intercept, `X^T X=5`, `X^T y=7`. OLS gives `7/5=1.4`. With `lambda=5`, ridge gives `7/(5+5)=0.7`. Training RSS at 1.4 is `(1-1.4)^2+(3-2.8)^2=0.20`; at 0.7 it is `(0.3)^2+(1.6)^2=2.65`. We knowingly worsen training fit to reduce variance under noisy repeated samples.

### Calculation 2: a collinear pair

If `x2=x1`, predictions depend only on `s=b1+b2`; OLS has infinitely many pairs with the same `s`. Ridge minimises `b1^2+b2^2` subject to the needed sum, so it chooses `b1=b2=s/2`. This is a coherent stable convention, not discovery of two separate causal effects.

## Lasso, sparsity, and its sharp edges

Lasso replaces the square with `||beta||_1=sum |beta_j|`. The objective is convex but nondifferentiable at zero. In orthonormal coordinates, each OLS coefficient `z_j` becomes soft-thresholded:

```text
beta_lasso,j = sign(z_j) max(|z_j|-lambda, 0).
```

This exact-zero behaviour supports compact models, but correlated features can be selected arbitrarily. A selected variable is not automatically important, causal, or stable. Elastic net, `lambda[(1-alpha)||beta||_2^2/2 + alpha||beta||_1]`, often handles correlated blocks more gracefully.

### Calculation 3: soft thresholding

For orthonormal OLS values `[2.4, -0.7, 0.3]` and `lambda=0.8`, lasso yields `[1.6, 0, 0]`. The `-0.7` coefficient is not “proved irrelevant”; it is below the chosen complexity price. If lambda changes to 0.2, output is `[2.2,-0.5,0.1]`. Selection is a function of both data and tuning.

### Calculation 4: standardisation changes the penalty

Suppose two equivalent features are `x` and `100x`, with coefficients `b` and `b/100`. Their predictions match, but lasso penalties are `|b|` versus `|b|/100`; unscaled lasso unfairly prefers the large-unit feature. Standardise using training-fold mean and scale before fitting. Never use test-fold statistics.

## Validation is an experiment, not a convenience function

You need three conceptual roles: training data fits parameters, validation data selects choices, and test data is a once-only audit. Cross-validation reuses data efficiently by fitting on folds and evaluating held-out folds. It estimates performance of a *procedure* that includes preprocessing and tuning. When tuning many configurations, nested CV or an untouched final test set is essential.

### Calculation 5: compare mean and variability across folds

Model A has five validation losses `[0.20,0.22,0.25,0.21,0.24]`: mean `0.224`. Model B has `[0.18,0.20,0.31,0.17,0.26]`: mean `0.224` too. Their equal means do not make them interchangeable. B has range `0.14` versus A's `0.05`; inspect fold composition, subgroup risk, training-time variance, and complexity. Picking B solely because one run showed 0.17 is selection noise.

### Calculation 6: why repeated tuning leaks

Imagine 100 useless hyperparameter settings each with true validation accuracy 0.70 and independent standard deviation 0.02. The maximum observed score will often be around 0.75 or more by chance. Reporting it as expected performance is optimism from multiple comparisons. Hold out an audit set or use nested selection.

## Information criteria and effective degrees of freedom

For likelihood models, AIC approximates out-of-sample deviance: `AIC=-2 log L + 2k`; BIC uses `k log n` and penalises complexity more as data grows. They make stronger model assumptions than held-out evaluation. Ridge's effective degrees of freedom are `trace[X(X^T X+lambda I)^(-1)X^T]`, between zero and the number of columns. This explains why regularisation is gradual, not an on/off variable.

```text
nested_model_selection(data, candidates):
    for outer_train, outer_test in outer_folds(data):
        scores = []
        for candidate in candidates:
            inner_score = cross_validate(pipeline(candidate), outer_train)
            scores.append(inner_score)
        chosen = argmin(scores)
        record(evaluate(fit(chosen, outer_train), outer_test))
    return distribution_of_recorded_scores
```

The pipeline must include imputation, scaling, encoding, feature selection, resampling, and calibration. Fitting any of those before fold splitting imports information from held-out rows.

## Debugging lab: the feature selector that saw the answer

Run [the core regression lab](/classical-ml-labs/core/linear_regression.py) and [all checks](/classical-ml-labs/core/run_all.py). Generate 1,000 random features and random labels. First select the top 20 features by full-dataset correlation, then cross-validate a model: you will obtain implausible performance. Repeat selection *inside* every training fold using a pipeline; the score should collapse to chance. Record the two results and explain exactly when label information crossed the validation boundary. Then compare ridge, lasso, and elastic net on duplicated features and chart coefficient stability under bootstrap resamples.

## Exercises with worked answers

1. **What is ridge's solution if `X^T X=4` and `X^T y=10`, lambda=1?** Answer: `10/(4+1)=2`.
2. **Does ridge set coefficients exactly to zero?** Answer: ordinarily no; finite ridge continuously shrinks them, unlike lasso's thresholding.
3. **Soft-threshold `z=-1.5` at lambda 0.4.** Answer: `-1.1`.
4. **Why must scaling happen within a CV fold?** Answer: a global mean or variance contains held-out distributional information and can create optimistic validation estimates.
5. **A 1-SE rule picks a simpler model near the best CV score. What does it trade?** Answer: a small possible mean-score loss for lower complexity and often greater stability/interpretability.
6. **When is random CV invalid?** Answer: dependent groups, times, patients, households, or duplicate entities cross folds; use group/time-aware splitting.
7. **Give one situation where lasso selection is unstable.** Answer: two nearly identical sensors: tiny sampling changes can swap which receives the nonzero coefficient.
8. **Can a final test set be used to choose lambda?** Answer: no; it becomes validation data and no longer supports an unbiased final claim.
9. **Why might a high-dimensional model need regularisation even with low training error?** Answer: many parameter settings interpolate training noise yet disagree sharply on new rows; penalty restricts variance.

Regularisation earns trust only when combined with an honest selection protocol, a domain-aware complexity story, and a final decision metric.
