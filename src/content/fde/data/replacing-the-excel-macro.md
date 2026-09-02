---
title: "Lab: replace the Excel macro nobody understands"
phase: data
module: etl-and-messy-data
kind: lab
summary: "A co-operative bank's operations analyst runs a 45-minute VBA macro every morning to reconcile branch cash positions. You reverse-engineer it, replace it with a re-runnable Python pipeline, and prove your output matches hers before you retire the spreadsheet."
duration: 3 h
updated: "2026-09-02"
outcomes:
  - Reverse-engineer an undocumented spreadsheet macro's logic from its behaviour and its code, not from a spec that does not exist.
  - Replace it with a re-runnable pipeline that survives a re-run and an empty cell without corrupting a total.
  - Prove equivalence against the macro's own output before proposing to retire it.
artifact: A Python pipeline that reproduces the macro's output exactly on a week of real inputs, plus a one-page note on where the two diverge and why.
---

**The customer.** Suryatex Fabrics — the same fictional textile exporter from the connectors lab later in this module — has an operations analyst who starts every morning by running a VBA macro inside a shared workbook. It pulls that day's branch cash-position CSVs, cross-checks them against yesterday's closing balances, flags anything more than ₹5,000 out of line, and produces a summary sheet the finance head reads before the 9:30 call. It takes her forty-five minutes, it breaks whenever a branch's export has an empty date cell, and she is the only person in the company who understands it. She wants it automated. She does not want to be surprised by a wrong number in front of the finance head.

## Step 1: Get the macro's actual logic, not a description of it

Open the workbook and read the VBA (Alt+F11 in Excel, or ask the analyst to walk you through it screen-sharing — the faster route, because a description in her words often differs from what the code actually does, and that gap is itself useful information). You are looking for three things: what counts as "today's" data, what the ₹5,000 threshold actually compares, and what happens on an empty cell — because in a macro built by an analyst rather than an engineer, that last case is almost never handled deliberately.

For this lab, treat the macro's logic as the following, confirmed by walking through it with her (write this down the way the ETL lesson's transformation section describes — attributed, dated):

- Read `branch_cash_<branch_code>.csv` for every branch from a fixed folder, for the current date.
- For each branch, compute `variance = closing_balance_today - opening_balance_today - net_transactions_today`.
- Flag any branch where `abs(variance) > 5000`.
- Where `opening_balance_today` is blank (a branch that failed to export it), the macro currently shows `#VALUE!` in that row and the analyst manually re-types yesterday's closing balance from memory. **This is the bug she wants fixed, not preserved.**

## Step 2: Build the source files for this lab

Since you do not have Suryatex's real branch exports, create three days of realistic ones. Directory `branch-cash/`:

`branch-cash/2026-08-10/branch_cash_BLR.csv`:
```csv
branch_code,opening_balance,closing_balance,net_transactions
BLR,182400,191200,8900
```

`branch-cash/2026-08-10/branch_cash_CHN.csv`:
```csv
branch_code,opening_balance,closing_balance,net_transactions
CHN,94200,101500,7100
```

`branch-cash/2026-08-11/branch_cash_BLR.csv`:
```csv
branch_code,opening_balance,closing_balance,net_transactions
BLR,,205100,9200
```

Note the blank `opening_balance` on the 11th for BLR — the exact case that currently breaks the macro.

`branch-cash/2026-08-11/branch_cash_CHN.csv`:
```csv
branch_code,opening_balance,closing_balance,net_transactions
CHN,101500,95800,-5900
```

CHN on the 11th has a variance of `95800 - 101500 - (-5900) = 200`, well inside the threshold. BLR on the 11th is the interesting row.

## Step 3: Write the pipeline

```python
"""suryatex-cash-recon/recon.py — replaces the morning VBA macro."""
import csv
import sys
from dataclasses import dataclass
from pathlib import Path

THRESHOLD = 5000

@dataclass
class BranchResult:
    branch_code: str
    date: str
    variance: float | None
    flagged: bool
    note: str

def load_day(branch_dir: Path) -> list[dict]:
    rows = []
    for csv_path in sorted(branch_dir.glob("branch_cash_*.csv")):
        with open(csv_path, newline="", encoding="utf-8") as fh:
            rows.extend(csv.DictReader(fh))
    return rows

def previous_closing_balance(root: Path, branch_code: str, before_date: str) -> float | None:
    """Fall back to the branch's most recent known closing balance, not manual re-entry."""
    for day_dir in sorted(root.iterdir(), reverse=True):
        if day_dir.name >= before_date:
            continue
        candidate = day_dir / f"branch_cash_{branch_code}.csv"
        if candidate.exists():
            with open(candidate, newline="", encoding="utf-8") as fh:
                row = next(csv.DictReader(fh))
                if row["closing_balance"].strip():
                    return float(row["closing_balance"])
    return None

def reconcile_day(root: Path, date: str) -> list[BranchResult]:
    day_dir = root / date
    results = []
    for row in load_day(day_dir):
        code = row["branch_code"]
        opening_raw = row["opening_balance"].strip()
        closing = float(row["closing_balance"])
        net = float(row["net_transactions"])

        if opening_raw:
            opening = float(opening_raw)
            note = ""
        else:
            opening = previous_closing_balance(root, code, date)
            note = "opening_balance missing; used prior day's closing balance"
            if opening is None:
                results.append(BranchResult(code, date, None, True,
                                             "opening_balance missing; no prior day available"))
                continue

        variance = closing - opening - net
        results.append(BranchResult(code, date, variance, abs(variance) > THRESHOLD, note))
    return results

def main():
    root = Path("branch-cash")
    date = sys.argv[1] if len(sys.argv) > 1 else "2026-08-11"
    for r in reconcile_day(root, date):
        flag = "FLAG" if r.flagged else "ok"
        extra = f"  ({r.note})" if r.note else ""
        print(f"{r.branch_code}  variance={r.variance}  {flag}{extra}")

if __name__ == "__main__":
    main()
```

Run `python recon.py 2026-08-11`. BLR resolves its missing opening balance from the previous day's closing balance (191200, from the 10th) automatically, computes `205100 - 191200 - 9200 = 4700`, and does not flag — inside the ₹5,000 threshold, and no manual re-typing required. CHN shows its 200 variance, unflagged. Run `python recon.py 2026-08-10`: both branches have their opening balances present and resolve directly.

## Step 4: Prove equivalence, then prove improvement

Before proposing this replaces the macro, run both against a week of real data the analyst already reconciled by hand, and produce a diff, not a claim:

```python
def diff_against_macro_output(pipeline_results, macro_summary_csv):
    """Compare pipeline output to the analyst's own recorded macro output.
    Every row must match on variance and flag; log every divergence with a reason."""
    macro_rows = {r["branch_code"]: r for r in csv.DictReader(open(macro_summary_csv))}
    for r in pipeline_results:
        macro_row = macro_rows.get(r.branch_code)
        if macro_row is None:
            print(f"{r.branch_code}: no macro row to compare — new branch or macro skipped it")
            continue
        macro_variance = macro_row.get("variance")
        if macro_variance in ("", "#VALUE!"):
            print(f"{r.branch_code}: macro errored here, pipeline resolved it — expected divergence")
        elif abs(float(macro_variance) - (r.variance or 0)) > 0.01:
            print(f"{r.branch_code}: DIVERGES — macro={macro_variance} pipeline={r.variance}")
```

Every divergence needs a reason attached before you can propose retiring the macro. A `#VALUE!` row that the pipeline now resolves is expected and is the improvement you were asked to make. A silent numeric mismatch with no explanation is a bug in your pipeline, not a discrepancy to explain away, and it means you are not done yet.

## Definition of done

- The pipeline reproduces the macro's variance calculation exactly on every row where the macro produced a real number.
- The missing-opening-balance case resolves automatically to the prior day's closing balance, with a note in the output showing that a fallback was used, and no case falls through to a silent wrong answer.
- Running the pipeline twice on the same day's files produces identical output.
- A one-page note lists every row where pipeline and macro output diverge, with a stated reason for each, reviewed by someone who did not write the pipeline.
- The analyst — or a stand-in for her in this exercise — can read the pipeline's plain-text output and understand it without you in the room.

## How this could go wrong

**Reverse-engineering from a wrong description.** The analyst's spoken explanation ("it just checks if the numbers look right") and the VBA's actual comparison operator can differ. Read the code, not just the explanation, and treat any mismatch between the two as itself worth a follow-up question.

**Silently changing behaviour while calling it a bug fix.** The missing-opening-balance fallback in this lab is a real behaviour change from the macro's `#VALUE!` plus manual re-entry, and it was explicitly requested. A pipeline that changes other behaviour nobody asked to change — rounding differently, or applying the threshold as `>=` instead of `>` — will produce numbers that quietly disagree with a year of institutional memory about what "normal" looks like, and someone will notice at the worst possible moment.

**Retiring the spreadsheet before the diff period is over.** Run the pipeline in parallel with the macro for at least a week of real mornings before anyone stops running the old process, and get the analyst's explicit sign-off on the diff report, in writing, before it is retired. She is the one who will be asked to explain a wrong number to the finance head, not you, three months after you have moved to the next engagement.
