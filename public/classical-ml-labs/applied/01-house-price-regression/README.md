# House-price regression

## Decision framing

Estimate a defensible sale-price range for an agent before listing; an agent, not the model, owns the final price.

## Reproduce

Create an environment, install the two declared packages, then run:

    pip install -r requirements.txt
    python solution.py --make-data

The command regenerates deterministic synthetic data in data/synthetic.csv and writes metrics to artifacts/solution_metrics.json. starter.py runs the deliberately simple baseline. No network calls, hidden data, or undeclared packages are required.

## Point-in-time rule

Only property attributes observed on listing_date are eligible features. The eventual sale_price is a label, never an input. The supplied runner uses the oldest 80% of rows for training and the newest 20% for evaluation. Never shuffle this lab.

## Baseline and target

The baseline is mean sale price (DummyRegressor); the reference solution is gradient-boosted regression. MAE must be at least 18% below the mean-price baseline.

## Required failure-mode exercise

Add sale_price to the feature frame, or shuffle rows before splitting. Record the implausible result, explain target leakage or future leakage, then restore the chronological split.

## Submit

Run the acceptance checks, preserve the metrics JSON, and write residual_review.md covering three expensive holdout errors and a missing-feature hypothesis. See rubric.md and expected_artifacts.md for grading criteria.

