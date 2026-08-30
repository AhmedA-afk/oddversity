---
title: "Decoding Mechanisms Cheatsheet"
track: "structured-outputs"
status: live
summary: "One table of what each decoding mechanism guarantees, what it costs, and which one to reach for first — with the reasoning-task exception called out."
duration: "5 min read"
---

Everything else in this module in one page. Keep this open while you're deciding.

## The core table

| Mechanism | Guarantee | Portability | Relative cost | Right default for |
|---|---|---|---|---|
| Prompt-only ("return JSON") | None — advisory only | Universal, any model | Lowest (no infra) | Low-stakes, human-reviewed output; prototyping |
| JSON mode | Syntactically valid JSON | Wide — most hosted APIs | Low | "Some parseable object," no fixed field names needed |
| Schema-constrained | Shape: keys, types, enums (not bounds/patterns/semantics) | Common on major hosted APIs; check keyword support | Low-moderate (compile once, cache) | Standard extraction and tool-call inputs — **start here, then measure** |
| Grammar-constrained (GBNF / Lark) | Full formal-grammar conformance, any target format | Self-hosted / specific engines only | Moderate (authoring + compile + masking) | Non-JSON formats, or a real JSON-Schema expressiveness gap |

Every row below JSON mode inherits everything above it — schema-constrained decoding is still, underneath, guaranteeing valid JSON, plus more. See [How Constrained Decoding Masks Tokens](/learn/structured-outputs/constrained-decoding-mechanics-deep-dive) for the shared mechanism.

## Start here, then measure

**Default:** if the target is JSON and you can access schema-constrained decoding on your provider, use it — `input_schema` + `strict: true` for tool-shaped output, `output_config`/`response_format` with a `json_schema` for a plain structured reply. This is the mechanism most requests should land on, per [Compiling a Schema into a Constraint](/learn/structured-outputs/schema-constrained-decoding-explained).

**Escalate only when measurement says so:**
- Provider or model has no schema-constrained option → fall back to JSON mode + validation, per [What JSON Mode Does and Doesn't Promise](/learn/structured-outputs/json-mode-what-it-guarantees).
- Target format isn't JSON at all, or a specific pattern/cross-field rule your provider won't enforce is producing real bad data → move to grammar-constrained decoding, per [Grammars Beyond JSON](/learn/structured-outputs/grammar-constrained-beyond-json).
- Task has genuine multi-step reasoning before an answer is knowable → keep the mechanism, change the *shape*: add a reasoning field first, or split into two passes, per [Separating Reasoning from Structuring](/learn/structured-outputs/thinking-then-structuring-pattern). This one isn't about which mechanism — it's orthogonal to all four rows above.

## Guarantee vs. still-your-job, at a glance

| Layer | Decode-time guarantee | Still needs a check after |
|---|---|---|
| Prompt-only | Nothing | Everything |
| JSON mode | Balanced, parseable JSON | Field names, types, presence, everything semantic |
| Schema-constrained | Keys, types, enum membership, closure (`additionalProperties: false`) | `minLength`/`maximum`/`pattern`, cross-field rules, truth |
| Grammar-constrained | Full grammar conformance for the target format | Same semantic gap — grammars constrain syntax, not meaning |

No row in either table ever reaches "verified true." That's the job of [the validation layer](/learn/structured-outputs/the-validation-layer), every time, regardless of which decoding mechanism sits underneath it.

## Quick snippets

Force a specific tool with a strict schema (Anthropic):

```python
tools=[{"name": "record", "strict": True, "input_schema": {...}}],
tool_choice={"type": "tool", "name": "record"}
```

Plain JSON mode (provider-generic shape):

```
response_format: { "type": "json_object" }
```

Reasoning-first field order, inside one schema:

```json
{"required": ["reasoning", "answer"]}
```
not
```json
{"required": ["answer", "reasoning"]}
```

## Cost cheat sheet

| Cost type | When you pay it | Amortizes? |
|---|---|---|
| Grammar/schema compilation | Once per distinct schema | Yes — cache and reuse the same schema across requests |
| Per-token masking | Every token of every constrained response | No — scales with output length |
| Reasoning-quality risk | Any time an answer field comes before reasoning is done | Not applicable — fix by reordering fields or splitting passes |

Full reasoning behind each row: [The Cost of Constraints](/learn/structured-outputs/what-constraints-cost-you).

## The one thing to remember

Constraint strength and correctness are two different axes. Moving right across the top table buys you more shape guarantee; it never buys you more truth. Keep both axes — the mechanism table and [reasoning-then-structuring](/learn/structured-outputs/thinking-then-structuring-pattern) — in mind at the same time, not as a single ladder to climb.

**Related:** [What JSON Mode Does and Doesn't Promise](/learn/structured-outputs/json-mode-what-it-guarantees), [Compiling a Schema into a Constraint](/learn/structured-outputs/schema-constrained-decoding-explained), [Grammars Beyond JSON](/learn/structured-outputs/grammar-constrained-beyond-json), [The Cost of Constraints](/learn/structured-outputs/what-constraints-cost-you), [Picking the Wrong Mechanism](/learn/structured-outputs/mechanism-selection-mistakes)
