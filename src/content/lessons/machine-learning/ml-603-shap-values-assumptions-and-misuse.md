---
title: "SHAP values: assumptions and misuse"
track: "machine-learning"
order: 603
status: live
summary: "Use Shapley-style attributions as a conditional or interventional accounting rule, not as a causal narrative or a guaranteed explanation of reality."
duration: "22 min read"
updated: "2026-08-30"
---

## The short answer

SHAP values allocate the difference between a model prediction and a baseline across features according to a Shapley-value rule. The allocation is exact only for the chosen model and background distribution; its meaning changes with how “missing” features are modeled.

## Why this matters

SHAP charts are persuasive because they are additive and visually precise. But correlated features, an unrepresentative background set, transformed variables, and probability versus log-odds scales can make an apparently simple story wrong.

## How it works

Choose the model output and baseline population explicitly. For each feature coalition, define the expected model output when unavailable features are marginalized. Interventional SHAP breaks feature dependence; conditional SHAP preserves an estimated dependence structure. Exact TreeSHAP is efficient for tree ensembles; sampling methods approximate the same accounting and need convergence checks. Report units, baseline, background data, and uncertainty from resampling.

## Worked examples and variations

1. A churn model’s prediction is above the average log-odds because recent support contacts and contract type contribute positively on the logit scale; this is not a percentage-point explanation.
2. Income and postcode are correlated. Interventional SHAP may attribute an implausible income-postcode combination; conditional SHAP reallocates association but depends on the conditional model.
3. A standardized age feature receives a negative SHAP value. Translate the transformed unit before telling a customer what it means.
4. A clinical model’s baseline comes from a healthy training cohort while the deployed ward is high acuity. Attributions can be mechanically correct yet anchored to the wrong reference population.
5. Counterexample: a feature with a positive SHAP value for a patient does not mean increasing that feature will increase risk; the model may encode a noncausal correlation.

## Two ways to see it

SHAP is cooperative-game accounting over model evaluations. It is also a choice of reference distribution: change what counts as an absent feature and you change the question being answered.

## Hands-on

For a tree model, generate SHAP values using two background samples: all training data and a recent production cohort. Compare local and global rankings. Deliberate failure: narrate each value as a causal intervention. Reset by labeling every chart “model attribution,” documenting the background set, and testing a counterfactual only within feasible feature constraints.

## Checkpoint

What output scale is being explained? What does a missing feature mean in your method? Which correlations make the allocation non-unique?

## What this does not solve

SHAP does not identify causes, supply recourse, guarantee stability, or protect private training records. It also cannot make a weak or invalid model trustworthy.

## Continue, go deeper, apply it

Study interaction SHAP, conditional-effect plots, and privacy-aware explanation delivery. Require versioned backgrounds and explanation regression tests in the release pipeline.
