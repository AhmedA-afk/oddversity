---
title: "Lab: release a model with a kill switch"
track: "machine-learning"
order: 615
status: live
summary: "Design a small end-to-end release that can be observed, constrained, and safely stopped when assumptions fail."
duration: "35 min lab"
updated: "2026-08-30"
---

## The short answer

Your goal is not simply to deploy a classifier. Release it behind a versioned routing policy with a monitored canary, safe fallback, audit logs, and a kill switch that changes behavior immediately without destroying evidence.

## Why this matters

The most dangerous production failure is often not an inaccurate prediction but an inability to stop an unsafe system. This lab makes operational reversibility a first-class model requirement.

## How it works

Use a simple risk classifier and two decision paths: candidate model and conservative baseline. Build a configuration-controlled router with `enabled`, traffic allocation, and fallback reason fields. Log request ID, timestamp, entity slice, model/feature/policy versions, score, decision, latency, and fallback. Define gates and rehearse disabling the candidate while preserving raw evidence and access controls.

## Worked examples and variations

1. Canary 10% of low-risk marketing leads while high-value accounts remain on the champion.
2. A feature-service timeout sends traffic to a conservative manual-review rule and records the exact fallback reason.
3. A null-rate spike disables only the affected region because other regions remain within contract.
4. A latency regression triggers the kill switch even though offline and shadow metrics were strong.
5. Counterexample: deleting the model deployment is not a kill switch if clients retry, cached scores persist, or audit evidence disappears.

## Two ways to see it

A kill switch is a safety control. It is also a product policy: someone must define what decisions happen during degradation and who is authorized to choose it.

## Hands-on

Implement a local router with a configuration object such as:

```json
{
  "candidate_enabled": true,
  "candidate_traffic_percent": 10,
  "fallback_policy": "manual_review_v2"
}
```

Send 50 synthetic requests, then inject missing critical features and p99 latency above the release gate. Deliberate failure: turn off only the scoring process and leave the caller without a fallback. Reset by flipping the configuration, verifying every request receives a versioned safe decision, and producing an incident timeline from logs.

## Checkpoint

Who can activate the kill switch? How fast does it take effect? What decision is made while it is active, and how do you prove no candidate decisions leaked through?

## What this does not solve

A kill switch cannot make an inherently harmful policy safe, recover lost labels, or decide the correct human fallback workload. Those require governance and capacity planning.

## Continue, go deeper, apply it

Extend the lab with role-based authorization, regional controls, automatic safety gates with human confirmation, and a rollback rehearsal in a staging environment.
