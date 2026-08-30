---
title: "Target design and label quality"
track: "machine-learning"
order: 103
status: live
summary: "Design labels that represent the decision you want to improve, and quantify uncertainty when labels are proxies."
duration: "25 min read"
updated: "2026-08-30"
---

## The short answer

A target is an operational definition of success or failure, not a natural fact sitting in a table. Specify its event, horizon, source, exclusion rules, and uncertainty. Train on a proxy only when you can explain how its errors affect the decision.

## Why this matters

Labels often encode past policy. A “successful applicant” label among approved loans says something about approvals and repayment, not necessarily repayment for everyone who applied. Optimizing a convenient proxy can optimize paperwork rather than the outcome users care about.

## How it works

Write a label card containing: decision objective, event definition, observation window, adjudicator/source, delay, known false positives/negatives, and coverage. For noisy binary labels, reason with sensitivity and specificity:

```text
observed label = true event + annotation/measurement error
```

Review disagreements on a stratified sample. If labels are delayed, do not treat recent unlabeled cases as negatives; they may be censored.

## Worked examples and variations

1. Spam: “user clicked report” misses spam never seen and benign messages reported in error.
2. Medical triage: a diagnosis code reflects clinician documentation and testing access, not necessarily biological disease.
3. Sales lead scoring: “closed-won” is influenced by sales follow-up; lack of contact is not customer rejection.
4. Boundary case: a calibrated laboratory assay with blinded review can be a high-quality label, yet its threshold still embodies a decision.
5. Counterexample: using “number of arrests” as a direct target for crime risk confuses enforcement exposure with underlying offending.

## Two ways to see it

In measurement theory, a label is an instrument with error. In product terms, it is a contract for what the model will optimize. Both views force you to inspect the gap between proxy and goal.

## Hands-on

Draft a label card and ask a domain reviewer to label ten borderline cases independently. Intentionally collapse “unknown” into negative and calculate the resulting class balance. Reset by preserving an unknown state and documenting when those cases mature.

## Checkpoint

- What real-world event does a positive label stand for?
- Who or what creates it, and under which policy?
- Which cases have not had enough time to become observable?

## What this does not solve

Label quality review cannot prove a target is ethical or useful. It should be combined with decision-cost, subgroup, and causal analysis.

## Continue, go deeper, apply it

Use the finished label card in a data audit, then choose evaluation metrics that match the target’s uncertainty and decision cost.
