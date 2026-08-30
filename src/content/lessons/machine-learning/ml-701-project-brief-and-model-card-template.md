---
title: "Project brief and model card template"
track: "machine-learning"
order: 701
status: live
summary: "Turn a business request into a testable ML decision, then document its limits."
duration: "45 min lab"
updated: "2026-08-30"
---

## The short answer

Do not begin with an algorithm. Write a one-page project brief that defines a decision, a prediction target, a baseline, harms, owners, and a stop condition. Maintain a model card beside the code so claims remain auditable after launch.

## Why this matters

Many failed ML projects are successful model-fitting exercises attached to an undefined product decision. A brief prevents target leakage, metric theater, and deployment of a system whose users, appeal path, or operating limits were never chosen.

## How it works

Create two versioned documents. The brief answers: who decides what, when, using which information available at that moment, and compared with what non-ML process. The model card records data provenance, splits, metrics with uncertainty, subgroup checks, intended use, prohibited use, monitoring signals, and rollback owner. Treat unknowns as open risks rather than optimistic prose.

## Worked examples and variations (4 examples incl. boundary/counterexample)

1. A retention team needs a weekly outreach queue: target is cancellation within 30 days, and the baseline is the current rule-based queue.
2. A house-price estimator supports an analyst's initial range, not an automated offer; the card forbids use for lending eligibility.
3. A screening model may prioritize manual review, but must not diagnose disease because its labels encode prior access to care.
4. Counterexample: “predict customer value” has no decision time, horizon, or action. It is not yet an ML brief.

## Two ways to see it

Operationally, the brief is a contract between domain owner, data owner, and builder. Statistically, it fixes the population, time boundary, loss function, and comparison needed to interpret validation honestly.

## Hands-on

Create `project_brief.md` and `model_card.md` in a new repository. Deliver a decision table with actor, action, timing, available features, target horizon, baseline, primary metric, safety metric, and rollback trigger. Add a data dictionary with a source and collection time for every proposed feature. Intentionally fail the review by adding one feature only known after the decision; label it leakage and remove it. Reset by rerunning the feature list review with a domain owner. Commit both documents before opening a notebook.

## Checkpoint

You can state one action the model changes, one non-ML baseline it must beat, and one use that is explicitly out of scope. A reader can identify which features would be unavailable at prediction time.

## What this does not solve

A good brief does not create representative labels, legal authority, user trust, or a worthwhile intervention. Those require data collection, governance, and product work.

## Continue, go deeper, apply it

Use this template before every lab in this sequence. Revise the card after each evaluation and production incident; a model card is a living operational record, not launch paperwork.
