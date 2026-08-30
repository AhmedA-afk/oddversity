---
title: "Four Properties of a Reliable Schema"
track: "structured-outputs"
status: live
summary: "Shallow, explicit, closed, and self-describing schemas raise valid-rates — each property maps to one specific failure it prevents."
duration: "7 min read"
---

A schema that validates isn't the same as a schema a model can reliably fill in correctly. This module is about closing that gap, and it starts with naming, precisely, what "reliable" means at the shape level.

## What it is

Four properties, each pulling a schema toward the version that's easiest for a model to produce correctly:

- **Shallow over deep** — fewer levels of nesting between the root object and any given value.
- **Explicit over inferred** — a value's constraints are enforced by the decoder (a type, an enum), not left to a description asking nicely.
- **Closed over open** — the set of legal shapes is fixed; there's no free-form dict or unconstrained union where the model can return something novel and still be "valid."
- **Self-describing over cryptic** — field names and descriptions carry enough meaning that the model doesn't have to guess what a slot is for.

[Schema Design Choices That Reduce Model Errors](/learn/structured-outputs/schema-design-for-reliability) introduced pieces of this as scattered advice — name fields well, prefer flat, use enums. This lesson is that advice organized into four properties with a mechanism behind each one, because "prefer flat" without knowing *why* doesn't tell you when flat stops being the right call.

## The mental model

A model filling in structured output is a blind typist with no backspace: it commits one token at a time, in order, and can't revise a bracket it already closed. Every property above is really the same question asked four ways — *where does this schema give the typist a way to slip?*

Depth gives it more brackets to balance and more places to put a value one level off. Inference gives it a rule it can silently misapply instead of one the decoder enforces for it. Openness gives it a shape it can fill in "creatively" and still pass. Cryptic names give it a slot with no clear intent, so it fills the slot with *something* — just not necessarily the right something.

## Why it works this way

**Shallow over deep** prevents *structural* misplacement. Each level of nesting is a chance to close an object one token early, open an array where a scalar was needed, or drop a value a level too shallow. [Nested Objects and Arrays in Output Schemas](/learn/structured-outputs/nested-and-array-schemas) calls this "depth is a cost, not a convenience" — two or three levels is normal, five or six starts costing you silently.

**Explicit over inferred** prevents *silent rule violations*. "Must be one of: low, medium, high" inside a free-text description is a rule the model can forget, misread, or paraphrase into `"med"`. The same constraint as an [enum](/learn/structured-outputs/enums-and-constrained-fields) is enforced by the decoder — the model literally cannot emit a fifth option. One is a request; the other is a guarantee.

**Closed over open** prevents *technically-valid-but-wrong* output. A field typed as a free-form dict (`additionalProperties: true`) or an unconstrained `oneOf` across dissimilar shapes lets the model return something that parses cleanly and still isn't what you needed — extra keys nobody asked for, or the wrong branch of a union with no way to detect it programmatically. [Schema shape antipatterns](/learn/structured-outputs/schema-shape-antipatterns) catalogs what "open" looks like in practice; [discriminated unions](/learn/structured-outputs/discriminated-unions-in-schemas) are the fix when you genuinely need more than one shape.

**Self-describing over cryptic** prevents *wrong value, right slot*. A field named `val2` with no description gets filled — the model won't leave it blank if it's required — but with a guess about what `val2` even means. [Field descriptions as prompts](/learn/structured-outputs/field-descriptions-as-prompts) goes deep on this specific lever.

## A concrete example (shown)

A support-ticket triage schema that violates three of the four properties:

```json
{
  "type": "object",
  "properties": {
    "info": {
      "type": "object",
      "properties": {
        "cat": { "type": "string" },
        "meta": { "type": "object", "additionalProperties": true }
      }
    }
  }
}
```

`info` is a needless extra layer (not shallow), `cat` has no enum or description (not explicit, not self-describing), and `meta` accepts anything (not closed). The reliable version:

```json
{
  "type": "object",
  "properties": {
    "category": {
      "type": "string",
      "enum": ["billing", "bug_report", "feature_request", "account_access"],
      "description": "The ticket's primary subject, chosen from the fixed set."
    },
    "urgency": {
      "type": "string",
      "enum": ["low", "medium", "high"],
      "description": "Business impact if unresolved, not the customer's tone."
    }
  },
  "required": ["category", "urgency"]
}
```

Same information, one level flatter, every value decoder-enforced, no open door for stray keys, and a description that resolves the one real ambiguity (`urgency` as impact, not tone).

## Where it shows up

Extraction pipelines pulling structured records out of documents ([structured extraction from documents and images](/learn/structured-outputs/structured-extraction-from-documents-and-images)) live or die on this, because there's no human in the loop catching a plausible-but-wrong field before it hits a database. Tool and function-call arguments ([tool/function schemas](/learn/structured-outputs/tool-function-schemas)) are just as exposed — a malformed argument doesn't get a second look, it gets executed.

## Watch out for

- **Over-shallowing loses real structure.** Flattening a genuine one-to-many relationship (multiple line items, multiple addresses) into numbered top-level fields doesn't make the schema more reliable, it makes it wrong. [When to Flatten and When to Nest](/learn/structured-outputs/flat-vs-nested-tradeoffs) draws the line.
- **Over-closing removes the model's only honest option.** A closed enum with no value for "none of these fit" forces a wrong answer instead of an honest one. [Letting the Model Say 'I Don't Know'](/learn/structured-outputs/representing-uncertainty-in-schemas) covers how to close a schema without closing off honesty.
- **Self-describing isn't free.** Every description is tokens on every call. Spend them on fields that are genuinely ambiguous, not on `id`.

## Where next

The rest of this module is these four properties applied to specific decisions: how deep to nest, how to order and name fields so the model conditions on the right things first, how to represent "I don't know" inside a closed schema, and how to change a schema later without breaking what already shipped.

**Related:** [Schema Design Choices That Reduce Model Errors](/learn/structured-outputs/schema-design-for-reliability), [Nested Objects and Arrays in Output Schemas](/learn/structured-outputs/nested-and-array-schemas), [Field Descriptions as Prompts](/learn/structured-outputs/field-descriptions-as-prompts), [Schema Shape Antipatterns](/learn/structured-outputs/schema-shape-antipatterns)
