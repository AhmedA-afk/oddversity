---
title: "Executable Classical ML lab studio"
track: "machine-learning"
order: 871
status: live
summary: "Run deterministic from-scratch implementations and six reproducible applied projects with tests, artefact requirements, and rubrics."
duration: "30 min setup + project work"
updated: "2026-08-30"
---

## What this is

This course now has executable work, not only hands-on prompts. Start with the
NumPy-only core package, then complete applied labs using fixed synthetic data,
explicit split rules, starter code, a reference solution, expected artefacts,
and a marking rubric.

## Core algorithms from scratch

Download or inspect the [core lab README](/classical-ml-labs/core/README.md).
It includes linear and logistic regression, kNN, a decision-tree split search,
k-means, PCA/SVD, Gaussian-mixture EM, and calibration metrics.

Run the verification suite:

```bash
python run_all.py
```

The suite must pass before comparing your implementation with a library.
Deliberately reverse one update sign or remove a numerical safeguard; explain
the failed assertion, then restore the implementation.

## Applied projects

1. [House-price regression](/classical-ml-labs/applied/01-house-price-regression/README.md)
2. [Churn classification](/classical-ml-labs/applied/02-churn-classification/README.md)
3. [Fraud triage under imbalance](/classical-ml-labs/applied/03-fraud-triage-under-imbalance/README.md)
4. [Demand forecasting](/classical-ml-labs/applied/04-demand-forecasting/README.md)
5. [Ranking and feedback loops](/classical-ml-labs/applied/05-ranking-feedback-loop/README.md)
6. [Drift incident response](/classical-ml-labs/applied/06-drift-incident-response/README.md)

Each folder has a starter, solution, requirements, expected artefacts, and
rubric. Treat the solution as a review tool after your own attempt, not as the
first reading.

## Submission standard

For each project, submit the code, command/output log, data and split card,
baseline comparison, error analysis, risk note, and a brief decision memo.
If a claimed result cannot be reproduced from the stated commands, it is not a
passing result.

## What the labs still do not do

They use deterministic synthetic data to make the method and failure modes
inspectable. They do not replace permissioned real-world validation, domain
review, or operational approval.
