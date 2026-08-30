---
title: "A Not-Found Sentinel That Stops Hallucination"
track: "structured-outputs"
status: live
summary: "Extract a tax ID that's absent from half a document set, first as a required string, then as a nullable value plus a found flag."
duration: "8 min read"
---

"Just make the field optional" is common advice and an incomplete fix. This lesson runs the actual before-and-after on a field that's genuinely absent from half a real document set, and shows why the flag matters as much as the nullability.

## The setup

Task: extract a business's tax ID from scanned invoices. In this batch of ten invoices, five have a clearly labeled tax ID field and five don't — smaller vendors, receipts, or invoices from jurisdictions that don't require one. The document itself gives no other signal; a missing tax ID looks exactly like an invoice that simply never had one.

**First schema — required string:**

```json
{
  "type": "object",
  "properties": {
    "tax_id": { "type": "string", "description": "The vendor's tax identification number." }
  },
  "required": ["tax_id"]
}
```

**Second schema — nullable value plus an explicit flag:**

```json
{
  "type": "object",
  "properties": {
    "tax_id": { "type": ["string", "null"] },
    "tax_id_found": {
      "type": "boolean",
      "description": "true only if a tax ID field is visibly present on the document, regardless of whether it was fully legible."
    }
  },
  "required": ["tax_id", "tax_id_found"]
}
```

## Step by step

**On a document that has a tax ID** (`GB123456789`, clearly printed), both schemas behave identically:

```json
// Schema 1
{ "tax_id": "GB123456789" }

// Schema 2
{ "tax_id": "GB123456789", "tax_id_found": true }
```

> **Why this step?** Neither design changes behavior on the easy case — the difference only shows up where the input doesn't cooperate, which is exactly where you'd want to check before trusting either schema in production.

**On one of the five documents with no tax ID field anywhere on it**, run through **Schema 1**:

```json
{ "tax_id": "123456789" }
```

> **Why this step?** `tax_id` is required and typed as a plain string — there is no legal way for the model to finish this object without producing *some* string. On this document, that string is invented: nine digits, formatted like a plausible tax ID, appearing nowhere on the source. It's not copied from anywhere on the page — it's the shape of a tax ID pattern-matched into existence because a value was mandatory. Nothing about the output looks wrong; it validates cleanly and reads as a real extraction.

Run the same document through **Schema 2**:

```json
{ "tax_id": null, "tax_id_found": false }
```

> **Why this step?** `tax_id` being nullable means "no value" is a legal completion, and `tax_id_found` gives the model an honest field to commit to *before* it would otherwise need to invent something to satisfy `tax_id`. The absence is now a signal your pipeline can act on directly, instead of a silent gap papered over with a plausible number.

## Comparing hallucination rates across the batch

Running both schemas across all ten invoices and checking each `tax_id` value against the source document by hand:

| | Documents with no tax ID (5) | Fabricated a value | Rate |
|---|---|---|---|
| Schema 1 (required string) | 5 | 4 | 4 ÷ 5 = 80% |
| Schema 2 (nullable + flag) | 5 | 0 | 0 ÷ 5 = 0% |

This is a small, illustrative run on one batch, not a general hallucination-rate statistic — build your own held-out set with known-absent fields before quoting a number to anyone. What generalizes past this specific batch is the *mechanism*: Schema 1's one non-fabricating case on the absent-field documents happened because that particular invoice had an adjacent field (a VAT number) close enough in position that the model appears to have grabbed the wrong number rather than inventing a fresh one — arguably a different failure, not evidence the required-string design is partially safe. Schema 2 didn't get a free pass either — on one of the five documents with a tax ID, the print was smudged and barely legible, and the model reported `tax_id_found: false` when a human, squinting, could still make it out. That's a real cost of this design, not a hidden win: an honest "not found" is safer than a hallucination, but it can undercount marginal cases that a more forgiving read would have caught. Better OCR preprocessing or a third `illegible` state (see the enum-based version in [Letting the Model Say 'I Don't Know'](/learn/structured-outputs/representing-uncertainty-in-schemas)) addresses that specific gap without reopening the door to fabrication.

## Where it breaks (+fix)

A nullable-plus-flag pair still assumes a binary outcome: found or not. Real documents produce a third case this schema can't distinguish — a tax ID field that's present but genuinely unreadable (smudged, cut off, wrong OCR crop). Under the two-field design, the model has to force that into `found: true` with a guessed value, or `found: false` and lose the fact that a field existed at all. The fix is the three-state enum from the previous lesson:

```json
{
  "tax_id": { "type": ["string", "null"] },
  "tax_id_status": {
    "type": "string",
    "enum": ["found", "not_present", "illegible"]
  }
}
```

`illegible` gives the model a home for exactly the smudged-invoice case above, and gives your pipeline a third branch: retry with better preprocessing rather than treating it the same as a document that never had the field.

## Takeaways

- A required field with no absence path doesn't fail loudly — it fails silently, by producing a plausible, wrong value that validates.
- Nullability alone answers "is there a value"; a sentinel flag or status enum answers "why not," and downstream logic usually needs the second answer, not just the first.
- Every uncertainty mechanism has its own failure mode — a not-found flag can undercount marginal, hard-to-read cases the way a required field overcounts fabricated ones. Check both directions on your own data before shipping either.

**Related:** [Letting the Model Say 'I Don't Know'](/learn/structured-outputs/representing-uncertainty-in-schemas), [Optional and Nullable Fields](/learn/structured-outputs/optional-and-nullable-fields), [Structured Extraction from Documents and Images](/learn/structured-outputs/structured-extraction-from-documents-and-images), [Extraction Confidence and Review Routing](/learn/structured-outputs/extraction-confidence-and-review-routing)
