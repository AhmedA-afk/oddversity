---
title: "What JSON Mode Does and Doesn't Promise"
track: "structured-outputs"
status: live
summary: "JSON mode guarantees your output parses. It has no idea what keys, types, or shape you actually wanted."
duration: "5 min read"
---

Turn on JSON mode and every response parses. That feels like the problem is solved — until you look at what actually came back.

## What it is

JSON mode is a decode-time constraint that guarantees exactly one thing: the output is syntactically valid JSON. Balanced braces, quoted keys, commas in the right places, no trailing garbage. That's the entire contract. The constraint the decoder is enforcing is the generic JSON grammar from [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) — object, array, string, number, boolean, null, and how they nest — not your schema. As far as JSON mode's constraint engine is concerned, `{"result": "42"}` and your carefully designed `{"customer_name": ..., "order_total": ...}` object are equally valid outputs, because both are equally valid *JSON*.

This is worth sitting with because the name invites the wrong assumption. "JSON mode" sounds like it should know about the JSON you want. It doesn't. It knows about JSON in general, the same way a spell-checker knows about real words in general without knowing which word you meant to type.

## The mental model

Picture two separate jobs stacked on top of each other: **is this parseable** and **is this the data I asked for**. JSON mode solves only the first, and it solves it completely — you will not get a `SyntaxError` from `JSON.parse()` on JSON-mode output. The second job — right keys, right types, right nesting — is a schema's job, and JSON mode was never given your schema to check against.

## Why it works this way

The reason is mechanical, not a missing feature. JSON mode compiles one fixed, generic grammar once and reuses it for every request regardless of what you're asking for — that's part of why it's cheap and available almost everywhere. Schema-specific enforcement requires compiling *your* schema into its own constraint, which is a different, heavier mechanism (see [Compiling a Schema into a Constraint](/learn/structured-outputs/schema-constrained-decoding-explained)). JSON mode intentionally stays at the cheaper, dumber layer: valid-JSON-in-general, nothing more.

## A concrete example (shown)

Say you need this shape out of an extraction prompt:

```json
{"customer_name": "Jordan Kim", "order_total": 42.50}
```

You turn on JSON mode and prompt: *"Extract the customer name and order total as JSON."* A perfectly plausible response comes back:

```json
{"name": "Jordan Kim", "total_amount": "42.50"}
```

This is valid JSON. It will parse without a single warning. And it is completely useless to code written against your intended schema — `data["customer_name"]` raises a `KeyError`, and even if you'd guessed the field names right, `total_amount` arrived as a string, not a number. JSON mode did its job perfectly. Its job was just narrower than you assumed.

## Where it shows up

- Quick internal scripts and prototypes where "some parseable object" is enough to unblock you
- Providers or models where full schema-constrained decoding isn't available, and generic JSON is the best guarantee on offer
- As a floor underneath prompting — instead of hoping the model remembers to skip the markdown fence and the "Sure, here's your JSON:" preamble, the floor is enforced

## Watch out for

- **Treating "it parsed" as "it's correct."** A parse success tells you nothing about field names, types, or completeness — that's a job for a real schema and [validation on the other side](/learn/structured-outputs/validation-and-auto-repair).
- **Prompts that don't ask for JSON.** Some providers will error rather than silently emit prose if nothing in your prompt or system message makes JSON the obviously expected output — the constraint has no sensible path to walk. State the expected shape in the prompt even with the flag on.
- **Silent type drift.** Numbers coming back as quoted strings, booleans as `"true"` the string — JSON mode has no type awareness beyond the six JSON primitives, so nothing stops a model from picking the technically-valid-but-wrong one.

## Where next

The natural next step up is [schema-constrained decoding](/learn/structured-outputs/schema-constrained-decoding-explained), which compiles your actual field names, types, and enums into the constraint instead of the generic JSON grammar. If you want the mechanism underneath both of them, see [How Constrained Decoding Masks Tokens](/learn/structured-outputs/constrained-decoding-mechanics-deep-dive). And if you've ever shipped code that trusted JSON mode as if it were schema conformance, that mismatch is cataloged in [Picking the Wrong Mechanism](/learn/structured-outputs/mechanism-selection-mistakes).

**Related:** [JSON Mode: Forcing Valid JSON Out of the Model](/learn/structured-outputs/json-mode-basics), [Compiling a Schema into a Constraint](/learn/structured-outputs/schema-constrained-decoding-explained), [The Validation Layer](/learn/structured-outputs/the-validation-layer), [Picking the Wrong Mechanism](/learn/structured-outputs/mechanism-selection-mistakes)
