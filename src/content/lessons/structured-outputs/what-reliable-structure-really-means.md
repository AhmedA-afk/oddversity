---
title: "Three Layers of Reliability"
track: "structured-outputs"
status: live
summary: "Valid JSON, the right shape, and the right values are three separate guarantees — passing two tells you nothing about the third."
duration: "7 min read"
---

Ask whether a model's structured output is "reliable" and you'll get three different answers depending on which of three separate questions you actually meant.

## What it is

Three layers, each a strictly narrower check than the last:

1. **Syntactic validity** — is this parseable at all? Balanced braces and brackets, correctly quoted strings, no trailing commas. `json.loads()` either succeeds or throws; there's no partial credit.
2. **Schema conformance** — given valid JSON, does it match the shape you asked for? Right keys present, right types, required fields not missing, enum values drawn from the allowed set.
3. **Semantic correctness** — given a conforming object, are the values actually right? Does the extracted total match the invoice? Does the sentiment label match the review's actual tone?

## The mental model

Picture three gates in series. Gate 1 asks "can I even parse this." Gate 2 asks "does the parsed thing look like what I asked for." Gate 3 asks "is what it says true." Each gate only catches its own class of failure and waves everything else through unexamined. Passing gate 1 tells you nothing about gate 2. Passing gate 2 tells you nothing about gate 3 — and gate 3 is the one most teams stop measuring first, because it's the one with no built-in check.

## Why it works this way

Each layer is enforced by a different mechanism, and none of them reach further than their job:

- JSON mode (see [JSON Mode Basics](/learn/structured-outputs/json-mode-basics)) constrains the decoder so it can only emit syntactically valid JSON. It has no idea what fields you wanted — that was never its job.
- A JSON Schema validator or schema-constrained decoding checks or enforces field names, types, and required-ness. It will happily accept `{"vendor": "ACME"}` whether or not "ACME" is the real vendor on the invoice, because a validator has no access to ground truth — only to shape.
- Semantic correctness has no generic mechanism at all. It needs grounding back to a source, a human reviewer, or evaluation against a gold-labeled dataset — a stricter schema cannot manufacture correctness it has no way to check.

## A concrete example (shown)

A support ticket reads: *"Camera crashes every time I open it. This is the third time I've written in this week."* The model is asked to produce:

```json
{"priority": "low", "category": "camera_bug", "needs_human": false}
```

Run it through the three gates:

- **Syntactic validity: pass.** It parses cleanly.
- **Schema conformance: pass.** `priority` is one of the allowed enum values, `category` is a string, `needs_human` is a boolean. A validator has nothing to object to.
- **Semantic correctness: fail.** A recurring crash, reported for the third time by a visibly frustrated customer, is not "low" priority, and it should almost certainly set `needs_human: true`. Nothing about the object's shape reveals this — the JSON is a perfectly formed, perfectly wrong answer.

This is why the three layers have to be measured separately: a dashboard that only tracks "percentage of responses that validated" would report this ticket as a clean success.

## Where it shows up

Layer 1 and 2 are what schema-constrained decoding and validation libraries are built to close — see [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair) and [Pydantic Models for Extraction](/learn/structured-outputs/pydantic-models-for-extraction). Layer 3 is what evaluation harnesses, gold datasets, and confidence-based review routing exist for — see [Building a Gold Dataset](/learn/structured-outputs/building-a-gold-dataset) and [Extraction Confidence and Review Routing](/learn/structured-outputs/extraction-confidence-and-review-routing).

## Watch out for

- **Treating "it validated" as "it's correct."** Teams ship on schema conformance alone and get silently wrong data flowing downstream at full confidence.
- **Retrying the wrong layer's failure the same way.** A schema-conformance failure (wrong type) and a semantic failure (wrong value) need different fixes — re-prompting with a validation error fixes the first; only better grounding or a human catches the second. See [Thinking in a Reliability Budget](/learn/structured-outputs/reliability-budget-thinking).
- **Assuming a stricter schema fixes semantic drift.** Adding more required fields or tighter enums only ever tightens layers 1 and 2 — it cannot make a value more true.

## Where next

Read [Why Parsing Prose Always Breaks](/learn/structured-outputs/strings-are-not-data-intuition) for why layer 1 fails constantly without structured output at all, then [The Schema as a Contract](/learn/structured-outputs/the-contract-between-model-and-code) for how layer 2 gets enforced as an actual agreement between model and code.

**Related:** [The Whole Game of Structured Output](/learn/structured-outputs/the-whole-game-of-structured-output) · [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair) · [What One Bad Field Costs Downstream](/learn/structured-outputs/cost-of-getting-it-wrong-intuition) · [Foundations Checkpoint](/learn/structured-outputs/foundations-quiz)
