from __future__ import annotations
import csv, json
from collections import defaultdict
from pathlib import Path
ROOT = Path(__file__).parent

def load_rows(path: Path | None = None):
    """TODO 1: validate cancellation/return conventions and numeric values."""
    with (path or ROOT / "data/fixture.csv").open(newline="") as handle: return list(csv.DictReader(handle))

def customer_revenue(rows):
    """TODO 2: replace this aggregate with cohort/RFM features and return handling."""
    totals = defaultdict(float)
    for row in rows:
        totals[row["customer_id"]] += int(row["quantity"]) * float(row["unit_price"])
    return dict(totals)

def top_customers(rows, limit=3):
    totals = customer_revenue(rows)
    return sorted(totals, key=lambda customer: (-totals[customer], customer))[:limit]

def run_offline(output_dir: Path):
    """TODO 3: add reproducible feature snapshots and a business-action policy."""
    rows=load_rows(); totals=customer_revenue(rows); ranking=top_customers(rows)
    output_dir.mkdir(parents=True, exist_ok=True)
    with (output_dir/"customer_revenue.csv").open("w",newline="") as handle:
        writer=csv.DictWriter(handle,fieldnames=["customer_id","revenue"]); writer.writeheader()
        writer.writerows({"customer_id": key, "revenue": round(totals[key],2)} for key in sorted(totals))
    report={"n_transactions":len(rows),"n_customers":len(totals),"top_customers":ranking}
    (output_dir/"metrics.json").write_text(json.dumps(report,indent=2)+"\n")
    return report

