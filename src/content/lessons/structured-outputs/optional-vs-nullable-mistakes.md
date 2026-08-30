---
title: "The Optional-vs-Nullable Bugs"
track: "structured-outputs"
status: live
summary: "Five real ways a model expresses uncertainty differently than your schema expects it to, and how each one hides in plain sight."
duration: "8 min read"
---

Every one of these mistakes produces a schema that validates cleanly and code that runs without an exception. That's what makes them worse than a crash — nothing tells you they happened until the data downstream is already wrong.

### The mistake: declaring a field nullable when the model actually omits it

**Why it's wrong:** `email: str | None` (required, nullable) tells the model the key must always appear, but says nothing that would stop the model from leaving it out anyway when a provider's structured-output mode is enforced loosely rather than strictly. Some models, especially without hard constrained decoding, treat "the field can be null" and "the field can be skipped" as close enough.

**Symptom:** a `KeyError` (Python dict access) or `undefined` (TypeScript) instead of the `None` / `null` you designed for, in code that only ever checked `if user["email"] is None`.

**Fix:** validate through Pydantic or Zod rather than reading the raw dict — `User.model_validate_json(...)` raises a clean `ValidationError` naming the missing required key, instead of your code discovering the gap three lines later at the point of use. If your provider's structured-output mode is a hint rather than a hard guarantee (see [why "JSON mode" isn't one thing](/learn/structured-outputs/cross-provider-structured-output-differences)), treat "required" as aspirational and validate every response regardless.

### The mistake: treating an empty string as equivalent to null

**Why it's wrong:** `""`, `null`, and "key absent" are three distinct signals that frequently get collapsed into one meaning — "unknown" — by different parts of a model's output and different parts of your code's null-checking. A model with a required, non-nullable `email: str` field and no email in the source text will often produce `"email": ""` rather than fail generation, because empty string is a legal value for the type even though it's not a legal *answer*.

**Symptom:** a downstream email-sending step silently no-ops on `""` (looks handled) while a null-check (`if email is None`) doesn't catch it at all (looks like a bug in the null-check, when the real bug is upstream). Three code paths, three different half-fixes, and the actual meaning — "no email was found" — was never represented anywhere.

**Fix:** don't let a field's type admit an empty string as ambiguous shorthand for "unknown." Make the field nullable (`str | None`, `z.string().nullable()`) and require the model to write an explicit `null` rather than an empty string when nothing was found — a description like `"the customer's email, or null if not present in the source"` (see [Field Descriptions Are Inline Prompts](/learn/structured-outputs/field-descriptions-as-prompts)) pushes the model toward the value you actually check for.

### The mistake: giving a field a default that hides whether the model addressed it at all

**Why it's wrong:** `confidence: float = 1.0` looks like a safe fallback, but it means a response that never mentions confidence and a response that explicitly asserts full confidence produce the identical value. If the field exists to flag uncertainty, defaulting it to the *opposite* of uncertain silently defeats its purpose the moment a model skips it.

**Symptom:** every record in the dataset shows `confidence: 1.0` in numbers wildly out of proportion to how often the model is actually certain — the metric looks perfect and is measuring nothing.

**Fix:** don't default a field whose entire job is to signal something about how the value was produced. Make it required with no default — a validation failure on a missing `confidence` is a much better outcome than a confidence score you can't trust.

### The mistake: using optional (absent-allowed) for a value that's occasionally zero

**Why it's wrong:** an optional numeric field — `discount_cents: int | None = None`, key omitted when there's no discount — collides with "the model forgot this field" in exactly the same representation. Both look identical: the key isn't there.

**Symptom:** a report that undercounts "invoices with a $0 discount explicitly applied" because those are indistinguishable from invoices where the discount field was simply never populated.

**Fix:** if zero is a meaningful, occurring value — not just an absence — make the field required with a numeric type that legitimately includes zero, rather than optional. Reserve optional/nullable for values that can be genuinely absent from the source, not for the low end of a numeric range.

### The mistake: assuming "not required" means "safe to skip validating"

**Why it's wrong:** teams sometimes decide that because a field is optional, a malformed value in it (wrong type, out-of-range number) doesn't need to fail validation — since the field wasn't mandatory anyway. But "optional" only ever meant *presence* is optional; it never meant *correctness* is optional once the field does show up.

**Symptom:** a bug ships where an optional `discount_percent` field comes back as `150` (out of any sane range) and passes straight through, because nobody wrote a bound on a field they'd mentally filed as "not important, it's optional."

**Fix:** every declared field gets full validation regardless of whether it's required — optionality controls presence, not the quality bar for the value when present. Add the same bounds and enums you'd add to a required field; see [Enums, Literals, and Bounded Fields](/learn/structured-outputs/enums-and-constrained-value-fields).

## Pre-flight checklist

Before shipping a schema, check every optional or nullable field against this list:

- [ ] Does "unknown" have exactly one representation for this field — not a choice between `null`, `""`, and an absent key?
- [ ] If the field is nullable, is it also required (key always present), or did you mean absent-allowed instead — or genuinely both?
- [ ] Does any default value collide with a real, meaningful value the field could legitimately hold?
- [ ] Are zero, empty-list, and false excluded from "counts as absent" wherever they're valid data rather than placeholders?
- [ ] Is every optional field still fully constrained (type, bounds, enum) when it *is* present?

**Related:** [Optional, Nullable, Default, Missing](/learn/structured-outputs/optional-nullable-and-defaults), [Optional and Nullable Fields: Modeling "The Model Doesn't Know"](/learn/structured-outputs/optional-and-nullable-fields), [Pydantic Models for Extraction](/learn/structured-outputs/pydantic-models-for-extraction), [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair)
