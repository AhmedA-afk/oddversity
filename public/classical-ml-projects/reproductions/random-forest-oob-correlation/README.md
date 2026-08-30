# Random forest: OOB error and tree correlation

Implement a compact random forest using bootstrap samples and randomized feature
subsets. This package evaluates two things that matter in Breiman-style forests:
out-of-bag (OOB) estimation and correlation among tree predictions.

## Deliverables

- Implement a deterministic stump/tree learner, bootstrap forest, OOB prediction,
  and average pairwise tree correlation.
- Save `artifacts/forest_metrics.json` and `artifacts/oob_predictions.csv`.
- Pass `python test_public.py`.

No network or external datasets are needed. `reference_solution.py` exists solely
to validate the public test contract.
