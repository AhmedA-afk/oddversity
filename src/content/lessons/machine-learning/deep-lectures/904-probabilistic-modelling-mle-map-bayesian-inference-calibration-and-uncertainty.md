---
title: "Deep lecture: Probabilistic modelling, MLE/MAP/Bayesian inference, calibration, and uncertainty"
track: "machine-learning"
order: 904
status: live
summary: "Connect likelihood, priors, posterior prediction, calibration, and uncertainty to decisions that must acknowledge what a model does not know."
duration: "115 min lecture + 4 hr lab"
updated: "2026-08-30"
---

# Probabilistic modelling: uncertainty is a prediction product, not a disclaimer

Many systems emit a number between zero and one, then call it a probability. That number becomes useful only when it is tied to an event, horizon, population, conditioning information, and validation procedure. A churn score is not “the chance the customer leaves” unless the event is specified—perhaps cancellation in the next 30 days conditional on being active today—and its calibration has been tested on a comparable future population. Probabilistic modelling supplies a language for making those commitments.

A model specifies `p(y | x, theta)`, a distribution for outputs given inputs and parameters. Likelihood treats observed data as a function of `theta`: `p(D | theta)=product_i p(y_i | x_i,theta)`. Maximum likelihood estimation (MLE) chooses `theta_hat=argmax p(D|theta)`. Bayes’ rule instead combines a prior `p(theta)` and likelihood:

```text
p(theta | D) = p(D | theta)p(theta) / p(D),
p(y_* | x_*,D) = integral p(y_* | x_*,theta)p(theta | D)dtheta.
```

The posterior predictive integrates parameter uncertainty rather than pretending the fitted parameter is known. MAP estimation maximises `log p(D|theta)+log p(theta)`, a compromise useful when a full posterior is impractical. A prior is not an optional moral opinion; it encodes scale, regularity, sparsity, and plausible parameter values. Its influence is strongest where data are scarce, precisely where unexamined defaults are most dangerous.

## Likelihood, loss, and regularisation

For a Bernoulli event with probability `p`, observing `y` has likelihood `p^y(1-p)^(1-y)`. For `n` independent observations with common rate `p`, the log likelihood is `k log p+(n-k)log(1-p)`, where `k=sum y_i`. Differentiation gives the MLE `p_hat=k/n`. Negative log likelihood is cross entropy. Thus fitting a classifier by log loss is not a technical ritual: it rewards honest probabilities and heavily penalises confident false predictions.

A Gaussian prior `theta ~ Normal(0,tau^2 I)` adds `-||theta||^2/(2tau^2)` to log posterior. For Gaussian-noise linear regression, maximising this posterior is ridge regression. A Laplace prior adds an absolute-value penalty and yields lasso-like MAP estimation. Calling the latter “feature selection” can conceal its instability under correlated features: it often selects one of several exchangeable measurements without establishing that the others are irrelevant.

### Worked example 1: MLE versus a Beta posterior

An onboarding experiment observes 1 conversion in 2 eligible visits. MLE is `p_hat=.5`. With a `Beta(1,1)` prior, posterior is `Beta(2,2)` and posterior mean is `.5`; here the uniform prior changes little. With historical knowledge represented as `Beta(20,80)` (mean `.2`), the posterior becomes `Beta(21,81)` with mean `.2059`. This is not “ignoring the two visits”; it acknowledges that two trials should not overturn a stable base rate. Report the prior and conduct a sensitivity analysis using weaker and stronger prior effective sample sizes.

### Worked example 2: posterior probability of beating a target

In a small treatment cell, 8 of 20 customers renew. With `Beta(1,1)`, posterior is `Beta(9,13)`. The posterior mean is `9/22=.409`. A decision may ask `P(p>.35 | D)`, not merely whether `.409>.35`. It can be computed from the Beta CDF or Monte Carlo draws. If 10,000 posterior samples exceed `.35` 7,800 times, estimate is `.78`. Whether `.78` warrants rollout depends on the cost of a bad launch, the opportunity cost of waiting, and external validity—not an arbitrary `.95` convention.

### Worked example 3: predictive variance has two pieces

For a Bayesian linear model with posterior `theta | D ~ Normal(m,S)` and observation noise `sigma^2`, prediction at feature vector `x_*` has mean `x_*^T m` and variance

```text
Var(y_* | x_*,D) = sigma^2 + x_*^T S x_*.
```

Suppose noise variance is `4`, and `x_*^T S x_*=9`. Predictive variance is `13`, standard deviation `3.606`. The first term is irreducible outcome noise (aleatoric); the second is uncertainty about parameters (epistemic). Collecting more representative data can reduce the second, not necessarily the first. A model that reports only residual standard deviation misses the danger of extrapolating to sparse regions.

### Worked example 4: calibration versus discrimination

Two models score 100 cases. Model A assigns `.9` to 10 cases, 9 of which are positive, and `.1` to 90 cases, 9 positive: it is calibrated in each bin. Model B ranks all 18 positives above all negatives (perfect AUC) but assigns every positive `.99` and every negative `.01`; if the top score group contains 18/18 positives, its `.99` claim is slightly overconfident, though ranking is perfect. Conversely, a perfectly calibrated constant predictor at prevalence `.18` has no ranking value. Measure calibration and discrimination separately.

## Calibration is an empirical contract

Calibration asks whether among predictions near `q`, the event occurs about fraction `q`. Reliability diagrams bin scores and compare mean prediction with observed frequency, but bins can hide small-sample variance and subgroup failures. Brier score `mean((p-y)^2)` rewards probabilities, while log loss responds sharply to disastrous confidence. Neither tells you whether the selected action threshold is profitable.

Post-hoc calibration must be fit on data untouched by base-model training and hyperparameter selection. Platt scaling fits a logistic mapping from scores to probabilities; isotonic regression fits a nondecreasing flexible map. Platt can be too rigid; isotonic can overfit small calibration sets. For multiclass predictions, check classwise and top-label calibration. For rare events, use enough calibration examples in the high-score region rather than declaring success from a smooth global plot.

```text
calibrate_and_decide(train, calibration, test, costs):
    base <- fit_model(train.X, train.y)
    raw_cal <- base.score(calibration.X)
    mapper <- fit_isotonic_or_platt(raw_cal, calibration.y)
    p_test <- mapper(base.score(test.X))
    assert all(0 <= p_test <= 1)
    threshold <- choose_threshold_from_expected_utility(p_test, costs,
                                                        capacity=costs.capacity)
    return p_test, threshold, calibration_report(p_test, test.y)
```

Do not fit the mapper and celebrate its curve on the same cases. When data are temporal, calibration data must be later than model-training data but earlier than final evaluation. Recalibration is often appropriate under prior-probability shift; it does not repair a model whose conditional relationships have changed.

## Approximate Bayesian inference without mysticism

Exact posterior integration is rare in modern models. Laplace approximation fits a Gaussian around a MAP solution using the inverse Hessian. Variational inference chooses a tractable distribution `q(theta)` and minimises `KL(q || p(theta|D))`, often producing fast but underdispersed uncertainty. Markov chain Monte Carlo generates dependent draws whose diagnostics—effective sample size, trace mixing, divergences—must be checked. Ensembles, bootstrap refits, and conformal prediction can supply useful predictive uncertainty under different assumptions. They are not interchangeable certificates.

Conformal prediction constructs sets or intervals with finite-sample marginal coverage under exchangeability. If a 90% interval method covers 90% overall but misses nearly all rare high-value customers, the aggregate guarantee may be insufficient. Distribution shift, selective labels, and repeated model adaptation violate simple exchangeability assumptions; state those limitations in the decision document.

## Real-world decision context: medical follow-up is not binary classification

Imagine a system that estimates a patient’s risk of non-attendance so staff can offer transport support. A score should not trigger punitive cancellation. The target label is shaped by access barriers and scheduling practice; missing appointments do not reveal willingness. The operational decision trades scarce outreach capacity against missed care. Report risk intervals or abstention conditions for unfamiliar clinics, calibrate by clinic and language where sample size permits, and route low-confidence cases to a human process. If a model is trained on historical outreach outcomes, selection bias is central: people who received help are not a random sample.

## Debugging workshop: uncertainty theatre

1. **Confidence from leakage.** A post-event note makes probabilities extreme and apparently calibrated. Enforce a feature timestamp contract and rerun calibration after removing future fields.
2. **Calibration fitted on test.** A beautiful reliability curve is invalid if its labels trained the calibrator. Preserve a final temporal test and record all reuse.
3. **Interval inversion.** A narrow confidence interval around a biased estimator is not safety. Check residual structure, coverage by slice, and whether the new population is represented.
4. **Base-rate drift.** A classifier trained at 1% prevalence may output probabilities around 1% when production prevalence becomes 4%. Compare observed and predicted prevalence weekly; recalibrate only after verifying label delays and shift type.

## Code exercise: posterior simulation and calibration audit

Write a small NumPy program that samples 50,000 values from `Beta(alpha+k,beta+n-k)` using a supplied Beta sampler or library, estimates `P(p > target)`, and reports a 90% credible interval using quantiles. Then implement Brier score and equal-frequency reliability bins from scratch. On a held-out dataset, compare raw scores, Platt-scaled scores, and isotonic scores. Include a test that raises an error if any calibration training row appears in the final test index. Explain which method you would deploy and why its apparent improvement might fail next quarter.

## Assignment: probability system dossier

**Part A — model statement (15 points).** Specify event, horizon, population, conditioning variables, labels, and data-generation limitations. State a prior for at least one interpretable parameter and justify its scale.

**Part B — derivations and calculations (25 points).** Derive Bernoulli MLE, Beta posterior update, MAP objective for Gaussian-prior logistic regression, and posterior predictive variance for a linear model. Solve three numeric cases, including a prior sensitivity comparison.

**Part C — empirical probability audit (20 points).** Use chronological train/calibration/test partitions. Report log loss, Brier score, reliability curves with bin counts, calibration slope/intercept, and meaningful slices with uncertainty.

**Part D — implementation (20 points).** Submit posterior-simulation code, calibration code or a documented library pipeline, index-leakage tests, deterministic seeds, and a reproducible environment file.

**Part E — decision policy (20 points).** Define utility, capacity, abstention/escalation conditions, monitoring for drift, and a safe response to missing or delayed labels. Include a plain-language explanation of uncertainty for operations staff.

| Rubric criterion | Full-credit evidence |
| --- | --- |
| Probability semantics | Event, horizon, and conditioning are unambiguous; scores are not overclaimed. |
| Mathematical rigour | Likelihood, prior, posterior, and predictive quantities are derived and calculated correctly. |
| Validation discipline | Calibration is separated from training and final evaluation; slices have caveats. |
| Technical quality | Code is reproducible and detects overlap, invalid probabilities, and empty bins. |
| Decision judgement | The action respects capacity, uncertainty, harms, and a documented fallback. |

The output of a probabilistic model is a commitment to a measurable frequency or predictive distribution. Treat that commitment as a product interface, test it under the conditions in which it will be used, and refuse to turn its uncertainty into false certainty.
