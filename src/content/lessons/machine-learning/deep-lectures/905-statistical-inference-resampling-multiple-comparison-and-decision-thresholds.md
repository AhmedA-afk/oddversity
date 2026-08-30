---
title: "Deep lecture: Statistical inference, resampling, multiple comparison, and decision thresholds"
track: "machine-learning"
order: 905
status: live
summary: "Quantify uncertainty in model comparisons, control false discoveries, and turn evidence into threshold policies with explicit costs."
duration: "105 min lecture + 4 hr lab"
updated: "2026-08-30"
---

# Statistical inference for machine learning: evidence is more than a leaderboard gap

An evaluation table with three decimal places often creates a dangerous illusion: that a model is known to be better, a feature is known to matter, or a threshold is known to be optimal. In reality, metrics are estimates from a finite, often dependent sample; model development has usually involved many hidden comparisons; and the value of an action depends on errors, capacity, and changing prevalence. Statistical inference makes the uncertainty visible. It does not turn every product decision into a ritual of null-hypothesis testing.

Let `T(D)` be a statistic such as AUC, mean absolute error, uplift, or calibration slope. We care about its sampling distribution: how `T` would vary if the data-generating process produced another valid dataset. Standard errors quantify spread under assumptions; confidence intervals describe a procedure’s long-run coverage; p-values measure compatibility with a null model, not the probability that the null is true. A useful ML report combines estimates, uncertainty, practical effect size, diagnostics, and a decision threshold rooted in consequences.

## Sampling variation and paired comparisons

Suppose models A and B are evaluated on the same examples. Comparing their separate metric intervals can be wasteful because their errors are correlated. Instead define per-example loss difference `d_i=loss_A(i)-loss_B(i)`. Its mean `d_bar` estimates expected advantage of B over A. A paired bootstrap resamples *rows of paired predictions*, recomputes the metric difference, and takes percentile or bias-corrected intervals. For classification AUC, resample examples with labels and both score vectors together. For grouped data, resample groups; for time series, use blocks. Resampling independent rows from repeated customers or adjacent days fabricates precision.

### Worked example 1: a confidence interval for a mean loss difference

On 25 independent cases, A’s loss minus B’s loss has mean `.012` and sample standard deviation `.030`. The estimated standard error is `.030/sqrt(25)=.006`. A rough 95% interval is `.012 ± 2.064*.006`, or `[-.0004,.0244]` using a `t` multiplier with 24 degrees of freedom. The data are compatible with a small B advantage, no advantage, or a moderately useful advantage. It would be misleading to announce B is better solely because `.012` is positive. If B is 10 times more expensive, the decision is clearer in the other direction.

### Worked example 2: bootstrap a quantile rather than pretending normality

Delivery operations care about 90th-percentile absolute error. On 200 orders, compute the observed 90th percentile. Repeat 2,000 times: sample 200 orders with replacement, recompute the percentile, and save it. If the 2.5th and 97.5th percentile of saved values are 8.2 and 11.7 minutes, report `P90 error=9.8 minutes (bootstrap 95% interval 8.2–11.7)`. This interval is often asymmetric because a quantile is not a smooth mean. It also assumes the resampled orders represent future operations; a holiday shift invalidates that premise.

### Worked example 3: why 20 feature tests create discoveries by chance

At significance level `.05`, test 20 truly null features independently. The expected number of false positives is `20*.05=1`. Probability of at least one is `1-(.95)^20=.642`. Choosing only the “significant” feature and describing it as discovered is selection bias. Bonferroni controls family-wise error by testing each at `.05/20=.0025`; it is conservative when tests are many or correlated. Benjamini–Hochberg controls false discovery rate (FDR), often appropriate for a screening stage where some false candidates can be validated later.

### Worked example 4: Benjamini–Hochberg calculation

Five p-values sorted are `.003,.014,.022,.041,.20`; set target FDR `q=.05`. Compare p-value `p_(i)` to `(i/5)q`: thresholds are `.01,.02,.03,.04,.05`. The first three pass; `.041` fails `.04`, so reject the first three hypotheses. This controls expected false-discovery proportion under stated dependence conditions; it does not establish effect size, causality, or deployability. If the p-values arose after trying 30 pipelines and selecting the prettiest five, the input to the procedure is already compromised.

## Permutation tests and resampling design

A permutation test creates a null distribution by rearranging labels or treatment assignments in a manner valid under the null. If labels are exchangeable with respect to a model-score difference, permute labels, recompute the difference, and count how often simulated differences are at least as extreme. For an A/B test randomised by household, permute assignment by household, not individual event. For time-dependent labels, unrestricted permutation destroys temporal structure; use a pre-specified alternative such as block permutation only when its null is defensible.

The bootstrap estimates sampling variation around the observed population; permutation tests a particular null. Both can fail with missing-not-at-random labels, adaptive data collection, data leakage, nonstationarity, or an ill-defined metric. Nested cross-validation estimates performance after hyperparameter selection: the outer folds evaluate the entire inner selection process. Repeatedly inspecting outer-fold results and changing the model invalidates its role as a final evaluator.

```text
paired_group_bootstrap(y, pred_a, pred_b, group, metric, B):
    unique_groups <- sorted(unique(group))
    observed <- metric(y, pred_b) - metric(y, pred_a)
    deltas <- []
    for seed in 1..B:
        sampled_groups <- sample_with_replacement(unique_groups,
                                                   size=len(unique_groups), seed=seed)
        idx <- concatenate(all rows belonging to each sampled group)
        deltas.append(metric(y[idx], pred_b[idx]) - metric(y[idx], pred_a[idx]))
    return observed, quantile(deltas, [.025, .5, .975])
```

If sampled groups repeat, repeat all their rows together. Add a test that verifies every original index appears only through its selected group and that prediction vectors align with labels. Store split identifiers so reviewers can reproduce a surprising interval.

## Decision thresholds are optimisation problems

For a calibrated probability `p`, binary action `a in {0,1}`, and utilities `U(a,y)`, choose action one when

```text
p U(1,1) + (1-p)U(1,0) > p U(0,1) + (1-p)U(0,0).
```

With benefit `B` for a true positive, cost `C` for a false positive, and zero utility for no action, treat when `p>B?` More exactly, `pB-(1-p)C>0`, so `p>C/(B+C)`. The formula breaks if utility depends on finite capacity, repeated exposure, fairness constraints, or treatment effects rather than risk. In those cases, optimise a constrained policy and test it prospectively.

### Worked example 5: threshold under asymmetric costs

An account-security intervention avoids an expected `$200` loss if an attack is real and costs `$8` in customer friction if it is not. Threshold is `8/(200+8)=.0385`. At `.5`, the system waits for almost certainty and ignores many expected-value-positive actions. If only 1,000 interventions per day are affordable, score threshold is endogenous: choose the top expected-value cases, then evaluate the queue’s realised outcomes and capacity spillover.

### Worked example 6: prevalence shift changes precision, not necessarily the model

At 90% sensitivity and 95% specificity, with 1% prevalence, positive predictive value is `.9*.01 / (.9*.01 + .05*.99)=.1538`. At 10% prevalence it becomes `.09/(.09+.045)=.6667`. The same sensitivity/specificity produces very different review yield. A team that promises “two-thirds of alerts are real” must tie the statement to a prevalence and sampling frame.

## Real-world decision context: model replacement for a credit collection queue

A team claims model B raises AUC from `.742` to `.751`. Before replacement, ask: were predictions paired on the same future accounts; how large is a bootstrap interval for net collections at the planned capacity; does B shift contacts toward legally sensitive or vulnerable groups; and did 50 feature variants precede this comparison? A `.009` AUC difference can be valuable for millions of accounts or irrelevant if it does not alter the top 5% queue. The decision memo should show the gain curve, expected value with uncertainty, complaint/fairness guardrails, and a holdout or phased rollout plan.

## Debugging workshop: common inferential traps

1. **Test-set gardening.** Repeatedly change features after looking at the final test. Remedy: create a new untouched test or run a prospective holdout; label the old result development feedback.
2. **Row bootstrap on a panel.** Thousands of transactions from 30 merchants look like precise independent evidence. Resample merchants or use a hierarchical/block method.
3. **Metric shopping.** Select the metric that favours the new model after seeing results. Pre-register the primary metric and report secondary ones transparently.
4. **Threshold by accuracy.** With rare positives, “never act” can have high accuracy. Use explicit utility, prevalence, capacity, and calibration.

## Code exercise: build an evaluation evidence harness

Implement a paired group bootstrap for a supplied binary dataset and predictions from two models. Compute AUC difference, log-loss difference, a gain-at-capacity difference, and 95% intervals. Implement Benjamini–Hochberg from scratch for a vector of p-values, including tests for unsorted inputs and ties. Finally, write `choose_threshold(probabilities, utilities, capacity)` and test it against the analytic threshold when capacity is unlimited. Your report must state assumptions that would make each result invalid.

## Assignment: evidence before rollout

**Part A — evaluation plan (15 points).** Define unit of resampling, primary and secondary metrics, selection protocol, final holdout, decision horizon, and the business question. Explain why rows are or are not exchangeable.

**Part B — computations (20 points).** Hand-calculate a paired mean-difference interval, a PPV under two prevalences, a cost-derived threshold, and a Benjamini–Hochberg rejection set. Show every intermediate quantity.

**Part C — resampling implementation (20 points).** Implement paired bootstrap or a justified alternative, with seeded reproducibility and tests for alignment/group integrity. Compare at least two models and report distributions, not just point metrics.

**Part D — multiplicity and selection audit (20 points).** Inventory every model, feature set, metric, and threshold considered. Apply an appropriate correction or explain a validation stage that protects against false discoveries. Separate exploratory from confirmatory claims.

**Part E — decision memo (25 points).** Recommend ship, hold, or experiment. Quantify practical benefit and uncertainty at operational capacity; define an online guardrail, stop condition, and how a harmed subgroup would be detected.

| Rubric criterion | Full-credit evidence |
| --- | --- |
| Inferential validity | Resampling unit and assumptions match the data-generating structure. |
| Calculation accuracy | Intervals, FDR procedure, Bayes-rule quantities, and utility threshold are correct. |
| Selection honesty | All adaptive choices are disclosed and the final test is protected. |
| Code quality | Harness is deterministic, tested, and reports failures rather than silently dropping cases. |
| Decision relevance | Recommendation is tied to effect size, uncertainty, capacity, and harms. |

Inference is successful when it changes the quality of a decision: it should prevent us from shipping noise, quantify a real improvement, and make the remaining uncertainty legible to the people who bear the outcome.
