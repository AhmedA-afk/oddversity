"""Offline baseline for Adult Income. Replace the transparent rule after studying it."""
from __future__ import annotations
import csv, json
from pathlib import Path

ROOT = Path(__file__).parent

def load_rows(path: Path | None = None):
    """TODO 1: reject missing columns and non-binary labels in your extension."""
    with (path or ROOT / "data/fixture.csv").open(newline="") as handle:
        return list(csv.DictReader(handle))

def predict_income(row: dict) -> int:
    """TODO 2: replace this auditable baseline with a validated model pipeline."""
    education = row["education"] in {"Bachelors", "Masters", "Doctorate"}
    return int((int(row["age"]) >= 36 and int(row["hours_per_week"]) >= 40) or (education and int(row["capital_gain"]) > 0))

def evaluate(rows):
    predictions = [predict_income(row) for row in rows]
    labels = [int(row["income_over_50k"]) for row in rows]
    correct = sum(p == y for p, y in zip(predictions, labels))
    return {"accuracy": correct / len(rows), "n": len(rows), "predictions": predictions}

def run_offline(output_dir: Path):
    """TODO 3: add train/test splits, slice metrics, calibration, and a model card."""
    rows = load_rows(); report = evaluate(rows); output_dir.mkdir(parents=True, exist_ok=True)
    with (output_dir / "predictions.csv").open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["id", "prediction"]); writer.writeheader()
        writer.writerows({"id": row["id"], "prediction": pred} for row, pred in zip(rows, report.pop("predictions")))
    (output_dir / "metrics.json").write_text(json.dumps(report, indent=2) + "\n")
    return report

