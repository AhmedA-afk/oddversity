---
title: "Lab: reproducible training pipeline"
track: "machine-learning"
order: 712
status: live
summary: "Package data, code, configuration, and evaluation so a training result can be recreated and compared."
duration: "105 min lab"
updated: "2026-08-30"
---

## The short answer

Turn a notebook experiment into a parameterized pipeline that records immutable data references, code revision, environment, random seed, split definition, model configuration, metrics, and artifacts.

## Why this matters

If a result cannot be reproduced, it cannot be trusted, debugged, compared, or safely promoted. Hidden state in notebooks and mutable data paths are common sources of accidental scientific fiction.

## How it works

Separate extraction, validation, feature generation, training, evaluation, and reporting into explicit steps. Load settings from a versioned configuration file, seed stochastic components, and persist split identifiers. Log package versions and a data snapshot identifier or query hash. Store fitted preprocessing with the model. Make evaluation read only saved predictions rather than silently retraining.

## Worked examples and variations (4 examples incl. boundary/counterexample)

1. A fixed split file lets two models be compared on identical rows.
2. A query hash identifies the exact warehouse extract when raw data cannot be copied.
3. Saving the encoder prevents production categories from mapping differently than training categories.
4. Counterexample: rerunning a notebook top to bottom after a source table changed is not reproduction of yesterday’s result.

## Two ways to see it

For a team, reproducibility is a handoff contract. For science, it is the minimum evidence needed to verify an empirical claim.

## Hands-on

Deliver a repository with a single command or documented sequence to run data validation, training, and evaluation; a configuration file; lockfile; split artifact; run manifest; and saved predictions. Intentionally fail by changing a seed or mutating a raw input without recording it; demonstrate the mismatch, then reset with a pinned run manifest and rerun from a clean environment. Ask a peer to reproduce one run using only the README.

## Checkpoint

You can identify every input required to recreate a metric and can compare two runs without guessing which data or code changed.

## What this does not solve

Reproducibility does not make data representative, a metric useful, or a model secure.

## Continue, go deeper, apply it

Add artifact registries, schema contracts, CI evaluation checks, deterministic containers where practical, and access-controlled data lineage.
