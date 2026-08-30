---
title: "The JSON Schema Subset That Matters"
track: "structured-outputs"
status: live
summary: "The four JSON Schema keywords that actually govern model output, and why closing the object matters most."
duration: "6 min read"
---

JSON Schema the full specification has recursive references, format validators, conditional `if`/`then` branches, and a dozen keywords you will never need for a model output. Generation only cares about a handful of them, and forgetting the least glamorous one is where most "working" schemas quietly leak garbage back into your pipeline.

## What it is

For the purpose of shaping what a model generates, JSON Schema reduces to four load-bearing keywords:

- **`type`** — the raw shape of a value: `object`, `array`, `string`, `number`, `integer`, `boolean`, or `null`.
- **`properties`** — the named slots inside an object, each with its own type (which can itself be an object, recursively).
- **`required`** — the list of property names that must appear as keys in the output object.
- **`additionalProperties: false`** — a statement that no key outside `properties` is allowed to exist.

Everything else in the spec — `format`, `$ref`, `allOf`/`anyOf`/`not`, `minLength`, conditional schemas — either isn't reliably enforced by a model's structured-output mode, or belongs to a different job: validating documents that already exist, not constraining ones a model is about to write. `pattern` and numeric bounds earn their place for specific fields — covered in [Enums, Literals, and Bounded Fields](/learn/structured-outputs/enums-and-constrained-value-fields) — but the four above are the ones every schema needs regardless of domain.

## The mental model

Think of the schema as a form, not a validator. `type: object` says "this is a form, not a single answer box." `properties` prints the labeled boxes on the form. `required` is the list stamped "must fill" next to some of those boxes — everything else is a box the model may leave out entirely. `additionalProperties: false` is the instruction stapled to the top: *you may not tape extra boxes to this form.*

That last one is easy to skip because it changes nothing about what a well-behaved model *should* do. It only matters when the model does something you didn't ask for — and models under a vague instruction like "return the ticket as JSON" do that constantly. Without the stapled instruction, there's nothing stopping a `notes`, `confidence`, or `additional_context` key from showing up next to the fields you actually wanted.

## Why it works this way

`required` and `additionalProperties: false` solve two different failure modes, and conflating them is the most common way schemas end up looser than their author thinks:

- `required` guarantees **presence** — the key exists. It says nothing about whether the value is any good; a required string field can still come back as `""`. That's the subject of [Optional, Nullable, Default, Missing](/learn/structured-outputs/optional-nullable-and-defaults).
- `additionalProperties: false` guarantees **closure** — no keys beyond the named ones. Without it, `required` only tells you the fields you asked for are there; it says nothing about what else came along for the ride.

Closure matters more than it looks like it should because of how models actually fail. A model that drops a required field usually does so because the source text didn't have that information — a visible, checkable failure. A model that *adds* a field does so because it decided, mid-generation, that a summary or caveat was worth including — and that addition sails through validation silently if nothing forbids it. If your provider supports real [constrained decoding](/learn/structured-outputs/constrained-decoding-under-the-hood), `additionalProperties: false` is enforced at the token level and the extra key becomes literally unreachable, not just unlikely.

## A concrete example (shown)

A schema for a support ticket, fully closed:

```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "subject": { "type": "string" },
    "priority": { "type": "string", "enum": ["low", "medium", "high"] },
    "tags": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["id", "subject", "priority"],
  "additionalProperties": false
}
```

Drop the last line and ask a model to summarize a messy ticket thread, and it's common to get back something like:

```json
{
  "id": "T-4821",
  "subject": "Login fails after password reset",
  "priority": "high",
  "tags": ["auth", "urgent"],
  "sentiment": "frustrated"
}
```

`sentiment` validates fine against the open schema — nothing in it says extra keys aren't allowed — and now your code either silently ignores a field you didn't design for, or breaks the moment something downstream does strict key-matching. With `additionalProperties: false` in place, that object fails validation immediately (or, under strict decoding, is never produced at all), and the failure points at the actual problem instead of surfacing three steps downstream as a confusing type error.

## Where it shows up

Every code-first schema tool defaults to the *open* behavior described above, not the closed one — which surprises people who assume "using Pydantic" or "using Zod" automatically gets them a locked-down contract. In Pydantic v2 you opt in with `model_config = ConfigDict(extra="forbid")`; in Zod you opt in by chaining `.strict()` onto the object. Both are covered with runnable examples in [Pydantic Models for Extraction](/learn/structured-outputs/pydantic-models-for-extraction) and [Zod Schemas for Extraction](/learn/structured-outputs/zod-schemas-for-extraction). The same four keywords also form the backbone of [tool and function-calling schemas](/learn/structured-outputs/tool-function-schemas), where an unclosed object is how a model ends up passing an argument your function signature never declared.

## Watch out for

- **Closure is not automatically recursive.** `additionalProperties: false` at the top level says nothing about a nested object three levels down — each object in the schema needs its own closure if you want the whole tree locked.
- **`required` is not "non-empty."** A required field can still be filled with an empty string, a zero, or a placeholder value. Presence and validity are separate concerns — see [The Optional-vs-Nullable Bugs](/learn/structured-outputs/optional-vs-nullable-mistakes) for how that gap gets exploited.
- **Not every provider enforces this at generation time.** Some treat the schema as a strong hint rather than a hard constraint. Check what your provider actually guarantees — see [why "JSON mode" isn't one thing](/learn/structured-outputs/cross-provider-structured-output-differences) — and keep a validation step regardless.

## Where next

This subset is the floor, not the ceiling. Once an object's shape is pinned down, the next questions are how to nest it ([Modeling Nested Objects and Arrays](/learn/structured-outputs/designing-nested-and-array-fields)), how to handle values that might be missing versus explicitly unknown ([Optional, Nullable, Default, Missing](/learn/structured-outputs/optional-nullable-and-defaults)), and how to stop hand-writing this JSON at all by generating it from code ([Pydantic Models for Extraction](/learn/structured-outputs/pydantic-models-for-extraction)).

**Related:** [JSON Schema: Specifying Your Exact Data Contract](/learn/structured-outputs/json-schema-for-outputs), [Pydantic Models for Extraction](/learn/structured-outputs/pydantic-models-for-extraction), [Zod Schemas for Extraction](/learn/structured-outputs/zod-schemas-for-extraction), [Modeling Nested Objects and Arrays](/learn/structured-outputs/designing-nested-and-array-fields)
