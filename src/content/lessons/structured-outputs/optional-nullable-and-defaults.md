---
title: "Optional, Nullable, Default, Missing"
track: "structured-outputs"
status: live
summary: "The four distinct states a field can be in, and the exact Pydantic and Zod declaration that produces each one on purpose."
duration: "7 min read"
---

"Make it optional" is the instruction most likely to produce a schema that does something other than what you meant. There isn't one state a field falls into when it's not strictly required — there are four, and each one means something different to the model, to your validator, and to whatever reads the parsed result afterward.

## What it is

Four genuinely different things get flattened into "optional" in casual conversation:

1. **Absent (optional)** — the key may not appear in the output object at all.
2. **Nullable** — the key always appears, but its value may be `null`.
3. **Defaulted** — if the key is absent, your code fills in a specific value before anyone sees a gap.
4. **Required-but-empty** — the key must appear with a real value, and "I don't know" isn't a value the field's type can hold at all, so the model is forced to produce *something*, even when nothing is true.

These are independent axes, not a ladder from "less optional" to "more optional." A field can be nullable and required at once (always present, sometimes `null`); a field can be optional and defaulted at once (often absent, filled in when it is); a field can be required and still empty in practice if its type doesn't distinguish "empty" from "unknown."

## The mental model

Picture the field as a mailbox. **Absent** means the mailbox itself isn't installed — there's no slot to check. **Nullable** means the mailbox exists and you check it, but sometimes it's empty on purpose, and empty is a meaningful, expected state. **Defaulted** means the mailbox has a standing instruction: "if nothing arrives, assume this." **Required-but-empty** means the mailbox must contain a letter, full stop — if the sender has nothing to say, they still have to write something, so what arrives might be padding rather than information.

The bug that recurs across teams is treating all four as the same box with different labels, when the actual question you're answering for each field is different: *can this be skipped* (absent), *can this be explicitly unknown* (nullable), *should a gap be filled automatically* (default), or *must this always carry real information* (required, no escape valve).

## Why it works this way

The reason to keep these separate is that each one produces a distinguishable failure if you get it wrong, and the failures look identical from the outside unless you know which state you designed for:

- Mark something **absent** when you actually meant **nullable**, and a model that decides a value is unknown just drops the key — now your code has to check for a missing key *and* a null value to mean the same thing, or it silently treats "the model looked and found nothing" differently from "the model didn't address this field at all."
- Give something a **default** when you actually needed to know it was **missing**, and you lose the distinction between "this really is zero" and "the model didn't tell us." A `retry_count` defaulted to `0` looks identical whether the source document said zero or said nothing.
- Make something **required with no escape valve** when the input genuinely sometimes lacks that information, and you've built a hallucination generator — the model has to write *something* syntactically valid, and it will invent a plausible-looking value rather than fail generation. This is the mechanism behind most fabricated emails, phone numbers, and dates in extraction output.

## A concrete example (shown)

The same field, `email`, declared four different ways, in both stacks:

**Absent (optional, no null):**
```python
# Pydantic
email: str | None = None  # see note below — this is actually optional+nullable+default combined
```
```typescript
// Zod
email: z.string().optional()
```

**Nullable (always present, may be null):**
```python
# Pydantic
email: str | None  # no default — the key is required, the value may be None
```
```typescript
// Zod
email: z.string().nullable()
```

**Defaulted (absent means "assume this"):**
```python
# Pydantic
retry_count: int = 0
```
```typescript
// Zod
retry_count: z.number().default(0)
```

**Required, no escape valve (must be a real value):**
```python
# Pydantic
transaction_id: str  # no default, no | None — must be present and non-null
```
```typescript
// Zod
transaction_id: z.string()
```

The Pydantic "absent" line has a callout on purpose: `str | None = None` is actually doing three jobs simultaneously — it's optional (has a default, so the key can be missing), nullable (the type includes `None`), and defaulted (missing resolves to `None` specifically). That collapse is usually fine, because in Python code `None` already means "absent or unknown, doesn't matter which," so optional-with-a-None-default and nullable both cash out the same way downstream. It stops being fine the moment you need to tell "the model explicitly said null" apart from "the model omitted the field," which is a real distinction if you're auditing what the model actually did versus what your schema filled in for it.

## Watch out for

- **A required field with a default is not the same as an optional field.** `retry_count: int = 0` in Pydantic still lets you omit the key — but if you need the key to always be present with the model choosing its value, don't give it a default at all; make it required and let a validation failure tell you when the model skipped it.
- **Nullable does not mean optional, in either direction.** `str | None` with no default is a *required* field that happens to accept `null` as its value — omitting the key entirely still fails validation. If you want both, you need both declarations together, not one or the other.
- **A default silently absorbs the "missing" signal.** If it matters *whether* a value was present versus filled in by your code, don't default it — check for absence explicitly and record that fact somewhere the default would otherwise hide.

## Where it shows up

This exact confusion is common enough to earn its own lesson of worked failures — see [The Optional-vs-Nullable Bugs](/learn/structured-outputs/optional-vs-nullable-mistakes) for the model-omits-the-key, model-returns-null, and model-returns-empty-string cases side by side, and how each interacts differently with these four declarations. It also underlies why enum fields need an explicit fallback value rather than relying on nullability — see [A Status Enum with a Safe Fallback](/learn/structured-outputs/status-enum-worked-example) — and it's the first row of the lookup table in [Field Design Decision Table](/learn/structured-outputs/field-design-cheatsheet).

## Where next

Once a field's presence semantics are pinned down, the next question is usually what values it's allowed to hold at all — see [Enums, Literals, and Bounded Fields](/learn/structured-outputs/enums-and-constrained-value-fields) — or, if the field's very shape depends on some other field, [Discriminated Unions for Heterogeneous Items](/learn/structured-outputs/discriminated-unions-for-variants).

**Related:** [Optional and Nullable Fields: Modeling "The Model Doesn't Know"](/learn/structured-outputs/optional-and-nullable-fields), [The Optional-vs-Nullable Bugs](/learn/structured-outputs/optional-vs-nullable-mistakes), [Pydantic Models for Extraction](/learn/structured-outputs/pydantic-models-for-extraction), [Zod Schemas for Extraction](/learn/structured-outputs/zod-schemas-for-extraction)
