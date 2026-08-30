"""Learner-owned AdaBoost with threshold decision stumps."""
from __future__ import annotations
import csv, json
from pathlib import Path
import numpy as np
ROOT=Path(__file__).parent
def load_fixture(path=ROOT / "fixture.csv"):
    rows=list(csv.DictReader(path.open()))
    return np.array([float(r["x"]) for r in rows]), np.array([int(r["label"]) for r in rows])
def best_stump(x, y, weights):
    """TODO: return (threshold, polarity, weighted_error) for the best stump.
    A polarity of 1 means predict +1 for x >= threshold; -1 reverses it."""
    raise NotImplementedError("TODO: search deterministic thresholds and polarities")
def fit_adaboost(x, y, rounds=8):
    """TODO: return a list of (threshold, polarity, alpha) weak learners."""
    raise NotImplementedError("TODO: implement weighted AdaBoost rounds")
def predict(x, learners):
    """TODO: aggregate signed weak-learner votes; resolve exact zero as +1."""
    raise NotImplementedError("TODO: implement boosted prediction")
def run_noise_experiment(x, y, noise_rates=(0.0,0.25), rounds=8, seed=13,
                         output_dir=ROOT / "artifacts"):
    """TODO: flip a seeded subset of labels, fit, score against clean y, save JSON."""
    raise NotImplementedError("TODO: save reproducible noise-sensitivity report")
