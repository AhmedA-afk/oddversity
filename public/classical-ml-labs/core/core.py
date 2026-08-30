"""Small, deterministic classical-ML implementations for learning."""
from __future__ import annotations
import numpy as np


def add_intercept(x: np.ndarray) -> np.ndarray:
    return np.column_stack([np.ones(len(x)), x])


def least_squares(x: np.ndarray, y: np.ndarray) -> np.ndarray:
    """Stable least squares; avoids explicit inversion of X.T @ X."""
    return np.linalg.lstsq(add_intercept(x), y, rcond=None)[0]


def linear_gradient_descent(x: np.ndarray, y: np.ndarray, lr=0.05, steps=3000) -> np.ndarray:
    design = add_intercept(x)
    beta = np.zeros(design.shape[1])
    for _ in range(steps):
        residual = design @ beta - y
        beta -= lr * (2 / len(y)) * design.T @ residual
    return beta


def sigmoid(score: np.ndarray) -> np.ndarray:
    score = np.clip(score, -35, 35)
    return 1 / (1 + np.exp(-score))


def logistic_gradient_descent(x: np.ndarray, y: np.ndarray, lr=0.2, steps=3000) -> np.ndarray:
    design = add_intercept(x)
    beta = np.zeros(design.shape[1])
    for _ in range(steps):
        beta -= lr * (design.T @ (sigmoid(design @ beta) - y)) / len(y)
    return beta


def knn_predict(train_x: np.ndarray, train_y: np.ndarray, query: np.ndarray, k=3) -> float:
    distances = np.sum((train_x - query) ** 2, axis=1)
    nearest = np.argsort(distances)[:k]
    return float(np.mean(train_y[nearest]))


def best_squared_error_split(x: np.ndarray, y: np.ndarray) -> tuple[float, float]:
    """Return threshold and weighted within-leaf SSE for one numeric feature."""
    best = (np.nan, np.inf)
    for threshold in np.unique(x)[:-1]:
        left, right = y[x <= threshold], y[x > threshold]
        if len(left) == 0 or len(right) == 0:
            continue
        sse = ((left - left.mean()) ** 2).sum() + ((right - right.mean()) ** 2).sum()
        if sse < best[1]:
            best = (float(threshold), float(sse))
    return best


def kmeans(x: np.ndarray, k=2, steps=100, seed=0) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(seed)
    centres = x[rng.choice(len(x), k, replace=False)].astype(float)
    for _ in range(steps):
        labels = np.argmin(((x[:, None, :] - centres[None, :, :]) ** 2).sum(axis=2), axis=1)
        new_centres = np.array([x[labels == j].mean(axis=0) if np.any(labels == j) else centres[j] for j in range(k)])
        if np.allclose(new_centres, centres):
            break
        centres = new_centres
    return centres, labels


def pca(x: np.ndarray, components=1) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    mean = x.mean(axis=0)
    centred = x - mean
    _, singular_values, vt = np.linalg.svd(centred, full_matrices=False)
    directions = vt[:components]
    return centred @ directions.T, directions, singular_values


def gmm_1d(x: np.ndarray, means=(-1.0, 1.0), variances=(1.0, 1.0), steps=50) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Two-component EM with variance floor; returns weights, means, variances."""
    x = np.asarray(x, dtype=float)
    means, variances = np.array(means, float), np.array(variances, float)
    weights = np.ones(2) / 2
    for _ in range(steps):
        log_prob = np.log(weights)[None, :] - .5 * (np.log(2 * np.pi * variances)[None, :] + (x[:, None] - means[None, :]) ** 2 / variances[None, :])
        log_prob -= log_prob.max(axis=1, keepdims=True)
        responsibility = np.exp(log_prob)
        responsibility /= responsibility.sum(axis=1, keepdims=True)
        count = responsibility.sum(axis=0) + 1e-12
        weights = count / len(x)
        means = (responsibility * x[:, None]).sum(axis=0) / count
        variances = np.maximum((responsibility * (x[:, None] - means[None, :]) ** 2).sum(axis=0) / count, 1e-6)
    return weights, means, variances


def brier_score(probability: np.ndarray, y: np.ndarray) -> float:
    return float(np.mean((np.asarray(probability) - np.asarray(y)) ** 2))


def expected_calibration_error(probability: np.ndarray, y: np.ndarray, bins=5) -> float:
    probability, y = np.asarray(probability), np.asarray(y)
    edges = np.linspace(0, 1, bins + 1)
    total = 0.0
    for low, high in zip(edges[:-1], edges[1:]):
        mask = (probability >= low) & ((probability < high) if high < 1 else (probability <= high))
        if mask.any():
            total += mask.mean() * abs(probability[mask].mean() - y[mask].mean())
    return float(total)
