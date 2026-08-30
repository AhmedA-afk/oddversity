"""Binary logistic regression trained with batch gradient descent.

Run: python logistic_regression.py
"""
from __future__ import annotations

import numpy as np

from linear_regression import add_intercept


def sigmoid(scores: np.ndarray) -> np.ndarray:
    """Numerically stable sigmoid for ordinary classroom-scale inputs."""
    scores = np.clip(scores, -500, 500)
    return 1.0 / (1.0 + np.exp(-scores))


def fit_logistic(
    x: np.ndarray, y: np.ndarray, learning_rate: float = 0.25, steps: int = 2_500
) -> tuple[np.ndarray, list[float]]:
    """Fit an intercept and coefficients by minimising log loss."""
    design = add_intercept(x)
    weights = np.zeros(design.shape[1])
    history: list[float] = []
    for _ in range(steps):
        probability = sigmoid(design @ weights)
        probability = np.clip(probability, 1e-12, 1 - 1e-12)
        weights -= learning_rate * (design.T @ (probability - y)) / len(y)
        history.append(float(-np.mean(y * np.log(probability) + (1 - y) * np.log(1 - probability))))
    return weights, history


def predict_proba(x: np.ndarray, weights: np.ndarray) -> np.ndarray:
    return sigmoid(add_intercept(x) @ weights)


def demo() -> dict[str, float]:
    # A tiny linearly separable classification problem: values >= 0.5 are positive.
    x = np.array([[-2.0], [-1.0], [-0.4], [0.2], [0.8], [1.5], [2.0]])
    y = np.array([0, 0, 0, 0, 1, 1, 1], dtype=float)
    weights, history = fit_logistic(x, y)
    probabilities = predict_proba(x, weights)
    accuracy = np.mean((probabilities >= 0.5) == y)
    return {"accuracy": float(accuracy), "initial_log_loss": history[0], "final_log_loss": history[-1]}


def self_check() -> None:
    result = demo()
    assert result["accuracy"] == 1.0
    assert result["final_log_loss"] < result["initial_log_loss"]


if __name__ == "__main__":
    self_check()
    print("Logistic regression checks passed:", demo())
