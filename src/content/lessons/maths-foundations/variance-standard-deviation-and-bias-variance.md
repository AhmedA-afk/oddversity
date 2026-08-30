---
title: "Variance, standard deviation, and bias–variance language"
track: "maths-foundations"
status: live
summary: "Variance is expected squared distance from the mean, Var(X)=E(X−μ)²; standard deviation is its square root in the original units."
duration: "5 min read"
---

## The short answer

Variance is expected squared distance from the mean, `Var(X)=E[(X−μ)²]`; standard deviation is its square root in the original units. Variance describes random spread, not systematic error. In ML, “bias–variance” can mean estimator bias versus estimator variance, or a prediction-error decomposition; name the random quantity and the source of randomness before using the phrase.

## Why this matters

Two models with the same average loss can differ in repeatability. Squaring makes
large deviations count more and gives a useful algebraic identity, but it also
makes variance sensitive to outliers. ML discussions often call a model “high
variance” when its estimates change across samples; that is not the same as a
model whose predictions have a wide natural distribution.

## How it works

Let `μ=E[X]`. Expand the square:

`Var(X)=E[X²−2μX+μ²]=E[X²]−2μE[X]+μ²=E[X²]−μ²`.

The middle equality uses `E[X]=μ`. Standard deviation is
`σ=√Var(X)`, so it has the same units as `X`. Adding a constant does not change
variance; scaling by `a` multiplies it by `a²`:
`Var(aX+b)=a²Var(X)`.

For an estimator `T` of a fixed parameter `θ`, bias is `E[T]−θ` and estimator
variance is `Var(T)`. These depend on repeated datasets or training randomness.
They should not be silently substituted for the distributional variance of a
target variable.

**Assumption check:** variance requires a finite second moment. The denominator
used for a population variance and for an estimator from a sample answers
different questions, so name it. Bias is defined relative to a fixed target
parameter; it is not a synonym for every observed error.

### Numerical and visual perspective

Plot observations with a vertical line at the mean and show squared distances;
then compare standard deviation bars in original units. A mean/variance pair
does not identify the shape: a symmetric distribution and a rare-outlier mixture
can share summaries differently from their operational risk.

### An illustrative story

A team reduced the average error but made retraining outcomes swing widely from
seed to seed. Calling this simply “bias improved” would miss estimator variance.
The story is illustrative; repeated fits are the evidence needed.

## Worked examples and variations

### Example A: fair die variance

**Input:** `X∈{1,…,6}` uniformly, `μ=3.5`. **Mechanism:**
`E[X²]=(1+4+9+16+25+36)/6=91/6`, so `Var(X)=91/6−12.25=35/12≈2.917`.
**Output:** `SD≈1.708` rolls. **Inspect:** the square converts deviations into
non-negative contributions. **Decision:** use the SD to describe ordinary roll
spread, not a tail guarantee.

### Example B: constant output

**Input:** every request has predicted latency 100 ms. **Mechanism:** every
deviation from `μ=100` is zero. **Output:** variance and SD are zero.
**Inspect:** zero variability can mean a constant system, not a correct one.
**Decision:** compare the mean with observed latency and validate the measurement.

### Example C: one outlier

**Input:** values `[1,1,1,1,11]`. **Mechanism:** the 11 contributes a squared
deviation much larger than the four ordinary values. **Output:** variance is
large relative to the central cluster. **Inspect:** plot the points and check
whether the outlier is an error, a rare real event, or a separate regime.
**Decision:** do not delete it merely to improve a summary.

### Boundary case: units and scaling

**Input:** latency in seconds with variance `0.04 s²`. **Mechanism:** converting
to milliseconds multiplies values by 1,000 and variance by `1,000²`.
**Output:** `40,000 ms²`, while SD changes from `0.2 s` to `200 ms`.
**Inspect:** variance units are squared. **Decision:** compare SDs in a common
unit; do not compare raw variances across unit systems.

### Counterexample: bias and variance are not synonyms

**Input:** estimator A is always `8` for true `θ=10`; estimator B is `6` half
the time and `14` half the time. **Mechanism:** A has bias `-2` and zero
variance; B has zero bias and variance `16`. **Output:** different error
profiles despite the same mean of B being correct. **Inspect:** repeat across
datasets rather than judging from one fit. **Decision:** report both systematic
offset and repeatability.

## Two ways to see it

### Builder view

Compute `E[X²]−E[X]²` and `E[(X−μ)²]` as independent checks. Plot the data and
state whether repeated rows, random seeds, or natural outcomes supply the
replicates.

### ML systems view

Ask “variance of what?”—labels, predictions across users, parameters across
datasets, or metrics across seeds. Each supports a different intervention.

## Hands-on

Implement variance two ways for `[1,1,1,1,11]`, calculate SD in two unit systems,
and simulate 20 repeated estimates for the A/B estimators above. Plot the
estimate distribution and mark the true parameter.

**Deliberate failure:** divide the sum of squared deviations by `n-1` while
labeling the result as the finite-population variance, then compare it with the
population definition. **Test:** require the chosen denominator to be named and
expect `Var([1,1,1,1,11])=16` for the population formula. **Reset:** restore the
denominator and label any sample estimator separately. **No-code route:** draw
the mean and square each distance by hand.

## Checkpoint

- [ ] Derive `Var(X)=E[X²]−E[X]²`.
- [ ] Explain why SD, not variance, has the original units.
- [ ] Distinguish natural outcome spread from estimator variance.
- [ ] Give a case where low variance is not evidence of accuracy.

## What this does not solve

Variance is not a full description of a distribution, a fairness measure, or a
tail guarantee. It can be unstable with outliers and uninformative about skew.
The bias–variance language also does not choose the right business loss or
sampling design; covariance describes how two quantities move together.

## Continue, go deeper, apply it

- Continue: Covariance, correlation, and confounding warnings
- Go deeper: Regularization and bias–variance
- Apply it: Mathematics Foundations assignments
