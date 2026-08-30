---
title: "Data contracts and schema evolution"
track: "machine-learning"
order: 605
status: live
summary: "Turn feature assumptions into executable agreements that can evolve without silently changing model meaning."
duration: "19 min read"
updated: "2026-08-30"
---

## The short answer

A data contract specifies what a dataset or feature means, who owns it, when it is available, its type and valid range, and how breaking changes are announced. Schema evolution preserves those semantics as producers and consumers change independently.

## Why this matters

Most ML incidents begin before inference: a timestamp moves from UTC to local time, a category is renamed, nulls acquire a new meaning, or a producer backfills history. A type-valid payload can still be semantically wrong enough to corrupt a model.

## How it works

Version schemas and semantic definitions separately. Encode required fields, units, nullability, freshness, primary keys, event time, allowed values, and availability cutoff. Classify changes as additive, deprecating, or breaking. Run producer and consumer compatibility tests in CI; monitor contract conformance at runtime. Give every field an owner and an escalation policy.

## Worked examples and variations

1. Adding an optional `device_os_version` field is additive, but it still needs a default behavior in the feature pipeline.
2. Renaming `annual_income` to `income` is breaking if the unit changes from dollars to thousands of dollars.
3. A nullable `cancelled_at` may mean “active” for subscriptions, but a newly introduced empty string must not be silently coerced to the same state.
4. An event’s ingestion timestamp is available now; its event timestamp may arrive late. Training and serving must agree which one defines eligibility.
5. Counterexample: an Avro-compatible addition can be business-incompatible if a downstream model treats an absent value as “unknown customer.”

## Two ways to see it

Contracts are API design for data. They are also scientific instrumentation: they document what was measured, when, and under which conventions.

## Hands-on

Write a contract for one production-like feature with owner, unit, event time, availability time, null semantics, range, and deprecation date. Deliberate failure: change its unit in a test fixture while preserving the column type. Reset by adding a unit assertion, a compatibility test, and a consumer rollout plan that can read both versions.

## Checkpoint

Can your contract distinguish a late event from a missing event? Who must approve a semantic change that remains type-compatible?

## What this does not solve

A contract cannot guarantee labels are correct, remove bias, or stop intentional misuse. It must be paired with quality monitoring and access controls.

## Continue, go deeper, apply it

Apply contracts to offline training tables, online feature APIs, labels, and prediction logs. Link each contract version to model lineage and release approvals.
