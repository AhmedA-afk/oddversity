---
title: "Lab: three sources, one clean table, one pipeline"
phase: data
module: enterprise-connectors
kind: lab
summary: "Build a pipeline for a fictional textile exporter that joins a document-store price list, a CRM order export, and an ERP flat file into one reconciled table, and survives each source lying in its own way."
duration: 4 h
updated: "2026-09-02"
outcomes:
  - Join three differently-shaped exports into one entity at a stated grain, with every join key normalised first.
  - Produce a reconciliation report that names exactly which rows failed to join and why.
  - Hand over a pipeline a non-technical ops lead can re-run from a README.
artifact: A repository with three loaders, one join stage, a reconciliation report, and a README a customer's own analyst could follow.
---

**The customer.** Suryatex Fabrics is a fictional textile exporter in Tiruppur with roughly 40 export customers across the EU and the Gulf. Their order desk works from three systems that were never designed to talk to each other: a SharePoint folder where the sales team keeps the current price list per customer (a spreadsheet, updated by hand), a CRM (Salesforce-shaped) holding the order pipeline, and their ERP's nightly flat-file export of confirmed shipments. Every Monday, the operations lead manually cross-checks these three by eye to catch orders billed at the wrong price. She wants that to stop being manual.

This lab builds the pipeline that replaces her Monday morning. You will not have real SharePoint or Salesforce credentials, so each source is provided as a local file shaped exactly like what the real connector would hand you, using the patterns from the three connector lessons in this module. Python 3.10 or later, `pandas`, no other dependencies.

## Step 1: Create the three source files

Create a working directory `suryatex-reconcile/` with a `sources/` folder holding three files, shaped as follows. Type them in; the specific values do not matter, the shapes do.

`sources/pricelist.csv` (from the document store — the sales team's live price list; one row per customer per fabric code):

```csv
customer_code,fabric_code,price_per_metre_usd,currency,effective_from
CUST-EU-04,FAB-2210,3.85,USD,2026-06-01
CUST-EU-04,FAB-3301,4.10,USD,2026-06-01
CUST-GULF-11,FAB-2210,3.60,USD,2026-07-15
CUST-EU-09,FAB-2210,,USD,2026-06-01
```

Note the blank price on the last row — a common state for a spreadsheet a salesperson has not finished updating.

`sources/crm_orders.csv` (from the CRM — the order pipeline; StageName is a picklist the sales team edits by hand):

```csv
order_id,customer_code,fabric_code,quantity_metres,stagename,closedate
ORD-9001,CUST-EU-04,FAB-2210,1200,Closed Won,2026-08-10
ORD-9002,CUST-EU-04,FAB-3301,800,Closed Won,2026-08-11
ORD-9003,CUST-GULF-11,FAB-2210,500,Negotiation,2026-08-12
ORD-9004,cust-eu-09,FAB-2210,300,Closed Won,2026-08-14
```

Note the lowercase `cust-eu-09` on the last row — a data-entry inconsistency, not a different customer.

`sources/erp_shipments.txt` (from the ERP — fixed-width, one row per confirmed shipment, columns: order_id[0:10], customer_code[10:22], fabric_code[22:32], qty_shipped[32:40], ship_date[40:50]):

```
ORD-9001  CUST-EU-04  FAB-2210  1200    2026-08-15
ORD-9002  CUST-EU-04  FAB-3301  0780    2026-08-16
ORD-9003  CUST-GULF11 FAB-2210  0500    2026-08-17
```

Note two things worth catching later: `ORD-9002` shipped 780 metres against an order of 800, and `CUST-GULF11` has dropped the hyphen that every other source uses.

## Step 2: Write the three loaders

One loader per source, each returning a typed, normalised `DataFrame`. Normalise `customer_code` to uppercase with hyphens preserved as the canonical form — pick this now, in one place, rather than fixing it ad hoc in the join.

```python
"""suryatex-reconcile/load.py — one loader per source, one normalised shape out."""
import re
import pandas as pd

def normalise_customer_code(code: str) -> str:
    code = str(code).strip().upper()
    # CUST-GULF11 -> CUST-GULF-11; already-correct codes pass through unchanged.
    return re.sub(r"^(CUST-[A-Z]+)(\d+)$", r"\1-\2", code)

def load_pricelist(path="sources/pricelist.csv") -> pd.DataFrame:
    df = pd.read_csv(path)
    df["customer_code"] = df["customer_code"].map(normalise_customer_code)
    return df

def load_crm_orders(path="sources/crm_orders.csv") -> pd.DataFrame:
    df = pd.read_csv(path)
    df["customer_code"] = df["customer_code"].map(normalise_customer_code)
    df = df[df["stagename"] == "Closed Won"].copy()   # only confirmed orders are billable
    return df

def load_erp_shipments(path="sources/erp_shipments.txt") -> pd.DataFrame:
    layout = [("order_id", 0, 10), ("customer_code", 10, 22),
              ("fabric_code", 22, 32), ("qty_shipped", 32, 40), ("ship_date", 40, 50)]
    rows = []
    with open(path) as fh:
        for line in fh:
            if not line.strip():
                continue
            rows.append({name: line[s:e].strip() for name, s, e in layout})
    df = pd.DataFrame(rows)
    df["customer_code"] = df["customer_code"].map(normalise_customer_code)
    df["qty_shipped"] = df["qty_shipped"].astype(int)
    return df
```

## Step 3: Join at the right grain

The grain of this reconciliation is **one row per order** — the closed CRM order is the anchor, because it is the thing that should have both a price and a shipment. Join outward from it; do not join the price list and the ERP file to each other directly, since neither carries an order id.

```python
"""suryatex-reconcile/reconcile.py"""
import pandas as pd
from load import load_pricelist, load_crm_orders, load_erp_shipments

def reconcile():
    price = load_pricelist()
    orders = load_crm_orders()
    shipments = load_erp_shipments()

    merged = orders.merge(
        price, on=["customer_code", "fabric_code"], how="left", suffixes=("", "_price")
    ).merge(
        shipments[["order_id", "qty_shipped", "ship_date"]], on="order_id", how="left"
    )

    merged["billed_amount_usd"] = merged["quantity_metres"] * merged["price_per_metre_usd"]
    merged["qty_mismatch"] = merged["qty_shipped"].notna() & (merged["qty_shipped"] != merged["quantity_metres"])
    merged["missing_price"] = merged["price_per_metre_usd"].isna()
    merged["missing_shipment"] = merged["qty_shipped"].isna()

    return merged
```

## Step 4: Write the reconciliation report

The ops lead does not want the joined table. She wants to know which of the 40 rows on her Monday check need a phone call.

```python
def report(merged: pd.DataFrame) -> str:
    lines = ["# Suryatex weekly reconciliation", "", f"Orders checked: {len(merged)}", ""]

    missing_price = merged[merged["missing_price"]]
    if len(missing_price):
        lines.append(f"## {len(missing_price)} order(s) with no confirmed price")
        for _, r in missing_price.iterrows():
            lines.append(f"- {r['order_id']}: {r['customer_code']} / {r['fabric_code']} — price list has no rate on file")
        lines.append("")

    mismatch = merged[merged["qty_mismatch"]]
    if len(mismatch):
        lines.append(f"## {len(mismatch)} order(s) shipped a different quantity than ordered")
        for _, r in mismatch.iterrows():
            lines.append(f"- {r['order_id']}: ordered {r['quantity_metres']}m, shipped {int(r['qty_shipped'])}m")
        lines.append("")

    missing_ship = merged[merged["missing_shipment"]]
    if len(missing_ship):
        lines.append(f"## {len(missing_ship)} closed order(s) not yet in the ERP shipment file")
        for _, r in missing_ship.iterrows():
            lines.append(f"- {r['order_id']}: closed {r['closedate']}, no shipment record yet")

    return "\n".join(lines) + "\n"

if __name__ == "__main__":
    merged = reconcile()
    open("report.md", "w").write(report(merged))
    print("wrote report.md")
```

Run it: `python reconcile.py`. You should see three findings surface across two orders — `ORD-9002`'s quantity mismatch (780 shipped vs 800 ordered), and `ORD-9004` flagged twice: once for the missing price (`CUST-EU-09`'s blank cell in the price list) and once for the missing shipment (it never appears in the ERP file at all — the CRM says closed won, the ERP has never heard of it). One order, two separate problems, is a realistic outcome and worth keeping as two separate lines in the report rather than collapsing it into one, because the ops lead needs to chase the pricing team and the warehouse separately.

## Definition of done

- Three loaders each normalise `customer_code` to the same canonical form, proven by `CUST-GULF11` and `cust-eu-09` both resolving to a hyphenated uppercase code that matches the price list.
- The join runs at one row per closed order, and every row in the output can be traced back to which source contributed which field.
- `report.md` names, by order id, every missing price, every quantity mismatch, and every closed order with no shipment record — not a count, a list a human can act on.
- Re-running the pipeline on the same three files twice produces an identical `report.md`.
- A `README.md` in the repository states, in three sentences, what to update to point the loaders at a real SharePoint, CRM, and ERP export, referencing the three connector lessons in this module by name.

## How this could go wrong

**The normalisation function is too clever.** A regex that fixes `CUST-GULF11` might also mangle a customer code you have not seen yet. Log every code that gets rewritten, with before and after, so a human can audit the normalisation step rather than trusting it silently.

**"Missing" gets treated as zero.** A missing price is not a zero-rupee price, and a missing shipment is not a cancelled order. Keep nulls as nulls through the whole pipeline and only resolve them in the report layer, where you can say what the absence means in words.

**The report grows without a threshold and nobody reads it.** If every run flags twenty issues, the ops lead will stop opening the file within a month. Track the week-over-week count of each finding type as a separate line, so a rising trend is visible even if the detail list is not read every time.

**The join silently drops rows.** A `how="inner"` join here would make `ORD-9004` disappear instead of surfacing it as a finding. Every join in a reconciliation pipeline should be a `left` join from the anchor entity, and every row that fails to match on the right side is itself the finding, not noise to be filtered out.
