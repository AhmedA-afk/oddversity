---
title: "Pydantic Models for Extraction"
track: "structured-outputs"
status: live
summary: "Build a Pydantic v2 model for a user-with-orders extraction, export its JSON Schema, and read a validation failure."
duration: "8 min read"
---

Hand-writing the JSON Schema for anything beyond a handful of flat fields gets tedious and drifts fast — you rename a field in your database model and forget the twin definition sitting in a prompt file. Pydantic fixes this by making one class the source of both your Python type and the schema the model sees.

## What we're building

A schema for extracting a customer record with a nested list of orders — the canonical "object with a nested array of objects" shape that shows up in invoices, CRM records, and order histories alike. We'll define it once, generate the JSON Schema from it, and then parse and validate a model's response against the same class.

## Setup

You need Pydantic v2 (the examples below use the v2 API — `model_config`, `model_json_schema()`, `model_validate_json()` — which differs from v1):

```bash
pip install "pydantic>=2"
```

## Build it

### Step 1: Define the nested model first

Build from the inside out. An `Order` is simpler than a `User`, and `User` will reference it:

```python
from pydantic import BaseModel, ConfigDict, Field

class Order(BaseModel):
    model_config = ConfigDict(extra="forbid")

    order_id: str
    item: str
    quantity: int = Field(gt=0)
    unit_price: float = Field(ge=0)
```

`ConfigDict(extra="forbid")` is the part people skip. Pydantic's default is to silently ignore fields it doesn't recognize — the opposite of what you want in a model output, where a stray key is a symptom worth seeing, not noise to swallow. This is the same `additionalProperties: false` idea from [The JSON Schema Subset That Matters](/learn/structured-outputs/json-schema-essentials-for-outputs), and it needs to be set explicitly at every nesting level, `Order` included.

### Step 2: Define the top-level model

```python
class User(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user_id: str
    name: str
    email: str | None = None
    orders: list[Order]
```

`orders: list[Order]` is the whole nested-array story — Pydantic recurses into `Order`'s schema automatically, so there's no separate step for "now describe what's inside the array." Notice `email: str | None = None` reads as three things at once — optional, nullable, and defaulted — which is exactly the kind of collapsed field worth pulling apart deliberately; see [Optional, Nullable, Default, Missing](/learn/structured-outputs/optional-nullable-and-defaults) for when that's the right call versus an accident.

### Step 3: Export the JSON Schema

```python
import json

schema = User.model_json_schema()
print(json.dumps(schema, indent=2))
```

This produces something close to:

```json
{
  "title": "User",
  "type": "object",
  "properties": {
    "user_id": { "type": "string", "title": "User Id" },
    "name": { "type": "string", "title": "Name" },
    "email": {
      "anyOf": [{ "type": "string" }, { "type": "null" }],
      "default": null,
      "title": "Email"
    },
    "orders": {
      "type": "array",
      "items": { "$ref": "#/$defs/Order" },
      "title": "Orders"
    }
  },
  "required": ["user_id", "name", "orders"],
  "additionalProperties": false,
  "$defs": {
    "Order": {
      "type": "object",
      "properties": {
        "order_id": { "type": "string", "title": "Order Id" },
        "item": { "type": "string", "title": "Item" },
        "quantity": { "type": "integer", "exclusiveMinimum": 0, "title": "Quantity" },
        "unit_price": { "type": "number", "minimum": 0, "title": "Unit Price" }
      },
      "required": ["order_id", "item", "quantity", "unit_price"],
      "additionalProperties": false
    }
  }
}
```

This is the exact dict you pass to your provider's structured-output or tool-calling parameter — no hand-transcription, and no chance of the schema disagreeing with the class that will parse the response.

### Step 4: Parse and validate a response

```python
raw_response = '''
{
  "user_id": "u_9284",
  "name": "Priya Shah",
  "email": null,
  "orders": [
    { "order_id": "o_1", "item": "Desk lamp", "quantity": 2, "unit_price": 24.5 },
    { "order_id": "o_2", "item": "Notebook", "quantity": 5, "unit_price": 3.0 }
  ]
}
'''

user = User.model_validate_json(raw_response)
print(user.orders[0].item)   # "Desk lamp"
print(user.orders[1].quantity * user.orders[1].unit_price)  # 15.0
```

`model_validate_json` does the parse and the validation in one call, and hands back real `Order` instances inside `user.orders` — not dicts you still need to trust.

## Run it

Feed it something invalid — say the model returns a negative quantity because the source text said "returned 2 units":

```python
bad_response = '''
{
  "user_id": "u_9284",
  "name": "Priya Shah",
  "orders": [
    { "order_id": "o_1", "item": "Desk lamp", "quantity": -2, "unit_price": 24.5 }
  ]
}
'''

from pydantic import ValidationError

try:
    User.model_validate_json(bad_response)
except ValidationError as e:
    print(e.errors())
```

`e.errors()` is a list of structured dicts, not a string you have to regex:

```python
[
  {
    "type": "greater_than",
    "loc": ("orders", 0, "quantity"),
    "msg": "Input should be greater than 0",
    "input": -2,
    "ctx": {"gt": 0}
  }
]
```

`loc` is a tuple giving you the exact path — `orders[0].quantity` — which is what makes this useful for anything beyond logging: you can route on `loc` and `type` to decide whether to retry, repair just that field, or reject the whole record. That routing logic is the subject of [validation and auto-repair](/learn/structured-outputs/validation-and-auto-repair); this error shape is the input it operates on.

## Harden it

A few additions that pay for themselves once this leaves a notebook:

- **Give every field a `description`** where the source data is ambiguous — it reaches the model as an inline instruction, not just documentation. See [Field Descriptions Are Inline Prompts](/learn/structured-outputs/field-descriptions-as-prompts).
- **Set `extra="forbid"` on every nested model, not just the top one.** It's easy to lock down `User` and forget `Order` sits open.
- **Prefer `model_validate_json` over `json.loads` + `model_validate`** when you have raw text — it fails with the same `ValidationError` for malformed JSON as for a schema mismatch, so you don't need two except blocks.
- **Log `e.errors()` structured, not stringified** — you lose the `loc` tuples the moment you cast it to a string.

## Extend it

Once this pattern is solid, the natural next moves are constraining `Order.item` or a status-like field to a fixed set with [Enums, Literals, and Bounded Fields](/learn/structured-outputs/enums-and-constrained-value-fields), handling an `orders` list where entries can be genuinely different shapes with [Discriminated Unions for Heterogeneous Items](/learn/structured-outputs/discriminated-unions-for-variants), or comparing this same model side by side with its Zod equivalent in [Pydantic and Zod Side by Side](/learn/structured-outputs/pydantic-and-zod-side-by-side).

**Related:** [Zod Schemas for Extraction](/learn/structured-outputs/zod-schemas-for-extraction), [The JSON Schema Subset That Matters](/learn/structured-outputs/json-schema-essentials-for-outputs), [Pydantic and Zod: Deriving Schemas from Code](/learn/structured-outputs/pydantic-zod-schema-patterns), [Optional, Nullable, Default, Missing](/learn/structured-outputs/optional-nullable-and-defaults)
