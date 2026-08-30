"""One-dimensional Gaussian-mixture model trained with expectation maximisation.

Run: python gmm_em.py
"""
from __future__ import annotations

import numpy as np


def normal_pdf(x: np.ndarray, means: np.ndarray, variances: np.ndarray) -> np.ndarray:
    """Evaluate each component density for each example."""
    return np.exp(-0.5 * (x[:, None] - means) ** 2 / variances) / np.sqrt(2 * np.pi * variances)


def fit_gmm_1d(x: np.ndarray, components: int = 2, steps: int = 100) -> tuple[np.ndarray, np.ndarray, np.ndarray, list[float]]:
    """Fit a small GMM. Variance clipping prevents a classroom degeneracy."""
    means = np.linspace(x.min(), x.max(), components)
    variances = np.full(components, np.var(x))
    weights = np.full(components, 1 / components)
    log_likelihoods: list[float] = []
    for _ in range(steps):
        weighted = normal_pdf(x, means, variances) * weights
        total = weighted.sum(axis=1, keepdims=True)
        responsibilities = weighted / np.clip(total, 1e-15, None)
        membership = responsibilities.sum(axis=0)
        weights = membership / len(x)
        means = (responsibilities * x[:, None]).sum(axis=0) / membership
        variances = (responsibilities * (x[:, None] - means) ** 2).sum(axis=0) / membership
        variances = np.clip(variances, 1e-6, None)
        log_likelihoods.append(float(np.log(total).sum()))
    return weights, means, variances, log_likelihoods


def demo() -> dict[str, float]:
    x = np.array([-2.1, -1.9, -1.8, -2.0, 1.8, 2.0, 2.2, 1.9])
    weights, means, _, likelihood = fit_gmm_1d(x)
    return {"mean_gap": float(abs(means[1] - means[0])), "weight_sum": float(weights.sum()), "ll_gain": likelihood[-1] - likelihood[0]}


def self_check() -> None:
    result = demo()
    assert result["mean_gap"] > 3.0
    assert abs(result["weight_sum"] - 1.0) < 1e-10
    assert result["ll_gain"] >= -1e-8


if __name__ == "__main__":
    self_check()
    print("GMM/EM checks passed:", demo())
