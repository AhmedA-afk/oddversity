---
title: "Schema-Shape Antipatterns"
track: "structured-outputs"
status: live
summary: "Four schema shapes that quietly wreck reliability, each with a real example and the refactor that fixes it."
duration: "7 min read"
---

Every one of these shapes will pass a code review that only checks "does this parse." None of them will hold up once real, messy input hits it.

### The mistake: five-levels-deep nesting

**Why it's wrong:** every level of nesting is one more place a model can misplace a value — put a field one level too shallow, wrap a scalar in an object it didn't need, or accidentally flatten two levels into one. The failure surface grows with depth, and it grows faster than the schema's expressiveness does past two or three levels.

**Symptom:** a value shows up in the output, correctly typed and spelled, sitting one level away from where the schema says it should be — `order.customer.address.city` comes back as `order.address.city`, and it passes validation for whichever branch happened to accept it, or fails validation in a way that doesn't obviously point at "depth" as the cause.

**Fix:** flatten the extraction schema to two or three levels and reconstruct the deeper structure afterward in code, where a mistake is a debuggable line of logic instead of a probabilistic generation error. See the depth guidance in [Modeling Nested Objects and Arrays](/learn/structured-outputs/designing-nested-and-array-fields) — most real data models that feel like they need five levels can be extracted at two and reassembled deterministically.

### The mistake: stringly-typed numbers and dates

**Why it's wrong:** `"quantity": "5"` or `"price": "24.50"` looks harmless because the value is *correct* — it's just wearing the wrong type. A schema that types these as strings gives up the one thing a real type would have caught: `"quantity": "five"` or `"price": "$24.50"` both pass a string-typed schema without complaint, and now a currency symbol or a spelled-out number is loose in a field your code will eventually try to do arithmetic on.

**Symptom:** a `TypeError` or a silent `NaN` several steps downstream, in code that assumed `price * quantity` would just work because both fields "looked like numbers" every time someone happened to check.

**Fix:** type numeric fields as `number`/`integer` and date fields as strings constrained by a `description` that specifies the exact format (see [Field Descriptions Are Inline Prompts](/learn/structured-outputs/field-descriptions-as-prompts)) — JSON Schema has no native date type, so a described, consistently-formatted string is the correct choice there, but a number pretending to be a string never is.

### The mistake: ambiguous untagged unions

**Why it's wrong:** a list of "any of these shapes" with no discriminator field forces the parser to guess which shape a given object is by trying each one and taking the first match — and when two shapes could both plausibly match the same object (overlapping optional fields, loosely typed tags), the parser picks one silently rather than flagging the ambiguity.

**Symptom:** an item ends up parsed as the wrong variant entirely — a `purchase` event missing its `amount_cents` field gets accepted as a `click` event instead of failing, because the click shape's requirements happened to still be satisfied. The full mechanics of this exact failure are walked in [An Event Stream as a Discriminated Union](/learn/structured-outputs/event-log-discriminated-union-example).

**Fix:** add a literal-typed discriminator field to every variant and build the union with a library construct that dispatches on it directly — Pydantic's `Field(discriminator=...)` or Zod's `z.discriminatedUnion` — rather than a generic `Union`/`z.union` tried in first-match order. See [Discriminated Unions for Heterogeneous Items](/learn/structured-outputs/discriminated-unions-for-variants).

### The mistake: free-form `dict[str, Any]` catch-alls

**Why it's wrong:** a field typed as an open dictionary of anything (`dict[str, Any]` in Python, `z.record(z.any())` or worse, `z.any()` itself, in TypeScript) is the schema equivalent of giving up — it validates whatever comes back, which means it validates nothing. It's usually added to "handle whatever extra metadata shows up," but structured output was supposed to eliminate exactly that uncertainty, not relocate it into one field.

**Symptom:** a field named `metadata` or `extra_fields` accumulates an unpredictable mix of shapes across different responses — sometimes a flat object, sometimes nested, sometimes a list disguised as an object with numeric string keys — because nothing about the schema tells the model what belongs there, so different calls fill it with different guesses at what "extra" means.

**Fix:** name the fields you actually expect, even if some of them are optional — an enumerated, closed set of optional fields beats one open catch-all every time, because each named field can still be typed, described, and validated individually. If the domain genuinely has unpredictable extra data (rare — most "we might need anything here" fields turn out, on inspection, to have a real, enumerable set of possibilities once someone looks at actual examples), constrain it to a `Record<string, string>`-style flat map of known-shape values rather than `Any`, which at least keeps the *values* typed even if the *keys* aren't fully known in advance.

## Pre-flight checklist

- [ ] Does any object nest more than three levels deep? If so, can the extraction schema be flatter with reconstruction happening in code instead?
- [ ] Is every numeric and boolean value typed as its real type, not a string that merely looks like one?
- [ ] Does every list of possibly-different-shaped items have a literal-typed discriminator, checked by a dispatch-on-tag union construct rather than a try-each-branch one?
- [ ] Is there a `dict[str, Any]`, `z.any()`, or equivalent open catch-all anywhere in the schema — and if so, can it be replaced by named, individually-typed optional fields?
- [ ] Would a reviewer unfamiliar with this schema be able to guess the shape of a valid response from the schema alone, without needing a real example alongside it?

**Related:** [Modeling Nested Objects and Arrays](/learn/structured-outputs/designing-nested-and-array-fields), [Discriminated Unions for Heterogeneous Items](/learn/structured-outputs/discriminated-unions-for-variants), [An Event Stream as a Discriminated Union](/learn/structured-outputs/event-log-discriminated-union-example), [Field Descriptions Are Inline Prompts](/learn/structured-outputs/field-descriptions-as-prompts)
