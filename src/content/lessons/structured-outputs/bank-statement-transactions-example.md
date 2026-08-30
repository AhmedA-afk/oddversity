---
title: "Transactions from a Bank Statement"
track: "structured-outputs"
status: live
summary: "A multi-page statement drops one transaction mid-table, and a running-balance check catches exactly where it went missing."
duration: "8 min read"
---

The transaction table starts on page 1 and keeps going onto page 2 with no repeated header — and somewhere in that handoff, one row goes missing. The fix isn't a sharper prompt; it's arithmetic the model's output has to agree with itself on.

## The setup

A three-page checking-account statement. Target schema: `transactions[]` of `{date, description, amount, balance}`, where `balance` is the running balance printed after each transaction. Page 1 holds the first six transactions, page 2 continues the same table with seven more, and page 3 is a summary with no transaction rows.

```python
from pydantic import BaseModel
from datetime import date

class Transaction(BaseModel):
    date: date
    description: str
    amount: float   # negative for debits, positive for credits
    balance: float  # running balance after this transaction
```

## Step by step

### 1. Extract per page

Page 1 is extracted first, ending with a balance of 1,842.17 after its last transaction. Page 2 is extracted next — [Extracting Tables Reliably](/learn/structured-outputs/multi-field-tables-from-documents) already flags the risk here: page 2 has no repeated header, so the extraction prompt needs to tell the model explicitly that this continues the same table rather than starting a new one.

### 2. Look at the raw combined output

```json
[
  {"date": "2026-08-01", "description": "Payroll Deposit", "amount": 2400.00, "balance": 1842.17},
  {"date": "2026-08-03", "description": "Rent Payment", "amount": -1450.00, "balance": 392.17},
  {"date": "2026-08-05", "description": "Grocery Co.", "amount": -86.40, "balance": 305.77},
  {"date": "2026-08-09", "description": "Utility Bill", "amount": -112.30, "balance": 193.47},
  {"date": "2026-08-14", "description": "Transfer In", "amount": 500.00, "balance": 693.47},
  {"date": "2026-08-20", "description": "Streaming Service", "amount": -15.99, "balance": 677.48},
  {"date": "2026-08-25", "description": "Payroll Deposit", "amount": 2400.00, "balance": 661.49}
]
```

That's page 1's six rows plus one row from page 2 — page 2 actually had seven rows in the source document, but only one made it into this output.

### 3. Run the running-balance check

```python
def check_running_balance(txns: list[Transaction]) -> list[str]:
    warnings = []
    for i in range(1, len(txns)):
        expected = round(txns[i - 1].balance + txns[i].amount, 2)
        if abs(expected - txns[i].balance) > 0.01:
            gap = round(txns[i].balance - expected, 2)
            warnings.append(
                f"row {i} ({txns[i].date}): expected balance {expected}, "
                f"got {txns[i].balance} — unexplained gap of {gap}"
            )
    return warnings
```

> **Why this step?** Every one of these seven rows is individually well-typed — dates parse, amounts and balances are numbers, nothing fails schema validation. The only thing wrong is that row 7's balance doesn't follow from row 6's balance plus row 7's amount, which only shows up when you check row-to-row, not field-by-field.

### 4. What the check finds

```
row 6 (2026-08-25): expected balance 3077.48, got 661.49 — unexplained gap of 2415.99
```

The jump from row 6 to row 7 doesn't reconcile, and the size of the gap ($2,415.99) is close to a full missing transaction rather than a rounding error — a strong signal that at least one row between "Streaming Service" and "Payroll Deposit" was silently dropped during extraction, most likely at the page 1 → page 2 seam.

## Where it breaks (+fix)

Widening the prompt ("don't miss any rows!") doesn't reliably fix a dropped row — the model isn't aware it dropped anything. Two things actually help: chunk page boundaries with a one-row overlap (re-extract the last row of the previous page alongside the next page, the same overlap idea from [Chunk, Extract, Merge](/learn/structured-outputs/chunk-and-merge-extraction), so a row near the seam has two chances to be captured), and treat a running-balance mismatch as a routing signal rather than something to silently accept or reject — send the flagged date range for a targeted re-extraction or a human glance rather than the whole statement. See [Confidence and Review Routing](/learn/structured-outputs/extraction-confidence-and-review-routing) for building that into an actual queue, and [Grounding Extractions in the Source](/learn/structured-outputs/grounding-and-citations-in-extraction) for attaching a page number to each row so the reviewer knows exactly where to look.

## Takeaways

- A schema-valid transaction list can still be missing a row entirely — cross-row arithmetic (running balance, running total) catches drops that per-field validation can't see.
- Page boundaries inside one logical table are exactly where rows go missing — give the extraction a one-row overlap across the seam, the same instinct as chunk overlap for long documents.
- The size of a reconciliation gap is itself a clue — it often points at roughly what got dropped, which narrows where to look before you even re-extract.

**Related:** [Extracting Tables Reliably](/learn/structured-outputs/multi-field-tables-from-documents), [Chunk, Extract, Merge](/learn/structured-outputs/chunk-and-merge-extraction), [Grounding Extractions in the Source](/learn/structured-outputs/grounding-and-citations-in-extraction), [Extraction Mistakes](/learn/structured-outputs/extraction-mistakes)
