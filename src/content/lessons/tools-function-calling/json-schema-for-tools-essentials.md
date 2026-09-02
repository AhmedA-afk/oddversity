---
title: "The JSON Schema Subset That Matters for Tools"
track: "tools-function-calling"
status: live
summary: "Tool schemas use a small, boring slice of JSON Schema — learn exactly which fields the model reads and which it ignores."
duration: "6 min read"
---

JSON Schema is a big spec. Tool calling uses maybe 10% of it, and providers silently ignore most of the rest. Knowing that 10% cold — and knowing what to stop writing — is the highest-leverage thing you can learn before you author a single schema.

## What it is

Every tool definition you send to a model — Claude's `input_schema`, OpenAI's `parameters` — is a JSON Schema object describing the shape of the arguments the model should produce. The model doesn't execute this schema like a validator does; it reads it as text, alongside your description, and uses it to decide what JSON to generate. That's the whole mechanism, and it's why the fields that matter are the ones that carry meaning in plain English, not the ones that are clever in schema terms.

The working set is small:

- **`type`** — `object`, `string`, `number`, `integer`, `boolean`, `array`. Almost every tool's top-level schema is `type: object`.
- **`properties`** — the named fields of that object, each with its own `type` and `description`.
- **`required`** — which of those properties must be present.
- **`enum`** — a closed list of allowed values for a string or number field.
- **`description`** — free text attached to the schema, or to any property, that steers the model's behavior. This one carries more weight than every structural field combined.
- **Simple nesting** — an `array` of `object`, or one level of nested `object` — used sparingly.

That's it. That's the subset.

## The mental model

Treat the schema as a form the model is filling out under time pressure, using only what it can see on the page. `type` tells it what shape of answer goes in the blank. `enum` narrows a blank to a dropdown so it can't invent a value. `required` tells it which blanks it can't leave empty. `description` is the label and helper text next to the blank — the only place you get to explain *what this means* and *what happens if you get it wrong*.

Nothing here validates anything at generation time. `required` doesn't stop the model from omitting a field — it stops your dispatcher from accepting the call if the field is missing, *after* the model has already responded. The schema shapes the model's output the way a form's layout shapes what a person writes on it; your code is still the thing that checks the answer.

## Why it works this way

Providers train models against a training distribution built from real, mostly-flat API schemas. The pattern the model has seen ten million times is `{type: "object", properties: {...}, required: [...]}` with one or two levels of nesting and the occasional `enum`. Structural features outside that pattern get one of two treatments:

1. **Silently stripped or ignored** — `minimum`, `maximum`, `pattern`, `format`, `minLength`, most `$ref` and `$defs` indirection, `oneOf`/`anyOf`/`allOf` combinators. Some providers accept these in the schema without complaint and then generate arguments that violate them anyway, because the model never "reads" a numeric bound the way a JSON Schema validator does — it reads the *words around it*.
2. **A source of confusion** — deep `$ref` chains and schema composition ask the model to hold indirection in its head while also reasoning about the user's request. That's budget better spent on the actual task.

The fix for anything you'd normally express structurally — "must be between 1 and 5", "must match `[A-Z]{3}-\d{4}`" — is to say it in the `description` and validate it in code after the call comes back. The model responds far better to "a priority from 1 (lowest) to 5 (highest)" in prose than to a `minimum`/`maximum` pair it may not enforce.

## A concrete example

Watch a schema grow field by field, and notice which additions actually change model behavior.

**Step 1 — bare minimum, ambiguous:**

```json
{
  "name": "set_reminder",
  "description": "Sets a reminder.",
  "input_schema": {
    "type": "object",
    "properties": {
      "text": { "type": "string" },
      "time": { "type": "string" }
    }
  }
}
```

Nothing is required, `time` has no format hint, and the description says nothing about *when* to call this. The model will call it eagerly and guess at time formats.

**Step 2 — add `required` and per-field descriptions:**

```json
{
  "name": "set_reminder",
  "description": "Create a one-time reminder for the user. Use this when the user explicitly asks to be reminded of something at a specific time.",
  "input_schema": {
    "type": "object",
    "properties": {
      "text": {
        "type": "string",
        "description": "What to remind the user about, in their own words."
      },
      "time": {
        "type": "string",
        "description": "ISO 8601 datetime in the user's local timezone, e.g. 2026-09-02T14:30:00-07:00."
      }
    },
    "required": ["text", "time"]
  }
}
```

Now the model knows exactly what belongs in each field and won't omit `time`.

**Step 3 — add an `enum` for a closed set:**

```json
{
  "name": "set_reminder",
  "description": "Create a reminder for the user. Use this when the user explicitly asks to be reminded of something at a specific time.",
  "input_schema": {
    "type": "object",
    "properties": {
      "text": {
        "type": "string",
        "description": "What to remind the user about, in their own words."
      },
      "time": {
        "type": "string",
        "description": "ISO 8601 datetime in the user's local timezone, e.g. 2026-09-02T14:30:00-07:00."
      },
      "recurrence": {
        "type": "string",
        "enum": ["none", "daily", "weekly", "monthly"],
        "description": "How often the reminder repeats. Defaults to none."
      }
    },
    "required": ["text", "time"]
  }
}
```

Three fields, one enum, one required list, descriptions doing the real work. This is a production-grade schema, and it's still using only the essentials.

## Where it shows up

This subset is exactly what /learn/tools-function-calling/designing-a-tool-schema walks through for a `create_calendar_event` tool, and it's the same subset /learn/structured-outputs/json-schema-for-outputs uses for constraining a final answer rather than a tool call — the two contexts share a schema dialect even though one shapes an argument object and the other shapes a response body. If you're generating schemas mechanically from an existing API, /learn/tools-function-calling/openapi-to-tool-schema shows where OpenAPI's richer vocabulary (nullable, oneOf, discriminators) has to be flattened down into this same essential set. And /learn/structured-outputs/tool-function-schemas covers the schema object's role in the wider function-calling contract, beyond just its fields.

## Watch out for

- **Writing `minimum`/`maximum`/`pattern` and trusting them.** They're frequently ignored at generation time. State the constraint in the description and validate the returned value in your dispatcher.
- **Reaching for `oneOf`/`anyOf` to express "one of these two shapes."** Models handle this poorly. Prefer two separate, clearly-named tools, or a single flatter schema with an optional field per case.
- **Nesting for the sake of "correctness."** A schema that mirrors your database's normalized structure is not a favor to the model. Flatten first; see /learn/tools-function-calling/parameter-design-patterns for the rule of thumb.

## Where next

Once the fields are second nature, the real skill is choosing what to require and how to word it — that's /learn/tools-function-calling/designing-a-tool-schema-walkthrough, followed by /learn/tools-function-calling/writing-descriptions-models-follow-deep for the description itself.

**Related:** /learn/tools-function-calling/designing-a-tool-schema · /learn/structured-outputs/json-schema-for-outputs · /learn/structured-outputs/tool-function-schemas · /learn/tools-function-calling/openapi-to-tool-schema · /learn/tools-function-calling/parameter-design-patterns
