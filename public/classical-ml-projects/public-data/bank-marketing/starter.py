from __future__ import annotations
import csv, json
from pathlib import Path
ROOT = Path(__file__).parent

def load_rows(path: Path | None = None):
    """TODO 1: perform strict schema/type validation."""
    with (path or ROOT / "data/fixture.csv").open(newline="") as handle: return list(csv.DictReader(handle))

def predict_subscription(row: dict) -> int:
    """TODO 2: replace this pre-call-safe baseline; do not use duration without justification."""
    return int((int(row["balance"]) > 1200 and row["housing"] == "no") or int(row["previous"]) >= 2)

def evaluate(rows):
    pred = [predict_subscription(r) for r in rows]; truth = [int(r["subscribed"]) for r in rows]
    tp=sum(p and y for p,y in zip(pred,truth)); fp=sum(p and not y for p,y in zip(pred,truth)); fn=sum(not p and y for p,y in zip(pred,truth))
    return {"precision": tp/(tp+fp) if tp+fp else 0, "recall": tp/(tp+fn) if tp+fn else 0, "n": len(rows), "predictions": pred}

def run_offline(output_dir: Path):
    """TODO 3: add time-aware validation and contact-cost-aware thresholding."""
    rows=load_rows(); report=evaluate(rows); output_dir.mkdir(parents=True,exist_ok=True)
    with (output_dir/"predictions.csv").open("w",newline="") as f:
        w=csv.DictWriter(f,fieldnames=["id","prediction"]); w.writeheader(); w.writerows({"id":r["id"],"prediction":p} for r,p in zip(rows,report.pop("predictions")))
    (output_dir/"metrics.json").write_text(json.dumps(report,indent=2)+"\n"); return report

