---
title: "Case study: a loan-model drift incident"
track: "machine-learning"
order: 616
status: live
summary: "Investigate a realistic lending-model incident by separating data drift, policy change, delayed outcomes, and fairness risk before acting."
duration: "28 min case study"
updated: "2026-08-30"
---

## The short answer

When a lending model’s approval rate and delinquency proxy change, do not immediately retrain. Establish the timeline, versions, affected cohorts, feature availability, policy thresholds, and outcome maturity; contain harm with a safe fallback or narrow routing while you test competing explanations.

## Why this matters

Credit decisions can cause direct harm and are governed by policy and law. A quick “fix” based on immature labels or aggregate metrics can worsen disparate impact, hide a data failure, and destroy the evidence needed for review.

## How it works

Scenario: On Monday, approvals fall from 42% to 31% in one region; model latency is normal; a new income-verification vendor launched Friday; early delinquency labels will not mature for months. Form a timeline, freeze versions, compare contractual input quality and feature/score distributions by region and protected-group audit slices, inspect threshold policy, and route the affected region to documented manual review if guardrails are breached. Do not use protected attributes for individual decisions unless the policy and law explicitly authorize it; use approved audit processes.

## Worked examples and variations

1. The vendor sends monthly income in cents rather than dollars. Range checks find a 100-fold shift before any retraining decision.
2. Income missingness rises only for applicants using a new mobile upload flow; the imputer drives scores downward, indicating a pipeline and product issue.
3. Scores are unchanged but approvals drop because a policy configuration moved the threshold. This is decision-policy drift, not model drift.
4. The region’s applicant mix changed due to a campaign. Input drift may be real and expected; evaluate calibration after outcomes mature.
5. Counterexample: retraining on the first week of post-launch data bakes a transient vendor error into the model and does not repair the current serving path.

## Two ways to see it

This is an incident-management problem with statistical evidence. It is also a causal diagnosis problem: several changes happened near each other, so correlation with the drop is not enough.

## Hands-on

Create a one-page incident record containing timeline, versions, hypotheses, disconfirming evidence, affected slices, containment decision, owner, and next label-review date. Deliberate failure: compare only aggregate AUC from an old holdout and declare the model healthy. Reset by reconstructing 100 impacted feature vectors as of decision time, checking the data contract, and evaluating score and approval changes separately by region.

## Checkpoint

What evidence distinguishes an income-unit error from a threshold change? Which action is reversible today, and which conclusion must wait for mature outcomes?

## What this does not solve

This case study does not provide legal advice or a universal lending policy. It illustrates disciplined investigation; real high-impact systems require jurisdiction-specific compliance, independent review, and affected-person safeguards.

## Continue, go deeper, apply it

Connect the case to data contracts, point-in-time reconstruction, subgroup evaluation, release gates, recourse, and post-incident governance. Run the scenario as a cross-functional tabletop with engineering, risk, operations, and compliance roles.
