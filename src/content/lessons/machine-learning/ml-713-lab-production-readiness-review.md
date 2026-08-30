---
title: "Lab: production readiness review"
track: "machine-learning"
order: 713
status: live
summary: "Run a concrete launch review covering interfaces, failure modes, monitoring, ownership, and rollback."
duration: "75 min lab"
updated: "2026-08-30"
---

## The short answer

Do not ship a model on offline metrics alone. Review the prediction contract, data dependencies, latency and capacity, human workflow, monitoring, incident response, rollback, and ownership with the people who will operate it.

## Why this matters

Production failure is usually mundane: a field changes meaning, a feature arrives late, a score is misread, or nobody owns an alert. The practical system includes much more than a serialized model.

## How it works

Create a readiness packet. Define input schema and fallback behavior, output semantics and permitted actions, SLOs, access controls, test cases, monitoring thresholds, alert recipients, deployment stages, and a rollback mechanism. Run shadow or replay evaluation where feasible. Verify that a stale or missing feature produces a safe response, not an unobserved guess.

## Worked examples and variations (4 examples incl. boundary/counterexample)

1. A batch churn score falls back to the prior approved queue if the feature job fails.
2. A real-time fraud feature timeout routes the transaction to existing rules.
3. A forecast feed marks late values as unavailable rather than filling them silently.
4. Counterexample: “monitor accuracy” is unusable when labels arrive three months later and no proxy or owner exists.

## Two ways to see it

Operations sees a service with failure modes and accountability. ML sees a distribution-dependent predictor whose assumptions can fail after deployment.

## Hands-on

Deliver a readiness checklist, interface contract, failure-mode table, dashboard mockup or specification, alert routing list, rollback runbook, and sign-off record with named roles. Intentionally fail a dependency in a staging or simulated environment, capture the observed behavior, then reset to the documented safe fallback. Include one tabletop incident: feature schema changes from integer to text.

## Checkpoint

You can state who receives each alert, what they do within what time, and how to stop the model’s impact without deleting evidence.

## What this does not solve

Readiness review does not guarantee adoption, regulatory approval, future data quality, or positive impact.

## Continue, go deeper, apply it

Add staged rollout, shadow mode, canary comparisons, periodic retraining approval, and post-incident learning reviews.
