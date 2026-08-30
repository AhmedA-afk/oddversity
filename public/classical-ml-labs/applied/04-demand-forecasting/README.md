# Demand forecasting

## Decision framing

Set a replenishment recommendation for a store-day, leaving safety-stock and supplier decisions to operations.

## Reproduce

Create an environment, install the two declared packages, then run:

    pip install -r requirements.txt
    python solution.py --make-data

The command regenerates deterministic synthetic data in data/synthetic.csv and writes metrics to artifacts/solution_metrics.json. starter.py runs the deliberately simple baseline. No network calls, hidden data, or undeclared packages are required.

## Point-in-time rule

The split is temporal. Promotion, holiday, weather, and day-of-week are known at forecast time; future units are not. The supplied runner uses the oldest 80% of rows for training and the newest 20% for evaluation. Never shuffle this lab.

## Baseline and target

The baseline is historical day-of-week mean; the reference solution is gradient-boosted regression. MAE must be at least 12% below the seasonal baseline.

## Required failure-mode exercise

Randomly split daily rows, then compare that score with the supplied temporal holdout. Explain why random validation hides future regime risk.

## Submit

Run the acceptance checks, preserve the metrics JSON, and write stockout_tradeoff.md quantifying the consequence of under- versus over-forecasting. See rubric.md and expected_artifacts.md for grading criteria.

