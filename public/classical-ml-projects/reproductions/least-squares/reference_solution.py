from __future__ import annotations
import csv, json
from pathlib import Path
import numpy as np
ROOT = Path(__file__).parent
def load_fixture(path=ROOT / "fixture.csv"):
    rows=list(csv.DictReader(path.open()))
    return np.array([[float(r["x"])] for r in rows]), np.array([float(r["y"]) for r in rows])
def fit_least_squares(x, y):
    design=np.column_stack([np.ones(len(x)), x])
    gram=design.T @ design
    if np.linalg.matrix_rank(gram) < gram.shape[0]: raise ValueError("singular design")
    theta=np.linalg.solve(gram, design.T @ y)
    return float(theta[0]), theta[1:]
def predict(x, intercept, coefficients): return intercept + np.asarray(x) @ np.asarray(coefficients)
def save_artifacts(x, intercept, coefficients, output_dir=ROOT / "artifacts"):
    output_dir.mkdir(exist_ok=True)
    (output_dir / "model.json").write_text(json.dumps({"intercept":float(intercept),"coefficients":np.asarray(coefficients).tolist()}, indent=2) + "\n")
    with (output_dir / "predictions.csv").open("w", newline="") as f:
        writer=csv.writer(f); writer.writerow(["x","prediction"])
        for row, pred in zip(x, predict(x, intercept, coefficients)): writer.writerow([float(row[0]), float(pred)])
