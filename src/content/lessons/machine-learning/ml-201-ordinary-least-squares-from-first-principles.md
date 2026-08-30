---
title: "Ordinary least squares from first principles"
track: "machine-learning"
order: 201
status: live
summary: "Derive, fit, and interrogate least-squares regression rather than treating it as a library call."
duration: "22 min read"
updated: "2026-08-30"
---

## The short answer

Ordinary least squares (OLS) chooses the linear prediction whose residuals have the smallest total squared size. For a design matrix $X$ and target $y$, it solves $\min_\beta \|y-X\beta\|_2^2$. Squaring makes large misses costly and turns the geometric problem into a tractable optimization problem.

## Why this matters

Linear regression is the baseline for pricing, forecasting, policy analysis, and model debugging. Its coefficients are useful only when you know what data representation, loss, and assumptions produced them. OLS also supplies the vocabulary behind regularization, gradients, projection, and uncertainty estimates.

## How it works

Add an intercept column of ones to $X$. Differentiating the squared-error objective gives the normal equations $X^TX\hat\beta=X^Ty$. If columns are linearly independent, the solution is $\hat\beta=(X^TX)^{-1}X^Ty$. In production, do not explicitly invert a matrix: QR, SVD, or a stable library solver is safer. The fitted vector is the orthogonal projection of $y$ onto the column space of $X$, so residuals are perpendicular to every included feature.

## Worked examples and variations

1. A one-feature house-price model estimates a price slope in dollars per extra square metre, conditional on the chosen feature set.
2. Adding neighbourhood indicators changes that slope because floor area is no longer standing in for location.
3. With two perfectly duplicate columns, there are infinitely many coefficient vectors with identical predictions: the inverse formula is unavailable.
4. A single ten-times-too-large invoice can dominate squared loss; its residual is squared, not merely counted.
5. Predicting a constant target gives zero residual for every row and makes many usual goodness-of-fit intuitions unhelpful.

## Two ways to see it

Algebraically, OLS solves equations that set each feature's residual correlation to zero. Geometrically, it drops a perpendicular from $y$ to the space spanned by the feature columns. Both views explain why irrelevant transformations of a dependent column can destabilize coefficients without changing predictions.

## Hands-on

Fit OLS to a small sales dataset with an intercept, then verify that `X.T @ residuals` is close to zero. Deliberately duplicate one numeric feature and attempt the normal-equation inverse; record the failure or unstable coefficients. Reset by removing the duplicate and compare QR/SVD predictions with the stable library fit.

## Checkpoint

Why can two OLS fits make the same predictions but report different coefficients? What property must the residual vector have after fitting?

## What this does not solve

Minimizing squared error does not make a relationship causal, protect against leakage, handle nonlinear structure automatically, or make an interval valid under arbitrary data collection.

## Continue, go deeper, apply it

Next study diagnostics, then ridge and lasso. Apply OLS as a transparent baseline before trying a complex demand, cost, or risk model.
