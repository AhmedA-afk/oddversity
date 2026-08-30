---
title: "Covariance, correlation, and confounding warnings"
track: "maths-foundations"
status: live
summary: "Covariance measures joint linear movement, Cov(X,Y)=E(X−μX)(Y−μY); correlation rescales it to -1,1 when both standard deviations are positive."
duration: "4 min read"
---

## The short answer

Covariance measures joint linear movement, `Cov(X,Y)=E[(X−μX)(Y−μY)]`; correlation rescales it to `[-1,1]` when both standard deviations are positive. Neither proves causality. A common cause can create correlation, and a nonlinear relationship can have zero covariance. Use a scatterplot, the population and intervention question, and an explicit design before acting.

## Why this matters

Feature selection, monitoring, and prediction use association; product or policy
decisions often ask what would happen if someone intervened. Those are different
questions. Correlation also depends on scale, subgroup mixture, and selection.
The number is a diagnostic summary, not a license to change a variable.

**Assumption check:** covariance and correlation refer to a declared population
and sampling unit, and correlation requires positive finite standard deviations.
Linearity, time ordering, selection, and a plausible data-generating graph must
be considered before an association is used for an intervention.

## How it works

Expand the centred product:

`Cov(X,Y)=E[XY−μX Y−μY X+μX μY]=E[XY]−μXμY`.

Correlation is `ρ=Cov(X,Y)/(σXσY)`. By the Cauchy–Schwarz inequality,
`|ρ|≤1`; equality indicates a perfect affine relationship in the idealized
population setting. Covariance changes with units; correlation does not, apart
from sign changes under a negative rescaling. Zero covariance only rules out a
linear association, not arbitrary dependence.

### Numerical and visual perspective

Plot `(x,y)` pairs, colour by a potential subgroup, and add a line only when a
linear summary is appropriate. Compare pooled correlation with within-group
correlations. A cloud shaped like a parabola can have correlation near zero
while still being predictably dependent.

### An illustrative story

Ice-cream sales and heat-related incidents rose together in summer. Reducing
ice-cream sales would not be a justified intervention for the incidents because
temperature is a plausible common cause. This is an illustrative causal warning,
not a measured claim about a particular dataset.

## Worked examples and variations

### Example A: same-direction linear movement

**Input:** pairs `(1,2),(2,4),(3,6)` with `Y=2X`. **Mechanism:** deviations
have the same sign, so covariance is positive and correlation is `+1`.
**Output:** perfect positive linear association. **Inspect:** all points lie on
one line. **Decision:** linear prediction is plausible within the observed range,
not guaranteed outside it.

### Example B: units change covariance

**Input:** temperature `X` in °C and sales `Y`, with covariance `2` sales·°C.
**Mechanism:** converting temperature to °F uses `Ytemp=1.8X+32`; covariance
becomes `1.8·2=3.6` sales·°F. **Output:** covariance changes, correlation does
not. **Inspect:** translation has no effect; scaling does. **Decision:** keep
units in covariance reports.

### Boundary case: constant variable

**Input:** every `X` equals 5. **Mechanism:** `σX=0`, so the correlation
formula divides by zero. **Output:** correlation is undefined, although
covariance is zero. **Inspect:** variance checks must precede normalization.
**Decision:** drop, redesign, or separately describe a constant feature.

### Example C: nonlinear dependence with zero covariance

**Input:** `X` uniform on `{-1,0,1}` and `Y=X²`. **Mechanism:** positive and
negative `X` values cancel in `E[XY]=E[X³]=0`, and `E[X]=0`, so covariance is
zero. **Output:** `Y` is still determined by `X`. **Inspect:** scatterplot shows
a U-shape. **Decision:** check nonlinear dependence before discarding a feature.

### Counterexample: correlation as intervention

**Input:** a model finds a correlation between a protected attribute proxy and
approval. **Mechanism:** the association may reflect confounding, selection, or
legitimate pathways; it does not identify the result of changing the proxy.
**Output:** predictive association only. **Inspect:** draw a causal graph and
state the intervention. **Decision:** use an approved causal or experimental
design before policy changes.

## Two ways to see it

### Builder view

Compute centred products, covariance, and correlation, then plot the points and
slice by entity/time. Treat `ρ` as a compact diagnostic whose denominator and
sampling unit remain visible.

### Systems or causal view

Ask what generated both variables, what was conditioned on, and which value is
being changed. Correlation can help predict; it does not by itself justify an
action.

## Hands-on

Create fixtures for `Y=2X`, the parabola `Y=X²`, and a two-group confounded
dataset. Compute covariance/correlation from first principles and plot each
scatter. Report pooled and within-group values.

**Deliberate failure:** replace centred values with raw `x*y` products and call
the result covariance. **Test:** the parabola fixture must have covariance zero
under the centred calculation while the raw product is nonzero. **Reset:**
restore centring and label any raw cross-moment as `E[XY]`. **No-code route:**
make a deviation table with columns `x−μX`, `y−μY`, and their product.

## Checkpoint

- [ ] Derive covariance from the centred-product definition.
- [ ] Explain why covariance changes with units and correlation is scaled.
- [ ] Give a nonlinear dependent pair with zero covariance.
- [ ] State why a confounded correlation is not an intervention effect.

## What this does not solve

Correlation does not establish causal direction, fairness, robustness, or
generalisation outside the observed population. It can be distorted by outliers,
selection, and aggregation. Joint and conditional distributions retain more of
the structure than one association summary.

## Continue, go deeper, apply it

- Continue: Joint, marginal, and conditional distributions
- Go deeper: Causal questions versus predictive models
- Apply it: Mathematics Foundations assignments
