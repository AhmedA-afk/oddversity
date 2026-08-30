---
title: "Problem Set 7: Evaluation, Statistical Inference, and Experiments"
track: "machine-learning"
order: 827
status: live
summary: "Design valid evaluations, calculate uncertainty, and separate evidence from noise."
duration: "100–130 min"
updated: "2026-08-30"
---

## Questions

1. A binary classifier has TP=72, FP=18, FN=8, TN=902. Compute precision, recall, specificity, and F1.
2. In an A/B test, A has 48 conversions out of 800; B has 64 out of 800. Compute the observed absolute lift and an approximate standard error for the difference using (\sqrt{p_A(1-p_A)/n_A+p_B(1-p_B)/n_B}).
3. Construct an approximate 95% Wald interval for the difference in question 2. State one reason not to treat it as the final word.
4. A model is evaluated after random row splitting, but ten rows may belong to each customer. Identify the likely leakage and specify a better split.
5. Explain why repeated test-set peeking can invalidate a p-value even if each individual test uses a 0.05 threshold.
6. A clinical triage team reports ROC-AUC 0.91, but its recall at the available nurse capacity is 0.30. Explain why AUC alone cannot approve deployment.
7. A team observes a 2% revenue increase after rollout. List four alternative explanations before crediting the model.
8. Debug: code computes confidence intervals across five cross-validation fold scores and calls this a confidence interval for population performance. What dependence/selection issues arise? Give a safer reporting alternative.

---

## Fully worked solutions

1. Precision (=72/90=.8); recall (=72/80=.9); specificity (=902/920\approx.9804); F1 (=2(.8)(.9)/1.7\approx.8471).
2. (p_A=.06,p_B=.08), lift (=.02). SE (=\sqrt{.06(.94)/800+.08(.92)/800}\approx\sqrt{.0001625}\approx.01275).
3. Approximate interval: (.02\pm1.96(.01275)\approx[-.0050,.0450]). It includes zero; the normal approximation may be rough, the metric may be one of many examined, and randomization/measurement assumptions matter.
4. Rows from one customer can put entity-specific patterns in both sets, producing optimistic results. Split by customer (and, for temporal claims, respect time order), then fit preprocessing only in each training partition.
5. The stopping/model-selection rule becomes data-dependent; the nominal null distribution no longer describes the reported minimum p-value. Pre-register a primary test or use appropriate multiplicity/holdout handling.
6. ROC-AUC averages ranking behaviour over thresholds, while capacity fixes an operating region. Deployment needs precision/recall, errors, calibration, benefits and harms at the actual threshold and relevant subgroups.
7. Seasonality, concurrent marketing/policy changes, measurement changes, and regression to the mean are plausible. Also investigate selection into treatment, outages, and delayed outcomes.
8. Fold scores share training data and are often used after tuning, so treating five values as IID sampling units is unjustified. Report outer nested-CV distribution with split protocol, or a single locked test evaluation plus uncertainty methodology justified for the data-generating unit.

## Grading rubric

30 points: metric and interval arithmetic; 25 points: splitting and inference validity; 25 points: decision-aware evaluation; 20 points: causal alternative explanations and reporting discipline.

## Common misconceptions

- Statistical nonsignificance is not evidence that effects are exactly zero.
- A random split is not valid when entities or time couple observations.
- AUC does not select a threshold or define acceptable harm.

## Extension problems

Write a one-page pre-analysis plan for the A/B test: unit, primary metric, guardrails, stopping rule, segmentation, and treatment of missing outcomes. Explain why each protects a different failure mode.
