---
title: "Deep lecture: Trees, random forests, and boosting—from split objective to deployment"
track: "machine-learning"
order: 903
status: live
summary: "Build tree objectives from first principles, compare bagging and boosting, and operate tabular models under changing data and asymmetric costs."
duration: "110 min lecture + 4 hr lab"
updated: "2026-08-30"
---

# Trees, random forests, and boosting: piecewise decisions with operational consequences

Tree ensembles dominate much of practical tabular machine learning because they turn mixed, nonlinear inputs into a sequence of simple conditional decisions. They are also easy to misuse. A tree can discover a useful threshold, memorise an identifier, produce overconfident scores, or encode a policy that no one has reviewed. The central question is therefore not “which ensemble has the highest validation score?” It is: *what partition, loss, uncertainty, and decision rule are we willing to defend when the population changes?*

A regression tree represents a function as regions of feature space. A split of node region `R` on feature `j` at threshold `t` creates `R_left={x in R: x_j <= t}` and `R_right={x in R: x_j > t}`. A leaf predicts a constant. Classification trees instead predict a class distribution. Greedy recursive splitting is computationally tractable, but it is not guaranteed to find the globally best tree. This distinction matters when someone interprets the first split as “the most important cause.” It is merely the locally best split under the available features, objective, and sample.

## Deriving split objectives

For squared-error regression, a node predicts its sample mean `mu_R`. Its within-node sum of squared errors is

```text
SSE(R) = sum_{i in R} (y_i - mu_R)^2.
gain(j,t) = SSE(R) - SSE(R_left) - SSE(R_right).
```

The mean minimises squared loss because differentiating `sum(y_i-c)^2` with respect to `c` gives `-2 sum(y_i-c)=0`, hence `c=mu_R`. For a two-class classifier with class-one probability `p`, common impurities are Gini `G(p)=2p(1-p)` and entropy `H(p)=-p log p-(1-p)log(1-p)`. A split is scored by parent impurity minus the weighted child impurities. Both are zero for pure nodes and highest near a 50/50 class mix. Entropy has an information-theoretic interpretation; Gini is cheaper and often yields similar partitions. Neither measures business value.

### Worked example 1: regression split gain by hand

At a node, feature values and outcomes are `(1,1),(2,2),(3,8),(4,9)`. The parent mean is `5`, so parent SSE is `(−4)^2+(−3)^2+3^2+4^2=50`. Split at `2.5`: left mean is `1.5`, left SSE is `.25+.25=.5`; right mean is `8.5`, right SSE is `.25+.25=.5`. Gain is `50-1=49`. A split at `1.5` has left SSE `0`; right mean `19/3=6.333`, right SSE approximately `40.667`; gain is `9.333`. The first threshold is far stronger on this sample. Notice that the threshold is selected after scanning many candidates; its apparent certainty is optimistic if evaluated on these same rows.

### Worked example 2: weighted Gini improvement

Suppose a parent has 10 examples, 4 positive and 6 negative. Its Gini is `2(.4)(.6)=.48`. A candidate creates a left child of 5 with 1 positive (`G=.32`) and a right child of 5 with 3 positives (`G=.48`). Weighted child impurity is `.5(.32)+.5(.48)=.40`; gain is `.08`. A second split creates 2 all-negative and 8 with 4 positive/4 negative (`G=.5`), weighted impurity `.4`; it ties in Gini gain. If the two splits differ in missingness, latency, protected-group impact, or stability across folds, those facts should decide the tie—not a random feature-order accident.

### Worked example 3: why a leaf probability needs smoothing

A fraud leaf contains 2 investigated transactions and both were fraud. The raw estimate is `2/2=1`. With a Beta(1,1) prior, the posterior mean is `(2+1)/(2+2)=.75`; with a parent-rate prior of strength 10 and parent rate `.08`, it is `(2+.8)/(2+10)=.233`. The second estimate may be more useful for a review queue because two labels are weak evidence. Minimum leaf sizes, Laplace smoothing, and calibration all address related overconfidence, but they are not substitutes for adequate data.

### Worked example 4: a cost-aware threshold after a forest

Suppose an intervention costs `$5`; a true save returns `$40`; an unnecessary intervention loses `$5`. Treat when `p*40-(1-p)*5 > 0`, so `45p>5`, or `p>0.111`. At the common `.5` threshold, the team would reject many profitable interventions. This calculation assumes calibrated probabilities, a stable response rate, and no capacity limit. With capacity for only 100 actions, rank by *incremental expected value*, then validate the policy in an experiment.

## From one unstable tree to a random forest

Individual deep trees have low bias and high variance: small changes to a training set can alter early splits and all later leaves. Bagging estimates `f_b(x)` on bootstrap samples and averages `B` predictors: `f_bar(x)=B^{-1}sum_b f_b(x)`. If individual prediction variance is `sigma^2` and pairwise correlation is `rho`, the variance of the average is approximately `rho sigma^2+(1-rho)sigma^2/B`. More trees reduce the second term; reducing correlation is just as important. Random forests sample a subset of features at each split to decorrelate trees. They do not need pruning to shallow stumps, but their leaf sizes, depth, feature sampling, class weighting, and split criteria remain consequential.

Out-of-bag (OOB) evaluation uses observations omitted from each bootstrap sample as quasi-validation predictions. It is valuable for diagnostics, but it does not replace an untouched temporal or grouped test set, and it must not tune policies against the same OOB metric indefinitely. Permutation importance measures score degradation after shuffling a feature. With correlated features, a useful feature can appear unimportant because its proxy remains; conditional or grouped permutations and ablation studies give a more faithful story.

## Boosting as sequential residual correction

Gradient boosting builds `F_M(x)=F_{M-1}(x)+eta h_M(x)` where `h_M` approximates the negative gradient of a chosen loss. For squared error, the negative gradient is the residual `y-F(x)`, so new shallow trees fit residuals. For logistic loss, pseudo-residuals depend on the current probabilities. The learning rate `eta`, tree complexity, number of rounds, subsampling, and regularisation jointly control fitting. “More rounds with a smaller learning rate” is not inherently safer; it still requires validation-based early stopping on an evaluation protocol that matches deployment.

For binary logistic loss, write score `F` and probability `p=sigma(F)`. For `y in {0,1}`, the derivative of negative log likelihood with respect to `F` is `p-y`. Thus the negative gradient is `y-p`: positives the model underpredicts receive positive residuals, false alarms receive negative residuals. A second-order implementation also uses curvature `p(1-p)`, which becomes tiny near 0 or 1; numerical safeguards and regularisation prevent an overconfident early mistake from dominating an update.

```text
fit_gradient_boosting(train, valid):
    score_train <- constant_that_minimises_loss(train.y)
    score_valid <- same_constant
    best <- infinity
    for round in 1..max_rounds:
        residual <- negative_gradient(train.y, score_train)
        tree <- fit_tree(train.X, residual, max_depth, min_leaf)
        step <- line_search_or_newton_leaf_values(tree, train)
        score_train <- score_train + learning_rate * predict(tree, train.X, step)
        score_valid <- score_valid + learning_rate * predict(tree, valid.X, step)
        if validation_loss(score_valid, valid.y) improves best:
            save model, calibration data, feature schema, round
        elif patience exhausted: break
    return best_saved_model
```

The `valid` set must be separated before target encoding, imputation statistics, feature selection, and threshold choice. In production, save the feature schema and the best iteration; refitting blindly for the configured maximum rounds is a subtle and common regression.

## Real-world decision context: prioritising account review

Consider an insurer triaging claims for manual review. A forest is attractive because it handles interactions among repair category, region, claim age, and missing documents. A boosted model may add lift. Yet neither predicts fraud itself: it predicts an historically observed label, which is influenced by prior reviewers, investigation capacity, and selective evidence. If past reviewers focused on one region, “not investigated” may mean “unobserved,” not “legitimate.” Evaluate separately by claim age and acquisition channel, review calibration within groups, and audit whether a high score causes a harmful delay. The model card should define an authorised use (ranking for review), prohibited uses (automatic denial), data freshness, fallback behaviour, owner, and rollback threshold.

## Debugging workshop: four failures that look like model skill

1. **Identifier splits.** A high-cardinality customer ID can produce near-pure leaves. Shuffle IDs or hold out future IDs; if lift disappears, ban the field. Hashing does not magically make an identifier causal.
2. **Leakage through aggregation.** “Number of claims in the next 30 days” produces dazzling validation results if computed across the split. Recompute every aggregate using only information available at scoring time.
3. **Misread importance.** A missingness flag may rank first because operations failed to collect a field for risky cases. This can be useful for prediction but needs a fairness and process review before policy use.
4. **Probability drift.** A fixed 0.2 threshold can flood a queue when prevalence changes. Monitor score distribution, calibration error, review yield, and capacity-adjusted utility—not only AUC.

## Code exercise: a split-search and ensemble audit

Implement `best_split(X_column, y, min_leaf)` without a tree library. Sort candidate thresholds once, maintain left/right class counts incrementally, and return weighted Gini gain plus child sizes. Then train a library forest and boosted model on a time-sorted binary dataset. Your notebook or script must: (a) show random-split versus temporal-split metrics; (b) produce reliability curves before and after a calibration split; (c) select a threshold from a written cost table; and (d) compare grouped permutation importance with one-feature ablations. Unit-test that no candidate leaves fewer than `min_leaf` rows and that a constant feature has zero gain.

## Assignment: build, audit, and release a tabular decision system

**Part A — objective and data contract (15 points).** Define the unit, label timestamp, prediction timestamp, intervention, harms, and a feature availability table. Identify three plausible leakages and one proxy-risk feature.

**Part B — calculations and derivation (20 points).** Derive the regression-tree SSE gain and weighted Gini gain. Hand-calculate each for a four-to-eight-row supplied dataset, explain a tie-breaking policy, and derive why bagging variance depends on correlation.

**Part C — experimental design (20 points).** Build a chronological or grouped split with a frozen final test. Tune a forest and a boosted model only inside training validation folds. Report uncertainty over at least five resamples and justify every metric.

**Part D — implementation and tests (20 points).** Submit split-search code, tests for constant columns and minimum leaves, reproducible training code, and a saved schema. Demonstrate that intentionally adding a future feature improves the invalid metric, then prove that your pipeline rejects it.

**Part E — decision and deployment memo (25 points).** Calibrate the selected model, choose a threshold using costs and capacity, report subgroup outcomes with uncertainty, propose monitoring/rollback rules, and state one decision the model must never automate.

| Rubric criterion | Full-credit evidence |
| --- | --- |
| Mathematical correctness | Objectives, gains, and variance reasoning are correct and notation is defined. |
| Experimental integrity | Splits respect time/group boundaries; no test-set tuning or feature leakage is present. |
| Engineering quality | Code is deterministic, tested, documented, and fails clearly on schema mismatch. |
| Decision quality | Threshold follows an explicit utility/capacity argument, not convention. |
| Responsible deployment | Limitations, slices, owner, monitoring, and rollback are concrete. |

A tree ensemble earns trust when its partition is reproducible, its probabilities are checked, and its action policy is accountable. Feature importance screenshots alone do none of those things.
