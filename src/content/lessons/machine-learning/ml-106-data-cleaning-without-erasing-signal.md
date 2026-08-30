---
title: "Data cleaning without erasing signal"
track: "machine-learning"
order: 106
status: live
summary: "Correct data defects while preserving rare, extreme, and operationally meaningful observations."
duration: "24 min read"
updated: "2026-08-30"
---

## The short answer

Cleaning is a sequence of justified transformations, not a campaign to make data look normal. Correct provable errors, preserve valid extremes, encode uncertainty, and apply every learned transformation inside a training pipeline so validation and production receive identical treatment.

## Why this matters

Outliers may be typing errors, but they may also be fraud, equipment failure, or the customers a model is meant to serve. Deleting them by a generic rule changes the learning problem and can conceal the cost of operational data failures.

## How it works

Classify a suspicious value before acting: impossible by domain rule, inconsistent with another field, valid but rare, missing-in-disguise, or unknown. Keep a raw immutable copy; produce a cleaned column and a flag when a correction is uncertain. Fit imputation, scaling, clipping, and vocabulary choices only on training data.

```python
# Learn boundaries from training rows only; retain a flag for clipped values.
lo, hi = train["amount"].quantile([0.01, 0.99])
train["amount_was_clipped"] = ~train["amount"].between(lo, hi)
```

## Worked examples and variations

1. A negative age is impossible: retain the raw value for audit, set the model feature missing, and flag the record.
2. A large card transaction is rare but valid: retain it and consider a log transform plus an extreme-value flag.
3. Temperatures encoded as `999` mean sensor failure, not a hot day; recode to missing with a failure indicator.
4. Boundary case: a value exactly at a stated maximum is valid unless the specification excludes it.
5. Counterexample: replacing every uncommon category with “other” can erase a protected or safety-critical subgroup.

## Two ways to see it

Robust statistics asks how estimates react to unusual observations. Data engineering asks whether a transformation is deterministic, versioned, and reversible. Use both: robustness without lineage is hard to trust.

## Hands-on

Create a cleaning log with rule, rationale, affected rows, and rollback method. Intentionally fit a scaler on all data before splitting. Reset by fitting it on train only and compare validation results. Then inspect whether the change was caused by leakage.

## Checkpoint

- Can you distinguish an error from a rare valid case?
- Is the raw value preserved somewhere secure and governed?
- Does the production pipeline apply the same transformation?

## What this does not solve

Cleaning cannot create missing information or make a biased collection process representative. It should not substitute for fixing upstream instrumentation.

## Continue, go deeper, apply it

Next, select representations for numeric, categorical, and text signals and audit the information each representation discards.
