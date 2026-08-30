---
title: "A Receipt Image to a Typed Object"
track: "structured-outputs"
status: live
summary: "One receipt photo, one schema, and a validation check that catches the model's arithmetic before it reaches your accounting system."
duration: "8 min read"
---

A crumpled hardware-store receipt, photographed on a phone, becomes a typed `Receipt` object — and the model gets one number wrong along the way. This is the full loop: prompt, schema, raw output, and the check that catches the mistake.

## The setup

The receipt is from Ferro Hardware & Supply: four line items, a subtotal, sales tax, and a total, printed on thermal paper that's started to fade. The target schema is `{merchant, date, items[], total}`, where each item has a description, quantity, and line total.

```python
from pydantic import BaseModel
from datetime import date

class ReceiptItem(BaseModel):
    description: str
    quantity: float
    unit_price: float
    line_total: float

class Receipt(BaseModel):
    merchant: str
    date: date
    items: list[ReceiptItem]
    subtotal: float
    tax: float
    total: float
```

Note that `subtotal` and `tax` made it into the schema even though the brief only asked for `total` — see [Extraction Is Schema-Filling](/learn/structured-outputs/extraction-as-a-structured-output-problem): model the fields the document actually shows, not the one number you ultimately want. That choice is what makes the validation step below possible.

## Step by step

### 1. Write the vision prompt

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-4-5",  # any current model with vision support
    max_tokens=1024,
    system=(
        "Extract the receipt into the given fields. If a value is not "
        "legible or not present, omit it rather than guessing. Report "
        "quantity, unit_price, and line_total exactly as printed, even "
        "if line_total does not equal quantity times unit_price."
    ),
    messages=[{
        "role": "user",
        "content": [
            {"type": "image", "source": {
                "type": "base64", "media_type": "image/jpeg", "data": IMG_B64
            }},
            {"type": "text", "text": "Extract this receipt."}
        ]
    }],
)
```

> **Why this step?** The instruction "report line_total exactly as printed, even if it doesn't equal quantity × unit_price" is doing real work. Without it, a model that notices its own arithmetic looks wrong will sometimes "fix" the number it read rather than report what's on the page — which destroys the one signal you need for the validation step. You want the model's transcription, not its opinion.

### 2. Look at the raw output

```json
{
  "merchant": "Ferro Hardware & Supply",
  "date": "2026-03-14",
  "items": [
    {"description": "Wood screws 3/4in x100", "quantity": 1, "unit_price": 9.49, "line_total": 9.49},
    {"description": "Paint roller 9in", "quantity": 2, "unit_price": 6.99, "line_total": 13.98},
    {"description": "Drop cloth 9x12", "quantity": 1, "unit_price": 8.75, "line_total": 8.75},
    {"description": "Sandpaper 120-grit 5pk", "quantity": 1, "unit_price": 4.49, "line_total": 4.49}
  ],
  "subtotal": 41.71,
  "tax": 3.13,
  "total": 47.20
}
```

> **Why this step?** Read it before validating anything programmatically. `subtotal` (41.71) plus `tax` (3.13) is 44.84, not the printed `total` of 47.20 — a gap of $2.36 that's suspiciously close to a full extra item. Eyeballing it first is what tells you *what kind* of check to write.

### 3. Validate — recompute, don't trust

```python
def validate_receipt(r: Receipt) -> list[str]:
    warnings = []
    computed_subtotal = round(sum(i.line_total for i in r.items), 2)
    if abs(computed_subtotal - r.subtotal) > 0.01:
        warnings.append(
            f"line items sum to {computed_subtotal}, "
            f"but subtotal field says {r.subtotal}"
        )
    computed_total = round(r.subtotal + r.tax, 2)
    if abs(computed_total - r.total) > 0.01:
        warnings.append(
            f"subtotal + tax = {computed_total}, "
            f"but total field says {r.total}"
        )
    return warnings
```

> **Why this step?** Every field in this schema is individually well-typed and the object parses cleanly — [validation and auto-repair](/learn/structured-outputs/validation-and-auto-repair) in the type-checking sense has nothing to flag. The bug only shows up as an *arithmetic* inconsistency, which means the check has to be domain logic, not schema logic. This is the gap [Extraction Is Schema-Filling](/learn/structured-outputs/extraction-as-a-structured-output-problem) warns about: schema-valid is not the same as correct.

Running it: `computed_subtotal` is 36.71 — the four listed items only sum to 36.71, not the printed 41.71. So the receipt has at least one more line item the model never transcribed, most likely one the crease in the paper obscured.

## Where it breaks (+fix)

The fix isn't to make the model "try harder" on the same image — a value that's genuinely not legible in the photo won't become legible by re-asking. Two things actually help: request a `source_note` field per item so the model can flag "I see a partial line here I can't read" instead of silently dropping it, and route receipts that fail the arithmetic check to a queue for a sharper photo or a human glance rather than accepting the total on faith. See [Confidence and Review Routing](/learn/structured-outputs/extraction-confidence-and-review-routing) for how to build that queue instead of hand-waving "flag it."

## Takeaways

- Model the fields the source document actually prints (subtotal *and* tax *and* total), even if you only need one of them downstream — the extra fields are what let you cross-check.
- Tell the model to transcribe faithfully rather than self-correct; a model "fixing" its own arithmetic hides the exact signal you need.
- A perfectly schema-valid object can still be wrong. Arithmetic and cross-field checks catch a different class of error than a validator ever will — see [Extraction Mistakes](/learn/structured-outputs/extraction-mistakes) for more of this family.

**Related:** [Extraction Is Schema-Filling](/learn/structured-outputs/extraction-as-a-structured-output-problem), [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair), [Extraction Mistakes](/learn/structured-outputs/extraction-mistakes), [Confidence and Review Routing](/learn/structured-outputs/extraction-confidence-and-review-routing)
