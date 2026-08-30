---
title: "A Taxonomy of Structured-Output Failures"
track: "structured-outputs"
status: live
summary: "Four named categories of structured-output failure, each demanding a different tool to catch and a different tool to fix."
duration: "6 min read"
---

"The JSON was broken" isn't a diagnosis, it's a shrug. Four specific things can go wrong between a model and a validated object, and naming which one happened tells you exactly which tool to reach for next.

## What it is

Every structured-output failure sorts into one of four buckets:

- **Syntactic** — the text isn't valid JSON at all. A truncated object, an unescaped quote inside a string, a trailing comma. A JSON parser rejects it before a schema is ever consulted.
- **Structural** — the text parses fine, but its shape doesn't match your schema. A missing required key, a string where a number belongs, an enum value outside the allowed set, an extra field you didn't ask for.
- **Semantic** — the text parses *and* validates cleanly, but a value is simply wrong. A fabricated ID, a confidence score the model invented because the schema asked for one, a date that's internally consistent but doesn't match the source document.
- **Prose-leakage** — the response isn't just JSON with some other text stuck in it; the model wrapped it in commentary — an apology, a caveat, a "Here's the JSON you asked for:" — that sits outside the object entirely. It's a distinct category because the fix is extraction, not repair of the JSON itself.

## The mental model

Picture the four as concentric checks, each one only reachable once the check before it passes. A prose-leaked response has to be stripped down to its JSON substring before a parser gets a fair shot at it. A parser has to accept the text before a schema validator can even run. A schema validator has to pass before you're left looking at semantic correctness at all — which is the one category no automated check in this taxonomy can catch by itself.

That ordering matters because a single broken response often stacks more than one failure at once — an apologetic preamble wrapped around JSON that's also truncated. Diagnose outside-in: strip prose first, then check for a parse error, then run schema validation, and only once all three pass do you get to ask whether the values are actually true.

## Why it works this way

Each category exists because it's produced by a different part of the generation process, and each needs a different fix:

- **Syntactic** failures come from hitting an output limit or an unlucky escaping mistake — mechanical, not a reasoning failure. The fix is mechanical too: raise `max_tokens`, or run a deterministic repair pass that closes what's open. See [Repairing Partial and Streamed JSON](/learn/structured-outputs/incremental-json-repair-explained) for exactly this class.
- **Structural** failures come from the model's own uncertainty about format — it knows roughly what you want but drifts on the details. This is precisely what [validation](/learn/structured-outputs/the-validation-layer) exists to catch, and it's the category [the repair ladder](/learn/structured-outputs/auto-repair-strategies) is built to fix cheaply, because the model usually corrects it the moment the specific error is pointed out.
- **Semantic** failures come from the model being fluent and wrong — the output is exactly what a well-formed answer looks like, it just isn't true. No schema can see this, because from a shape perspective there is nothing to see. Grounding, cross-checking against a source of truth, or a human is what catches it — not a stricter validator.
- **Prose-leakage** comes from the model's conversational instinct overriding the instruction to emit only JSON — most common with plain prompting and largely eliminated by real [JSON mode](/learn/structured-outputs/json-mode-basics) or [tool calling](/learn/structured-outputs/tool-function-schemas), which give the model a slot to fill instead of a stream to narrate over.

## A concrete example

One broken response per category:

```text
Syntactic:   {"items": [{"name": "Widget", "price": 12.99}, {"name": "Gad

Structural:  {"id": "t1", "priority": "high", "status": "open"}
             # priority should be an int

Semantic:    {"id": "t1", "priority": 3, "status": "resolved"}
             # valid shape, but the ticket in question is still open

Prose-leak:  Sure, here's the extracted data:
             {"id": "t1", "priority": 3, "status": "open"}
             Let me know if you need anything else!
```

All four look "broken" at a glance. Only the taxonomy tells you that the first needs a bracket-closer, the second needs a type coercion or a re-ask, the third needs a fact-check against your ticket database, and the fourth needs a regex or a fenced-block extraction before any of the other three checks even run.

## Where it shows up

This vocabulary is the backbone of the rest of the module: [Diagnosing Five Real Broken Outputs](/learn/structured-outputs/diagnosing-five-real-failures) walks five concrete examples by category, [The Repair Ladder](/learn/structured-outputs/auto-repair-strategies) prescribes a fix per category, and the [Failure-to-Repair Cheatsheet](/learn/structured-outputs/failure-and-repair-cheatsheet) is this same taxonomy compressed into a lookup table for an incident.

## Watch out for

**Treating "it validated" as "it's correct."** A structural pass says the shape matches. It says nothing about the semantic category — that's the exact gap [Structured Output Failure Modes](/learn/structured-outputs/structured-output-failure-modes) calls out with hallucinated fields that are perfectly well-typed and completely made up.

**Misreading prose-leakage as a syntax error.** If you feed the whole response, commentary included, to a JSON repair function, you're asking a bracket-closer to solve a problem it wasn't built for. Strip the prose first; repair the JSON second.

**Assuming one failure means one cause.** Real production output frequently stacks two or three of these categories on the same response. Check them in order — prose, then syntax, then structure, then semantics — rather than assuming the first thing you notice is the only thing wrong.

## Where next

Practice reading a validation error back to its category in [Diagnosing Five Real Broken Outputs](/learn/structured-outputs/diagnosing-five-real-failures), then see what each category earns on [the repair ladder](/learn/structured-outputs/auto-repair-strategies).

**Related:** [Structured Output Failure Modes](/learn/structured-outputs/structured-output-failure-modes), [Always Validate at the Boundary](/learn/structured-outputs/the-validation-layer), [Diagnosing Five Real Broken Outputs](/learn/structured-outputs/diagnosing-five-real-failures), [The Repair Ladder](/learn/structured-outputs/auto-repair-strategies), [When to Reject Instead of Repair](/learn/structured-outputs/when-not-to-repair)
