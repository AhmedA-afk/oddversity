# Churn classification

## Decision framing

Prioritise retention outreach to customers who may leave, while preserving a human review and contact-policy check.

## Reproduce

Create an environment, install the two declared packages, then run:

    pip install -r requirements.txt
    python solution.py --make-data

The command regenerates deterministic synthetic data in data/synthetic.csv and writes metrics to artifacts/solution_metrics.json. starter.py runs the deliberately simple baseline. No network calls, hidden data, or undeclared packages are required.

## Point-in-time rule

Each row is a month-end snapshot. Only the trailing-30-day behavior available at snapshot_date may be used. The supplied runner uses the oldest 80% of rows for training and the newest 20% for evaluation. Never shuffle this lab.

## Baseline and target

The baseline is class-prior classifier (DummyClassifier); the reference solution is logistic regression. ROC-AUC must improve by at least 0.10 over the prior baseline.

## Required failure-mode exercise

Use a cancellation event recorded after snapshot_date as a feature. Show why it creates perfect-looking but unusable validation, then remove it.

## Submit

Run the acceptance checks, preserve the metrics JSON, and write threshold_memo.md that chooses an outreach threshold with false-positive cost and capacity. See rubric.md and expected_artifacts.md for grading criteria.

