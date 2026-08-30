# Drift incident response

## Decision framing

Detect when a loan-risk model should be investigated or paused after a policy change; never use an automated alarm as a denial decision.

## Reproduce

Create an environment, install the two declared packages, then run:

    pip install -r requirements.txt
    python solution.py --make-data

The command regenerates deterministic synthetic data in data/synthetic.csv and writes metrics to artifacts/solution_metrics.json. starter.py runs the deliberately simple baseline. No network calls, hidden data, or undeclared packages are required.

## Point-in-time rule

Train on the reference period and evaluate the later post-policy period. period is an investigation label, not a feature. The supplied runner uses the oldest 80% of rows for training and the newest 20% for evaluation. Never shuffle this lab.

## Baseline and target

The baseline is class-prior classifier; the reference solution is logistic regression plus Population Stability Index alarm. The holdout utilization PSI must trigger the 0.20 drift alarm.

## Required failure-mode exercise

Mix post-policy rows into training, then compare the masked shift with the reference-only result. Explain why retraining is not automatically the correct remediation.

## Submit

Run the acceptance checks, preserve the metrics JSON, and write incident_report.md with severity, owner, rollback/hold action, and revalidation plan. See rubric.md and expected_artifacts.md for grading criteria.

