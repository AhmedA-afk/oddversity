"""Binary classification metrics and an expected-calibration-error calculation.

Run: python calibration_metrics.py
"""
from __future__ import annotations

import numpy as np


def confusion_counts(y_true: np.ndarray, probabilities: np.ndarray, threshold: float = 0.5) -> tuple[int, int, int, int]:
    predicted = probabilities >= threshold
    return (
        int(np.sum((predicted == 1) & (y_true == 1))),
        int(np.sum((predicted == 0) & (y_true == 0))),
        int(np.sum((predicted == 1) & (y_true == 0))),
        int(np.sum((predicted == 0) & (y_true == 1))),
    )


def binary_metrics(y_true: np.ndarray, probabilities: np.ndarray, threshold: float = 0.5) -> dict[str, float]:
    """Compute accuracy, precision, recall, F1, Brier score, and log loss."""
    tp, tn, fp, fn = confusion_counts(y_true, probabilities, threshold)
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    clipped = np.clip(probabilities, 1e-12, 1 - 1e-12)
    return {
        "accuracy": (tp + tn) / len(y_true),
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "brier": float(np.mean((probabilities - y_true) ** 2)),
        "log_loss": float(-np.mean(y_true * np.log(clipped) + (1 - y_true) * np.log(1 - clipped))),
    }


def expected_calibration_error(y_true: np.ndarray, probabilities: np.ndarray, bins: int = 5) -> float:
    """Estimate calibration error by comparing mean confidence and outcome per bin."""
    edges = np.linspace(0, 1, bins + 1)
    error = 0.0
    for lower, upper in zip(edges[:-1], edges[1:]):
        mask = (probabilities >= lower) & ((probabilities < upper) if upper < 1 else (probabilities <= upper))
        if np.any(mask):
            error += mask.mean() * abs(probabilities[mask].mean() - y_true[mask].mean())
    return float(error)


def demo() -> dict[str, float]:
    y = np.array([0, 0, 0, 1, 1, 1])
    probabilities = np.array([0.05, 0.20, 0.35, 0.70, 0.85, 0.95])
    result = binary_metrics(y, probabilities)
    result["ece"] = expected_calibration_error(y, probabilities)
    return result


def self_check() -> None:
    result = demo()
    assert result["accuracy"] == 1.0
    assert 0 <= result["ece"] <= 1
    bad = binary_metrics(np.array([0, 1]), np.array([0.99, 0.01]))
    assert bad["log_loss"] > 4.0


if __name__ == "__main__":
    self_check()
    print("Calibration and metric checks passed:", demo())
