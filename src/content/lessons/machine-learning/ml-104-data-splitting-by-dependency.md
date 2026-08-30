---
title: "Split data by dependency, not habit"
track: "machine-learning"
order: 104
status: live
summary: "Choose train, validation, and test partitions that prevent related observations and future information from leaking across evaluation."
duration: "24 min read"
updated: "2026-08-30"
---

## The short answer

Random row splits are valid only when rows are exchangeable. When observations share people, places, devices, time, or repeated measurements, split at the dependency boundary—or forward in time—so test performance represents genuinely unseen decisions.

## Why this matters

If the same customer appears in train and test, a model can exploit customer-specific history rather than learn a general pattern. That result is not merely optimistic; it answers a different question than deployment.

## How it works

Identify the smallest group whose information must not cross a split. Use group splits for entity dependence, blocked/geographic splits for location dependence, and rolling-origin evaluation for temporal deployment. Freeze a final test set before repeated model selection.

```text
train: earlier time / groups A–M
validate: later time / groups N–P
test: latest time / groups Q–R
```

## Worked examples and variations

1. Patient records: split by patient, not visit, when predicting a later visit.
2. House prices: split by neighborhood or time when deployment targets new neighborhoods or future markets.
3. Sensor windows: keep all overlapping windows from one machine-run together.
4. Boundary case: independently randomized lab measurements may allow a random split after verifying no batch effect.
5. Counterexample: stratifying labels while ignoring time creates balanced folds that leak a future prevalence shift.

## Two ways to see it

Probabilistically, correlated train and test rows violate the independence expected by a simple estimate. Operationally, a split is a rehearsal: ask, “What will be unavailable when we score the next case?”

## Hands-on

Make a table of candidate dependency keys: entity, household, device, site, batch, and date. Intentionally run a random split and a group/time split. Reset by making the stricter split your selection procedure; treat the performance gap as a diagnostic, not a nuisance.

## Checkpoint

- What information could identify a test example from training?
- Does the test period occur after the data used to tune models?
- Is the split aligned to the rollout population?

## What this does not solve

A valid split does not correct sample selection, target noise, or a mismatch between offline and online decisions. It only prevents an especially common evaluation illusion.

## Continue, go deeper, apply it

Use the chosen split in the model-selection workflow, then audit features for availability at the same prediction time.
