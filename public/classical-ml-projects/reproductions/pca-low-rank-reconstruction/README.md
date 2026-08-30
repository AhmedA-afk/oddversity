# PCA low-rank reconstruction

Implement PCA with centering and SVD/eigendecomposition, then evaluate rank-1 versus
rank-2 reconstruction on a deterministic low-rank fixture. The artifact contract
captures both the learned basis and reconstruction diagnostics.

## Deliverables

- Implement PCA fit, transform, inverse transform, and reconstruction reporting.
- Save `artifacts/pca_metrics.json` and `artifacts/reconstruction.csv`.
- Pass `python test_public.py`.

Do not call a PCA library. NumPy SVD is allowed because the learning objective is the
correct centering, component ordering, projection, reconstruction, and evaluation.
