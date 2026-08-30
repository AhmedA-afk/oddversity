---
title: "Letting the Model Say 'I Don't Know"
track: "structured-outputs"
status: live
summary: "Confidence scores, nullable-for-unknown, and not-found sentinels — the three tools for giving absence a legal, honest shape."
duration: "6 min read"
---

A schema with no legal way to express "I don't know" doesn't get honesty by default — it gets a confident-looking wrong answer instead, because the decoder still has to finish the object.

## What it is

Three complementary tools for representing uncertainty inside an otherwise closed, reliable schema: a **confidence score** attached to a value, a **nullable field** for values that are genuinely sometimes absent, and an explicit **not-found sentinel** (a sibling flag or enum value) that names the absence instead of just leaving a gap. [Optional and Nullable Fields](/learn/structured-outputs/optional-and-nullable-fields) already covers the core mechanics of the nullable half of this — required-fields-force-fabrication, optional versus nullable as different contracts. This lesson is about combining these tools deliberately, as a reliability decision, not just a validation one.

## The mental model

Every field in a required, non-nullable schema is a promise: *the model will produce a value here, no matter what.* If the source material doesn't support one, the model doesn't get to break the promise — it satisfies it with something plausible-looking instead, and that output validates cleanly, so nothing downstream flags it. The fix isn't to remove the promise everywhere (a schema with nothing required just pushes the ambiguity onto every consumer of the output); it's to make the *legal* set of values include an honest "not present," so the promise the model keeps is "I'll tell you accurately whether this exists," not "I'll produce a value regardless of whether one exists."

## Why it works this way

A decoder enforcing a schema doesn't know or care whether a value is *true* — only whether it's *shaped correctly*. A required string field must be filled with some string before generation can finish; if there's no legal way to say "not present," the model's only path to a valid object is inventing one. This is one of the quietest sources of hallucination in extraction pipelines specifically because the output is syntactically perfect — no error, no flag, just a wrong value sitting where a real one should be.

**Confidence scores** attach a number (or a coarse `high`/`medium`/`low` enum) to a value the model did produce, signaling how much to trust it. They're useful for routing — send low-confidence extractions to a human, auto-accept high-confidence ones — but treat a model's self-reported confidence as a rough, uncalibrated signal, not a real probability. A model saying "0.9 confidence" isn't drawing that number from a measured error rate; it's generating a plausible-looking number the same way it generates any other token. Use it to rank and route, not to compute anything that assumes it's statistically meaningful.

**Nullable fields** give a value slot a legal empty state — `"type": ["string", "null"]` — for data that's sometimes genuinely missing from the source. This is the right tool when absence itself doesn't need explaining: a middle name, a discount code, an optional comment field.

**Not-found sentinels** go one step further, for cases where the *reason* for absence matters downstream — did the model not find it, or did it find it and confirm it doesn't apply? A bare `null` is ambiguous between "I looked and it's not there" and "I didn't check." Pairing the value with an explicit flag resolves that:

```json
{
  "tax_id": null,
  "tax_id_found": false
}
```

or, more compactly, folding it into an enum the model fills honestly instead of a boolean plus a value:

```json
{
  "tax_id_status": "not_present_in_document"
}
```

[Discriminated Unions for Variants](/learn/structured-outputs/discriminated-unions-in-schemas) is the same idea scaled up — a discriminant field that tells the consumer which shape of "the rest" to expect, rather than trying to cram every possible outcome into one ambiguous slot.

## A concrete example

Extracting an invoice's PO number, which is genuinely absent from a large share of real invoices:

```json
{
  "type": "object",
  "properties": {
    "po_number": { "type": ["string", "null"] },
    "po_number_status": {
      "type": "string",
      "enum": ["found", "not_present", "illegible"],
      "description": "'not_present' if the document has no PO number field at all; 'illegible' if a PO number field exists but the value can't be read."
    }
  },
  "required": ["po_number", "po_number_status"]
}
```

This turns "the model doesn't know" from a silent gap into a signal your pipeline can branch on directly — retry with a different extraction strategy on `illegible`, skip PO-based matching entirely on `not_present`, and trust `po_number` outright on `found`.

## Where it shows up

Document extraction where fields are legitimately, unpredictably absent across a corpus — [Structured Extraction from Documents and Images](/learn/structured-outputs/structured-extraction-from-documents-and-images) — is the most common home for this pattern, but it applies anywhere a schema asks for something the input might not contain: a sentiment schema asking for a `stated_reason` that not every review gives, a resume parser asking for a `graduation_year` that not every resume states.

## Watch out for

- **A sentinel scheme with no fixed vocabulary is worse than none.** `null`, `""`, `"N/A"`, and `"unknown"` used interchangeably across a codebase reintroduce exactly the ambiguity you were trying to remove — [Reliability-Design Mistakes](/learn/structured-outputs/reliability-design-mistakes) covers this specific failure.
- **Don't make everything optional to be safe.** A field that should always exist for the record to make sense (an `id`, a `record_type`) belongs as required — a missing one should fail loudly, not degrade gracefully into more ambiguity.
- **A confidence score is not a substitute for grounding.** A well-calibrated-*sounding* number next to a hallucinated value is worse than no number at all, because it invites trust the value hasn't earned.

## Where next

[A Not-Found Sentinel That Stops Hallucination](/learn/structured-outputs/not-found-sentinel-example) runs the required-string-versus-nullable-plus-flag comparison directly on a field that's absent from half a real document set.

**Related:** [Optional and Nullable Fields](/learn/structured-outputs/optional-and-nullable-fields), [A Not-Found Sentinel That Stops Hallucination](/learn/structured-outputs/not-found-sentinel-example), [Discriminated Unions for Variants](/learn/structured-outputs/discriminated-unions-in-schemas), [Extraction Confidence and Review Routing](/learn/structured-outputs/extraction-confidence-and-review-routing)
