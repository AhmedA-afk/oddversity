---
title: "When to Flatten and When to Nest"
track: "structured-outputs"
status: live
summary: "Flatten to cut the model's bracket-balancing burden; nest only when the grouping itself carries meaning the consumer needs."
duration: "6 min read"
---

"Prefer flat schemas" is the kind of advice that's right often enough to become a reflex — and reflexes are exactly what break on the cases where nesting was the correct call all along.

## What it is

The rule: flatten by default, because every level of nesting is a place the model can misplace a value with no functional gain in return. Nest specifically when the sub-structure represents a real grouping your consumer code needs intact — not because it "feels more organized."

## The mental model

Ask one question of every nested object in a draft schema: *if I flattened this into prefixed top-level fields, would my consumer code still be able to tell which fields belong together?* If yes, and there's exactly one instance of the group, flattening usually wins — fewer brackets, fewer chances to misplace a value, no functional loss. If no — because the group can repeat, or because splitting it apart would let the model mix up which field belongs to which instance — the nesting isn't decoration, it's load-bearing.

## Why it works this way

A flat schema asks the model to track one thing: a set of sibling keys, each independent. A nested schema asks it to also open the right object, at the right point, and close it before moving on — extra structural bookkeeping for every level. [Nested Objects and Arrays in Output Schemas](/learn/structured-outputs/nested-and-array-schemas) frames this as depth being "a cost, not a convenience," and that cost buys you nothing when the nesting doesn't correspond to anything real — it's just ceremony the model has to get right for no informational payoff.

But the same bracket-balancing cost is worth paying the moment flattening would destroy information. A single address has one street, one city, one zip — flattening `address_street`, `address_city`, `address_zip` loses nothing, because there's exactly one of each and the prefix keeps them associated. The moment you need *more than one* of something — multiple line items, multiple addresses, multiple contacts — flattening stops being merely un-elegant and starts being lossy, because there's no way to number an unbounded set of prefixed fields, and a fixed number of them (`item_1_name`, `item_2_name`, `item_3_name`...) silently caps what the schema can represent.

## A concrete example

An invoice-extraction schema that over-flattens a genuinely repeating structure:

```json
{
  "type": "object",
  "properties": {
    "item_1_name": { "type": "string" },
    "item_1_qty": { "type": "integer" },
    "item_2_name": { "type": "string" },
    "item_2_qty": { "type": "integer" },
    "item_3_name": { "type": "string" },
    "item_3_qty": { "type": "integer" }
  }
}
```

This caps every invoice at three line items and leaves the model guessing what to do with a fourth — drop it, cram two items into one slot, or leave `item_3_*` fields empty and hope nobody notices. There's no flattened shape that fixes this, because the real relationship — "N line items, each with a name and quantity" — genuinely requires a list:

```json
{
  "type": "object",
  "properties": {
    "line_items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "quantity": { "type": "integer" }
        },
        "required": ["name", "quantity"]
      }
    }
  },
  "required": ["line_items"]
}
```

One extra level of nesting, but it's the level that actually corresponds to something real — an unbounded, ordered set of items — and no amount of flattening could have represented that without a hard, arbitrary cap.

## Where it shows up

Anywhere a source document has a variable-length repeating structure: invoice line items, resume work history, multi-party contracts, a list of extracted entities. It also shows up more subtly in single-instance groups that *feel* worth nesting but aren't — a `metadata` wrapper around two unrelated flags, or a `details` object holding one string, both of which just add a level with nothing to show for it.

## Watch out for

- **A repeating group flattened "for simplicity."** If you catch yourself numbering field names (`_1`, `_2`, `_3`), that's the schema telling you it needed an array, not a cap.
- **A single-instance group nested "for cleanliness."** If a nested object holds exactly one field, or fields that never repeat and never need to travel together as a unit, it's adding depth for aesthetics — flatten it.
- **Mixing the two mistakes in one schema is common** — see [Refactoring a Fragile Schema](/learn/structured-outputs/refactoring-a-fragile-schema-example) for a case that over-nested a single scalar while under-structuring a field that actually needed constraints.

## Where next

Depth and field count both push error rates in the same direction as a schema grows — [Complexity vs Accuracy, and When to Split](/learn/structured-outputs/schema-complexity-vs-model-accuracy) works out how far "shallow but wide" can go before it needs splitting into separate passes instead.

**Related:** [Nested Objects and Arrays in Output Schemas](/learn/structured-outputs/nested-and-array-schemas), [Four Properties of a Reliable Schema](/learn/structured-outputs/what-makes-a-schema-reliable), [Complexity vs Accuracy, and When to Split](/learn/structured-outputs/schema-complexity-vs-model-accuracy), [Refactoring a Fragile Schema](/learn/structured-outputs/refactoring-a-fragile-schema-example)
