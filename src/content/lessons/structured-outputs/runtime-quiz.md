---
title: "Runtime Checkpoint"
track: "structured-outputs"
status: live
summary: "Six questions on the failure taxonomy, the repair ladder, partial-JSON parsing, streaming, and when to reject instead of repair."
duration: "8 min read"
---

Six questions, each built around a scenario rather than a definition. One asks you to diagnose and prescribe over a broken output the way you would on an actual incident.

## 1. Naming the failure

A response comes back as:

```text
Sure! Here's the JSON: {"id": "t4", "status": "open"}
```

What category of failure is this, and what should happen before anything else?

A. Structural failure; validate the text immediately, the object is fine as-is.
B. Prose-leakage; extract the JSON substring before any parsing or validation is attempted.
C. Syntactic failure; run a deterministic bracket-closer on the entire string.
D. Semantic failure; ground the `id` field against a source of truth before proceeding.

<details><summary>Answer</summary>

**Correct: B.** [A Taxonomy of Structured-Output Failures](/learn/structured-outputs/failure-modes-taxonomy) names this specifically — the JSON itself is fine, but it's wrapped in commentary that sits outside the object. The fix is extraction (find the `{...}` substring), not repair of the JSON, and it has to happen before a parser gets a fair shot at the text.

**A** ignores that validating the raw string as given fails instantly — it doesn't start with `{`. The object being fine *once extracted* isn't the same as being fine as-is.

**C** misapplies a fix meant for truncation — nothing inside the JSON here is unclosed or broken; a bracket-closer has nothing to do.

**D** jumps to a category with no supporting evidence — nothing suggests `id` is factually wrong, and it skips the much simpler, correctly-diagnosed problem in front of it.

</details>

## 2. Climbing the ladder

A response fails validation only because a required field is truncated mid-string — a syntactic issue. Instead of trying anything else first, the team's repair code immediately opens a fresh model call with the validation error attached. What's the mistake?

A. There's no mistake — re-asking with the specific error is always the correct first move.
B. It skipped rung one (deterministic fixups); a truncated string closes with a free bracket-closer and never needed a model call at all.
C. It should have skipped straight to constrained regeneration instead, since that rung is the most reliable.
D. Re-asking is never appropriate for a syntactic failure, only for structural ones.

<details><summary>Answer</summary>

**Correct: B.** [The Repair Ladder](/learn/structured-outputs/auto-repair-strategies) is explicit that you climb only as far as needed — a syntactic truncation is exactly what a deterministic, free fixup resolves, and reaching for a model call first pays a real cost for something rung one likely solves in milliseconds.

**A** treats a habit as a rule — re-asking is a reasonable *second* move, not an unconditional first one, once cheaper options are ruled out.

**C** picks the most expensive rung for a cheaply-fixable problem, the exact inefficiency the ladder is built to prevent — reliability isn't the only variable, cost is too, and rung one is both reliable and free for this failure shape.

**D** overcorrects into an absolute — re-asking can still be the right call for a syntactic failure a deterministic fixup can't cleanly resolve; the actual lesson is "start cheap," not "never use rung two here."

</details>

## 3. A scalar mid-write

A tolerant parser is scanning a buffer that currently ends in `..., "count": 4` — a number, with the stream still going. What should the parser's current best-effort value show for `count`?

A. Drop `count` entirely — it hasn't been confirmed complete by a following comma or bracket.
B. Include `count: 4`, since `"4"` already reads as a complete, valid JSON number on its own.
C. Include `count: 4.`, with a trailing decimal point, to signal it might still be growing.
D. Raise an error — a number with nothing after it is ambiguous.

<details><summary>Answer</summary>

**Correct: B.** [Building a Tolerant Incremental Parser](/learn/structured-outputs/incremental-parser-walkthrough) keeps a trailing token exactly when it already parses as a complete value on its own — `"4"` is a fully legal JSON number regardless of what streams in after it.

**A** confuses this with the *array-element-boundary* rule from [Consuming Structured Output as It Streams](/learn/structured-outputs/streaming-structured-output-model), which requires a following comma or bracket before treating a whole array *element* as confirmed — that rule governs whether more fields might still be added to an object, not whether an individual scalar value is itself already well-formed.

**C** invents syntax that was never in the buffer, producing something that isn't even valid JSON — the fabrication is worse than either keeping or dropping the value honestly.

**D** contradicts the entire purpose of a tolerant parser, which exists specifically to give a best-effort answer on incomplete input rather than raise.

</details>

## 4. Confirming an array element

A streaming buffer currently reads:

```text
[{"id": 1, "done": true}, {"id": 2, "done": fal
```

By the element-boundary rule, how many elements are safe to render right now?

A. Two — both objects have all their expected fields present in some form.
B. Zero — nothing is safe to render until the entire array closes.
C. One — element 1 is followed by a real comma in the stream; element 2 is still open and unconfirmed.
D. One — because arrays should always render all but the last element, by convention.

<details><summary>Answer</summary>

**Correct: C.** [Consuming Structured Output as It Streams](/learn/structured-outputs/streaming-structured-output-model) sets the rule precisely: an element counts as done only once the character right after it, ignoring whitespace, is a comma or the array's own closing bracket. Element 1 has a real comma after it; element 2's `"done"` value hasn't even finished as a literal yet (`fal` is not `false`).

**A** treats "some field is present" as equivalent to "done" — element 2's own value isn't even a complete token yet, let alone a confirmed, finished element.

**B** overcorrects — element 1 is genuinely complete and confirmed by real stream content; withholding it too throws away information that's already trustworthy, per [Rendering Results as They Stream](/learn/structured-outputs/streaming-progress-ui-example).

**D** lands on the right number for this one buffer but for the wrong reason — the "always hold back the last element" heuristic is explicitly called out as an approximation that breaks once the schema has trailing fields after the array; the real rule checks for an actual trailing delimiter, not position.

</details>

## 5. A self-consistent-looking contradiction

An invoice extractor returns a fully well-typed object where `line_items` sum to $340 but `total` reads $340,000. What's the correct move?

A. Repair by re-asking the model to recompute the total from the line items.
B. Accept it — every individual field passed type and required-field validation.
C. Reject and route to human review — this is a cross-field, semantic contradiction that no repair rung can resolve without guessing which number is right.
D. Auto-correct `total` to $340 to match the line items, since that's clearly what was meant.

<details><summary>Answer</summary>

**Correct: C.** [When to Reject Instead of Repair](/learn/structured-outputs/when-not-to-repair) draws exactly this line — fixing this requires inventing which of two conflicting numbers is actually correct, which is the specific test for routing to reject rather than climbing the repair ladder further.

**A** invites the model to produce *a* plausible-looking correction with no way to confirm which number was actually wrong — repair only earns its keep on failures with one unambiguous correct fix, and this isn't one.

**B** is the exact trap [A Taxonomy of Structured-Output Failures](/learn/structured-outputs/failure-modes-taxonomy) warns about — every field being well-typed says nothing about whether the *relationship* between two fields is true, and a schema validator has no visibility into that relationship at all.

**D** assumes its own conclusion — "clearly what was meant" isn't established by anything in the data; the line items could just as easily be the ones missing a factor of a thousand.

</details>

## 6. Diagnose and prescribe

A schema expects `role` to be one of `"admin"`, `"member"`, `"guest"`, and forbids any field not in the schema. This response comes back:

```json
{"user": "Alicia Gomez", "role": "amdin", "last_login": "2026-08-15T10:00:00Z", "notes": "vip", "internal_flag": true}
```

Which combination of diagnosis and first action is correct?

A. One syntactic failure; run a deterministic bracket-closer.
B. Two structural failures — `role` is an out-of-set enum value and `internal_flag` is a forbidden extra field; try rung one (a deterministic enum remap and a field-strip) before any model call.
C. This is a semantic failure, since the account's role might genuinely be wrong; escalate straight to human review.
D. One structural failure only, on `internal_flag` — `"amdin"` is close enough to `"admin"` that validators auto-correct typos like this.

<details><summary>Answer</summary>

**Correct: B.** The JSON parses cleanly end to end, so there's no syntactic problem at all — but two separate structural violations are present: an enum value outside the allowed set, and a field the schema forbids. Both are covered directly in [Diagnosing Five Real Broken Outputs](/learn/structured-outputs/diagnosing-five-real-failures), and both are cheap, rung-one fixes: a likely typo remap for `"amdin"` and a deterministic strip for `internal_flag`, per [The Repair Ladder](/learn/structured-outputs/auto-repair-strategies).

**A** misreads the failure entirely — nothing here is truncated or malformed; a bracket-closer has no open structure to act on.

**C** skips past a much cheaper, more likely explanation. A one-letter transposition in an enum value is a textbook structural failure, not evidence of a genuine business contradiction — escalating straight to a human here spends review effort on something rung one probably resolves outright.

**D** understates the diagnosis on two fronts — schema validators do not auto-correct typos by default, so `"amdin"` is a real, uncaught violation, and treating it as fine repeats the exact mistake [A Taxonomy of Structured-Output Failures](/learn/structured-outputs/failure-modes-taxonomy) warns about: assuming a value is fine because it merely looks close to right.

</details>

## If a question tripped you up, go here first

- **Missed Q1 or Q6** (naming and diagnosing failures): [A Taxonomy of Structured-Output Failures](/learn/structured-outputs/failure-modes-taxonomy), [Diagnosing Five Real Broken Outputs](/learn/structured-outputs/diagnosing-five-real-failures).
- **Missed Q2** (the repair ladder): [The Repair Ladder](/learn/structured-outputs/auto-repair-strategies), [A Bounded Repair Loop](/learn/structured-outputs/repair-loop-implementation).
- **Missed Q3** (partial JSON parsing): [Building a Tolerant Incremental Parser](/learn/structured-outputs/incremental-parser-walkthrough), [Repairing Partial and Streamed JSON](/learn/structured-outputs/incremental-json-repair-explained).
- **Missed Q4** (streaming consumption): [Consuming Structured Output as It Streams](/learn/structured-outputs/streaming-structured-output-model), [Rendering Results as They Stream](/learn/structured-outputs/streaming-progress-ui-example).
- **Missed Q5** (reject vs. repair): [When to Reject Instead of Repair](/learn/structured-outputs/when-not-to-repair), [Repair-Loop Mistakes](/learn/structured-outputs/repair-loop-mistakes).

If all six felt clear, you have the runtime picture this module builds: validate at the boundary, name the failure precisely, climb the repair ladder only as far as it earns its keep, parse streams with a tolerant parser that never outruns what's actually arrived, and know the difference between a fixable accident and a value that was never going to be fixed by asking again.

**Related:** [Failure-to-Repair Cheatsheet](/learn/structured-outputs/failure-and-repair-cheatsheet), [A Taxonomy of Structured-Output Failures](/learn/structured-outputs/failure-modes-taxonomy), [The Repair Ladder](/learn/structured-outputs/auto-repair-strategies), [When to Reject Instead of Repair](/learn/structured-outputs/when-not-to-repair), [Consuming Structured Output as It Streams](/learn/structured-outputs/streaming-structured-output-model)
