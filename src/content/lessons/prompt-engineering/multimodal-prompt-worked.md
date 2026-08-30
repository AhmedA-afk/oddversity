---
title: "Worked Example: A Multimodal Image-Plus-Text Prompt"
track: "prompt-engineering"
status: live
summary: "Extracting structured data from a receipt photo plus text instructions, including what to do when the image is unreadable."
duration: "7 min read"
---

One receipt photo, one JSON schema, and two very different failure modes — a bad instruction and a bad image — that break the extraction in different ways.

## The setup

Building an expense-report extractor: input is a photo of a paper receipt plus a short text instruction; output is structured JSON for an accounting system. The target schema:

```json
{
  "merchant": "string or null",
  "date": "YYYY-MM-DD or null",
  "currency": "ISO 4217 code or null",
  "line_items": [{"description": "string", "amount": "number"}],
  "tax": "number or null",
  "total": "number or null",
  "unreadable_fields": ["field names the image could not support"],
  "needs_review": "boolean"
}
```

## Step by step

### Step 1 — reference the image correctly, and put text after it

```python
message_content = [
    {
        "type": "image",
        "source": {
            "type": "base64",
            "media_type": "image/jpeg",
            "data": base64_encoded_receipt,
        },
    },
    {
        "type": "text",
        "text": (
            "Extract the fields below from the receipt image above. "
            "Return only JSON matching this schema:\n" + schema_json
        ),
    },
]
```

> **Why this step?** Put the image block before the text instruction that refers to it ("the receipt image above"), not the other way around — the instruction should point backward at something the model has already seen. That's the same reference-and-recency logic behind [restating a task after untrusted content](/learn/prompt-engineering/injection-attack-and-defense-worked): pointing forward at "the image below," before anything has been shown, gives the model less to anchor the instruction to.

### Step 2 — constrain the output schema, including null handling

Add to the text block:

```text
For any field you cannot read with confidence, use null (or an empty list
for line_items) and add the field name to unreadable_fields. Never estimate
or invent a number you cannot actually read. Set needs_review to true if
unreadable_fields is non-empty, or if tax plus the sum of line_items.amount
does not match total.
```

> **Why this step?** This is what [Structured Output](/learn/prompt-engineering/structured-output) and [JSON Schema in Prompts](/learn/prompt-engineering/json-schema-in-prompts) both come back to: a contract is only as good as what it says about the fields it *can't* fill, not just the ones it can. Without this line, a model under pressure to complete the JSON tends to guess a plausible-looking number rather than admit it can't read one — which is worse than an obvious error, because it looks correct.

### Step 3 — handle a genuinely low-quality image

An illustrative result for a receipt with glare across the bottom, where the tax and total lines are unreadable:

```json
{
  "merchant": "Riverside Cafe",
  "date": "2026-08-14",
  "currency": "USD",
  "line_items": [
    {"description": "Coffee", "amount": 4.50},
    {"description": "Sandwich", "amount": 8.95}
  ],
  "tax": null,
  "total": null,
  "unreadable_fields": ["tax", "total"],
  "needs_review": true
}
```

> **Why this step?** This is the exact behavior the schema in step 2 was built to produce: two line items were legible, the bottom of the receipt (often the most glare-prone part of a thermal-printed receipt) wasn't, and the model reported that honestly instead of inventing a total. `needs_review: true` routes this specific receipt to a human instead of silently filing an incomplete or fabricated number.

### Step 4 — validate downstream before trusting the JSON

```python
import json

def parse_extraction(raw_output: str) -> dict:
    try:
        data = json.loads(raw_output)
    except json.JSONDecodeError:
        raw_output = strip_markdown_fences(raw_output)  # one repair attempt
        data = json.loads(raw_output)

    items_total = sum(item["amount"] for item in data.get("line_items", []))
    tax = data.get("tax") or 0
    total = data.get("total")
    if total is not None and abs((items_total + tax) - total) > 0.01:
        data["needs_review"] = True
    return data
```

> **Why this step?** This arithmetic check doesn't rely on the model at all — it's a cheap, deterministic cross-check that catches the case where every individual field looked plausible but the numbers don't actually add up, which a glance at the JSON alone wouldn't catch. The one-repair-attempt pattern here is the same discipline covered in the [validate-and-repair loop](/learn/prompt-engineering/validation-and-repair-loop): fix the obvious wrapper issue once, then trust the result or flag it.

## Where it breaks (+fix)

A rotated photo, a receipt in a currency or script the extractor hasn't been tested on (see [Adapting Prompts Across Languages](/learn/prompt-engineering/adapting-prompts-across-languages)), or a photo cropped at an angle that cuts off the total entirely — the model may confidently report a subtotal as the total, because nothing about a cropped image *looks* incomplete to it the way a blurry patch does. The fix isn't a smarter prompt alone: add a lightweight completeness check before extraction (does the image contain anything matching a total-like line at all), and always run the arithmetic cross-check from step 4 regardless of what confidence the model claims for itself.

## Takeaways

- Show the image before the instruction that refers to it.
- An output contract needs an explicit answer for "what if this field is illegible," not just a type.
- A model reporting confidence and a model being right are two different things — a deterministic cross-check catches errors a schema check alone won't.
- Design the null and `needs_review` path as a first-class part of the output, not an afterthought bolted on for edge cases.

**Related:** [Adapt Prompts Across Modalities and Languages](/learn/prompt-engineering/multimodal-and-localized-prompts) · [Worked Example: An Injection Attack and Its Mitigations](/learn/prompt-engineering/injection-attack-and-defense-worked) · [Structured Output](/learn/prompt-engineering/structured-output) · [JSON Schema in Prompts](/learn/prompt-engineering/json-schema-in-prompts) · [Validation and Repair Loop](/learn/prompt-engineering/validation-and-repair-loop) · [Adapting Prompts Across Languages](/learn/prompt-engineering/adapting-prompts-across-languages)
