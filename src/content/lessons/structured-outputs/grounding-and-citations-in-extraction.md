---
title: "Grounding Extractions in the Source"
track: "structured-outputs"
status: live
summary: "A value with no path back to where it came from is a value a reviewer has to either fully trust or fully re-derive."
duration: "6 min read"
---

An extracted total, date, or clause is only as auditable as its path back to the source. Without that path, checking one field means re-reading the whole document.

## What it is

Grounding means every extracted field carries provenance alongside its value — a page number, a character span, a bounding region, or the exact source text it came from — so a human or an automated checker can jump straight to where the model read it, instead of taking the value on faith or re-scanning the entire document to confirm it.

## The mental model

Stop thinking of a field as a bare value and start thinking of it as a `(value, provenance)` pair. Provenance can be coarse — "this came from page 4" — or fine — "this came from the text spanning characters 1,204 to 1,219, which rendered as the box at these four coordinates." The right granularity depends on what a reviewer would actually need to verify the value quickly: a page number is often enough for a contract clause; a bounding box matters more for a receipt total headed into an automated reimbursement flow, where a human glance at the highlighted region is the entire review step.

## Why it works this way

Grounding turns "trust the model" into "trust the model, verify in one click." That's the same idea that makes retrieval-augmented answers auditable rather than just plausible-sounding — see [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality) for the shared principle: an answer (or an extraction) without a pointer back to its source is a claim you can't cheaply check, no matter how confident it looks. The cost of adding grounding is small — one or two extra fields per record — and it converts every low-confidence extraction from "escalate the whole document" into "escalate this one page, this one row."

## A concrete example (shown)

```json
{
  "total": {
    "value": 47.20,
    "page": 1,
    "source_text": "TOTAL   47.20"
  },
  "merchant": {
    "value": "Ferro Hardware & Supply",
    "page": 1,
    "source_text": "FERRO HARDWARE & SUPPLY"
  }
}
```

Each field is now a small object instead of a bare scalar — see [Nested Objects and Arrays in Output Schemas](/learn/structured-outputs/nested-and-array-schemas) for the general pattern of wrapping a value with metadata. A reviewer checking `total` doesn't re-read the receipt; they read one line.

## Where it shows up

Bank statement rows pointing back to a page and row position (see [Transactions from a Bank Statement](/learn/structured-outputs/bank-statement-transactions-example)), contract clauses citing the page they were found on (see [Extracting Clauses from a 40-Page Contract](/learn/structured-outputs/contract-clause-extraction-example)), and any high-stakes extraction — payments, medical forms, legal filings — where a wrong value has real consequences and someone needs to check it fast.

## Watch out for

- **Asking for provenance the model's modality can't actually supply.** A text-only pass over OCR output can report a page number reliably but shouldn't be asked for a precise bounding box it never had pixel coordinates for — only request grounding the input actually supports.
- **Trusting a reported page number without range-checking it.** A model can misreport `page: 47` on a 40-page document as easily as it can misread a total; validate that grounding metadata is itself plausible, the same way you'd validate any other field.
- **Building the grounding fields and never surfacing them.** An audit trail nobody's UI displays is an audit trail that doesn't get used — the point of grounding is that a reviewer actually clicks through to it.

## Where next

Grounding is what makes [Confidence and Review Routing](/learn/structured-outputs/extraction-confidence-and-review-routing) practical — a low-confidence extraction routed to a human is only quick to review if it comes with a pointer to exactly where to look.

**Related:** [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality), [Confidence and Review Routing](/learn/structured-outputs/extraction-confidence-and-review-routing), [Transactions from a Bank Statement](/learn/structured-outputs/bank-statement-transactions-example), [Extracting Clauses from a 40-Page Contract](/learn/structured-outputs/contract-clause-extraction-example), [Extraction Is Schema-Filling](/learn/structured-outputs/extraction-as-a-structured-output-problem)
