---
title: "Picking the Wrong Mechanism"
track: "structured-outputs"
status: live
summary: "Five recurring mismatches between what a mechanism guarantees and what people build assuming it guarantees — each with its telltale symptom."
duration: "6 min read"
---

Every mechanism in this module solves a specific, narrower problem than it looks like it solves. Here's where that gap actually bites in real code.

### The mistake: reaching for a hand-written grammar when a JSON Schema would do

**Why it's wrong.** A GBNF or Lark grammar buys you nothing over native schema-constrained decoding when the target really is a JSON object — you're paying the authoring cost of [writing and debugging a grammar by hand](/learn/structured-outputs/gbnf-grammar-worked-example), pinning yourself to a self-hosted engine, and giving up whatever native provider support exists, all for a guarantee your provider's schema mode already gives you.

**Symptom.** A grammar file in the repo that, on inspection, just re-encodes `{"type": "object", "properties": {...}}` rule by rule — and a note in the code that nobody remembers why it isn't just a JSON Schema call.

**Fix.** Default to native schema-constrained decoding (Anthropic's `input_schema` / `output_config`, OpenAI's `response_format`) for anything that is actually JSON. Reserve grammars for targets [JSON Schema genuinely can't express](/learn/structured-outputs/grammar-constrained-beyond-json) — non-JSON formats, or a specific expressiveness gap that's costing you real bad data today.

### The mistake: trusting JSON mode as if it guaranteed your schema

**Why it's wrong.** [JSON mode guarantees syntax, not shape](/learn/structured-outputs/json-mode-what-it-guarantees) — it was never given your field names or types to check against, because it compiles one fixed, generic JSON grammar reused for every request.

**Symptom.** Code that does `data["expected_field"]` right after `json.loads()` with no existence or type check, and a `KeyError` or `TypeError` showing up in production the first time the model reasonably paraphrases a field name.

**Fix.** If you need specific keys and types, move up to schema-constrained decoding, which compiles your actual schema into the constraint. If you're stuck on JSON mode alone (no schema mode available), validate every field's presence and type on the other side — treat the parse succeeding as step one of two, not the whole job.

### The mistake: over-constraining a reasoning task into a single answer token

**Why it's wrong.** Forcing `{"answer": ...}` as the first thing generated denies the model the visible, token-by-token scratchpad that multi-step arithmetic or logic actually needs — the computation gets squeezed into a single hidden forward pass instead of being spread across steps it can check against. The mechanism is covered in full in [When Tight Constraints Hurt Reasoning](/learn/structured-outputs/constraints-and-model-quality-interaction).

**Symptom.** A schema-valid response with a wrong number — no parse error, no validation failure, just an answer that's arithmetically off in a way that would have been obvious if the steps had been visible.

**Fix.** Add a `reasoning` field ordered *before* the answer field in the same schema, or split into an unconstrained reasoning pass followed by a constrained structuring pass — see [Separating Reasoning from Structuring](/learn/structured-outputs/thinking-then-structuring-pattern).

### The mistake: assuming schema-constrained decoding enforces bounds and business rules

**Why it's wrong.** Decode-time constraint enforces what's checkable incrementally — presence, type, enum membership. It typically does *not* enforce `minLength`, `minimum`/`maximum`, `pattern`, or cross-field rules, even when your provider's docs let you write those keywords into the schema. Writing the keyword is not the same as it being enforced — see [Compiling a Schema into a Constraint](/learn/structured-outputs/schema-constrained-decoding-explained) for exactly where that line falls.

**Symptom.** A `priority: {"minimum": 1, "maximum": 5}` field that comes back as `9`, or a `ticket_id: {"minLength": 5}` that comes back as `"x"` — both pass the "did it validate" step in your pipeline because nothing downstream is actually checking the bound the schema only *described*.

**Fix.** Treat numeric ranges, length bounds, patterns, and cross-field rules as [validation-layer](/learn/structured-outputs/the-validation-layer) work, always, regardless of whether your provider's schema syntax accepts the keyword.

### The mistake: skipping constraint entirely and relying on prompt wording for high-stakes structure

**Why it's wrong.** A prompt is a suggested route, not a rail — see [Asking Nicely vs a Physical Rail](/learn/structured-outputs/guardrails-vs-guidance-intuition). No amount of "return ONLY valid JSON matching exactly this schema" changes which tokens are *reachable*, only which ones are *likely*, and "likely" eventually loses on a long enough tail of requests.

**Symptom.** A parser that works in every manual test and then throws on some small fraction of production traffic, with no pattern to the failures beyond "unusual input" or "long conversation history" — exactly where a probability-only defense is weakest.

**Fix.** For anything feeding an automated pipeline with no human in the loop, use an actual decode-time constraint (JSON mode at minimum, schema-constrained where available) rather than prompt wording alone. Reserve prompt-only formatting for genuinely low-stakes, human-reviewed output.

## Pre-flight checklist

- [ ] Is the target actually JSON? If yes, default to native schema-constrained decoding before reaching for a hand-written grammar.
- [ ] Does the code read specific field names or types out of the response? If yes, JSON mode alone isn't enough — use schema-constrained decoding.
- [ ] Does the task require more than one step of arithmetic or logic before an answer is known? If yes, put a reasoning field or pass before the answer field, not after it.
- [ ] Does the schema contain `minLength`, `minimum`/`maximum`, `pattern`, or a cross-field rule? If yes, assume it's not enforced at decode time until you've confirmed your provider's supported-keyword list, and validate it anyway.
- [ ] Is this output feeding an automated pipeline with no human review? If yes, don't rely on prompt wording alone — use a real constraint.

**Related:** [What JSON Mode Does and Doesn't Promise](/learn/structured-outputs/json-mode-what-it-guarantees), [Compiling a Schema into a Constraint](/learn/structured-outputs/schema-constrained-decoding-explained), [When Tight Constraints Hurt Reasoning](/learn/structured-outputs/constraints-and-model-quality-interaction), [Decoding Mechanisms Cheatsheet](/learn/structured-outputs/decoding-mechanisms-cheatsheet)
