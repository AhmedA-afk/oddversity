---
title: "Worked Example: A Classify-Then-Extract Pipeline"
track: "prompt-engineering"
status: live
summary: "One classifier routes documents to one of several type-specific extraction prompts, each with its own schema."
duration: "7 min read"
---

An invoice and a contract have nothing in common structurally — different fields, different rubrics, no shared schema worth forcing. One classifier decides which document you're looking at; the extraction prompt that runs next is chosen, not shared.

## The setup

Two documents, run through the same pipeline:

**Doc A:**
```text
INVOICE #4471
Vendor: BrightSupply Co.
Bill to: Acme Corp
Amount Due: $2,340.00
Due Date: 2026-09-15
Thank you for your business.
```

**Doc B:**
```text
SERVICES AGREEMENT
This agreement is entered into between Acme Corp and Northwind Logistics,
effective July 1, 2026, for an initial term of 12 months. Either party
may terminate with 60 days' written notice.
```

## Step by step

### Step 1 — classify (one job, one rubric, every document)

```text
Classify this document as exactly one of: "invoice", "contract", "other".
Respond with JSON: {"document_type": "<one of the above>"}

Document: {document_text}
```

```json
// Doc A
{"document_type": "invoice"}
// Doc B
{"document_type": "contract"}
```

> **Why this step?** Classification is the same job no matter what walks in — a single, narrow prompt handles any document without needing to already know which fields matter. It's the routing layer, not the payload layer, which is exactly the kind of clean seam described in [When to Split One Prompt Into a Pipeline](/learn/prompt-engineering/when-to-split-a-prompt).

### Step 2 — route to a type-specific extractor

```python
EXTRACTORS = {
    "invoice": run_invoice_extraction,
    "contract": run_contract_extraction,
    "other": None,
}

def run_pipeline(document_text, call_model):
    doc_type = classify(document_text, call_model)["document_type"]
    extractor = EXTRACTORS.get(doc_type)
    if extractor is None:
        return {"document_type": doc_type, "extracted": None}
    return {"document_type": doc_type, "extracted": extractor(document_text, call_model)}
```

> **Why this step?** The routing itself is a plain dict lookup — the interesting decision already happened in step 1. The two extraction jobs share no fields, so one prompt trying to cover "whatever fields this document turns out to need" would recreate the exact multi-format problem that motivated splitting in the first place.

### Step 3a — invoice extraction (only reached when `document_type == "invoice"`)

```text
Extract the following fields from this invoice. Use null if a field is not present.

Fields: vendor (string), invoice_number (string), amount_due (number),
due_date (string, YYYY-MM-DD)

Document: {document_text}

Respond with JSON only.
```

```json
{"vendor": "BrightSupply Co.", "invoice_number": "4471", "amount_due": 2340.00, "due_date": "2026-09-15"}
```

### Step 3b — contract extraction (only reached when `document_type == "contract"`)

```text
Extract the following fields from this contract. Use null if a field is not present.

Fields: parties (array of strings), effective_date (string, YYYY-MM-DD),
term_length_months (number or null), termination_notice_days (number or null)

Document: {document_text}

Respond with JSON only.
```

```json
{"parties": ["Acme Corp", "Northwind Logistics"], "effective_date": "2026-07-01", "term_length_months": 12, "termination_notice_days": 60}
```

> **Why this step?** The two schemas share zero fields. Forcing them into one shared shape — a single `amount` and a single `parties` field for both document types — would mean every invoice result carries a meaningless empty `parties` array and every contract result carries a meaningless `amount_due: null`. Routing first is what lets each [output contract](/learn/prompt-engineering/structured-output-contracts) stay exactly as narrow as its document type actually needs.

## Where it breaks (and the fix)

Feed the pipeline a purchase order that mixes invoice-like line items with contract-like terms language. Stage 1 misreads it as `"invoice"`, and stage 2 dutifully runs the invoice extractor — which finds no vendor, no invoice number, no amount due in a document that never had them, and returns:

```json
{"vendor": null, "invoice_number": null, "amount_due": null, "due_date": null}
```

That's valid JSON, and it passes a schema check that only requires the right keys and types — nulls are allowed. It looks like a clean, successful run. It's actually a silent routing failure wearing the costume of "this invoice was just missing all its fields."

The fix is a cheap sanity check after extraction, not a smarter classifier: if a type-specific extraction returns null or empty for most of its fields, treat that as a signal the classification may have been wrong, not as a normal result to accept. Route it to review instead of returning it as-is. This is the same syntax-versus-semantics trap covered in [Structured Output: Making the Model Speak a Contract](/learn/prompt-engineering/structured-output-contracts) — a schema-valid answer that's still the wrong answer — and it's a good candidate for the kind of feedback a [validate-and-repair loop](/learn/prompt-engineering/validation-and-repair-loop) can catch if you extend the schema to require at least one non-null field.

## Takeaways

- Classification is the one job every document shares; extraction is N different jobs, one schema per document type, and they don't need to look alike.
- Routing on the classification result is what lets each extraction prompt stay narrow instead of trying to anticipate every possible document shape in a single call.
- A confidently-empty result is a real failure mode of this pattern — it's schema-valid and still wrong, so check for "extracted almost nothing" as its own signal, not just for parse failures.

**Related:** [When to Split One Prompt Into a Pipeline](/learn/prompt-engineering/when-to-split-a-prompt), [Structured Output: Making the Model Speak a Contract](/learn/prompt-engineering/structured-output-contracts), [Passing State Cleanly Between Pipeline Stages](/learn/prompt-engineering/passing-state-between-stages), [Building a Validate-and-Repair Loop](/learn/prompt-engineering/validation-and-repair-loop)
