---
title: "PMFs, CDFs, PDFs, and probability mass versus density"
track: "maths-foundations"
status: live
summary: "A PMF assigns probability mass to discrete values; a CDF gives P(X≤x) for any variable; a PDF is a density whose area over an interval is probability."
duration: "5 min read"
---

## The short answer

A PMF assigns probability mass to discrete values; a CDF gives `P(X≤x)` for any variable; a PDF is a density whose area over an interval is probability for a continuous model. Mass is probability, density is probability per unit. A density may exceed 1, but a valid total area and every interval probability must stay within the rules.

## Why this matters

Confusing a PDF height with probability at a point creates wrong tail risks,
thresholds, and likelihood calculations. Discrete model outputs need sums; a
continuous latency or embedding coordinate needs integrals. The CDF provides a
common interface for quantiles and interval probabilities across both cases.

## How it works

For a discrete variable, `p(x)=P(X=x)`, `p(x)≥0`, and `Σ_x p(x)=1`. Its CDF is
`F(x)=P(X≤x)=Σ_{t≤x}p(t)`. For a continuous variable with density `f`,

`P(a≤X≤b)=∫ₐᵇ f(x)dx`, `f(x)≥0`, and `∫_{-∞}^{∞}f(x)dx=1`.

When differentiability conditions hold, `F'(x)=f(x)`; conversely,
`F(b)-F(a)` gives interval probability. In a continuous model `P(X=x)=0`
for an exact point even if `f(x)` is large. A mixed distribution can contain
both point mass and a continuous component, so do not force every variable into
one representation.

**Derivation:** a CDF accumulates all mass to the left. For a discrete variable
that accumulation is a sum; for a continuous variable it is an integral. When
`F` is differentiable, differentiating the accumulated area recovers the PDF.

### Numerical and visual perspective

Plot a PMF as bars, a CDF as a nondecreasing staircase, and a PDF as a curve
with shaded interval area. Check the PMF bar sum or PDF numerical integral. A
curve height of 5 over an interval of width 0.2 can have area 1; the height is
not itself a probability.

### An illustrative story

A threshold alert used the peak of a latency density as if it were the chance of
landing at exactly that millisecond. The correct question was the area beyond a
service-level threshold. This is an illustrative story, not a production
measurement.

## Worked examples and variations

### Example A: fair die PMF and CDF

**Input:** `X` is a fair die. **Mechanism:** `p(x)=1/6` for `x=1,…,6`; the CDF
adds bars from left to right. **Output:** `F(3)=1/2`, and
`P(2≤X≤4)=3/6`. **Inspect:** the CDF jumps only at supported values.
**Decision:** use sums for this discrete label/count.

### Example B: a narrow continuous density

**Input:** `X` is uniform on `[0,0.2]`. **Mechanism:** `f(x)=1/0.2=5` inside
the interval and 0 outside. **Output:** `P(0.05≤X≤0.15)=5·0.10=0.5`.
**Inspect:** the density height 5 exceeds 1 while the area is valid.
**Decision:** integrate over a range; never report `f(0.1)=5` as a probability.

### Boundary case: a point probability

**Input:** continuous `X` and one exact value `x=4`. **Mechanism:** an interval
shrinks to zero width, so its area and `P(X=4)` are zero under a continuous
model. **Output:** `F(4)=F(4-)` for a smooth distribution. **Inspect:** a point
can have high density and still zero point mass. **Decision:** ask for a bin,
range, or tail event.

### Example C: model confidence bins

**Input:** 100 predictions binned into confidence intervals; counts are
`[20,30,50]` in bins `[0,.33),[.33,.66),[.66,1]`. **Mechanism:** normalize
counts to a discrete empirical PMF, then form a step CDF. **Output:** the final
bin carries 0.50 mass. **Inspect:** this describes observed scores, not yet
calibration or a continuous density. **Decision:** compare bin frequencies with
outcome frequencies before interpreting confidence.

### Counterexample: a negative or unnormalised density

**Input:** proposed `f(x)=2x` on `[0,1]` plus `-0.1` on part of the interval.
**Mechanism:** a density must be non-negative everywhere and integrate to one;
local cancellation does not repair negative probability. **Output:** invalid
distribution. **Inspect:** numerical integration alone can hide a sign error.
**Decision:** test pointwise non-negativity and total area separately.

## Two ways to see it

### Builder view

Choose the representation that matches the variable. Use empirical PMFs/CDFs
for finite observations, analytic densities only with a justified model, and
integrals or CDF differences for continuous interval queries.

### Systems or reviewer view

Ask whether a reported number is mass, density, CDF, quantile, or score. A chart
with an unlabeled y-axis can make these quantities look interchangeable when
they are not.

## Hands-on

Create a fair-die PMF and an `[0,0.2]` uniform density. Implement a cumulative
sum and a trapezoid-area check. Plot bars/staircase/curve with labeled axes and
calculate one interval probability from each representation.

**Deliberate failure:** report the density height at `0.1` as the interval
probability and allow a negative density point. **Test:** expect area 1 and
`P(0.05≤X≤0.15)=0.5`; fail if the answer is 5 or if a sampled density is
negative. **Reset:** restore the non-negative density and interval integration.
**No-code route:** shade the relevant area under a hand-drawn curve.

## Checkpoint

- [ ] Define PMF, CDF, and PDF in terms of sums, cumulative probability, and area.
- [ ] Explain why a PDF can be greater than one.
- [ ] Calculate an interval probability for a discrete and a continuous example.
- [ ] Identify a pointwise or normalisation failure in a proposed distribution.

## What this does not solve

A valid PMF, CDF, or PDF does not mean the chosen distribution fits the data or
the future population. Density estimates can be sensitive to bins and bandwidth;
empirical CDFs still reflect sampling and selection. Expectation and variance
compress these distributions into useful summaries, with information lost.

## Continue, go deeper, apply it

- Continue: Expectation and linearity
- Go deeper: Probability and statistics for ML
- Apply it: Base rates, Bayes, and simulation
