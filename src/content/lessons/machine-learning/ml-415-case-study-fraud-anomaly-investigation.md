---
title: "Case study: investigate fraud anomalies safely"
track: "machine-learning"
order: 415
status: live
summary: "Design anomaly-assisted fraud investigation around evidence, review capacity, customer recourse, and feedback quality."
duration: "30 min case study"
updated: "2026-08-30"
---

## The short answer

An anomaly model should prioritise cases for investigation, not silently decide who is fraudulent. This case study designs a score-to-review workflow with evidence, threshold economics, outcome logging, and a safe path for legitimate customers.

## Why this matters

Fraud is adversarial, labels arrive late, and true incidents are rare. A high-scoring system may target unusual but legitimate travel, accessibility needs, or new merchants; indiscriminate blocking converts a detection problem into customer harm.

## How it works

Define an event-time feature snapshot: transaction amount relative to account history, device novelty, merchant context, velocity, and prior confirmed outcomes. Train a supervised ranker if sufficiently representative labels exist; otherwise use anomaly ranking as a supplement. Choose score bands: allow, step-up verification, manual review, and emergency hold only with policy authority. Reviewers receive reasons and context, record dispositions, and sample low-score cases to detect blind spots.

## Worked examples and variations (4–6, include boundary and counterexample)

1. **Card not present:** a high amount plus new device becomes a verification prompt, not an accusation.
2. **Account takeover:** a rapid location, password, and payout change is escalated with an audit trail.
3. **Merchant shift:** a new legitimate merchant category triggers a data-drift review before thresholds tighten.
4. **Boundary:** an emergency hold may be justified for a clear, high-loss policy signal but must have immediate recourse.
5. **Counterexample:** unusual international spending on a declared trip should not be treated as model failure or fraud.

## Two ways to see it

Statistically, the score ranks observations by expected unusualness or risk. Operationally, it allocates scarce human attention and therefore needs queue and appeal design.

## Hands-on

Take a timestamped transaction sample and construct only pre-transaction features. Produce a precision-versus-review-volume curve and estimate false-positive cost. Deliberately include a post-dispute field to create leakage; observe the impossible metric, remove it, and reset the scorecard. Write reviewer prompts, appeal SLA, logging fields, and a monthly random audit of low-score decisions.

## Checkpoint

- [ ] No post-event labels or outcome fields enter features.
- [ ] Thresholds map to authorised actions and capacity.
- [ ] Customers have a timely explanation and recovery route.

## What this does not solve

An anomaly score does not determine legal fraud, replace investigators, or prevent attackers from adapting. It needs security controls and continuous evaluation.

## Continue, go deeper, apply it

Connect this workflow to drift monitoring, calibration, and incident response. Apply it first in shadow mode with measured reviewer outcomes.

