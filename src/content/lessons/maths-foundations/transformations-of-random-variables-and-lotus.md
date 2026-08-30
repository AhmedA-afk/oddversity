---
title: "Transformations of random variables and LOTUS"
track: "maths-foundations"
status: live
summary: "If Y=g(X), transform probabilities through the mapping, not by substituting into a density and stopping."
duration: "4 min read"
---

## The short answer

If `Y=g(X)`, transform probabilities through the mapping, not by substituting into a density and stopping. For a one-to-one differentiable map, `f_Y(y)=f_X(g⁻¹(y))|d g⁻¹(y)/dy|`; for any integrable function, LOTUS says `E[g(X)]=∫g(x)f_X(x)dx`. Non-monotonic maps require all preimages.

## Why this matters

Log transforms, squared norms, probabilities, and simulated features change
distributions. The Jacobian factor accounts for stretching or compressing the
axis; omitting it gives the wrong mass. LOTUS is often simpler when you need an
expectation but not the full transformed density.

## How it works

For a monotone differentiable `g`,
`F_Y(y)=P(g(X)≤y)` or its reversed inequality gives the CDF; differentiating
produces the absolute derivative of the inverse. Equivalently, small intervals
transform with width `dx≈|d g⁻¹/dy|dy`, which explains the factor.

For a non-monotone map, sum over every root `x_i` such that `g(x_i)=y`:

`f_Y(y)=Σ_i f_X(x_i)/|g'(x_i)|`, when the roots are regular.

LOTUS avoids inversion: use the original variable’s distribution to integrate
`g(X)`. The required assumptions are a valid input distribution and a measurable
function; differentiability is only needed for the density formula.

### Numerical and visual perspective

Draw a density and map equal-width intervals through `g`. A log map spreads low
values and compresses high ones; a square folds negative and positive inputs
onto the same nonnegative output, so densities add. Monte Carlo histograms are a
useful check but do not replace the Jacobian derivation.

### An illustrative story

A feature pipeline logged a positive value and reused the original density
height as the density of the log value. Tail probabilities shifted because the
axis had been stretched. This is illustrative; transformed-value checks catch
the error.

## Worked examples and variations

### Example A: linear transformation

**Input:** `X~Uniform(0,1)`, `Y=2X`. **Mechanism:** inverse `x=y/2` and derivative
`dx/dy=1/2`. **Output:** `f_Y(y)=1/2` on `[0,2]`, which integrates to one.
**Inspect:** doubling the interval width halves the density. **Decision:** carry
units and support through the transform.

### Example B: LOTUS for a square

**Input:** `X` is a standard normal, `Y=X²`; ask for `E[Y]`. **Mechanism:**
LOTUS gives `E[X²]=Var(X)+E[X]²=1`. **Output:** expected squared value 1.
**Inspect:** no need to derive the chi-square density. **Decision:** use LOTUS
for expected losses or norms when the transformed density is cumbersome.

### Boundary case: a constant map

**Input:** `Y=3` for every `X`. **Mechanism:** all input mass maps to one point.
**Output:** `P(Y=3)=1`; there is no ordinary continuous density. **Inspect:** a
zero derivative invalidates the one-to-one formula. **Decision:** represent the
result as a point mass.

### Example C: non-monotonic square map

**Input:** `X~Uniform(-1,1)`, `Y=X²`, `0<y<1`. **Mechanism:** preimages are
`±√y`, each has `|g'(x)|=2√y`; density contributions sum to
`1/(4√y)+1/(4√y)=1/(2√y)`. **Output:** a density that is larger near zero and
integrates to one. **Inspect:** both roots are required. **Decision:** never
discard a preimage because the transformation “looks one-sided.”

### Counterexample: omit the Jacobian

**Input:** `Y=2X` from Example A. **Mechanism:** using `f_X(y/2)=1` on `[0,2]`
would integrate to 2. **Output:** invalid total mass. **Inspect:** integrate the
transformed density before using it. **Decision:** add the derivative factor or
use a sample-based check with an explicit limitation.

## Two ways to see it

### Builder view

Track support, inverse branches, derivative, and normalisation. Use LOTUS when
the desired quantity is an expectation and the transformed density adds risk.

### Systems or reviewer view

Ask whether the transformation changes units, folds states together, or creates
a point mass. A feature that is easy to compute can still have a surprising tail
or loss distribution after transformation.

## Hands-on

Implement the `Y=2X` and `Y=X²` transformations, integrate their predicted
densities numerically, and compare with histograms from sampled `X`. Calculate
`E[X²]` by LOTUS and by the sample mean of squares.

**Deliberate failure:** omit the Jacobian for `Y=2X` and include only the
positive root for `X²`. **Test:** density area and empirical histogram must fail
to match; the square density should have both preimage contributions. **Reset:**
restore the derivative and root sum, then rerun. **No-code route:** map equal
probability strips on the input axis and count how much output width each strip
occupies.

## Checkpoint

- [ ] Derive the one-to-one change-of-variables density.
- [ ] Use LOTUS to compute an expectation without finding the output density.
- [ ] Handle a non-monotonic transformation by summing preimages.
- [ ] Detect a missing-Jacobian normalisation failure.

## What this does not solve

The formulas do not fix a misspecified input distribution, discontinuities, or
high-dimensional Jacobian mistakes. Monte Carlo agreement depends on sample size
and can miss rare regions. Sampling algorithms provide practical ways to obtain
the transformed distribution when analytic inversion is inconvenient.

## Continue, go deeper, apply it

- Continue: Sampling, inverse transform, and rejection sampling
- Go deeper: Probability and statistics for ML
- Apply it: Likelihood, priors, and sampling assignment
