# Expected artifacts

- `artifacts/forest_metrics.json`: `oob_accuracy`, `mean_tree_correlation`,
  `n_trees`, and `covered_oob_rows`.
- `artifacts/oob_predictions.csv`: one row per fixture sample with the OOB vote
  where available.

The acceptance test checks determinism, valid OOB coverage, and sensible metric
bounds. It deliberately does not require a single implementation strategy.
