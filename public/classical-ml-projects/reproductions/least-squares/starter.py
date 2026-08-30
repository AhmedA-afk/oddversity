"""Learner-owned ordinary least-squares implementation."""
from __future__ import annotations

import csv
import json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).parent

def load_fixture(path: Path = ROOT / "fixture.csv"):
    rows = list(csv.DictReader(path.open()))
    x = np.array([[float(row["x"])] for row in rows], dtype=float)
    y = np.array([float(row["y"]) for row in rows], dtype=float)
    return x, y

def fit_least_squares(x: np.ndarray, y: np.ndarray):
    """Return (intercept, coefficients) using the normal equation.

    TODO: add an intercept column, compute X^T X and X^T y, and solve the system.
    Raise a useful error for a singular design rather than silently returning junk.
    """
    raise NotImplementedError("TODO: implement normal-equation least squares")

def predict(x: np.ndarray, intercept: float, coefficients: np.ndarray) -> np.ndarray:
    """TODO: return one prediction per row of x."""
    raise NotImplementedError("TODO: implement prediction")

def save_artifacts(x: np.ndarray, intercept: float, coefficients: np.ndarray,
                   output_dir: Path = ROOT / "artifacts") -> None:
    """TODO: write model.json and predictions.csv deterministically."""
    raise NotImplementedError("TODO: write reproducible artifacts")

if __name__ == "__main__":
    X, y = load_fixture()
    b, w = fit_least_squares(X, y)
    save_artifacts(X, b, w)
    print({"intercept": b, "coefficients": np.asarray(w).tolist()})
