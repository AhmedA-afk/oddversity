---
title: "Lab: medical screening with calibration"
track: "machine-learning"
order: 704
status: live
summary: "Practice calibration, threshold selection, and safety review for a high-stakes screening workflow."
duration: "105 min lab"
updated: "2026-08-30"
---

## The short answer

Use a de-identified educational dataset to build a *screening-support* model, validate it across time and subgroups, calibrate probabilities, and select review thresholds from a documented clinical workflow. Never present the exercise as diagnosis.

## Why this matters

In screening, false negatives and false positives have asymmetric human costs. A discriminative score without calibration, intended-use limits, and prospective clinical validation is not safe to use for care.

## How it works

Specify the index time, reference standard, follow-up window, and exclusion criteria with a clinical advisor. Use a locked temporal or external test set. Start with logistic regression, then compare a non-linear model only if it adds clinically meaningful benefit. Report sensitivity, specificity, PPV, NPV, ROC/PR curves, calibration plot, confidence intervals, and missing-data behavior. Set thresholds for human review, not autonomous treatment.

## Worked examples and variations (4 examples incl. boundary/counterexample)

1. A score of 0.20 is useful only if approximately one in five similar cases truly has the outcome.
2. At low prevalence, PPV can remain low even with high specificity.
3. A lower threshold may be appropriate when the follow-up test is safe and inexpensive.
4. Counterexample: training on a diagnosis code entered after a specialist visit makes a deceptively strong but unusable model.

## Two ways to see it

Clinically, calibration communicates risk for a triage conversation. Mathematically, it checks whether predicted probabilities agree with empirical frequencies in relevant groups.

## Hands-on

Deliver a protocol-style brief, cohort flow diagram, temporal split, baseline model, calibrated variant, subgroup metric table, and decision-threshold worksheet. Intentionally fail by evaluating only ROC-AUC or by fitting calibration on the held-out test set; show why the result is invalid, then reset with validation-only calibration and a sealed test set. Add an escalation rule for missing critical inputs and a statement requiring clinician oversight.

## Checkpoint

You can explain why a high AUC is insufficient, why prevalence changes PPV, and why threshold choice belongs to the care workflow.

## What this does not solve

This is not clinical validation, medical advice, regulatory clearance, or evidence that a model improves patient outcomes.

## Continue, go deeper, apply it

Study decision-curve analysis, prospective silent trials, dataset shift across sites, and governance requirements with qualified clinical and regulatory partners.
