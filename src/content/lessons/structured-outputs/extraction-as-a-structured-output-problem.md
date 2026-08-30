---
title: "Extraction Is Schema-Filling"
track: "structured-outputs"
status: live
summary: "Document and image extraction is the same schema-filling problem from earlier lessons, just with a document standing in for the prompt."
duration: "6 min read"
---

Ask someone to "extract the invoice fields" and they picture something bespoke — a hand-rolled parser, regexes tuned to one vendor's layout, maybe an OCR library duct-taped to a spreadsheet. It's actually the same problem this whole track has been solving: pick a schema, get the model to fill it.

## What it is

Every lesson before this one treated the model's job as turning a short prompt into a JSON object that matches a schema. Extraction is the same job with one thing swapped: the source of truth is now a document or image instead of a sentence. You still write a schema. You still send it to the model. You still validate what comes back. The only difference is that the facts the model needs live in a receipt photo, a 40-page PDF, or a scanned form, and finding them is now part of the model's job.

That reframing matters because it tells you which lessons already apply. [JSON Schema for outputs](/learn/structured-outputs/json-schema-for-outputs), [nested and array schema design](/learn/structured-outputs/nested-and-array-schemas), [optional and nullable fields](/learn/structured-outputs/optional-and-nullable-fields) — none of that changes because the input got longer or turned into pixels. What's new is everything downstream of "the model has to *read* before it can *fill*."

## The mental model

Think of the schema as the extraction spec and the model as the thing filling it — the same contract described in [The Contract Between Model and Code](/learn/structured-outputs/the-contract-between-model-and-code), just pointed at a document instead of a task description. That contract has always had two ways to fail: the model can emit something that doesn't match the shape (a missing field, a string where you wanted a number), or it can emit something that matches the shape perfectly but is *wrong* (the right field, the wrong number). Structured-output tooling — schemas, constrained decoding, validation — only defends against the first failure. Extraction is where the second failure becomes the dominant one, because now there's a real answer sitting in the document that the model can simply misread.

## Why it works this way

Instruction-tuned models are trained hard on filling well-named, well-typed slots — that's most of what function calling and JSON-mode training looks like. Handing a model a document plus a schema activates the same behavior: "find the value for this field, put it here" rather than "compose a good answer." That's a gift, because it means the field-design moves you already know — descriptive names, enums over free text, nullable-by-default (see [Field Descriptions as Prompts](/learn/structured-outputs/field-descriptions-as-prompts)) — do double duty. They're not just formatting instructions anymore; they're reading instructions. A field named `total_amount_cents` with a description saying "the final total including tax, not the subtotal" tells the model exactly which number on a cluttered receipt to look at.

## A concrete example (shown)

A shipping label, extracted into `{tracking_number, carrier, weight_kg, delivery_date}`:

```
Label text (photographed): "FastShip Logistics · TRK: 8842-901X ·
Weight: 2.4 kg · Est. Delivery: 09/02/2026"
```

```json
{
  "tracking_number": "8842-901X",
  "carrier": "FastShip Logistics",
  "weight_kg": 2.4,
  "delivery_date": "2026-09-02"
}
```

Nothing about this is different in kind from turning a text prompt into JSON — the model located four facts on a busy label and mapped them onto four fields, including normalizing a locale-ambiguous date into ISO 8601. The schema told it what to look for; the image supplied what to find.

## Where it shows up

- Receipts and invoices, where the interesting fields are usually a header (merchant, date) plus a repeating array (line items) — see [A Receipt Image to a Typed Object](/learn/structured-outputs/receipt-image-to-schema-example).
- Contracts, where the "fields" are semi-structured clauses rather than scalars — see [Extracting Clauses from a 40-Page Contract](/learn/structured-outputs/contract-clause-extraction-example).
- Bank and brokerage statements, where the schema is a table row repeated hundreds of times.
- Scanned forms and UI screenshots, covered in [Structured Extraction from PDFs, Forms, and Screenshots](/learn/structured-outputs/structured-extraction-from-documents-and-images).

## Watch out for

- **Schema-valid isn't the same as correct.** A response that parses cleanly against your schema can still have the wrong number in the right field — validation catches shape errors, not reading errors.
- **Designing the schema like a database, not like the document.** If the receipt shows subtotal, tax, tip, and total as four separate printed lines, don't collapse them into one `total` field and hope the model picks the right line — model the fields the document actually presents.
- **Forgetting the source is lossy.** A prompt you write yourself is exactly as clear as you make it. A document was written for a human reader with context you don't have, on a scanner or camera you don't control — treat every field as fallible until it's checked.

## Where next

Start with a worked example — [A Receipt Image to a Typed Object](/learn/structured-outputs/receipt-image-to-schema-example) — then branch into the two real complications extraction adds on top of ordinary structured output: documents too long for one call ([Strategies for Long Documents](/learn/structured-outputs/long-document-extraction-strategies)) and using tool calling itself as the extraction mechanism ([Tool Calling as an Extraction Mechanism](/learn/structured-outputs/tool-and-function-schemas-for-extraction)).

**Related:** [Structured Extraction from PDFs, Forms, and Screenshots](/learn/structured-outputs/structured-extraction-from-documents-and-images), [The Contract Between Model and Code](/learn/structured-outputs/the-contract-between-model-and-code), [JSON Schema for outputs](/learn/structured-outputs/json-schema-for-outputs), [Field Descriptions as Prompts](/learn/structured-outputs/field-descriptions-as-prompts)
