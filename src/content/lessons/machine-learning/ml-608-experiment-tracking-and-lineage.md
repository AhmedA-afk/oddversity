---
title: "Experiment tracking and lineage"
track: "machine-learning"
order: 608
status: live
summary: "Make every reported metric traceable to code, data, environment, evaluation protocol, and a reviewable decision."
duration: "18 min read"
updated: "2026-08-30"
---

## The short answer

Experiment tracking records what you tried; lineage records how an artifact came to exist. Together they let another person reproduce a result, compare it fairly, and investigate a deployed prediction months later.

## Why this matters

“Best model: 0.91 AUC” is not a result without a split, metric definition, data snapshot, feature version, seed, code revision, and environment. Without lineage, rollback and incident analysis become archaeology.

## How it works

Treat each run as an immutable record: source revision, parameters, random seeds, container or lockfile digest, input dataset identifiers and hashes, feature definitions, split strategy, metrics with confidence intervals, artifacts, reviewer, and intended deployment. Link model registry versions to the approved run, then log the serving version with every prediction.

## Worked examples and variations

1. Two runs have the same hyperparameters but different data snapshots; comparing their AUCs as though only a parameter changed is invalid.
2. A new model wins macro-F1 but loses recall for a safety-critical class; lineage should retain both metrics and the decision rationale.
3. A notebook’s local random state changes after an untracked cell. A fixed seed alone is insufficient without code and dependency capture.
4. A production incident is traced to a feature definition revision, not the model binary; lineage must span data transformations.
5. Boundary case: hashing a mutable cloud path is not a durable dataset identity if the underlying objects can change.

## Two ways to see it

Tracking is a laboratory notebook for computational experiments. Lineage is a supply chain: each artifact has inputs, transformations, owners, and a route to recall.

## Hands-on

Run one model twice under a tracked configuration. Record the complete run card and compare artifacts byte-for-byte where determinism is expected. Deliberate failure: select the best score after repeatedly peeking at a test set without recording trials. Reset by creating validation/test roles, logging every trial, and locking the final test evaluation to a release candidate.

## Checkpoint

Can you reproduce the exact feature matrix for a deployed version? Can you explain why the selected model—not just the highest score—was approved?

## What this does not solve

Lineage cannot make an experiment scientifically valid, stop cherry-picking by itself, or guarantee source data can legally be retained. Governance and review remain necessary.

## Continue, go deeper, apply it

Connect runs to data contracts, model cards, registry approvals, and prediction logs. Rehearse an audit: trace one output backwards to its source events.
