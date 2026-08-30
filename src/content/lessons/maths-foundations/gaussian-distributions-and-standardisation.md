---
title: "Gaussian distributions and standardisation"
track: "maths-foundations"
status: live
summary: "A Gaussian variable is described by a mean μ and standard deviation σ>0, with density proportional to exp(−(x−μ)²/(2σ²))."
duration: "5 min read"
---

## The short answer

A Gaussian variable is described by a mean `μ` and standard deviation `σ>0`, with density proportional to `exp(−(x−μ)²/(2σ²))`. Standardisation maps it to `Z=(X−μ)/σ`, whose mean is 0 and standard deviation is 1. Z-scores compare locations, but a Gaussian fit remains an assumption about shape and tails.

## Why this matters

Standardisation puts features with different units on a common scale and makes
tail thresholds interpretable. It does not make a skewed or heavy-tailed feature
Gaussian. In anomaly detection, a threshold such as “three standard deviations”
has a model-dependent false-alarm meaning; inspect the empirical distribution
before treating it as a probability.

## How it works

The Gaussian density is

`f(x)=1/(σ√(2π)) · exp(−(x−μ)²/(2σ²))`.

Set `Z=(X−μ)/σ`. Translation gives `E[Z]=0`; scaling gives
`Var(Z)=Var(X)/σ²=1`. The change-of-variable factor `1/σ` is what preserves
total area. If `X` is Gaussian, `Z` is standard normal, and tail probabilities
can be calculated from its CDF `Φ`:
`P(X≤x)=Φ((x−μ)/σ)`.

The familiar 68–95–99.7 description is an approximation for intervals within
one, two, and three standard deviations of a Gaussian. It is not a universal
rule for arbitrary data.

**Derivation:** substitute `x=μ+σz` into the Gaussian density. The exponent
becomes `−z²/2`, while `dx=σ dz` cancels the original `1/σ` factor. The result
is the standard-normal density, which explains both the centring and the scale
division.

### Numerical and visual perspective

Plot a histogram with a fitted curve and a Q–Q plot against standard normal
quantiles. A z-score plot centres and rescales but cannot remove skew. The
standard normal table or CDF turns a z-score into a tail area; the area, not the
curve height, is the probability.

### An illustrative story

A detector applied a Gaussian z-score cutoff to a feature with a long right
tail. Many “anomalies” were ordinary large customers. The standardisation was
algebraically correct; the shape assumption was not. This is illustrative.

## Worked examples and variations

### Example A: standardise a measurement

**Input:** `X=80`, `μ=70`, `σ=5`. **Mechanism:** `z=(80−70)/5=2`.
**Output:** the value is two standard deviations above the reference mean.
**Inspect:** units cancel in the ratio. **Decision:** compare locations across
features only when their reference mean and spread are appropriate.

### Example B: a Gaussian tail

**Input:** `X~N(100,10²)` and threshold `x=120`. **Mechanism:** `z=2`, so
`P(X>120)=1−Φ(2)≈0.0228`. **Output:** about 2.3% under the Gaussian model.
**Inspect:** this is a model-based tail, not an observed frequency unless the
fit is checked. **Decision:** validate tail behaviour before setting alerts.

### Example C: feature scaling

**Input:** one feature measured in metres, another in centimetres. **Mechanism:**
subtract each training mean and divide by its training SD. **Output:** both have
training mean 0 and SD 1. **Inspect:** apply stored training parameters to later
data; recomputing them on the test set leaks information. **Decision:** separate
standardisation from a claim of Gaussianity.

### Boundary case: zero standard deviation

**Input:** every training value equals 4. **Mechanism:** `σ=0`, so the z-score
division is undefined. **Output:** there is no spread to standardise.
**Inspect:** a constant feature may be dropped or given a documented constant
encoding. **Decision:** fail the transform rather than return infinities.

### Counterexample: all standardised data are normal

**Input:** an exponential feature is centred and divided by its SD.
**Mechanism:** the operation changes location and scale but leaves skewness and
tail shape. **Output:** mean 0 and SD 1, but not a Gaussian distribution.
**Inspect:** histogram, Q–Q plot, and tail counts. **Decision:** do not use
Gaussian tail probabilities merely because z-scores exist.

## Two ways to see it

### Builder view

Store `μ`, `σ`, units, fit population, and transform version. Use z-scores for
comparability, then separately test the distributional assumption behind a tail
or likelihood calculation.

### Systems or reviewer view

Ask who set the reference distribution and what happens after drift. A fixed
standardisation can expose drift; refitting on every batch can hide it.

## Hands-on

Generate 1,000 Gaussian samples and 1,000 exponential samples with fixed seeds.
Standardise both, plot histograms and Q–Q plots, and compare the empirical upper
tail with the Gaussian prediction. Add a constant-feature assertion.

**Deliberate failure:** compute z-scores with a zero SD and use `mean±3*sd` on
the exponential feature as if it were Gaussian. **Test:** the constant fixture
must fail explicitly and the exponential tail must be labeled assumption
dependent. **Reset:** guard zero SD and report empirical tail rates. **No-code
route:** mark the mean and one/two/three-SD bands on two hand-drawn histograms.

## Checkpoint

- [ ] Standardise a value and reverse the transformation.
- [ ] Convert a Gaussian threshold into a z-score and tail statement.
- [ ] Explain why standardisation does not create normality.
- [ ] State the zero-variance failure and a safe response.

## What this does not solve

Gaussian assumptions do not guarantee independence, calibrated tails, or robust
out-of-distribution behaviour. A mean and SD miss skew and multimodality, and
standardisation parameters can leak or drift. Multivariate Gaussians add
covariance geometry and conditioning.

## Continue, go deeper, apply it

- Continue: Multivariate Gaussians and covariance geometry
- Go deeper: Linear algebra for ML
- Apply it: Likelihood, priors, and sampling assignment
