---
title: "Enums, Literals, and Bounded Fields"
track: "structured-outputs"
status: live
summary: "Four ways to shrink a field's legal values down from anything to something, and how each pairs with constrained decoding."
duration: "6 min read"
---

A `type: string` field accepts any string that ever existed. Most fields don't need that much freedom — they need one of a known handful of values, a value shaped a certain way, or a number inside a sane range. Constraining the field is how you turn "probably fine" into "structurally can't be wrong."

## What it is

Four tools, each closing off a different kind of unwanted freedom:

- **Enums** — a fixed list of legal string values (`"low" | "medium" | "high"`). Use for closed categories.
- **Literal unions** — the type-system-level version of the same idea (`Literal["click", "purchase", "error"]` in Python, `z.literal("click")` composed with `z.union` or `z.discriminatedUnion` in Zod). Where enums live in JSON Schema, literals live in your code's type system and compile down to the same `enum` or `const` keyword.
- **String patterns** — a regular expression the value must match (`^[A-Z]{2}\d{6}$` for a reference code). Use when the legal values aren't enumerable but do have a fixed shape.
- **Bounded numbers** — `minimum`/`maximum` (or `gt`/`ge`/`lt`/`le` in Pydantic, `.min()`/`.max()` in Zod). Use for anything with a known plausible range: a percentage, a quantity, an age.

## The mental model

Each of these is a fence around the space of legal outputs, and the four differ in what shape of fence they draw. An enum draws a fence around a finite list — anything not on the list is outside. A pattern draws a fence around a *shape* rather than a list — infinite possible values, but all matching one template. A bound draws a fence around a *range* — infinite possible values, but between two numbers. Picking the right one is about matching the fence to the actual shape of "legal" for that field, not reaching for whichever one is most familiar.

The failure mode to watch for is using a looser fence than the data supports. A `status` field with four real values, left as a plain string with a paragraph in the description explaining the four options, is a fence made of a strongly worded sign instead of a fence — the model usually reads the sign, but "usually" is not the guarantee an enum gives you.

## Why it works this way

The reason enums are worth reaching for isn't just tidiness — it's what they let a provider's decoder do. With real [constrained decoding](/learn/structured-outputs/constrained-decoding-under-the-hood), an enum is enforced at the token level: once the model starts writing the value for a `status` field, the sampler restricts the next tokens to only the ones that could complete one of the listed strings. A synonym, a typo, a differently-cased variant — none of them are reachable, not just discouraged. That's a categorically stronger guarantee than a pattern or a bound gives you, because both of those still allow an enormous space of technically-valid values; they only rule out the ones outside a range or shape.

Patterns and bounds are still worth using even without hard constrained decoding, because they turn a whole class of malformed values into a validation-time catch instead of a silent pass-through. A `unit_price` typed as a bounded `number` can't come back as `"twenty four dollars"` — the type alone rejects that — and `ge=0` catches the (more common than you'd think) case of a negative price from a return or refund line getting misread as the price itself.

## A concrete example (shown)

All four side by side, on a shipment record:

```json
{
  "type": "object",
  "properties": {
    "carrier": {
      "type": "string",
      "enum": ["ups", "fedex", "usps", "dhl"]
    },
    "tracking_number": {
      "type": "string",
      "pattern": "^1Z[0-9A-Z]{16}$",
      "description": "UPS tracking number format"
    },
    "package_weight_kg": {
      "type": "number",
      "minimum": 0,
      "maximum": 70
    }
  },
  "required": ["carrier", "tracking_number", "package_weight_kg"],
  "additionalProperties": false
}
```

`carrier` is a closed, small, stable list — an enum. `tracking_number` has a fixed shape but effectively infinite values — a pattern. `package_weight_kg` has a plausible physical range (nothing a shipping carrier accepts weighs 4,000 kg) — a bound. None of the three tools could substitute for either of the others without losing precision: an enum can't express "shaped like a UPS tracking number," a pattern can't express "one of four known carriers" as cleanly as listing them, and a bound doesn't apply to a string at all.

## Where it shows up

Literal unions are what make [discriminated unions](/learn/structured-outputs/discriminated-unions-for-variants) possible — the discriminator field on each variant is a `Literal["click"]` or `z.literal("click")`, a one-value enum that lets the parser pick the right branch. Bounded numbers show up constantly in [invoice line items](/learn/structured-outputs/invoice-line-items-nested-example) (`quantity` shouldn't be negative) and anywhere a value has a physically or logically sane range. Enums with a deliberate fallback value are their own worked example in [A Status Enum with a Safe Fallback](/learn/structured-outputs/status-enum-worked-example).

## Watch out for

- **An enum with no escape hatch forces a wrong answer on edge cases.** If the real-world input distribution has cases that don't fit any listed value, the model will force-fit the nearest one rather than fail generation — see the worked example for why an explicit `"other"` value is usually worth adding.
- **Patterns validate shape, not meaning.** A tracking-number pattern accepts any string of the right shape, including one the model invented because it matched the format without matching a real package. Pattern-matched fields still deserve a downstream existence check where one is available.
- **Bounds catch typos, not lies.** `ge=0, le=100` on a `discount_percent` stops `150` but does nothing about a plausible-but-wrong `15` when the real discount was `50`. Bounds are a floor on data quality, not a ceiling on how wrong a value can be within range.

## Where next

Once you can constrain a single value, the next step is constraining which *shape* a whole object takes based on one of its fields — that's [Discriminated Unions for Heterogeneous Items](/learn/structured-outputs/discriminated-unions-for-variants). For a fast lookup of which of these four tools fits a given field, see [Field Design Decision Table](/learn/structured-outputs/field-design-cheatsheet).

**Related:** [Enums: Locking a Field to a Fixed Set of Values](/learn/structured-outputs/enums-and-constrained-fields), [A Status Enum with a Safe Fallback](/learn/structured-outputs/status-enum-worked-example), [Constrained Decoding: How Guaranteed-Valid Output Actually Works](/learn/structured-outputs/constrained-decoding-under-the-hood), [Discriminated Unions for Heterogeneous Items](/learn/structured-outputs/discriminated-unions-for-variants)
