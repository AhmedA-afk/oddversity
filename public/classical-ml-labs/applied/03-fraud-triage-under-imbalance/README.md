# Fraud triage under imbalance

## Decision framing

Rank transactions for a fixed manual-review queue; do not automatically decline payment based on this exercise.

## Reproduce

Create an environment, install the two declared packages, then run:

    pip install -r requirements.txt
    python solution.py --make-data

The command regenerates deterministic synthetic data in data/synthetic.csv and writes metrics to artifacts/solution_metrics.json. starter.py runs the deliberately simple baseline. No network calls, hidden data, or undeclared packages are required.

## Point-in-time rule

Features must exist at event_time. The queue reviews exactly the top 5% of the future holdout scores. The supplied runner uses the oldest 80% of rows for training and the newest 20% for evaluation. Never shuffle this lab.

## Baseline and target

The baseline is class-prior scoring; the reference solution is class-weighted logistic regression. Recall among the top 5% review budget must be at least 0.20.

## Required failure-mode exercise

Optimise accuracy on the imbalanced label and compare it with recall at review capacity. Explain why the apparently strong accuracy is operationally useless.

## Submit

Run the acceptance checks, preserve the metrics JSON, and write queue_policy.md with a review budget, missed-fraud cost, and escalation rule. See rubric.md and expected_artifacts.md for grading criteria.

