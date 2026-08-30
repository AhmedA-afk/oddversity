---
title: "Extracting Tables Reliably"
track: "structured-outputs"
status: live
summary: "A table is a repeating record — model it as rows of a typed schema, not as one blob of text to parse later."
duration: "6 min read"
---

A table looks like a formatting problem, but the reliable way to extract one has nothing to do with preserving its layout — it's about treating each row as its own schema instance.

## What it is

Tabular extraction means defining a row schema — `{date, description, amount, balance}`, say — and asking for `rows: RowSchema[]`, rather than asking for the table as a single string, a markdown block, or a 2D array of untyped cells. Each row becomes an independent, individually validated object.

## The mental model

Treat a table the same way you'd treat any other repeating structure — see [Nested Objects and Arrays in Output Schemas](/learn/structured-outputs/nested-and-array-schemas) — where the "one thing that repeats" happens to be a table row instead of, say, an order line item. Column alignment stops being a property of the whole table and becomes a property of one row at a time: row 14 having a missing `balance` value doesn't threaten the alignment of rows 1 through 13 or 15 through 40, because every row carries all of its own named fields rather than depending on shared column position.

## Why it works this way

A blob-of-text extraction (or an unstructured 2D array) has no per-cell validation surface — if the model drops a column somewhere in the middle, everything after that point silently shifts and you have no schema-level way to notice. A `rows[]` of typed, named objects degrades gracefully instead: a missing cell shows up as a null field on one specific row, not a global misalignment. It also makes ragged tables (some rows have a memo column, some don't) and multi-page tables (the header only prints once, but data rows continue for three more pages) tractable, because "does this row have all its fields" is a row-local question you can check with ordinary validation.

## A concrete example (shown)

```
Date       Description          Amount
03/01      Coffee Co.           -4.50
03/02      Payroll Deposit    2,400.00
03/03      (no description)      -12.00
```

```json
{
  "rows": [
    {"date": "2026-03-01", "description": "Coffee Co.", "amount": -4.50},
    {"date": "2026-03-02", "description": "Payroll Deposit", "amount": 2400.00},
    {"date": "2026-03-03", "description": null, "amount": -12.00}
  ]
}
```

Row three's missing description becomes one `null` field, not a corrupted row — the schema absorbed the raggedness instead of breaking on it.

## Where it shows up

Bank and brokerage statements (see [Transactions from a Bank Statement](/learn/structured-outputs/bank-statement-transactions-example)), invoice line items, price lists, and exhibits or schedules attached to contracts.

## Watch out for

- **Parsing positionally instead of by field.** If you (or the model) infer a value's meaning from its column position rather than asking for named fields directly, a row with a missing column silently shifts every value after it into the wrong field.
- **Multi-page tables where the header only appears once.** A model reading page 2 of a statement in isolation may not recognize that its rows continue the same table as page 1 — carry the column schema and a short sample forward across chunks (see [Chunk, Extract, Merge](/learn/structured-outputs/chunk-and-merge-extraction)) rather than re-deriving it from a headerless page.
- **Section or subtotal rows extracted as if they were data rows.** A "Pending Transactions" header row or a subtotal line can look enough like a real row to get extracted as one — ask explicitly for a way to mark non-data rows, or exclude them, rather than letting them pollute `rows[]`.

## Where next

[Transactions from a Bank Statement](/learn/structured-outputs/bank-statement-transactions-example) works through a real multi-page table, including the running-balance check that catches a row the model silently dropped.

**Related:** [Nested Objects and Arrays in Output Schemas](/learn/structured-outputs/nested-and-array-schemas), [Transactions from a Bank Statement](/learn/structured-outputs/bank-statement-transactions-example), [Strategies for Long Documents](/learn/structured-outputs/long-document-extraction-strategies), [Extraction Is Schema-Filling](/learn/structured-outputs/extraction-as-a-structured-output-problem)
