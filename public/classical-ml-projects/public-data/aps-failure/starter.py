from __future__ import annotations
import csv,json
from pathlib import Path
ROOT=Path(__file__).parent
def load_rows(path:Path|None=None):
    """TODO 1: validate missing-value policy and feature availability at scoring time."""
    with (path or ROOT/"data/fixture.csv").open(newline="") as handle:return list(csv.DictReader(handle))
def predict_failure(row:dict)->int:
    """TODO 2: replace this cost-sensitive baseline with calibrated, validated scores."""
    risk=int(row["sensor_a"])+int(row["sensor_b"])+2*int(row["sensor_c"])
    return int(risk >= 9)
def evaluate(rows):
    pred=[predict_failure(r) for r in rows]; truth=[int(r["failure"]) for r in rows]
    tp=sum(p and y for p,y in zip(pred,truth));fp=sum(p and not y for p,y in zip(pred,truth));fn=sum(not p and y for p,y in zip(pred,truth))
    return {"n":len(rows),"recall":tp/(tp+fn) if tp+fn else 0,"precision":tp/(tp+fp) if tp+fp else 0,"predictions":pred}
def run_offline(output_dir:Path):
    """TODO 3: add PR curves, expected-cost thresholding, and an inspection workflow."""
    rows=load_rows();report=evaluate(rows);output_dir.mkdir(parents=True,exist_ok=True)
    with (output_dir/"triage.csv").open("w",newline="") as handle:
        writer=csv.DictWriter(handle,fieldnames=["id","inspect"]);writer.writeheader();writer.writerows({"id":r["id"],"inspect":p} for r,p in zip(rows,report.pop("predictions")))
    (output_dir/"metrics.json").write_text(json.dumps(report,indent=2)+"\n");return report

