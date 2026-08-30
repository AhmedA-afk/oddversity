from __future__ import annotations
import csv,json
from pathlib import Path
ROOT=Path(__file__).parent
def load_rows(path: Path|None=None):
    """TODO 1: validate dates, seasonality, and unavailable-at-forecast-time features."""
    with (path or ROOT/"data/fixture.csv").open(newline="") as f:return list(csv.DictReader(f))
def predict_rentals(row:dict)->float:
    """TODO 2: replace this seasonal baseline with a chronological forecasting model."""
    return 80 + 70*int(row["workingday"]) + 6*float(row["temp_c"]) - 25*int(row["rain"])
def evaluate(rows):
    pred=[predict_rentals(r) for r in rows]; y=[float(r["rentals"]) for r in rows]
    return {"mae":sum(abs(a-b) for a,b in zip(pred,y))/len(y),"n":len(y),"predictions":pred}
def run_offline(output_dir:Path):
    """TODO 3: add naive seasonal comparisons, intervals, and forecast monitoring."""
    rows=load_rows(); report=evaluate(rows); output_dir.mkdir(parents=True,exist_ok=True)
    with (output_dir/"predictions.csv").open("w",newline="") as f:
        w=csv.DictWriter(f,fieldnames=["id","prediction"]);w.writeheader();w.writerows({"id":r["id"],"prediction":round(p,2)} for r,p in zip(rows,report.pop("predictions")))
    (output_dir/"metrics.json").write_text(json.dumps(report,indent=2)+"\n");return report

