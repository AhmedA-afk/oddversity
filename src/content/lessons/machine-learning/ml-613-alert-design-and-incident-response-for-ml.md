---
title: "Alert design and incident response for ML"
track: "machine-learning"
order: 613
status: live
summary: "Turn ML anomalies into owned, actionable incidents with clear severity, evidence, containment, recovery, and learning."
duration: "19 min read"
updated: "2026-08-30"
---

## The short answer

An ML alert is useful only when it identifies a meaningful condition, routes to an owner, and names a safe first action. Incident response should contain impact, preserve evidence, restore a safe decision path, communicate uncertainty, and improve the system without blaming individuals.

## Why this matters

Alert fatigue causes real failures to be ignored. ML adds ambiguity: a shifted feature may be expected, labels may be delayed, and a model issue may actually be a policy or data-pipeline incident. Generic infrastructure runbooks are not enough.

## How it works

Define alert contracts: signal, baseline, persistence window, affected slice, severity, owner, confidence, dashboard link, and required action. Separate symptoms from root causes. Maintain a model incident playbook: assess scope; halt, constrain, or route to fallback; snapshot versions and logs; check data contracts and recent releases; validate recovery; perform a blameless review with follow-up owners.

## Worked examples and variations

1. A feature-null alert fires only when a critical field exceeds a threshold for three windows and score coverage is affected, reducing noise from one delayed batch.
2. A sudden increase in fallback decisions is a high-severity service incident even if model scores remain healthy.
3. Calibration degrades only in a new region. Contain by routing that region to a reviewed baseline rather than globally disabling a healthy model.
4. A weekly performance alert fires after labels mature; it should trigger an investigation queue, not an automatic retrain.
5. Counterexample: “PSI > 0.2” without a cohort, baseline, owner, or action is a dashboard decoration, not an alert.

## Two ways to see it

Alerts are product requirements expressed as operational signals. Incidents are hypothesis-driven investigations where safe containment matters more than immediately naming a cause.

## Hands-on

Write one alert contract for critical missingness and one for subgroup decision-rate change. Run a tabletop incident: data source changes, labels are unavailable, and a VP asks whether to shut down the model. Deliberate failure: page an engineer for every small distribution shift. Reset by introducing severity tiers, persistence, correlation with impact, and a preapproved fallback decision.

## Checkpoint

Can the recipient take the first action without guessing? What evidence must be preserved before rollback or retraining changes the scene?

## What this does not solve

An incident process does not eliminate model risk or replace a fairness review. It also cannot responsibly automate high-stakes remediation without carefully bounded authority.

## Continue, go deeper, apply it

Schedule drills for feature outages, skew, harmful policy changes, and compromised artifacts. Convert every post-incident finding into a tested guardrail or documented accepted risk.
