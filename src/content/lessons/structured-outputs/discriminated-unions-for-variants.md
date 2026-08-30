---
title: "Discriminated Unions for Heterogeneous Items"
track: "structured-outputs"
status: live
summary: "How a shared tag field lets one list hold genuinely different object shapes without forcing the parser to guess which."
duration: "6 min read"
---

Some lists aren't lists of one thing. An activity feed mixes clicks, purchases, and errors; a form's fields mix text inputs, dropdowns, and checkboxes. Modeling that honestly means letting each item be a genuinely different shape — safely.

## What it is

A **discriminated union** (also called a tagged union) is a set of alternative object shapes that share one field — the discriminator, commonly named `type`, `kind`, or `action` — whose value both identifies which shape applies and is checked before anything else about the object. Every variant declares the discriminator as a fixed literal value (`type: "click"`, `type: "purchase"`), so reading that one field alone is enough to know the shape of everything else in the object.

This is different from an **untagged union**, where you list the same set of alternative shapes but give the parser no field to check first — it has to try each shape against the object and see which one happens to fit.

## The mental model

Think of the discriminator as a label on a shipping box, read before anyone opens it. A tagged union says: check the label, then open the box knowing exactly what's inside and in what arrangement. An untagged union says: here's a stack of boxes and a stack of packing lists, try matching packing lists to boxes until one seems to fit — which works fine until two packing lists could both plausibly match the same box, in which case you get someone's guess, not a fact.

## Why it works this way

The problem an untagged union creates isn't purely theoretical — it comes from real overlap between variant shapes. If two variants share some field names, or if one variant's required fields happen to all be optional or absent in the data, an untagged parser can match the wrong branch and produce an object that's *structurally* valid for the shape it landed on while being *semantically* a different event entirely. Nothing errors. The parser found a fit; it just found the wrong one.

A discriminator removes the guessing by making the match decision use information the schema author actually controls, instead of information incidental to which fields happen to be populated in a given instance. `type: "purchase"` is checked directly — there's no ambiguity to resolve by trying alternatives, because there's nothing to try.

This also composes well with the value-constraining tools from [Enums, Literals, and Bounded Fields](/learn/structured-outputs/enums-and-constrained-value-fields): the discriminator field is itself a one-value literal (or, across the whole union, effectively an enum of the tag values), so if your provider supports [constrained decoding](/learn/structured-outputs/constrained-decoding-under-the-hood), the decoder can commit to a branch as soon as it emits the tag token and then only sample tokens legal for that specific variant — the wrong-branch case becomes unreachable at generation time, not just detectable after the fact.

## A concrete example (shown)

Three notification types, tagged by `channel`:

```json
{
  "oneOf": [
    {
      "type": "object",
      "properties": {
        "channel": { "const": "email" },
        "address": { "type": "string" },
        "subject": { "type": "string" }
      },
      "required": ["channel", "address", "subject"],
      "additionalProperties": false
    },
    {
      "type": "object",
      "properties": {
        "channel": { "const": "sms" },
        "phone_number": { "type": "string" },
        "body": { "type": "string" }
      },
      "required": ["channel", "phone_number", "body"],
      "additionalProperties": false
    },
    {
      "type": "object",
      "properties": {
        "channel": { "const": "push" },
        "device_token": { "type": "string" },
        "title": { "type": "string" }
      },
      "required": ["channel", "device_token", "title"],
      "additionalProperties": false
    }
  ]
}
```

`channel: "sms"` without a `phone_number` fails immediately — there's no other branch it could quietly match instead, because `sms` picked the branch before any other field was even inspected. Compare an untagged version of the same three shapes (just the three objects in a plain list, no `const` tags): if `body` and `title` were accidentally given the same field name across two variants, or if `subject` were made optional on the email variant, a push notification missing its `device_token` could validate as an email instead — wrong channel, silently.

## Where it shows up

This is the standard shape for an [event stream or activity log](/learn/structured-outputs/event-log-discriminated-union-example), where each entry can be a click, a purchase, or an error. It's also how [tool and function-calling schemas](/learn/structured-outputs/tool-function-schemas) represent "the model picked one of several available actions" — the action name *is* the discriminator, and the arguments that follow depend entirely on which action was chosen. Both Pydantic and Zod have first-class support for this exact pattern rather than requiring you to hand-write `oneOf`; see the worked implementation in both languages in [An Event Stream as a Discriminated Union](/learn/structured-outputs/event-log-discriminated-union-example).

## Watch out for

- **Overlapping required fields across variants defeat the discriminator's purpose even when it's present.** If a validator tries branches by shape rather than trusting the tag, two variants that could both match the same partial object reintroduce the ambiguity a tag was supposed to remove. Use a library's native discriminated-union support (Pydantic's `Field(discriminator=...)`, Zod's `z.discriminatedUnion`) rather than a hand-rolled `oneOf`, since these dispatch on the tag directly instead of trying every branch.
- **Deeply nested unions — a union inside a union inside a union — push some providers past what they'll accept as a valid schema.** Flatten where the domain allows it.
- **The discriminator itself still needs the same care as any enum field** — including, where the input distribution warrants it, an `other` fallback variant. See [A Status Enum with a Safe Fallback](/learn/structured-outputs/status-enum-worked-example) for the same argument applied to a plain enum.

## Where next

[An Event Stream as a Discriminated Union](/learn/structured-outputs/event-log-discriminated-union-example) builds this pattern end to end in both Pydantic and Zod, including a deliberately broken untagged version to show the mis-parse in practice.

**Related:** [Discriminated Unions: One Field Deciding the Shape of the Rest](/learn/structured-outputs/discriminated-unions-in-schemas), [Enums, Literals, and Bounded Fields](/learn/structured-outputs/enums-and-constrained-value-fields), [An Event Stream as a Discriminated Union](/learn/structured-outputs/event-log-discriminated-union-example), [Modeling Nested Objects and Arrays](/learn/structured-outputs/designing-nested-and-array-fields)
