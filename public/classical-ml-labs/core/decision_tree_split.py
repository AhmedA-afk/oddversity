"""One CART-style numerical split search using Gini impurity.

Run: python decision_tree_split.py
"""
from __future__ import annotations

import numpy as np


def gini(labels: np.ndarray) -> float:
    """Return 0 for a pure node and larger values for mixed class labels."""
    if len(labels) == 0:
        return 0.0
    _, counts = np.unique(labels, return_counts=True)
    probabilities = counts / len(labels)
    return float(1 - np.sum(probabilities**2))


def best_split(feature: np.ndarray, labels: np.ndarray) -> tuple[float, float]:
    """Find the threshold with minimum weighted child Gini impurity."""
    values = np.unique(feature)
    candidates = (values[:-1] + values[1:]) / 2
    if len(candidates) == 0:
        raise ValueError("need at least two distinct feature values")
    best_threshold, best_score = float(candidates[0]), float("inf")
    for threshold in candidates:
        left, right = labels[feature <= threshold], labels[feature > threshold]
        score = (len(left) * gini(left) + len(right) * gini(right)) / len(labels)
        if score < best_score:
            best_threshold, best_score = float(threshold), float(score)
    return best_threshold, best_score


def demo() -> dict[str, float]:
    feature = np.array([1, 2, 3, 8, 9, 10], dtype=float)
    labels = np.array([0, 0, 0, 1, 1, 1])
    threshold, impurity = best_split(feature, labels)
    return {"threshold": threshold, "weighted_gini": impurity}


def self_check() -> None:
    result = demo()
    assert result["threshold"] == 5.5
    assert result["weighted_gini"] == 0.0


if __name__ == "__main__":
    self_check()
    print("Decision-tree split checks passed:", demo())
