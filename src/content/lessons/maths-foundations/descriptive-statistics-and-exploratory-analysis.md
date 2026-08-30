---
title: "Descriptive statistics and exploratory analysis"
track: "maths-foundations"
status: live
summary: "Descriptive statistics compress observed data into summaries that expose location, spread, shape, and unusual cases."
duration: "5 min read"
---

## The short answer

Descriptive statistics compress observed data into summaries that expose location, spread, shape, and unusual cases. Use at least one robust summary, one spread measure, and a plot matched to the data-generating question. A mean alone is a decision hazard: first inspect the distribution, units, missingness, and influential observations before choosing a model or threshold.

## Why this matters

An AI team often receives a table before it receives a clear population definition. A five-number summary and a small set of plots can reveal that “average latency” combines two request classes, that a feature has a long tail, or that a missing value has been encoded as zero.

**Small incident (illustrative):** a queue dashboard reported a healthy mean response time while a small set of large exports were taking minutes. The mean was not mathematically wrong; it answered a less useful question than the product team thought it did.

## How it works

For observations x₁,…,xₙ, the mean is x̄ = (1/n) sum xᵢ, the median is the middle order statistic, and the sample variance is s² = (1/(n−1)) sum (xᵢ−x̄)². Quantiles describe rank positions; the interquartile range is IQR = Q₀.₇₅ − Q₀.₂₅. A histogram, empirical CDF, box plot, or scatter plot gives shape that a scalar cannot.

### Assumptions and derivation

The mean is meaningful when addition and division preserve the quantity’s interpretation, such as milliseconds or currency. The median only needs an ordered scale. Variance measures squared distance from the mean, so its units are squared; use standard deviation when communicating in the original unit. The divisor n−1 is the conventional unbiased estimator of a population variance when the mean was estimated from the same sample; it is not a universal correction for every data problem.

## AI use

Use summaries to choose preprocessing, slices, and monitoring signals—not to certify data quality. A model feature with a heavy tail may need a log transform; a class count may need stratified evaluation; a latency SLO may need p95 or p99 rather than the mean. Record the population, time window, denominator, and missing-value rule beside every number.

## Worked examples and variations

### Example A — smallest happy path

**Input:** scores `[2, 3, 3, 4, 5]`. **Mechanism:** mean = 17/5 = 3.4, median = 3, range = 3, and sample standard deviation ≈ 1.14. **Output:** a centered, moderately spread sample. **Inspect:** all values have the same unit and no value dominates. **Next decision:** a mean and standard deviation are reasonable first summaries, while still plotting the five points.

### Example B — meaningful variation

**Input:** request latencies `[80, 82, 85, 90, 650]` ms. **Mechanism:** mean = 197.4 ms but median = 85 ms; the upper tail is visible in an empirical CDF. **Output:** typical requests are fast, but one request is not. **Inspect:** identify the request class and whether the 650 ms case is an error or a legitimate export. **Next decision:** report median and tail percentiles separately before changing the service.

### Example C — boundary case

**Input:** one observation `[7]`. **Mechanism:** mean and median are 7, but sample variance divides by n−1 = 0 and is undefined. **Output:** location is known for the observed row; uncertainty and spread are not estimable from one row. **Inspect:** assert `n >= 2` before reporting sample variance. **Next decision:** collect more observations or label the spread as unavailable.

### Example D — tempting counterexample

**Input:** datasets A `[0, 0, 0, 0, 20]` and B `[4, 4, 4, 4, 4]`. **Mechanism:** both means equal 4, but A has median 0 and B has median 4. **Output:** identical means conceal different operational behavior. **Inspect:** compare median, IQR, tail count, and plot. **Next decision:** do not select a threshold or capacity plan from the mean alone.

## Computation and interpretation

```python
import numpy as np

def summary(x):
    x = np.asarray(x, dtype=float)
    if x.size == 0 or not np.isfinite(x).all():
        raise ValueError("need non-empty finite observations")
    return {
        "n": x.size,
        "mean": x.mean(),
        "median": np.median(x),
        "q25": np.quantile(x, 0.25),
        "q75": np.quantile(x, 0.75),
        "sample_sd": np.std(x, ddof=1) if x.size > 1 else np.nan,
    }

print(summary([80, 82, 85, 90, 650]))
```

Interpret the output in the unit of the input. Mean and median are estimands of different kinds; neither is automatically “the real value.” If the sample came from several regimes, compute summaries by regime and show the denominator for each slice.

## Two ways to see it

### Builder view

Exploratory analysis is an interface contract for later modelling: every feature gets a type, unit, missingness rule, range check, and distribution snapshot. The artifact is reproducible code plus labelled plots, not a screenshot with a preferred story.

### Systems view

The summary is a lossy projection. A dashboard can hide rare failures, subgroup gaps, or time drift. Ask which decisions the summary supports and which cases it removes from view.

## Hands-on

Create `eda_report.md` from the deterministic fixture:

```python
latency_ms = [80, 82, 85, 90, 650]
```

Record n, mean, median, Q1, Q3, IQR, sample standard deviation, and one empirical-CDF or sorted-value plot. **Failure fixture:** append `0` as a missing-value sentinel and compute the mean without filtering or documenting it. **Test:** the report must reject undocumented sentinel values and must show that `median < mean` for the clean fixture. **Reset:** remove the sentinel, rerun the checks, and regenerate the report from the original five values. No network or private data is needed.

## Checkpoint

- [ ] Explain why median and mean answer different questions for a long-tailed feature.
- [ ] Compute the IQR of `[2, 3, 3, 4, 5]` using your stated quantile convention.
- [ ] Produce one plot whose axes, units, and denominator are explicit.
- [ ] Name the sample-size condition under which the usual sample variance is defined.

## What this does not solve

Descriptive analysis does not establish causality, representativeness, statistical significance, or future performance. A clean-looking plot can still describe a selected or biased sample. Treat summaries as evidence about the observed dataset, then audit how that dataset was generated.

## Continue, go deeper, apply it

- Continue: Data-generating processes, sampling, and selection bias
- Go deeper: Estimators, bias, consistency, efficiency, and variance
- Apply it: Interpretability and error analysis
