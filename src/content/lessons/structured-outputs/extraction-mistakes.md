---
title: "Extraction Mistakes"
track: "structured-outputs"
status: live
summary: "Five ways extraction fails that a plain schema validator will never flag, each with the check that catches it."
duration: "6 min read"
---

These aren't generic structured-output bugs — they're specific to pulling data out of documents and images, and every one of them slips straight past a schema validator that only checks shape.

## The mistake: hallucinating a plausible value for an absent field

**Why it's wrong:** A schema that marks a field required, or a prompt that implies every field should be filled, pressures the model to produce *something* even when the document genuinely doesn't have that information — a receipt with no visible tax line, a form with a blank signature box. A plausible-looking guess is worse than an honest gap, because it's indistinguishable from a real value downstream.

**Symptom:** Extracted values that are suspiciously "typical" — a $0.00 tax on a receipt from a state that charges sales tax, a delivery date exactly 3 days after the order date on every single order regardless of what's printed.

**Fix:** Make every field nullable by default and instruct the model explicitly to omit or null a field it can't actually find, rather than to fill it (see the sentinel pattern in [the Not-Found Sentinel](/learn/structured-outputs/not-found-sentinel-example)). Spot-check nulls too — a suspiciously *low* null rate on a field that's often genuinely absent in the source population is itself a sign the model is guessing instead of reporting.

## The mistake: unit and date-format drift

**Why it's wrong:** Documents mix units and date formats constantly — a European invoice using DD/MM/YYYY next to a US-formatted due date, weights in kg on one line and lb on another. A schema that just says `date: string` or `weight: number` gives the model no reason to normalize consistently, and it won't.

**Symptom:** A `date` field that's sometimes ISO 8601 and sometimes not, or valid on some rows and silently swapped (03/04 read as April 3rd instead of March 4th) on others. Numeric fields that are occasionally off by a unit-conversion factor.

**Fix:** Say the target format and unit explicitly in the field description, not just the type — "ISO 8601, YYYY-MM-DD" and "weight in kilograms; convert if the source shows pounds" are prompts to the reading process, not just documentation (see [Field Descriptions as Prompts](/learn/structured-outputs/field-descriptions-as-prompts)). For genuinely ambiguous source dates (no locale indicator at all), add a `date_ambiguous: boolean` field rather than silently picking one interpretation.

## The mistake: merge collisions across chunk boundaries

**Why it's wrong:** Overlapping chunks are supposed to guarantee no entity is lost — but the same overlap guarantees some entities get extracted twice, and a merge step that doesn't dedupe carefully either drops a real duplicate-looking-but-distinct entity or keeps two fragments of the same one.

**Symptom:** An item count in the merged output that's noticeably higher than a manual estimate, with several near-identical entries; or a clause/requirement that only shows the truncated half of what the document actually says (see [Extracting Clauses from a 40-Page Contract](/learn/structured-outputs/contract-clause-extraction-example)).

**Fix:** Key the merge on the most specific identity signal available (an explicit ID, a `type` + starting `page` pair) before falling back to fuzzy text similarity, and when two candidates match, keep the more complete one rather than the first one seen. [Chunk, Extract, Merge](/learn/structured-outputs/chunk-and-merge-extraction) implements this end to end.

## The mistake: over-trusting OCR or vision output on a blurry image

**Why it's wrong:** A blurry photo or a low-resolution scan doesn't make a model refuse to answer — it makes the model produce its best guess at what's there, formatted exactly as confidently as a clean read of a crisp document. Confidence in tone and confidence in accuracy are unrelated.

**Symptom:** A digit or character substitution that's visually plausible (a 3 read as an 8, an "S" read as a "5") producing a value that's schema-valid and unremarkable-looking, but wrong — the kind of error that only surfaces through a cross-check like arithmetic ([A Receipt Image to a Typed Object](/learn/structured-outputs/receipt-image-to-schema-example)) or a running total ([Transactions from a Bank Statement](/learn/structured-outputs/bank-statement-transactions-example)), never through the value looking "off" on its own.

**Fix:** Never rely on a single extraction of a high-stakes number when a cross-check is available — recompute sums, check running balances, compare a total against its components. Where no cross-check exists, ask the model to self-report legibility (a `low_confidence_fields: string[]` list) and route those to review rather than accepting them at face value.

## The mistake: treating schema-valid as correct

**Why it's wrong:** This is the umbrella mistake behind the four above: a validator checks that a `total` is a number and a `date` parses — it has no opinion on whether that number or date is the *right* one. Teams that stop at "it validated" ship extractions that are structurally perfect and semantically wrong.

**Symptom:** Extraction pipelines with a green validation dashboard and a steady trickle of downstream complaints — wrong invoice totals reaching accounting, wrong dates reaching a calendar — none of which show up as a validation failure because nothing about them is invalid JSON.

**Fix:** Add domain-specific cross-field checks as a second validation layer, separate from schema conformance: arithmetic that should reconcile, values that should fall in a plausible range, fields that should agree with each other. Treat a cross-field check failure exactly like a schema failure for routing purposes — see [Confidence and Review Routing](/learn/structured-outputs/extraction-confidence-and-review-routing).

## Pre-flight checklist

- [ ] Every field is nullable, and the prompt explicitly says to omit rather than guess when a value isn't present or legible.
- [ ] Every date and unit field's target format is spelled out in its description, not just its type.
- [ ] The merge step keys on the most specific identity signal available, and logs every merge decision it makes.
- [ ] At least one cross-field or arithmetic check exists for every high-stakes numeric field.
- [ ] "Validated" and "correct" are treated as two different gates, with the second one feeding a review queue, not a silent pass.

**Related:** [Extraction Is Schema-Filling](/learn/structured-outputs/extraction-as-a-structured-output-problem), [Not-Found Sentinel Example](/learn/structured-outputs/not-found-sentinel-example), [Chunk, Extract, Merge](/learn/structured-outputs/chunk-and-merge-extraction), [A Receipt Image to a Typed Object](/learn/structured-outputs/receipt-image-to-schema-example), [Confidence and Review Routing](/learn/structured-outputs/extraction-confidence-and-review-routing)
