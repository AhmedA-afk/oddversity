---
title: "Units, scales, normalisation, and dimensionless quantities"
track: "maths-foundations"
status: live
summary: "Units describe what a number measures; scale describes its numerical size."
duration: "5 min read"
---

## The short answer

Units describe what a number measures; scale describes its numerical size; a
normalisation rule changes representation so a comparison or optimisation is
better behaved. Use dimensional analysis to reject incompatible arithmetic, fit
normalisation parameters on training data only, and treat zero variance,
negative log inputs, and outliers as explicit cases—not as reasons to add an
arbitrary constant and move on.

## Why this matters

A model can combine age in years, income in rupees, and a distance in metres,
but the raw magnitudes can make one feature dominate a dot product or a gradient.
Changing units can change coefficients without changing the underlying signal.
Worse, a scaler fitted on validation or production data can leak information
back into training and make the reported evaluation optimistic.

Units and scales are therefore part of the feature contract. They affect feature
engineering, model interpretation, numerical conditioning, and the meaning of a
coefficient.

## How it works

Only quantities with compatible dimensions may be added or compared. Multiplying
and dividing combines dimensions: distance divided by time is speed. A common
training transformation is standardisation:

```text
z = (x - μ_train) / s_train
```

The numerator and denominator have the same unit, so `z` is dimensionless. The
mean `μ_train` and scale `s_train` are learned from the training split and then
reused unchanged. If `s_train=0`, the feature has no observed variation and the
formula is undefined; this is a data decision, not a numerical nuisance.

Min–max scaling, `(x-min)/(max-min)`, is also dimensionless but is sensitive to
extreme values. A logarithm can compress positive multiplicative scales, but
`log(x)` requires a positive argument unless a domain-specific shift is justified.

## Worked examples and variations

### Example A: dimensional analysis of a derived feature

**Illustrative.** **Input:** distance `120 km` and time `2 h`. **Mechanism:** divide compatible
quantities: `120 km / 2 h = 60 km/h`. **Output:** a speed, not a distance.
**Inspect:** adding `120 km + 2 h` would have no physical meaning.
**Decision:** keep the unit in the feature name or schema so a later transform
does not silently treat the number as unitless.

### Example B: standardising two differently scaled features

**Illustrative.** **Input:** a feature with values `[10, 20, 30]` and a second with values
`[1000, 2000, 3000]`. **Mechanism:** each feature gets its own training mean and
standard deviation, so both become centred dimensionless values with comparable
spread. **Output:** the second feature is not “more important” merely because
its raw unit is larger. **Inspect:** store `(μ, s)` per column. **Decision:** reuse
those stored values at validation and serving time.

### Example C: ratios remove a shared scale

**Illustrative.** **Input:** clicks and impressions, `(40, 1000)`. **Mechanism:** conversion rate
`40/1000 = 0.04`, a dimensionless ratio. **Output:** `4%`. **Inspect:** the
denominator defines the population; `40/100` would answer a different question.
**Decision:** report the denominator and not only the percentage.

### Boundary case: constant and non-positive features

**Illustrative.** **Input:** a column `[7, 7, 7]` and another column containing `0` or negative
values. **Mechanism:** the first has `s=0`, while `log` is undefined for the
second at non-positive entries. **Output:** no valid standardised or raw-log
representation under those formulas. **Inspect:** a tiny epsilon can prevent a
crash but can also fabricate a huge, arbitrary feature. **Decision:** drop or
mark the constant column, and choose an explicitly documented transform for the
non-positive column.

### Counterexample: min–max scaling hides an outlier problem

**Illustrative.** **Input:** ordinary values `[10, 20, 30]` plus an outlier `10000`.
**Mechanism:** min–max scaling maps the outlier to `1` and compresses the first
three values near `0`. **Output:** a bounded feature whose ordinary cases are
hard to distinguish. **Inspect:** compare quantiles or a histogram before and
after scaling. **Decision:** investigate the outlier and consider a robust or
log transform only when its semantics support that choice.

## Two ways to see it

### Builder view

Write a feature ledger with column name, unit, valid domain, training summary,
transform, and inverse interpretation. That ledger becomes a testable contract
between data preparation, training, and inference.

### Model and reviewer view

Normalisation changes coordinates, not information. It can improve numerical
behaviour while preserving an ordering, or it can destroy interpretability and
amplify outliers. Ask what is fitted, on which split, and whether the transformed
quantity still answers the product question.

## Hands-on

Build a three-column feature fixture with `age_years`, `income_rupees`, and
`orders`. Fit a standardiser on the first two rows only, record the means and
scales, then transform the held-out row with those same parameters. Include a
column ledger that states the unit and valid domain.

**Failure fixture:** make `orders=[2, 2, 2]` so its training scale is zero, and
fit the scaler after appending the held-out row. **Test:** the implementation
must raise a named constant-feature error and must show that the held-out row
did not participate in fitting the other columns. A check such as
`fit_row_ids == {0, 1}` is sufficient. **Reset:** replace the constant fixture
with `[1, 2, 3]`, fit only on rows `{0, 1}`, and rerun the stored-parameter and
no-leakage assertions.

## Checkpoint

- [ ] Decide whether `5 m + 2 s` is meaningful and explain why.
- [ ] Compute the standardised value for `x=14` when `μ=10` and `s=2`.
- [ ] State why a scaler fitted on all rows can leak evaluation information.
- [ ] Choose a defensible response to a zero-variance feature and record the reason.

## What this does not solve

Equalised numerical scales do not remove bias, missingness, confounding, or
outliers. Normalisation also does not guarantee faster training for every model;
tree-based methods, domain-specific units, and interpretability requirements can
change the decision. Keep the raw meaning available for review.

## Continue, go deeper, apply it

- Continue: Floating-point arithmetic and computational notation
- Go deeper: Ratios, percentages, and numerical sanity checks
- Apply it: Features, leakage, and missingness
