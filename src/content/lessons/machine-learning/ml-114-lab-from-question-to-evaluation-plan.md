---
title: "Lab: from question to evaluation plan"
track: "machine-learning"
order: 114
status: live
summary: "Build a reviewable ML plan before training: decision, data contract, split, baselines, metrics, and stop conditions."
duration: "45 min lab"
updated: "2026-08-30"
---

## The short answer

Before touching a model, write a one-page evaluation plan that another person can challenge. It should name the decision, unit, `t0`, target horizon, data-generating process, feature availability, dependency-aware split, baselines, metric and threshold policy, risks, and evidence required to proceed.

## Why this matters

Most wasted ML work comes from optimizing an underspecified question. A plan turns assumptions into reviewable choices while changing them is cheap. It also separates “can we predict?” from “should we make this decision?”

## How it works

Use this skeleton:

```text
Decision and owner:
Unit / prediction time / action horizon:
Target and label source:
Population and exclusion rule:
Feature availability contract:
Split and final test policy:
Baselines:
Metric, threshold, capacity, and harms:
Failure modes, privacy/fairness review, and stop conditions:
Reproducibility record:
```

Treat every blank as a research task, not a field to fill with a guess. Decide which result would stop the project—for example, no improvement over a simple rule under the intended review capacity.

## Worked examples and variations

1. Triage customer support: one row per ticket at opening; action is expedited review; target is a verified escalation within seven days.
2. Predict machine failure: one row per machine-shift; split forward in time and by machine; action must account for maintenance capacity.
3. Prioritize document review: one row per document at ingestion; labels from final reviewer outcomes may be delayed and policy-dependent.
4. Boundary case: an exploratory project with no action owner can have a discovery plan, but should not claim production readiness.
5. Counterexample: “use ML to improve retention” without a defined intervention has no lawful label, threshold, or evaluation of value.

## Two ways to see it

This plan is a preregistration-lite: it limits retrofitting success criteria after results appear. It is also a product requirements document: it describes the user, action, operating constraints, and acceptance test.

## Hands-on

Choose a public or synthetic tabular problem and complete the skeleton in 45 minutes. Intentionally write a random row split before identifying dependencies. Reset by listing entity, timestamp, batch, and geography fields; revise the split and explain the effect. Ask a peer to find one impossible feature at `t0`.

## Checkpoint

- Can an operator explain what happens after a high score?
- Is your target observed after `t0` and mature for all evaluated rows?
- What baseline result would make you stop rather than tune further?

## What this does not solve

Planning does not supply consent, policy authority, reliable labels, or production infrastructure. Escalate those missing prerequisites rather than papering over them.

## Continue, go deeper, apply it

Use the plan to build the first pipeline, then revisit each assumption after the baseline’s error analysis. The next case study asks you to make the plan under a real operational constraint.
