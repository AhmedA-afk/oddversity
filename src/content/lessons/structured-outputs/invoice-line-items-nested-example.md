---
title: "Modeling an Invoice with Line Items"
track: "structured-outputs"
status: live
summary: "A full invoice schema with header fields, an array of line items, and a totals block, plus a populated example that validates against it."
duration: "7 min read"
---

An invoice is the textbook case for nested-and-array design: a handful of header facts that appear once, a variable-length list of line items that each carry the same few attributes, and a totals block that's derivable from the line items but worth stating explicitly anyway.

## The setup

We're extracting a vendor invoice into three parts: header fields (`invoice_number`, `invoice_date`, `vendor_name`, `customer_name`), a `line_items` array where each entry is `{description, qty, unit_price, amount}`, and a `totals` object of `{subtotal, tax, total}`. The goal is a schema a real invoice — with a variable number of lines — can populate without forcing anything into the wrong shape.

## Step by step

**Step 1 — the header.** These fields appear exactly once per invoice, so they sit flat at the top level rather than inside a wrapper object:

```json
{
  "invoice_number": { "type": "string" },
  "invoice_date": { "type": "string", "description": "ISO-8601 date, YYYY-MM-DD" },
  "vendor_name": { "type": "string" },
  "customer_name": { "type": "string" }
}
```

> **Why this step?** A nested `header: {...}` wrapper here would add a level of depth for no benefit — these fields don't repeat and don't need to travel as a unit for validation purposes. Nest for repetition or multi-field grouping (see [Modeling Nested Objects and Arrays](/learn/structured-outputs/designing-nested-and-array-fields)), not by default.

**Step 2 — the line items array.** This is where the real structure lives:

```json
{
  "line_items": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "description": { "type": "string" },
        "qty": { "type": "integer" },
        "unit_price": { "type": "number" },
        "amount": { "type": "number", "description": "qty * unit_price, restated explicitly" }
      },
      "required": ["description", "qty", "unit_price", "amount"],
      "additionalProperties": false
    }
  }
}
```

> **Why this step?** `amount` is arithmetically redundant with `qty * unit_price`, and it's still worth asking for explicitly. A model extracting from a real invoice image is reading the printed amount column directly, which catches cases where the source document itself has a rounding quirk or a discount folded into that line — recomputing `qty * unit_price` in your own code afterward gives you a free consistency check between what the model read and what the math says, and a mismatch there is a legitimate signal to flag the line for review.

**Step 3 — the totals object.** A fixed, non-repeating group of three related numbers — a textbook nested object:

```json
{
  "totals": {
    "type": "object",
    "properties": {
      "subtotal": { "type": "number" },
      "tax": { "type": "number" },
      "total": { "type": "number" }
    },
    "required": ["subtotal", "tax", "total"],
    "additionalProperties": false
  }
}
```

> **Why this step?** Same redundancy argument as `amount` — `total` should equal `subtotal + tax`, and asking the model to state all three anyway means you can validate that identity in your own code rather than trusting a single number with nothing to check it against.

**Step 4 — a populated response.** Feeding a real (three-line) invoice through this schema:

```json
{
  "invoice_number": "INV-20394",
  "invoice_date": "2026-08-14",
  "vendor_name": "Northbridge Supply Co.",
  "customer_name": "Ansari Consulting",
  "line_items": [
    { "description": "Standing desk", "qty": 1, "unit_price": 340.00, "amount": 340.00 },
    { "description": "Monitor arm", "qty": 2, "unit_price": 65.00, "amount": 130.00 },
    { "description": "Cable management kit", "qty": 3, "unit_price": 12.50, "amount": 37.50 }
  ],
  "totals": {
    "subtotal": 507.50,
    "tax": 40.60,
    "total": 548.10
  }
}
```

> **Why this step?** Notice the array has three entries here, but the schema places no ceiling on that — a one-line invoice and a forty-line invoice validate against the exact same schema. That's the entire point of modeling this as an array instead of, say, three named fields `line_item_1`, `line_item_2`, `line_item_3`: the schema doesn't need to know the count in advance.

## Where it breaks (+ fix)

**The break:** a flattened alternative — `item_1_description`, `item_1_qty`, `item_1_amount`, `item_2_description`, and so on — looks tempting for a "usually 2-3 line items" invoice because it avoids arrays entirely. It breaks the moment an invoice has a fourth line: either the schema needs a fixed maximum decided in advance (and silently truncates anything longer), or you need a different schema per line count, which defeats the purpose of having one schema at all. Even at a line count the flat version handles, it's already lost the grouping — nothing in the schema says `item_2_qty` belongs with `item_2_description` rather than `item_1_description`, so a consumer has to reconstruct that relationship from naming convention alone.

**The fix:** the `line_items` array shown above. It handles one line item or fifty without changing shape, and the grouping is structural rather than implied by a naming pattern.

## Takeaways

- Header fields that appear once stay flat; repeating multi-field records go in an array of objects — don't nest for tidiness, nest for repetition.
- Redundant-looking fields (`amount` alongside `qty` and `unit_price`, `total` alongside `subtotal` and `tax`) are worth keeping. They give you a free arithmetic cross-check between what the model extracted and what the numbers imply, without any extra schema complexity.
- A flattened, numbered-field alternative (`item_1_qty`, `item_2_qty`, ...) is the parallel-arrays antipattern in a different costume — it caps the data at a count you have to guess in advance and throws away the grouping that made the object shape worth having.

**Related:** [Modeling Nested Objects and Arrays](/learn/structured-outputs/designing-nested-and-array-fields), [Pydantic Models for Extraction](/learn/structured-outputs/pydantic-models-for-extraction), [Zod Schemas for Extraction](/learn/structured-outputs/zod-schemas-for-extraction), [Schema-Shape Antipatterns](/learn/structured-outputs/schema-shape-antipatterns)
