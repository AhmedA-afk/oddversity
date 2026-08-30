"""A small deterministic implementation of k-means clustering.

Run: python kmeans.py
"""
from __future__ import annotations

import numpy as np


def fit_kmeans(x: np.ndarray, k: int, steps: int = 100) -> tuple[np.ndarray, np.ndarray]:
    """Cluster data, initialising centroids from the first k observations.

    This deterministic choice is for teaching; production k-means uses multiple
    random starts or k-means++ because initialization can be a failure mode.
    """
    if not 1 <= k <= len(x):
        raise ValueError("k must be between 1 and the number of examples")
    centroids = x[:k].astype(float).copy()
    for _ in range(steps):
        labels = np.argmin(np.linalg.norm(x[:, None] - centroids[None, :], axis=2), axis=1)
        updated = np.array([x[labels == cluster].mean(axis=0) if np.any(labels == cluster) else centroids[cluster] for cluster in range(k)])
        if np.allclose(updated, centroids):
            break
        centroids = updated
    return centroids, labels


def demo() -> dict[str, float]:
    x = np.array([[0, 0], [0, 1], [1, 0], [8, 8], [8, 9], [9, 8]], dtype=float)
    centroids, labels = fit_kmeans(x, 2)
    separation = float(np.linalg.norm(centroids[0] - centroids[1]))
    return {"clusters": float(len(np.unique(labels))), "centroid_separation": separation}


def self_check() -> None:
    result = demo()
    assert result["clusters"] == 2.0
    assert result["centroid_separation"] > 10.0


if __name__ == "__main__":
    self_check()
    print("k-means checks passed:", demo())
