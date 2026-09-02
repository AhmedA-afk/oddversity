---
title: "Converting an OpenAPI Spec to Tool Schemas"
track: "tools-function-calling"
status: live
summary: "Generate a tool schema programmatically from a Stripe-style OpenAPI endpoint, then hand-tune the result — because raw conversion is a starting point, not a finished schema."
duration: "8 min read"
---

If you already have an OpenAPI spec for your API, generating tool schemas from it looks like it should be a solved, mechanical problem. It's about 70% mechanical. The other 30% — the part that actually determines whether the model calls the tool correctly — is judgment a converter can't supply.

## What we're building

A small converter that takes one OpenAPI path/operation, in the style of Stripe's public API, and emits a Claude-style tool schema (`name`, `description`, `input_schema`). Then we hand-tune the auto-generated output and compare the two side by side.

## Setup

The source: a single OpenAPI operation for creating a charge, trimmed to the parts that matter for this walkthrough.

```yaml
/v1/charges:
  post:
    operationId: PostCharges
    summary: Create a charge
    description: To charge a credit card or other payment source, you create a Charge object.
    requestBody:
      content:
        application/x-www-form-urlencoded:
          schema:
            type: object
            properties:
              amount:
                type: integer
                description: A positive integer in cents representing how much to charge.
              currency:
                type: string
                description: Three-letter ISO currency code, in lowercase.
              customer:
                type: string
                description: The ID of an existing customer to charge.
              description:
                type: string
                description: An arbitrary string attached to the object.
              receipt_email:
                type: string
                nullable: true
                description: Email address to send this charge's receipt to.
              source:
                type: string
                description: A payment source to be charged, such as a token or a card.
            required:
              - amount
              - currency
```

## Build it

### Step 1: parse the operation into a flat parameter list

```python
import yaml

def load_operation(spec_text: str, path: str, method: str) -> dict:
    spec = yaml.safe_load(spec_text)
    return spec[path][method]

op = load_operation(spec_yaml, "/v1/charges", "post")
props = op["requestBody"]["content"]["application/x-www-form-urlencoded"]["schema"]["properties"]
required = op["requestBody"]["content"]["application/x-www-form-urlencoded"]["schema"].get("required", [])
```

> **Why this step?** OpenAPI splits parameters across `parameters` (path/query) and `requestBody` (body), and can nest the body schema behind a media type key. A tool schema doesn't care about that transport-level distinction — every one of these becomes a flat property in `input_schema.properties`. This step's job is collapsing OpenAPI's transport structure down to the one flat namespace tools actually use.

### Step 2: map each OpenAPI field to a JSON Schema tool property

```python
def map_type(oas_type: str, nullable: bool = False) -> dict:
    result = {"type": oas_type}
    return result

def convert_properties(props: dict) -> dict:
    converted = {}
    for name, field in props.items():
        entry = map_type(field.get("type", "string"), field.get("nullable", False))
        if "description" in field:
            entry["description"] = field["description"]
        if "enum" in field:
            entry["enum"] = field["enum"]
        converted[name] = entry
    return converted

converted_props = convert_properties(props)
```

> **Why this step?** This is the truly mechanical part: `type` and `description` carry over almost unchanged, `enum` carries over unchanged (OpenAPI and tool-schema JSON Schema agree here). This is also where OpenAPI's richer vocabulary starts getting silently dropped — `nullable` has no clean tool-schema equivalent, so it's currently ignored, which is exactly the kind of gap Step 4 exists to catch.

### Step 3: assemble the tool definition

```python
def build_tool(op: dict, converted_props: dict, required: list[str]) -> dict:
    return {
        "name": op["operationId"].lower().replace("post", "create", 1) if op["operationId"].lower().startswith("post") else op["operationId"].lower(),
        "description": op.get("description") or op.get("summary", ""),
        "input_schema": {
            "type": "object",
            "properties": converted_props,
            "required": required
        }
    }

raw_tool = build_tool(op, converted_props, required)
```

> **Why this step?** `operationId` becomes the tool `name` (with a light naming pass — `PostCharges` to `create_charges` reads far better to a model than a raw camelCase operation ID), and the OpenAPI `description` becomes the tool description verbatim, for now.

### Step 4: run it and inspect the raw output

```python
print(json.dumps(raw_tool, indent=2))
```

```json
{
  "name": "create_charges",
  "description": "To charge a credit card or other payment source, you create a Charge object.",
  "input_schema": {
    "type": "object",
    "properties": {
      "amount": { "type": "integer", "description": "A positive integer in cents representing how much to charge." },
      "currency": { "type": "string", "description": "Three-letter ISO currency code, in lowercase." },
      "customer": { "type": "string", "description": "The ID of an existing customer to charge." },
      "description": { "type": "string", "description": "An arbitrary string attached to the object." },
      "receipt_email": { "type": "string", "description": "Email address to send this charge's receipt to." },
      "source": { "type": "string", "description": "A payment source to be charged, such as a token or a card." }
    },
    "required": ["amount", "currency"]
  }
}
```

This is a complete, valid tool schema. It is also not ready to ship, and the reasons why are the actual point of this lesson.

## Why raw generation is a starting point, not the finish

Walk through what's wrong with the mechanically-generated schema:

- **The name is generic and plural-awkward.** `create_charges` (from `PostCharges`) reads oddly for an operation that creates exactly one charge. OpenAPI operation IDs are written for developers browsing an API reference, not for a model choosing between tools — `create_charge` is the name a human would actually give this.
- **The description is API documentation, not tool-selection guidance.** "To charge a credit card or other payment source, you create a Charge object" describes the *concept* of a Charge object the way Stripe's docs would, but says nothing about *when an agent should call this* or what happens if it's called twice. Compare this against /learn/tools-function-calling/writing-descriptions-models-follow-deep — a converted description almost never survives that bar unedited.
- **`amount` in cents is a landmine with no warning.** The OpenAPI description says "in cents" but doesn't scream it, and a model asked to "charge the customer $50" has to correctly multiply by 100. This needs to be far more explicit than the source spec bothered to make it, precisely because the spec was written for developers who already know Stripe's cents convention — a model calling this for the first time doesn't.
- **`source` accepts several different kinds of payment source** (raw card token, saved card ID, and more in Stripe's real API) collapsed into one untyped string with a vague description. This is exactly the kind of thing that was probably an `oneOf` or a `$ref` union in the full OpenAPI spec — see /learn/tools-function-calling/json-schema-for-tools-essentials on why those combinators get flattened away rather than carried over, and here that flattening lost information the model needs restated in prose.
- **No mention of the tool's real-world consequence.** This charges a real payment method. Nothing in the auto-generated schema signals that this needs an approval gate before execution — see /learn/tools-function-calling/approval-gates-for-sensitive-tools — because OpenAPI specs don't carry that judgment and a converter can't infer it.

## The hand-tuned result

```json
{
  "name": "create_charge",
  "description": "Charge a customer's saved payment method or a one-time payment token. This creates a real charge — only call this after the user has explicitly confirmed the amount and recipient. Use for a single, immediate charge, not for subscriptions or recurring billing.",
  "input_schema": {
    "type": "object",
    "properties": {
      "amount_cents": {
        "type": "integer",
        "description": "Amount to charge, in cents (e.g. 5000 for $50.00). Always convert from dollars before calling."
      },
      "currency": {
        "type": "string",
        "description": "Three-letter ISO currency code, lowercase, e.g. usd."
      },
      "customer_id": {
        "type": "string",
        "description": "ID of an existing saved customer to charge. Omit if using payment_token instead."
      },
      "payment_token": {
        "type": "string",
        "description": "A one-time payment token for a customer with no saved payment method. Omit if using customer_id instead."
      },
      "description": {
        "type": "string",
        "description": "Short note about what this charge is for, shown on the receipt."
      }
    },
    "required": ["amount_cents", "currency"]
  }
}
```

The field-level types and required set survived from the raw conversion almost unchanged — that part really was mechanical and correct. Everything that changed is the part that needed a human who understands both the model's failure modes and the business risk of this specific call: the name, the description's "when to use / when not to / what it does in the real world," the renamed `amount_cents` field forcing the unit into the name itself instead of hoping the description gets read carefully, and splitting `source` into two mutually-exclusive, clearly-named fields.

## Extend it

Run the converter across your full OpenAPI spec to get a first-pass registry, but treat every generated tool as a draft that needs the same review this one got — specifically: rename anything derived mechanically from an `operationId`, rewrite every description against the /learn/tools-function-calling/writing-descriptions-models-follow-deep bar, hunt for `oneOf`/`nullable`/enum-hiding-in-a-`$ref` that got silently flattened and lost information, and flag any endpoint with a real-world side effect for an approval gate. Budget real review time per tool — a spec with 40 endpoints does not give you 40 finished tool schemas for free.

**Related:** /learn/tools-function-calling/openapi-to-tool-schema · /learn/tools-function-calling/json-schema-for-tools-essentials · /learn/tools-function-calling/writing-descriptions-models-follow-deep · /learn/tools-function-calling/approval-gates-for-sensitive-tools · /learn/tools-function-calling/parameter-design-patterns
