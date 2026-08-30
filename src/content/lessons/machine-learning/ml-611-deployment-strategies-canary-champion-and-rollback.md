---
title: "Deployment strategies: canary, champion, and rollback"
track: "machine-learning"
order: 611
status: live
summary: "Release models as controlled experiments with eligibility rules, safety gates, versioned decisions, and a practiced route back."
duration: "20 min read"
updated: "2026-08-30"
---

## The short answer

Canary deployment exposes a small, governed traffic slice to a candidate. Champion-challenger compares a serving incumbent with alternatives. Rollback is a pretested switch to a known-safe behavior, not an improvised response to an alert.

## Why this matters

Aggregate offline validation misses production latency, data gaps, subgroup harms, and feedback loops. A release without a clear owner, gates, and rollback path turns every model change into an uncontrolled experiment on users.

## How it works

Version model, features, policy, and configuration independently but log them together. Define eligibility and exclusion rules before launch, guardrails for latency/error rates/decision distributions, and leading versus delayed outcome metrics. Begin with shadow when appropriate, canary only if harm is bounded, promote by predefined criteria, and retain a rollback artifact plus a safe rules-based fallback.

## Worked examples and variations

1. A marketing ranker canary sends 5% of eligible traffic to a candidate and monitors unsubscribe rate as a guardrail.
2. A credit decision model may require a parallel human-review phase rather than direct canary denial decisions because individual harm is high.
3. A candidate raises conversion overall but disproportionately lowers approvals for one audited subgroup; the subgroup guardrail blocks promotion.
4. A package regression doubles p99 latency while scores remain unchanged; rollback is warranted because the service SLO is part of system quality.
5. Counterexample: routing “random” traffic by user ID without checking geography or account type can produce a biased canary slice.

## Two ways to see it

A deployment is a risk-limited experiment. A rollback is a control mechanism that caps the time and scope of an unexpected failure.

## Hands-on

Write a release runbook for a candidate model: entry checks, traffic allocation, three promotion gates, two stop conditions, owner, communication channel, and exact rollback command or configuration change. Deliberate failure: use a dashboard alert with no threshold or owner. Reset by simulating the alert, timing rollback, and verifying prediction logs identify both old and new versions.

## Checkpoint

Who may promote or stop the release? What outcome would halt it even if aggregate accuracy improves? Can the old path accept traffic immediately?

## What this does not solve

Canaries cannot make unethical decisions acceptable or solve delayed-label ambiguity. They also require enough exposure and statistical power to detect the harms they claim to guard against.

## Continue, go deeper, apply it

Integrate release gates with calibration, fairness slices, incident response, and human approvals for high-impact decisions.
