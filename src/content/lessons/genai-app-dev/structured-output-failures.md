---
title: "Structured Output Failures and Repair Traps"
track: "genai-app-dev"
status: live
summary: "Five real ways structured-output pipelines break, each with the failing case and the concrete fix — checked before you ship an extraction feature."
duration: "7 min read"
---

Structured output feels solved the day it works in the demo. It breaks in production on inputs the demo never saw. Here are the five failures that show up most often, in roughly the order teams discover them.

### The mistake: trusting `JSON.parse` without a schema

**Why it's wrong:** `JSON.parse` only checks that the text is syntactically valid JSON — it says nothing about whether the fields you need exist, have the right types, or fall within sane ranges. A response like `{"amount": "forty-two"}` parses just fine and then crashes three functions downstream when something tries `amount.toFixed(2)`.

**Symptom:** intermittent runtime type errors (`toFixed is not a function`, `undefined.map`) that only show up on specific inputs, and that no amount of "but it worked when I tested it" reproduces reliably.

**Fix:** run every parsed response through a real schema — Zod or Pydantic — before any other code touches it, as covered in [Schema, Validation, and Auto-Repair](/learn/genai-app-dev/json-schema-and-validation). `JSON.parse` answers "is this JSON"; a schema answers "is this the JSON I asked for."

### The mistake: unbounded repair loops

**Why it's wrong:** re-prompting on validation failure is a reasonable idea, but without a hard cap, a schema the model structurally cannot satisfy — or a genuinely ambiguous input — turns one request into an infinite (or just very expensive) retry loop, each iteration burning tokens and latency for a request that was never going to succeed.

**Symptom:** a handful of requests that take 30+ seconds and rack up a suspiciously high token count compared to everything else in your logs, often traced back to one malformed input that keeps failing the same validation check in the same way.

**Fix:** cap retries explicitly — two or three attempts, as in [Schema, Validation, and Auto-Repair](/learn/genai-app-dev/json-schema-and-validation) — and route anything that exhausts the cap to a human queue rather than looping again or returning a default. A repair loop with no ceiling isn't more thorough, it's just slower to fail.

### The mistake: schemas so strict the model can't comply

**Why it's wrong:** a schema that demands certainty the input doesn't contain — a required `dueDate` when the source text never states one, a `reason` field with an unreasonably long minimum length — doesn't make the model more accurate. It makes the model choose between failing validation repeatedly or inventing a plausible-looking value to satisfy the constraint. Most models will eventually do the latter, because "produce something" is what they're trained to do.

**Symptom:** suspiciously confident-looking output on inputs that shouldn't have enough information to support it — a due date extracted from an email that never mentions a date, a reason field padded with filler to hit a length minimum.

**Fix:** make genuinely optional fields nullable, and pair uncertain fields with a confidence score instead of forcing a value — the approach worked through in [Extracting Typed Records From Freeform Text](/learn/genai-app-dev/extracting-typed-data-from-freeform). A schema should describe what a *correct* extraction can look like, including "nothing found," not just the happy path.

### The mistake: enums the model invents values for

**Why it's wrong:** an enum field is supposed to be a closed set, but if the constraint is only described in a prompt ("respond with low, medium, or high") rather than enforced by the API's schema mechanism, the model can and will occasionally produce `"urgent"` or `"critical"` — values that read as reasonable English but don't exist in your downstream `switch` statement.

**Symptom:** a default-case bug report: some records silently fall through to an `else` branch or a fallback UI state, and when you trace it back, the "impossible" enum value is sitting right there in the data.

**Fix:** enforce the enum through the provider's native schema or tool-calling mechanism (an actual `enum: [...]` in the JSON schema, not a sentence describing the allowed values), as shown in [Why Application Code Needs Structured Output](/learn/genai-app-dev/structured-output-in-apps) — and validate again in code, because even schema-enforced generation is a constraint on the API side that your own type system should never take on faith from a network response.

### The mistake: treating schema-valid as correct

**Why it's wrong:** passing validation only proves the response has the right *shape* — the right field names, types, and enum membership. It proves nothing about whether the values are true. `{"priority": "low", "reason": "server outage affecting all customers"}` is perfectly valid JSON and obviously the wrong priority.

**Symptom:** clean logs, passing validation, and still-wrong decisions downstream — the kind of bug that's hard to catch because nothing is throwing an error, the output is just quietly incorrect.

**Fix:** add semantic checks in code wherever you can state them deterministically — line items that should sum to a total, a date that shouldn't be in the past, a priority that should correlate with keywords in the source text — the same cross-check pattern used in the invoice example. Schema validation and semantic validation are two different jobs; shipping only the first one is shipping half the safety net.

## Pre-flight checklist

- [ ] Every model response is validated against a real schema before any other code reads it — never a bare `JSON.parse`.
- [ ] The repair loop has a hard attempt cap, and exhausting it routes to a human queue, not a retry-forever loop or a silent default.
- [ ] Fields the input might not contain are nullable or carry a confidence score, not forced-required.
- [ ] Enums are enforced through the provider's schema/tool mechanism, not just described in prose — and re-checked in code.
- [ ] At least one deterministic semantic check exists for any field where correctness can be computed (sums, date ranges, cross-references) rather than assumed from schema validity alone.

**Related:** [Why Application Code Needs Structured Output](/learn/genai-app-dev/structured-output-in-apps), [Schema, Validation, and Auto-Repair](/learn/genai-app-dev/json-schema-and-validation), [Extracting Typed Records From Freeform Text](/learn/genai-app-dev/extracting-typed-data-from-freeform), [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair)
