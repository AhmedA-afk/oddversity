# Expected artifacts

- `artifacts/pca_metrics.json`: explained-variance ratios and reconstruction MSE
  for ranks 1 and 2.
- `artifacts/reconstruction.csv`: rank-1 reconstructed features for every row.

A rank-2 reconstruction must not be worse than rank-1. Principal-component signs may
flip; the tests evaluate subspace effects rather than a particular sign convention.
