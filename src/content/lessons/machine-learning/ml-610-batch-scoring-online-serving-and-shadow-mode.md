---
title: "Batch scoring, online serving, and shadow mode"
track: "machine-learning"
order: 610
status: live
summary: "Choose inference architecture by decision latency and failure cost, then validate candidate models without exposing users to unproven decisions."
duration: "21 min read"
updated: "2026-08-30"
---

## The short answer

Batch scoring precomputes predictions; online serving computes them in a request path; shadow mode computes candidate predictions without using them for decisions. The right choice follows the decision’s freshness, latency, throughput, and safe-fallback requirements.

## Why this matters

Online inference adds availability, latency, and skew risks that may be needless for weekly prioritization. Batch inference can be dangerously stale for fraud. Shadow mode is valuable only when it receives representative traffic and logs enough context for comparison.

## How it works

Map the business action to a prediction SLA and freshness window. For batch, schedule point-in-time feature computation, atomically publish outputs, and label stale results. For online, set timeouts, idempotency, caching, capacity limits, and a deterministic fallback. For shadow, duplicate requests asynchronously or safely in parallel, suppress side effects, sample carefully, and compare scores, latency, errors, and downstream-label outcomes.

## Worked examples and variations

1. Weekly lead prioritization is well suited to batch scoring with a clear “generated at” timestamp.
2. Card authorization requires low-latency online scoring and a fallback rule when the model endpoint times out.
3. A new fraud model shadows all traffic but cannot observe final fraud labels for weeks; log delayed join keys and predefine interim health metrics.
4. A recommender shadows candidate rankings while the current ranker controls exposure; compare candidate scores but do not infer user preference without an experiment.
5. Boundary case: running a shadow call synchronously in the critical path can itself degrade the established service and invalidate the safety premise.

## Two ways to see it

Inference architecture is an operations trade-off between freshness and reliability. Shadowing is a measurement design, not an automatic proof that a candidate improves outcomes.

## Hands-on

Design the same model as batch, online, and shadow deployment. Write the SLA, fallback, feature source, log fields, and success criteria for each. Deliberate failure: let shadow predictions trigger notifications or database writes. Reset by isolating credentials and side effects, then test that a shadow outage leaves the primary decision unchanged.

## Checkpoint

What happens if features are stale, the endpoint exceeds its timeout, or the candidate differs sharply from the champion? Which labels arrive late?

## What this does not solve

Shadow mode does not measure causal business impact without controlled exposure. Neither architecture cures an invalid target, poor calibration, or unsafe policy.

## Continue, go deeper, apply it

Combine shadow mode with canary releases, slice monitoring, and an explicit champion-challenger decision protocol.
