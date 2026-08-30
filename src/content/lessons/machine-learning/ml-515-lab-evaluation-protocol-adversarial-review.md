---
title: "Lab: evaluation protocol adversarial review"
track: "machine-learning"
order: 515
status: live
summary: "Stress-test an ML evaluation plan by actively trying to find leakage, wrong units, invalid comparisons, unsupported claims, and missing safeguards."
duration: "45 min lab"
updated: "2026-08-30"
---

## The short answer

Before a model is approved, run a structured adversarial review of the evaluation protocol. Reviewers should try to break the result: find information that crosses the split, mismatches between metric and decision, group or time dependence, post-hoc choices, unsupported causal language, and unowned monitoring gaps. The aim is a stronger protocol, not a performative critique.

## Why this matters

The most expensive ML failures often pass a narrow accuracy check. A second set of eyes with permission to challenge assumptions catches errors the builder has normalized. Adversarial review is especially valuable when a result is surprising, commercially attractive, or consequential for people.

## How it works

Prepare a review packet: problem statement, decision and prediction time, data lineage, feature availability table, split diagram, model-search ledger, metrics with operating thresholds, uncertainty report, slice report, error samples, causal claims, and deployment runbook. Assign reviewers to distinct attacks: leakage and timing, data quality, statistics, product workflow, affected-user impact, and operations.

For each finding, record evidence, severity, owner, remedy, and re-evaluation needed. Separate a confirmed flaw from a question and a preference. Re-run the entire pipeline after material changes; do not patch a chart manually. A reviewer can recommend no-go when evidence is insufficient.

## Worked examples and variations

### Example 1: timestamp attack

A reviewer finds that a feature is updated after the prediction timestamp. Remove it, rebuild folds, and compare the honest result with the leaked one.

### Example 2: unit-of-analysis attack

A churn model validates by row despite multiple rows per customer. Replace it with customer-grouped evaluation and review the changed error profile.

### Example 3: metric attack

A fraud model reports ROC AUC but has a fixed review queue. Require precision and recall at queue capacity and a cost-sensitive threshold decision.

### Example 4: causal-language attack

A report says a recommendation increased retention based on offline prediction accuracy. Rewrite it as a predictive claim and propose an experiment for the intervention claim.

### Boundary case: no independent reviewer

If a small team cannot staff a formal panel, use a checklist and asynchronous review from someone who did not build the pipeline. Document the reduced assurance rather than pretending it was independent.

### Counterexample: checklist theater

Marking every item complete without evidence or authority creates false confidence. Each check should link to an artifact, test, or explicit unresolved risk.

## Two ways to see it

As quality assurance, the lab searches for defects in an experimental system. As governance, it gives people a documented chance to challenge a decision before its costs are externalized.

## Hands-on

Choose an existing project or create a one-page fictional model proposal. Conduct a 30-minute review using the packet above. Deliberately insert one leakage feature, one wrong split, one post-hoc metric, and one causal overclaim; have a reviewer find them. Reset by removing every planted flaw, rerunning the appropriate evaluation, and writing a go, conditional-go, or no-go memo with owners and dates.

## Checkpoint

- [ ] The review packet contains evidence, not only claims and charts.
- [ ] Findings have severity, owner, remedy, and required re-evaluation.
- [ ] Approval language matches the strength and limits of the evidence.

## What this does not solve

Adversarial review cannot make harmful objectives acceptable or substitute for subject-matter, legal, privacy, and stakeholder oversight where those are required.

## Continue, go deeper, apply it

Continue with the promotion-model versus policy-change case study. Go deeper by scheduling periodic post-launch reviews. Apply this by adding an adversarial review gate to every high-impact release.
