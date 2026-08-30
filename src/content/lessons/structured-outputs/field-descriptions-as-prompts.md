---
title: "Field Descriptions Are Inline Prompts"
track: "structured-outputs"
status: live
summary: "A schema's description strings reach the model as instructions, and a well-placed one changes output more than a system-prompt paragraph does."
duration: "8 min read"
---

*This is a deep dive — the mechanism behind why descriptions work, stated precisely enough to reason about tradeoffs, marked optional depth on top of the other lessons in this module.*

It's easy to treat `description` as documentation for the next engineer who reads the schema. It's read by something else first: the model, at the exact moment it's about to generate that field's value — which makes it one of the highest-leverage places to put an instruction in the entire prompt.

## The mechanism

When a schema is passed to a model's structured-output or tool-calling parameter, the provider doesn't strip `description` fields before the model sees them — they're serialized into the context the model conditions on, typically inlined near the corresponding property in whatever internal representation the provider builds from your schema (sometimes rendered as accompanying text, sometimes as part of a structured tool definition). The model is, in a real sense, reading the schema as part of its instructions, not receiving it as an opaque contract enforced by something outside its own generation process.

This matters because of *where* that instruction lands relative to *when* it's used. A system-prompt instruction like "format all dates as ISO-8601" has to be recalled and correctly generalized across every date-shaped field in a potentially large schema, at whatever distance separates the instruction from the point of generation. A `description` on the specific field is present at the moment that field's value is being generated — it's not a rule to recall and apply, it's context sitting immediately next to the decision it governs. The same instruction, placed field-locally instead of globally, doesn't have to survive being generalized correctly across every other field that happens to also look date-shaped.

## A concrete example

Take a single field: the date an invoice was issued. Two versions of the same schema, differing only in the `description`:

```json
{ "invoice_date": { "type": "string" } }
```

Given source text like *"Invoice issued 8/9, due in 30 days"* — genuinely ambiguous, since `8/9` could be August 9th or September 8th depending on locale, and no year is stated — a model with no guidance beyond the bare type will often just copy the ambiguous string through: `"invoice_date": "8/9"`. It's not wrong given what it was told; it wasn't told anything about the format you actually need.

```json
{
  "invoice_date": {
    "type": "string",
    "description": "The invoice issue date, normalized to ISO-8601 (YYYY-MM-DD). If the source gives an ambiguous or relative date, resolve it using the document's own dateline or any other stated reference date."
  }
}
```

With that description present, the same source text is far more likely to produce a resolved, normalized value — `"invoice_date": "2026-08-09"` — because the field now carries its own resolution instructions exactly where they're needed, instead of relying on a separate, generic prompt instruction to have been both stated and correctly applied to this specific field. This is illustrative, not a measured benchmark — treat the direction of the effect as reliable and the exact hit rate as something to check against your own model and inputs, not something to assume transfers.

## Why it works this way

Three properties make field-level descriptions unusually effective as an instruction channel, compared to prompt text elsewhere:

1. **Proximity.** The instruction and the decision it governs are adjacent in whatever the model conditions on — there's no distance for the model to bridge between "recall the formatting rule" and "apply it right now."
2. **Specificity.** A description on `invoice_date` only has to be correct for that one field. A global instruction ("format all dates as ISO-8601") has to correctly identify *which* fields are dates in the first place, across however many fields the schema has — a classification step the model has to get right before the formatting rule even applies.
3. **Survivability under schema-driven decoding.** Where a provider supports [constrained decoding](/learn/structured-outputs/constrained-decoding-under-the-hood), the schema — descriptions included — is often the most reliable piece of context that survives all the way to generation, more so than a system prompt that might be summarized, truncated, or deprioritized under context pressure. The field-level description travels with the exact thing it modifies.

The tradeoff is real, though, and worth stating precisely rather than glossing over: every description is prompt tokens, on every request, for every field. A schema with fifteen fields and a three-sentence description on each is meaningfully more expensive per call than the same schema with bare types, and a bloated schema can itself become a reliability problem — the model has more text to read before it starts producing the actual answer, and a long description can bury the one sentence that matters in surrounding fluff.

## Writing descriptions that steer without bloating

- **State the format, not the concept.** "The date" describes what the field is; "ISO-8601, YYYY-MM-DD" tells the model what to write. Descriptions earn their keep by resolving ambiguity the type alone can't — favor instructions over restatements of the field name.
- **Put resolution rules where the ambiguity actually is.** If only dates are ambiguous, describe only the date fields. Don't add a boilerplate description to every field "for consistency" — that's the bloat with none of the payoff.
- **Keep it to one or two sentences.** If a field needs a paragraph of business logic to describe correctly, that's usually a sign the logic belongs in post-validation code (see [validation and auto-repair](/learn/structured-outputs/validation-and-auto-repair)), not in a description the model has to correctly interpret and apply unsupervised on every single call.
- **Don't contradict the type or constraints.** A description that says "a number between 1 and 5" on a field typed as a plain unbounded `number` is weaker than actually bounding it — see [Enums, Literals, and Bounded Fields](/learn/structured-outputs/enums-and-constrained-value-fields). Use the description to add what the type system can't express, not to restate what it already enforces more strongly.
- **Treat it as reviewable prompt text, not incidental metadata.** Since it changes model behavior, a description edit deserves the same scrutiny in review as a change to the system prompt — not the lighter scrutiny a comment or docstring usually gets.

## Where this shows up

Both Pydantic and Zod carry descriptions straight into the generated JSON Schema — a Pydantic `Field(description="...")` or a Zod `.describe("...")` ends up as the same `description` key a hand-written schema would use, which is one more reason to generate schemas from code rather than writing them by hand: the description lives next to the field definition your team already reviews, in [Pydantic Models for Extraction](/learn/structured-outputs/pydantic-models-for-extraction) and [Zod Schemas for Extraction](/learn/structured-outputs/zod-schemas-for-extraction).

**Related:** [JSON Schema: Specifying Your Exact Data Contract](/learn/structured-outputs/json-schema-for-outputs), [The JSON Schema Subset That Matters](/learn/structured-outputs/json-schema-essentials-for-outputs), [Constrained Decoding: How Guaranteed-Valid Output Actually Works](/learn/structured-outputs/constrained-decoding-under-the-hood), [Schema-Shape Antipatterns](/learn/structured-outputs/schema-shape-antipatterns)
