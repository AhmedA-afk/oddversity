---
title: "Structured output: make the model speak a contract"
track: "prompt-engineering"
status: live
summary: "Structured output constrains a model response to a machine-readable shape such as JSON."
duration: "3 min read"
---

## The short answer

Structured output constrains a model response to a machine-readable shape such as JSON. It reduces parser ambiguity and makes downstream validation possible, but valid syntax is not the same as correct meaning. Treat the schema as an API contract: validate types, allowed values, required fields, and business rules before taking an action.

## Syntax versus semantics

```json
{
  "route": "refund",
  "confidence": 0.92,
  "evidence": ["duplicate charge"]
}
```

This can be valid JSON while being the wrong route. A safe consumer checks that `confidence` is in range, `route` is allowed, and evidence actually appears in the input or retrieved policy.

## Worked example

Input: “I was charged twice.”

Model output: `{"route":"refund","confidence":0.92}`.

The parser passes. The policy check should not: a duplicate charge may require investigation, not an automatic refund. The application should draft or escalate, not execute the financial action.

## A small story

An integration failed because a model returned `"high"` where the schema expected `0.0–1.0`. The team first loosened the parser. That stopped the error but hid a contract mismatch. The better fix was to keep validation strict and return a visible “needs review” state.

## More examples and variations

- **Extraction:** allow `null` for a missing invoice ID and reject unknown fields.
- **Routing:** use an enum for queues, but require a reason and confidence semantics.
- **Nested result:** separate `answer`, `sources`, and `needs_review` so the UI can act safely.
- **Counterexample:** valid JSON can still contain a fabricated source or an unsupported label.

## Two ways to see it

### Developer view

The schema is an adapter between probabilistic text generation and deterministic code.

### Governance view

The schema is a control surface: it should make risky actions explicit and require evidence or approval.

## Hands-on

Define a JSON schema for triaging five support messages. Write one syntactically valid but semantically unsafe output and make your validator reject it.

## Checkpoint

- [ ] Parser errors are different from policy errors.
- [ ] Unknown values have an explicit fallback.
- [ ] A risky action cannot happen from schema validity alone.

## What this does not solve

Schemas do not guarantee truth, protect against prompt injection, or verify that citations support a claim.

## Continue, go deeper, apply it

- Continue: Reasoning and decomposition
- Go deeper: Tool calling
- Apply it: Red-team output contracts
