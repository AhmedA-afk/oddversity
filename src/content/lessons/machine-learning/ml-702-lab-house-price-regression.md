---
title: "Lab: house-price regression"
track: "machine-learning"
order: 702
status: live
summary: "Build, audit, and communicate a regression estimate without treating it as an appraisal."
duration: "90 min lab"
updated: "2026-08-30"
---

## The short answer

Build a time-aware regression baseline, compare linear and tree-based models, inspect residuals by neighborhood and price band, and publish prediction intervals or abstentions where the data cannot support a confident estimate.

## Why this matters

Regression can look excellent on average while failing exactly where decisions are expensive: rare homes, changing markets, or sparsely observed neighborhoods. Price is also a sensitive proxy for local conditions, so an estimate must be framed as decision support.

## How it works

Choose a historical sales dataset with sale date, property attributes, and locality. Split by time: train on earlier sales, validate on later sales, and reserve the newest period for test. Establish a median-price baseline, then a regularized linear model and a gradient-boosted/tree ensemble. Evaluate MAE and median absolute error overall and in slices. Plot residuals against predicted price and sale date; investigate, do not silently delete, extreme errors.

## Worked examples and variations (4 examples incl. boundary/counterexample)

1. A median baseline is useful when bedrooms and floor area are missing.
2. Log-transforming a right-skewed price target can stabilize relative error, but report errors back in currency.
3. A neighborhood feature may improve fit while becoming stale after rezoning; check time drift.
4. Boundary case: a unique mansion has no comparable training examples; return a wide range or abstain rather than a precise-looking number.

## Two ways to see it

For an analyst, this is comparable-sales assistance. For a statistician, it is conditional expectation estimation under covariate shift and heteroscedastic noise.

## Hands-on

Deliver a reproducible notebook or script with a time split, data dictionary, baseline, two models, a metrics table, and three residual plots. Create a table of the ten largest absolute errors with feature values and plausible data-quality hypotheses. Intentionally fail by using the final sale price derived field or a post-sale tax assessment as a feature; demonstrate the inflated validation score, remove it, and rerun. Reset with only attributes knowable before valuation. Write a one-paragraph deployment constraint: no automated lending or purchase decision.

## Checkpoint

You can explain why random splitting may overstate future performance and can name a slice where your model should abstain or request appraisal review.

## What this does not solve

This lab does not provide a licensed appraisal, capture every local market shock, or establish causal effects of renovations.

## Continue, go deeper, apply it

Add conformal intervals, geospatial validation blocks, and a monitoring report comparing new listing features with the training distribution.
