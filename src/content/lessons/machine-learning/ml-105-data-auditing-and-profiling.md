---
title: "Data auditing and profiling"
track: "machine-learning"
order: 105
status: live
summary: "Inspect coverage, validity, distributions, joins, and change over time before patterns become model behavior."
duration: "26 min read"
updated: "2026-08-30"
---

## The short answer

Profile data before modeling: verify row grain, uniqueness, ranges, units, missingness, cardinality, join multiplicity, label delay, and distributions across relevant time and groups. An audit produces testable data expectations, not a decorative dashboard.

## Why this matters

Most early ML mistakes are data mistakes with persuasive charts. A duplicated join can improve a metric; a unit conversion can turn a clinical value into an apparent outlier; an absent category can silently become “other.”

## How it works

Start with a data inventory. For each field record owner, type, semantic unit, allowed range, null meaning, update cadence, and availability at `t0`. Then profile counts and quantiles overall and by time/group. Assert invariants in code:

```python
assert frame["prediction_id"].is_unique
assert frame["event_time"].le(frame["prediction_time"]).all()
```

Investigate every many-to-many join explicitly; aggregate or deduplicate before joining when that is the intended grain.

## Worked examples and variations

1. Revenue stored in cents in one source and dollars in another creates a long tail that is not customer behavior.
2. A customer join duplicates account rows because an address table has history; aggregate addresses first.
3. A category “N/A” can mean not applicable, not collected, or parsing failure—three different mechanisms.
4. Boundary case: a valid rare event may look like an outlier; preserve it after checking the source.
5. Counterexample: deleting all values beyond the 99th percentile can erase the very fraud cases a model must detect.

## Two ways to see it

Data profiling is exploratory statistics, but it is also software testing for a data contract. A histogram finds surprises; an assertion prevents their silent return tomorrow.

## Hands-on

Build a profile for ten fields with type, null rate, distinct count, five quantiles, and a time plot. Intentionally perform a join without a cardinality check. Reset by asserting the expected join relation and comparing row counts before and after.

## Checkpoint

- Is one row truly one prediction unit?
- Does every null have a documented meaning?
- Which distribution changed most across time or source?

## What this does not solve

An audit finds suspicious patterns; it does not decide whether a field is appropriate, causal, or permitted. Those require domain and governance review.

## Continue, go deeper, apply it

Turn audit findings into cleaning decisions and automated checks that run before every training and scoring job.
