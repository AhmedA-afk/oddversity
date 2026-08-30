---
title: "Modeling Nested Objects and Arrays"
track: "structured-outputs"
status: live
summary: "When to nest an object, when to reach for an array of objects, and why depth is a reliability cost you pay deliberately."
duration: "6 min read"
---

Most real extraction tasks aren't flat. An invoice has line items, a resume has jobs and each job has bullet points, a support ticket has a thread of messages. The question isn't whether to nest — it's how deep, and what shape the nesting takes.

## What it is

Two structural moves cover almost every case: a **nested object** groups a fixed set of related fields under one key (`address: {street, city, zip}`), and an **array of objects** repeats a shape an unknown number of times (`line_items: [{description, qty, ...}, ...]`). Everything you'll model — invoices, event logs, org charts, form responses — is some combination of these two moves, stacked to whatever depth the data actually has.

## The mental model

Ask two questions about any group of related values: *does this repeat?* and *does it have more than two or three fields?* A yes to the first means array; a yes to the second means object. A field that's both — a repeating group of multi-field records — is an array of objects, which is the single most common structured shape in real schemas and the one worth defaulting to over any alternative.

The alternative people reach for instead, especially when migrating from a spreadsheet mindset, is **parallel arrays**: `item_names: [...]`, `item_quantities: [...]`, `item_prices: [...]`, kept in lock-step by position. Resist this. It works until one array comes back one element short — a model drops a quantity it couldn't find — and now every entry after that index is silently misaligned, with no error anywhere, because each array is individually valid. An array of objects fails differently and better: a missing `quantity` on one line item is a validation error on *that item*, not a silent shift across every item after it.

## Why it works this way

The reliability argument for objects-over-parallel-arrays isn't stylistic — it changes what a validator can catch. When a record's fields travel together in one object, a schema can require all of them together, and a missing one fails exactly where it happened. When the same fields travel in separate arrays, no schema keyword expresses "these three arrays must have matched lengths and matched drop-patterns" — you'd need custom cross-field validation to catch what an object-shaped schema catches for free.

This same logic is why arrays of well-shaped objects beat arrays of loose values generally, not just versus parallel arrays. An array of bare strings for line items (`["2x Desk lamp - $24.50", ...]`) pushes the actual parsing back into your code, which is exactly the work structured output was supposed to remove. If a value has more than one attribute, give it an object, even inside an array — the array's job is to say "there are several of these," not to also encode what "these" contain.

## A concrete example (shown)

```json
{
  "type": "object",
  "properties": {
    "customer": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "email": { "type": "string" }
      },
      "required": ["name", "email"],
      "additionalProperties": false
    },
    "line_items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "description": { "type": "string" },
          "quantity": { "type": "integer" },
          "unit_price": { "type": "number" }
        },
        "required": ["description", "quantity", "unit_price"],
        "additionalProperties": false
      }
    }
  },
  "required": ["customer", "line_items"],
  "additionalProperties": false
}
```

`customer` is a nested object because it's a fixed, non-repeating group of fields. `line_items` is an array of objects because it repeats an unknown number of times and each entry has three attributes that belong together. Neither could correctly substitute for the other. [Modeling an Invoice with Line Items](/learn/structured-outputs/invoice-line-items-nested-example) takes this exact shape further with a fully populated example and a totals block on top.

## Where it shows up

This is the default shape for anything extracted from a document with repeating structure — invoices, bank statements, resumes, contracts with numbered clauses. It's also how [tool and function-calling schemas](/learn/structured-outputs/tool-function-schemas) represent a function that takes a list of structured arguments, and how an [event log](/learn/structured-outputs/event-log-discriminated-union-example) represents a sequence of heterogeneous records — though a repeating array where each item can be a genuinely *different* shape needs a discriminator on top of just "array of objects," covered in [Discriminated Unions for Heterogeneous Items](/learn/structured-outputs/discriminated-unions-for-variants).

## Watch out for

- **Depth without payoff.** Two or three levels deep is normal. Five or six invites a model to misplace a value — put a field one level too shallow, or wrap a scalar in an object it didn't need — especially with smaller or faster models. If your real data model is genuinely that deep, extract flatter and reconstruct the nested shape in code afterward.
- **Objects with one field.** A nested object holding a single scalar (`{ "amount": { "value": 42 } }`) is usually a flattening opportunity — `"amount": 42` says the same thing with one less place to go wrong, unless that single field is about to grow siblings you already know are coming.
- **Reflexively nesting everything that's related.** Two fields that are merely *about the same thing* — a `status` and a `status_reason` — don't need to be wrapped in a `status_info` object just because they're conceptually paired. Nest for repetition or genuine multi-field grouping, not for tidiness.

## Where next

Once the nesting is right, the fields inside each object still need the right optionality and value constraints — see [Optional, Nullable, Default, Missing](/learn/structured-outputs/optional-nullable-and-defaults) and [Enums, Literals, and Bounded Fields](/learn/structured-outputs/enums-and-constrained-value-fields). For a worked example that puts all of this together on a realistic document, go to [Modeling an Invoice with Line Items](/learn/structured-outputs/invoice-line-items-nested-example).

**Related:** [Nested Objects and Arrays in Output Schemas](/learn/structured-outputs/nested-and-array-schemas), [Modeling an Invoice with Line Items](/learn/structured-outputs/invoice-line-items-nested-example), [The JSON Schema Subset That Matters](/learn/structured-outputs/json-schema-essentials-for-outputs), [Discriminated Unions for Heterogeneous Items](/learn/structured-outputs/discriminated-unions-for-variants)
