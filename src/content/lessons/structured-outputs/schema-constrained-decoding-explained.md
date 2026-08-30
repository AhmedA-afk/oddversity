---
title: "Compiling a Schema into a Constraint"
track: "structured-outputs"
status: live
summary: "A JSON Schema becomes a decoding constraint, but only the shape-level keywords survive the compile — the rest still needs a check after generation."
duration: "7 min read"
---

Schema-constrained decoding sounds like it enforces "your schema." It enforces a specific, smaller slice of it — and knowing exactly which slice is what lets you stop over-trusting the rest.

## What it is

Schema-constrained decoding compiles a JSON Schema directly into the grammar a token masker walks, instead of the generic JSON grammar [JSON mode](/learn/structured-outputs/json-mode-what-it-guarantees) uses. The states in the resulting machine map onto your schema's structure: a required key becomes a forced sequence of literal tokens, a `"type": "integer"` field becomes a branch that only accepts digit tokens, an `"enum"` becomes a small fixed set of accepted literal paths. This is the same masking mechanism described in [How Constrained Decoding Masks Tokens](/learn/structured-outputs/constrained-decoding-mechanics-deep-dive) — schema-constrained decoding just points it at a grammar generated from your JSON Schema instead of a generic one.

## The mental model

Treat the schema as a blueprint for the machine, not as a checklist consulted after the fact. `"properties"` with `"required"` lays out a fixed sequence of key literals the automaton must walk through in order. `"type"` on each value picks which sub-grammar (digits-only, string-with-quotes, `true`/`false`, nested object) governs that value's tokens. `"enum"` compiles almost for free — each member becomes one accepted literal path, which is why enum fields are both the cheapest thing to constrain and the ones that can never come back with a value outside the set.

## Why it works this way

The dividing line between what's enforceable and what isn't comes from what the constraint engine can actually check *incrementally*, one token at a time, without knowing the future or evaluating meaning:

**Reliably decode-time enforceable:**
- Object shape — which keys exist, in what structure
- `required` — presence of specific keys
- `type` — string vs. number vs. boolean vs. object vs. array vs. null
- `enum` — membership in a fixed literal set
- `additionalProperties: false` — no keys beyond the named ones
- Array item types and nesting depth

**Typically not enforced at decode time, even where implementations vary:**
- `minLength` / `maxLength` — bounding a string's length interacts awkwardly with when the automaton is allowed to accept the closing quote, and most production implementations skip it
- `pattern` — a regex is theoretically compilable into the same kind of automaton, but many providers' "strict" structured-output modes explicitly don't support it
- `format` (`email`, `date-time`, `uuid`, …) — even a syntactically constrainable format says nothing about whether the value is a *real* email or an *existing* date; most engines don't attempt it
- `minimum` / `maximum` on numbers — a smooth numeric range doesn't map cleanly onto a small set of accepted token paths the way an enum does
- Cross-field rules (`if`/`then`, `dependentRequired`, "end date after start date") — checking these requires comparing values that may not both exist yet at the point the grammar would need to decide
- Anything semantic — whether a total actually sums, whether an address is real, whether a claim is true

Provider support for the middle tier drifts over time and differs by vendor, so treat this as "check your specific provider's documented supported-keyword list," not as a universal spec. What doesn't drift is the boundary itself: decode-time constraint enforces *presence, type, and enumerated identity* — the parts checkable prefix by prefix — and stops there.

## A concrete example (shown)

A schema for a support ticket:

```json
{
  "type": "object",
  "properties": {
    "status": {"type": "string", "enum": ["open", "closed", "pending"]},
    "ticket_id": {"type": "string", "minLength": 5},
    "priority": {"type": "integer", "minimum": 1, "maximum": 5}
  },
  "required": ["status", "ticket_id", "priority"],
  "additionalProperties": false
}
```

What schema-constrained decoding actually guarantees from this: `status` will be exactly one of the three strings, nothing else, ever. `ticket_id` will be *some* string. `priority` will be *some* integer. What it does not guarantee: that `ticket_id` is at least 5 characters, or that `priority` falls between 1 and 5. This is a fully schema-valid, fully decode-constraint-satisfying, and still-broken response:

```json
{"status": "open", "ticket_id": "x", "priority": 9}
```

Nothing at the decoding layer objects to `"x"` (a valid string, just a short one) or `9` (a valid integer, just outside your intended range). Both need a validator that runs *after* generation — see [The Validation Layer](/learn/structured-outputs/the-validation-layer) — checking the exact bounds the grammar couldn't.

## Where it shows up

Anthropic's tool `input_schema` (with `strict: true` and `additionalProperties: false`) and its `output_config: {"format": {"type": "json_schema", ...}}` mode, OpenAI's `response_format` with a `json_schema` and `strict: true`, and self-hosted engines like Outlines compiling a Pydantic model or raw schema — see [Turning On Structured Modes in Code](/learn/structured-outputs/enabling-structured-modes-across-sdks) for the exact calls.

## Watch out for

- **Treating "schema-constrained" as "fully validated."** It closes the shape gap [JSON mode](/learn/structured-outputs/json-mode-what-it-guarantees) leaves open, but the bounds-and-business-rules gap is still yours to close.
- **Designing schemas around keywords your provider's strict mode silently ignores.** A `pattern` or `minimum` that never gets enforced gives false confidence — check the supported subset before you lean on it.
- **Deeply recursive or `$ref`-heavy schemas.** Some compilers choke on unbounded recursion or hit complexity limits; flatten or bound recursion depth where you can.

## Where next

If the format you need isn't JSON at all, the same masking mechanism generalizes — see [Grammars Beyond JSON](/learn/structured-outputs/grammar-constrained-beyond-json). For the leftover gap this lesson keeps pointing at, go to [The Validation Layer](/learn/structured-outputs/the-validation-layer) next.

**Related:** [What JSON Mode Does and Doesn't Promise](/learn/structured-outputs/json-mode-what-it-guarantees), [How Constrained Decoding Masks Tokens](/learn/structured-outputs/constrained-decoding-mechanics-deep-dive), [The Validation Layer](/learn/structured-outputs/the-validation-layer), [The JSON Schema Subset That Matters](/learn/structured-outputs/json-schema-essentials-for-outputs), [Decoding Mechanisms Cheatsheet](/learn/structured-outputs/decoding-mechanisms-cheatsheet)
