---
title: "Structured Output: Making the Model Speak a Contract"
track: "prompt-engineering"
status: live
summary: "Return JSON gets you JSON. Naming exact keys, types, and enums gets you JSON your code is allowed to trust."
duration: "7 min read"
---

"Return JSON" gets you JSON. It doesn't get you JSON your code can trust — a downstream parser doesn't fail loudly on an underspecified shape, it fails quietly three functions later when a key that used to be there isn't.

## What it is

A structured-output contract is a promise about the exact shape of a response, specified precisely enough that downstream code can rely on it without checking each time. Four things make a shape into a contract instead of a suggestion:

- **Exact field names**, fixed and stable — not "something like a category field."
- **Exact types** — a string, a number, a boolean, an array of a named shape, never "whatever seems natural."
- **Enums where the value set is closed** — a fixed list of allowed strings, not free text that happens to often say the same thing.
- **Explicit nullability** — which fields can be missing, and what that means (`null` for "not found" is a different fact than the field being absent entirely).

[Structured output as an API contract](/learn/prompt-engineering/structured-output) covers the other half of this — that valid syntax against a schema still isn't the same as a *correct* answer. This lesson is about designing the contract precisely enough that syntax validation actually catches the mistakes it's supposed to.

## The mental model

Treat the output shape the way you'd treat a REST API response schema: a promise made once, in writing, and relied on everywhere downstream without re-checking. If a backend silently renamed `user_id` to `userId`, every consumer would break at once — which is exactly why API contracts get versioned and reviewed. A prompt's output shape is the same kind of promise, with one difference: the thing generating it is probabilistic and doesn't remember last call's shape unless you restate the contract, explicitly, in every prompt that produces it.

## Why it works this way

"Return JSON with the sentiment and urgency" is valid syntax with no fixed vocabulary behind it. Nothing in that sentence pins down whether the sentiment key is called `sentiment`, `Sentiment`, or `emotion`; whether urgency is a number, a word, or a 1-5 scale; or whether "negative" is spelled with a capital letter. Every one of those variants is syntactically valid JSON, so a bare `json.loads()` call succeeds on all of them — the ambiguity doesn't surface as a parse error, it surfaces later as a `KeyError` or a routing rule that silently never matches "Negative" against a check for `"negative"`. Naming the keys, types, and allowed values converts an implicit convention the model is guessing at into something a validator can check mechanically, which is the setup [Enforcing a JSON Schema From the Prompt](/learn/prompt-engineering/json-schema-in-prompts) builds on directly.

## A concrete example (shown)

**Underspecified:**

```text
Analyze this support ticket and return JSON with the sentiment and urgency.
```

Three runs, three different shapes:

```json
{"sentiment": "negative", "urgency": "high"}
{"Sentiment": "Negative", "Urgency": "High"}
{"emotion": "frustrated", "priority_level": 3}
```

Every one of these is valid JSON. None of them can be parsed by the same fixed code path.

**Contracted:**

```text
Return a JSON object with exactly these fields and nothing else:
- sentiment: one of "positive", "neutral", "negative"
- urgency: integer from 1 to 5, where 5 is most urgent
No fields other than these two. No prose before or after the JSON.
```

```json
{"sentiment": "negative", "urgency": 4}
```

Run this three times and you get the same two keys, the same value types, and values drawn from the same fixed sets every time — because there's nothing left for the model to decide about the *shape*, only about the *content*.

## Where it shows up

Routing systems that feed a category into a queue or `if`/`elif` chain (an enum, not free text, is what makes the routing logic exhaustive and checkable). Extraction pipelines writing into a database, where the contract's types should match the column types they're headed for. Tool-call arguments, which are a contract enforced by the calling framework rather than by you. And any multi-stage pipeline, where a downstream stage parses an upstream stage's output with no human in the loop to notice a shape drifted — see [Passing State Cleanly Between Pipeline Stages](/learn/prompt-engineering/passing-state-between-stages) for what that stage-to-stage contract needs to carry.

## Watch out for

- **Treating "valid JSON" as "correct."** A contract makes output parseable, not true — `{"route": "refund", "confidence": 0.92}` can be syntactically perfect and still the wrong route. Keep that check separate; see [Structured Output as a Contract](/learn/prompt-engineering/structured-output) for the syntax-versus-semantics split.
- **Leaving a numeric field's scale unstated.** Ask for "confidence" with no range and you'll get a mix of `0.92`, `"high"`, and `9/10` across runs — say `float between 0.0 and 1.0` explicitly, every time.
- **Letting spelling or casing drift.** `"Negative"` and `"negative"` read the same to a person and fail a strict equality check in code. Spell out the exact enum strings in the prompt, not just the concept behind them.

## Where next

Once the contract is specified, [Enforcing a JSON Schema From the Prompt](/learn/prompt-engineering/json-schema-in-prompts) shows how to phrase it precisely and validate it in code, and [Before/After: Taming Malformed JSON](/learn/prompt-engineering/fixing-malformed-json-output) walks a real prompt from "mostly works" to reliably parseable. When validation still fails despite a clear contract, [Building a Validate-and-Repair Loop](/learn/prompt-engineering/validation-and-repair-loop) is the fallback.

**Related:** [Structured Output: Make the Model Speak a Contract](/learn/prompt-engineering/structured-output), [Enforcing a JSON Schema From the Prompt](/learn/prompt-engineering/json-schema-in-prompts), [Before/After: Taming Malformed JSON](/learn/prompt-engineering/fixing-malformed-json-output), [Building a Validate-and-Repair Loop](/learn/prompt-engineering/validation-and-repair-loop), [Passing State Cleanly Between Pipeline Stages](/learn/prompt-engineering/passing-state-between-stages)
