---
title: "Generalized additive models"
track: "machine-learning"
order: 210
status: live
summary: "Capture smooth nonlinear effects while preserving a transparent contribution from each feature."
duration: "24 min read"
updated: "2026-08-30"
---

## The short answer

A generalized additive model (GAM) replaces straight feature effects with learned smooth functions: $g(E[Y|x])=\beta_0+f_1(x_1)+\cdots+f_p(x_p)$. It is a strong middle ground between a rigid GLM and an opaque flexible model.

## Why this matters

Risk, demand, and biological responses are often nonlinear, yet teams may need to inspect and govern how each input changes a prediction. GAM plots expose the learned shape directly.

## How it works

Represent each $f_j$ with basis functions such as splines, then penalize excessive wiggliness. Fit a link and response family as in a GLM. Select smoothness through validation or principled fitting, inspect support where data are sparse, and add carefully justified interactions when additive effects are inadequate. Extrapolation beyond observed values remains dangerous.

## Worked examples and variations

1. Credit risk may rise sharply at high utilization but flatten at lower utilization.
2. Electricity demand can have a U-shaped temperature response.
3. A categorical region effect can sit beside a smooth income effect.
4. If feature effects interact strongly, additive curves can conceal the key pattern.
5. A beautiful curve beyond the training range is a counterexample to interpretability: it is unsupported extrapolation.

## Two ways to see it

A GAM is linear in basis coefficients but nonlinear in raw inputs. Its plots are conditional model contributions, not automatically causal partial effects in the population.

## Hands-on

Fit a GAM and a straight-line GLM on a nonlinear target; compare held-out error and plot each smooth with data density. Intentionally increase basis flexibility until the curve chases noise. Reset with a smoothness penalty chosen in cross-validation and test performance in low-density regions.

## Checkpoint

Why can a GAM be nonlinear while remaining interpretable? When is an interaction necessary?

## What this does not solve

Additivity does not remove confounding, guarantee stable curves under correlated features, or validate unsupported extrapolation.

## Continue, go deeper, apply it

Use GAMs as interpretable challengers to boosting. Continue with survival outcomes when target observation itself is incomplete.
