"""k-nearest-neighbours classification with Euclidean distance.

Run: python knn.py
"""
from __future__ import annotations

import numpy as np


def predict_one(x_train: np.ndarray, y_train: np.ndarray, query: np.ndarray, k: int = 3) -> int:
    """Predict a binary/integer label; ties resolve to the smaller label."""
    if not 1 <= k <= len(x_train):
        raise ValueError("k must be between 1 and the number of training examples")
    distances = np.linalg.norm(x_train - query, axis=1)
    labels = y_train[np.argsort(distances)[:k]]
    counts = np.bincount(labels.astype(int))
    return int(np.flatnonzero(counts == counts.max())[0])


def demo() -> dict[str, int]:
    x = np.array([[0, 0], [0, 1], [1, 0], [4, 4], [4, 5], [5, 4]], dtype=float)
    y = np.array([0, 0, 0, 1, 1, 1])
    return {"near_origin": predict_one(x, y, np.array([0.8, 0.4]), 3), "near_far_cluster": predict_one(x, y, np.array([4.2, 4.3]), 3)}


def self_check() -> None:
    result = demo()
    assert result == {"near_origin": 0, "near_far_cluster": 1}
    try:
        predict_one(np.array([[0.0]]), np.array([0]), np.array([0.0]), 2)
    except ValueError:
        return
    raise AssertionError("invalid k must fail")


if __name__ == "__main__":
    self_check()
    print("kNN checks passed:", demo())
