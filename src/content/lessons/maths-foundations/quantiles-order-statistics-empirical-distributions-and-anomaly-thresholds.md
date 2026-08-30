---
title: "Quantiles, order statistics, empirical distributions, and anomaly thresholds"
track: "maths-foundations"
status: live
summary: "A quantile is a value below which a chosen fraction of a distribution lies; order statistics are sorted observations; the empirical CDF."
duration: "5 min read"
---

## The short answer

A quantile is a value below which a chosen fraction of a distribution lies; order statistics are sorted observations; the empirical CDF is the fraction of a sample at or below each value. Quantiles can define robust intervals and anomaly thresholds, but small samples, ties, interpolation conventions, drift, and a contaminated reference set make cutoffs unstable.

## Why this matters

Means and standard deviations can be pulled by a few extreme values. Quantiles
answer operational questions such as “what does 95% of ordinary latency stay
below?” They are not automatically safer: a 95th percentile estimated from 20
rows is one order statistic with substantial uncertainty, and a threshold trained
on incidents can normalise harm.

## How it works

For CDF `F`, one definition is the lower quantile
`Q(u)=inf{x:F(x)≥u}`, `0<u<1`. For observations sorted as
`x_(1)≤…≤x_(n)`, the empirical CDF is
`F_n(x)=n⁻¹Σ1{xᵢ≤x}`. Quantile software may interpolate between order statistics;
record the convention when exact reproducibility matters.

**Derivation:** the empirical CDF is obtained by replacing each population
indicator probability `P(X≤x)` with its sample average. The lower quantile is
then the first value where this cumulative step function reaches `u`; any
interpolation rule is an additional convention, not part of the raw order.

An empirical percentile interval `[Q(.05),Q(.95)]` contains approximately the
central 90% of the reference sample under the chosen convention. For a new
point, an upper anomaly rule can be `x>Q(.99)` or a robust rule based on the
interquartile range `IQR=Q(.75)-Q(.25)`. These thresholds describe the reference
distribution; they do not prove that an outlier is erroneous or harmful.

**Assumption check:** a percentile threshold is conditional on the reference
population, sampling unit, time window, and quantile convention. It does not
inherit the target population’s coverage when the reference set is selected,
censored, or stale.

### Numerical and visual perspective

Sort the values, draw the empirical CDF as a staircase, and mark quantile
locations. Compare a quantile threshold with mean±2SD on a skewed sample. A
bootstrap or rolling-window plot shows small-sample and drift uncertainty.

### An illustrative story

A latency alert used the 99th percentile of a tiny quiet-hour sample. One new
normal peak shifted the cutoff sharply, causing alert fatigue. This is
illustrative; thresholds need sample-size, time-window, and drift checks.

## Worked examples and variations

### Example A: median and IQR

**Input:** sorted values `[1,2,3,4,100]`. **Mechanism:** the median is the
middle order statistic, 3; quartiles depend on a stated small-sample convention
but stay near the central values. **Output:** a robust centre and spread that do
not move as much as the mean under one extreme point. **Inspect:** write the
quantile convention. **Decision:** use median/IQR for skewed operational data.

### Example B: a percentile threshold

**Input:** 100 reference latencies and the empirical 95th percentile is 420 ms.
**Mechanism:** at most roughly 5% of reference rows exceed the selected cutoff.
**Output:** a reference-based alert threshold. **Inspect:** count, time window,
and whether the reference set was healthy. **Decision:** monitor exceedance rate
after deployment rather than treating 420 ms as a universal SLA.

### Example C: empirical CDF comparison

**Input:** two model score samples. **Mechanism:** plot their staircase CDFs and
compare the same quantiles. **Output:** one model may have a higher median but a
worse upper tail. **Inspect:** distributional shape, not only mean score.
**Decision:** choose a threshold from the consequence and tail target.

### Boundary case: tiny sample and ties

**Input:** `[5,5,5,5]` or a single observation. **Mechanism:** many quantiles
are equal or interpolation is convention-dependent. **Output:** a seemingly
precise cutoff with little information. **Inspect:** sample count and unique
values. **Decision:** widen the review band or defer thresholding until more
representative data exist.

### Counterexample: mean plus two standard deviations

**Input:** a heavily right-skewed latency distribution. **Mechanism:** the mean
and SD are pulled upward by the tail, so `mean+2SD` may mark few or no ordinary
tail observations—or fail to control the desired false-alert rate. **Output:**
an opaque anomaly rule. **Inspect:** compare empirical exceedance and quantile
cutoffs on a held-out reference window. **Decision:** choose the rule from an
explicit alert budget and validate its stability.

## Two ways to see it

### Builder view

Store sorted reference data or a reproducible summary, quantile convention,
window, sample count, cutoff, and post-deployment exceedance. Refit only under a
documented schedule or drift rule.

### Systems or reviewer view

Ask who is in the reference set, which failures were excluded, and what happens
when the distribution shifts. An anomaly threshold encodes a definition of
“ordinary,” not a ground-truth label.

## Hands-on

Implement an empirical CDF, median, quartiles, a 95th-percentile threshold, and
mean±2SD for a skewed fixture. Plot both rules, then add one new extreme value
and compare the cutoff changes. Use a fixed quantile convention.

**Deliberate failure:** compute a percentile from an unsorted list using the row
index as if it were an order statistic, and use a four-row sample as a stable
production threshold. **Test:** the CDF must be nondecreasing, the cutoff must
be reproducible, and the small-sample warning must fire. **Reset:** sort, record
the convention/window, and rerun with a larger reference fixture. **No-code
route:** order tokens, draw the empirical staircase, and mark the percentile
rank by hand.

## Checkpoint

- [ ] Define a quantile through the CDF and an order statistic.
- [ ] Compute an empirical percentile interval with a stated convention.
- [ ] Compare a quantile threshold with a mean/SD rule on skewed data.
- [ ] Explain why a small-sample cutoff is unstable and what to monitor.

## What this does not solve

Quantiles do not identify causes, label anomalies, guarantee future coverage, or
protect against a biased reference population. They can be unstable under small
samples, ties, censoring, and drift. Statistical inference turns these summaries
into uncertainty statements; the next module is the route for that work.

## Continue, go deeper, apply it

- Continue: Mathematics Foundations checklist
- Go deeper: Anomaly detection
- Apply it: Likelihood, priors, and sampling assignment
