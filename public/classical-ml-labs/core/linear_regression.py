"""From-scratch linear regression: normal equation and batch gradient descent.

Run: python linear_regression.py
"""
from __future__ import annotations

import numpy as np


def add_intercept(x: np.ndarray) -> np.ndarray:
    """Prepend a column of ones to a two-dimensional feature matrix."""
    return np.column_stack((np.ones(len(x)), x))


def fit_normal_equation(x: np.ndarray, y: np.ndarray) -> np.ndarray:
    """Return least-squares parameters using a stable pseudoinverse."""
    design = add_intercept(x)
    return np.linalg.pinv(design) @ y


def fit_gradient_descent(
    x: np.ndarray, y: np.ndarray, learning_rate: float = 0.08, steps: int = 2_000
) -> tuple[np.ndarray, list[float]]:
    """Minimise mean squared error with full-batch gradient descent."""
    design = add_intercept(x)
    weights = np.zeros(design.shape[1])
    history: list[float] = []
    for _ in range(steps):
        residual = design @ weights - y
        weights -= learning_rate * (2 / len(y)) * (design.T @ residual)
        history.append(float(np.mean(residual**2)))
    return weights, history


def demo() -> dict[str, float]:
    # y = 1.5 + 2.0x with small, deterministic noise.
    x = np.arange(0.0, 6.0).reshape(-1, 1)
    y = 1.5 + 2.0 * x[:, 0] + np.array([0.0, 0.1, -0.1, 0.05, -0.05, 0.0])
    closed = fit_normal_equation(x, y)
    gd, history = fit_gradient_descent(x, y)
    return {
        "normal_intercept": float(closed[0]),
        "normal_slope": float(closed[1]),
        "gd_intercept": float(gd[0]),
        "gd_slope": float(gd[1]),
        "initial_mse": history[0],
        "final_mse": history[-1],
    }


def self_check() -> None:
    result = demo()
    assert abs(result["normal_slope"] - 2.0) < 0.03
    assert abs(result["gd_slope"] - result["normal_slope"]) < 1e-4
    assert result["final_mse"] < result["initial_mse"] * 0.01


if __name__ == "__main__":
    self_check()
    print("Linear regression checks passed:", demo())
