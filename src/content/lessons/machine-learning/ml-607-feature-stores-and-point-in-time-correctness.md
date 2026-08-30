---
title: "Feature stores and point-in-time correctness"
track: "machine-learning"
order: 607
status: live
summary: "Use feature systems to share definitions while ensuring every historical row contains only information that existed at that moment."
duration: "22 min read"
updated: "2026-08-30"
---

## The short answer

A feature store is useful when it provides governed, reusable feature definitions across offline and online use. Its central ML correctness requirement is point-in-time correctness: a training example may use only data available before its prediction timestamp.

## Why this matters

Naively joining a label table to the latest customer aggregate leaks the future. The result is a model that appears brilliant offline, then collapses when served with genuinely contemporaneous information.

## How it works

Represent entity keys, event time, ingestion/availability time, feature definitions, TTL, and materialization state. For each training row at time `t`, perform an as-of join to the latest feature event available by `t`, not merely the latest event with event time before `t`. Deduplicate late updates deterministically. Maintain offline/online parity tests and explicit backfill policies.

## Worked examples and variations

1. For churn predicted on 1 June, a purchase made 30 May but ingested 4 June cannot be used if the production system would not have known it on 1 June.
2. A daily balance feature must use the balance at the decision cutoff, not end-of-day balance when the decision was made at noon.
3. An aggregate “previous 7 days clicks” excludes the current click when predicting click fraud for that event.
4. A slowly changing customer segment needs both effective time and recorded time; retroactive corrections require an explicit historical policy.
5. Counterexample: putting tables in a feature store does not create correctness if the transformation itself reads post-outcome columns.

## Two ways to see it

Point-in-time joins are temporal database queries. For ML, they are a guardrail against a more subtle form of target leakage: information travel from the future.

## Hands-on

Build a small event table with delayed ingestion and labels. Create an as-of feature join, then compare it with a latest-value join. Deliberate failure: train using the latest-value join and report the inflated validation score. Reset by enforcing availability time, rerunning temporal validation, and recording the score gap in your experiment log.

## Checkpoint

Do you track both when something happened and when your system could know it? What is the defined behavior for late and corrected events?

## What this does not solve

A feature store does not make features useful, stable, fair, or cheap. It can also become an expensive abstraction if ownership and definitions are unclear.

## Continue, go deeper, apply it

Add feature contracts, TTL tests, materialization observability, and a sampled online/offline feature reconciliation job before scaling reuse.
