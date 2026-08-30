# Ranking feedback loop

## Decision framing

Order ten candidate items for a user while treating click labels as exposure-biased feedback, not direct relevance truth.

## Reproduce

Create an environment, install the two declared packages, then run:

    pip install -r requirements.txt
    python solution.py --make-data

The command regenerates deterministic synthetic data in data/synthetic.csv and writes metrics to artifacts/solution_metrics.json. starter.py runs the deliberately simple baseline. No network calls, hidden data, or undeclared packages are required.

## Point-in-time rule

Train on older impressions and evaluate on newer impressions. logged_position is deliberately excluded from model features. The supplied runner uses the oldest 80% of rows for training and the newest 20% for evaluation. Never shuffle this lab.

## Baseline and target

The baseline is class-prior scoring; the reference solution is logistic regression. NDCG@5 must improve by at least 0.08 over the prior baseline.

## Required failure-mode exercise

Include logged_position. Explain how position bias creates attractive offline results but can reinforce past exposure in production.

## Submit

Run the acceptance checks, preserve the metrics JSON, and write feedback_risk.md with an exploration or randomisation proposal and a guardrail metric. See rubric.md and expected_artifacts.md for grading criteria.

