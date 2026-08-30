---
title: "Partial dependence, ICE, and ALE"
track: "machine-learning"
order: 313
status: live
summary: "PDP, ICE, and ALE visualize modeled associations, each with different behavior under heterogeneous effects and correlated features."
duration: "14 min read"
updated: "2026-08-30"
---

## The short answer

Partial dependence plots (PDPs) average a model’s predictions while varying one feature; individual conditional expectation (ICE) plots show that curve per row; accumulated local effects (ALE) aggregate local changes in regions supported by data. They describe a fitted model, not the causal effect of an intervention.

## Why this matters

Flexible models need diagnostic views beyond one global score. These plots can reveal implausible jumps, hidden interactions, constraint violations, and regions where a model is being asked to extrapolate.

## How it works

PDP replaces a feature with grid values across all rows and averages predictions. ICE keeps each row separate, exposing heterogeneous effects. PDP can create unrealistic feature combinations when predictors are correlated. ALE instead computes local prediction changes over feature intervals using observations already in those intervals, reducing extrapolation pressure; it is centered and its vertical offset is relative.

## Worked examples and variations

1. **Price model:** PDP may show higher predicted price with more floor area on average.
2. **Customer tenure:** ICE can reveal that tenure helps retained customers differently by acquisition channel.
3. **Distance and travel time:** ALE is safer than PDP when these correlated variables would otherwise be paired unrealistically.
4. **Boundary case:** sparse extreme ranges should show rug marks or sample counts, not a smooth line presented as certainty.
5. **Counterexample:** “raising income causes lower default” does not follow from a PDP; income is entangled with many unmodeled factors.

## Two ways to see it

**Visualization view:** these are controlled probes of a model’s response surface.

**Support view:** a trustworthy probe must respect which input combinations exist in the data.

## Hands-on

Train a boosted model with two correlated features. Produce PDP, ICE, and ALE for each; overlay observed density and segment ICE curves by a relevant group. Deliberately generate PDP values far outside the data support, flag the implausible combinations, then reset to ALE and restricted grids.

## Checkpoint

- [ ] Plots name the model, data slice, feature range, and support density.
- [ ] ICE is used when an average can hide opposite individual patterns.
- [ ] Interpretation language says “model association,” not causal effect.

## What this does not solve

These tools cannot establish fairness, causal impact, or correctness of features and labels.

## Continue, go deeper, apply it

Pair response curves with permutation checks, error slices, and domain review.
