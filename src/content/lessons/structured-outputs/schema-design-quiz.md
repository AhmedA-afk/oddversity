---
title: "Schema Languages Checkpoint"
track: "structured-outputs"
status: live
summary: "Six questions on the optional/nullable/default/missing distinction, enum fallbacks, discriminated unions, and schema antipatterns."
duration: "6 min read"
---

Six questions covering the field-design decisions from this module. Work through them before checking the answer — several have a distractor that looks right until you trace what actually happens at validation time.

## Question 1

A field must always appear as a key in the output object — your downstream code does positional/fixed-shape access and can't tolerate a missing key — but the value itself may legitimately be unknown for some records. Which declaration is correct?

**A.** Leave the field out of `required`, type it as a plain string.
**B.** Make it required, type it as `[string, null]` (nullable, required).
**C.** Make it required, default it to an empty string when unknown.
**D.** Make it both optional and nullable.

<details><summary>Answer</summary>

**Correct: B.** Required-and-nullable is exactly "always a key, sometimes null" — the two properties you need are independent, and this is the one combination that gets both right.

- **A** is wrong: leaving the field out of `required` means it can be *absent*, which is the opposite of "must always appear as a key."
- **B** is correct.
- **C** is wrong: an empty string is not the same signal as an explicit null, and code that checks for `null` won't catch it — see [The Optional-vs-Nullable Bugs](/learn/structured-outputs/optional-vs-nullable-mistakes).
- **D** is wrong: making it optional reopens the possibility of the key being absent, which the scenario explicitly rules out.

</details>

## Question 2

A ticket-status enum of `{open, pending, resolved, closed}` has no `other` value. A ticket arrives whose real state (merged into another ticket) matches none of the four. With no escape hatch, what does the model most likely do, and what's the fix?

**A.** It fails to generate any output at all, which is actually the safest outcome.
**B.** It force-fits the ticket into the closest listed value (likely `closed`), with nothing in the output flagging that a mismatch occurred.
**C.** It adds a fifth value on the fly, since enums are just suggestions.
**D.** It leaves the `status` field out of the response entirely.

<details><summary>Answer</summary>

**Correct: B.** A required enum field forces the model to pick one of the listed values — there's no "none of the above" available, so the model picks whichever listed value is closest, and that choice is indistinguishable from a genuine, correct case in the output.

- **A** is wrong: a required enum field doesn't fail generation over an imperfect fit — it just makes a choice.
- **B** is correct: this is the specific hazard [A Status Enum with a Safe Fallback](/learn/structured-outputs/status-enum-worked-example) walks through directly.
- **C** is wrong: with real constrained decoding, values outside the enum aren't reachable at all — the model can't add one even if it "wanted" to.
- **D** is wrong: `status` is required in this scenario, so omitting it fails validation loudly rather than silently — which would actually be preferable to the force-fit, but isn't what a required field permits.

The fix is adding an explicit `"other"` value to the enum, paired with a nullable free-text field for the specifics.

</details>

## Question 3

Why does a discriminated (tagged) union behave more reliably than an untagged union of the same underlying shapes?

**A.** Tagged unions are validated faster, which reduces the chance of a timeout mid-parse.
**B.** The tag is checked first and selects one specific schema to validate against, so there's no risk of the object matching the wrong branch by coincidence.
**C.** Untagged unions can't be expressed in JSON Schema at all, so the comparison doesn't apply.
**D.** Tagged unions don't allow `additionalProperties: false`, so they're actually less strict.

<details><summary>Answer</summary>

**Correct: B.** The discriminator removes the guessing — the parser doesn't need to try each shape and hope exactly one fits, because the tag tells it which one applies before it looks at anything else.

- **A** is wrong: the reliability difference is about correctness of the match, not raw performance.
- **B** is correct.
- **C** is wrong: `oneOf` expresses an untagged union just fine in JSON Schema — it's valid, just ambiguous when branches overlap.
- **D** is wrong: closing each variant with `additionalProperties: false` is fully compatible with — and recommended alongside — a discriminated union; see [An Event Stream as a Discriminated Union](/learn/structured-outputs/event-log-discriminated-union-example).

</details>

## Question 4

You're modeling a payment amount: it must always be present, must never be negative, and there's no scenario where "amount unknown" is a valid state for a completed payment record. Which field construct fits?

**A.** `amount: float | None` (nullable, so missing amounts don't break validation).
**B.** `amount: float = Field(ge=0)` — required, bounded, no null allowed.
**C.** An enum of amount tiers (`"small" | "medium" | "large"`).
**D.** A string field with a regex pattern matching currency-formatted text.

<details><summary>Answer</summary>

**Correct: B.** Required and bounded is exactly what "always present, never negative, never unknown" describes — no nullability needed, because unknown isn't a legitimate state here.

- **A** is wrong: nullability is for values that can be legitimately unknown. This scenario explicitly rules that out — making it nullable anyway just gives the model a way to avoid answering.
- **B** is correct.
- **C** is wrong: an enum discards the actual amount, which you need for real financial calculations, not just a category.
- **D** is wrong: a string pattern validates shape ("looks like currency") but not the numeric value itself, and throws away the ability to do arithmetic without parsing the string back out — see [Schema-Shape Antipatterns](/learn/structured-outputs/schema-shape-antipatterns) on stringly-typed numbers.

</details>

## Question 5

Which of these is the "stringly-typed" antipattern from [Schema-Shape Antipatterns](/learn/structured-outputs/schema-shape-antipatterns)?

**A.** A date field typed as a string, with a description specifying ISO-8601 format.
**B.** A quantity field typed as `"quantity": "5"` — a number, quoted as a string, in the schema's type declaration.
**C.** An enum field where every value is a lowercase string.
**D.** A discriminator field typed as `Literal["click"]`.

<details><summary>Answer</summary>

**Correct: B.** Typing a genuinely numeric value as a string throws away the one guarantee that would have caught a malformed value — `"quantity": "five"` or `"quantity": "5 units"` both pass a string-typed schema without complaint.

- **A** is wrong: JSON Schema has no native date type, so a described, format-constrained string is the *correct* choice for dates, not the antipattern — see [Field Descriptions Are Inline Prompts](/learn/structured-outputs/field-descriptions-as-prompts).
- **B** is correct.
- **C** is wrong: enum values are strings by nature in JSON Schema — that's not a type mismatch, it's how enums are expressed.
- **D** is wrong: a literal-typed discriminator is the correct, recommended pattern for tagged unions, not an antipattern.

</details>

## Question 6

Given `quantity: int = 1` in Pydantic (a default of `1`, not typed as nullable), what happens if the model's response includes `"quantity": null` explicitly?

**A.** Validation passes and `quantity` becomes `1`, since that's the default.
**B.** Validation fails — a default only fills in for an *absent* key, and `int` doesn't accept `None` unless the type explicitly allows it.
**C.** Validation passes and `quantity` becomes `None`, overriding the default.
**D.** Pydantic silently converts `null` to `0`.

<details><summary>Answer</summary>

**Correct: B.** A default and nullability are two separate declarations. `int = 1` only tells Pydantic what to do when the key is *missing* — it says nothing about accepting `null` as a value, and a plain `int` type rejects `None` outright. This is the trap covered in [Optional, Nullable, Default, Missing](/learn/structured-outputs/optional-nullable-and-defaults): defaulted and nullable are independent, not interchangeable.

- **A** is wrong: the default only applies to absence, not to an explicit `null` value — those are different cases entirely.
- **B** is correct.
- **C** is wrong: `int` doesn't hold `None` unless the type is `int | None` — this would raise a `ValidationError`, not silently accept the value.
- **D** is wrong: Pydantic doesn't perform this kind of implicit type coercion from `null` to `0`.

</details>

**Related:** [Optional, Nullable, Default, Missing](/learn/structured-outputs/optional-nullable-and-defaults), [The Optional-vs-Nullable Bugs](/learn/structured-outputs/optional-vs-nullable-mistakes), [A Status Enum with a Safe Fallback](/learn/structured-outputs/status-enum-worked-example), [Discriminated Unions for Heterogeneous Items](/learn/structured-outputs/discriminated-unions-for-variants), [Schema-Shape Antipatterns](/learn/structured-outputs/schema-shape-antipatterns), [Field Design Decision Table](/learn/structured-outputs/field-design-cheatsheet)
