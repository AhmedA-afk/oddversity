"""Principal-component analysis via covariance eigendecomposition and SVD.

Run: python pca_svd.py
"""
from __future__ import annotations

import numpy as np


def pca_eigen(x: np.ndarray, components: int = 1) -> tuple[np.ndarray, np.ndarray]:
    """Return centered projections and principal axes using covariance eigenvectors."""
    centered = x - x.mean(axis=0)
    _, vectors = np.linalg.eigh(np.cov(centered, rowvar=False))
    axes = vectors[:, ::-1][:, :components]
    return centered @ axes, axes


def pca_svd(x: np.ndarray, components: int = 1) -> tuple[np.ndarray, np.ndarray]:
    """Return the same PCA projections using the right singular vectors."""
    centered = x - x.mean(axis=0)
    _, _, vt = np.linalg.svd(centered, full_matrices=False)
    axes = vt[:components].T
    return centered @ axes, axes


def demo() -> dict[str, float]:
    # Nearly all variation lies along y=x.
    x = np.array([[0, 0.1], [1, 0.9], [2, 2.1], [3, 2.9], [4, 4.1]], dtype=float)
    eigen_projection, _ = pca_eigen(x)
    svd_projection, _ = pca_svd(x)
    correlation = abs(float(np.corrcoef(eigen_projection[:, 0], svd_projection[:, 0])[0, 1]))
    return {"absolute_projection_correlation": correlation}


def self_check() -> None:
    assert demo()["absolute_projection_correlation"] > 0.999999


if __name__ == "__main__":
    self_check()
    print("PCA/SVD checks passed:", demo())
