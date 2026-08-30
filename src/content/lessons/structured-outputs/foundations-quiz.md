---
title: "Foundations Checkpoint"
track: "structured-outputs"
status: live
summary: "Six questions on the three reliability layers, the four mechanisms, system placement, and reliability-budget math."
duration: "7 min read"
---

Six questions covering everything in this module. Question 5 has real arithmetic worth doing on paper rather than eyeballing.

## 1. Which layer of reliability does JSON mode, on its own, guarantee?

A. Semantic correctness — the values are accurate
B. Schema conformance — the right keys and types are present
C. Syntactic validity — the output parses as JSON
D. All three layers at once

<details><summary>Answer</summary>

**Correct: C.** JSON mode constrains the decoder so it can only emit syntactically valid JSON — balanced braces, correctly quoted strings, no trailing commas. See [Three Layers of Reliability](/learn/structured-outputs/what-reliable-structure-really-means).

- A is wrong: JSON mode has no access to ground truth about your data; it cannot check whether a value is true.
- B is wrong: JSON mode never sees your intended keys or types — `{"result": "ok"}` is valid JSON-mode output regardless of what shape you wanted.
- C is correct.
- D is wrong for the reasons above — schema conformance and semantic correctness both need separate mechanisms.

</details>

## 2. Scenario: a support-ticket model returns `{"priority": "low", "category": "camera_bug", "needs_human": false}` for a customer reporting the same crash for the third time this week. The JSON parses cleanly and matches the schema exactly. Which layer has failed?

A. Syntactic validity
B. Schema conformance
C. Semantic correctness
D. None — this is expected, correct behavior

<details><summary>Answer</summary>

**Correct: C.** The object is valid JSON and perfectly shaped, but "low" priority and no human escalation for a recurring, frustrated customer is factually the wrong call — see [Three Layers of Reliability](/learn/structured-outputs/what-reliable-structure-really-means).

- A is wrong: nothing about parsing failed here.
- B is wrong: every key, type, and enum value is exactly what the schema required.
- C is correct.
- D is wrong: the priority and escalation decision are objectively mismatched to the ticket's content, which is precisely what a semantic-layer check would catch.

</details>

## 3. Which statement correctly matches a mechanism to what it uniquely adds over the one before it?

A. JSON mode adds schema conformance over prompt-only
B. Schema-constrained decoding adds shape guarantees (right keys and types) over JSON mode's syntax-only guarantee
C. Grammar-constrained decoding adds semantic correctness over schema-constrained decoding
D. Prompt-only guarantees valid JSON syntax on every call

<details><summary>Answer</summary>

**Correct: B.** JSON mode only guarantees syntax; schema-constrained decoding constrains generation to also match a specific schema's keys, types, and required fields. See [Four Roads to Structured Output](/learn/structured-outputs/three-ways-to-get-json-overview).

- A is wrong: JSON mode guarantees syntax only, not any particular shape.
- B is correct.
- C is wrong: grammar-constrained decoding generalizes shape/syntax constraints to arbitrary formats — it still cannot verify that a value is true, which is what semantic correctness requires.
- D is wrong: prompt-only has no enforcement mechanism at all; validity is best-effort.

</details>

## 4. Scenario: an agent's extracted parameters feed directly into `send_refund(amount, account_id)`, which executes immediately with no human step. Which home does this represent, and how strict must the contract be?

A. Document extraction; strictness can be low since a human reviews it eventually
B. Tool/function call; strictness must be highest, since a bad value causes an immediate real-world side effect
C. Agent state; strictness is moderate since it's just being passed along
D. Direct database write; strictness is fully handled by the database's column types

<details><summary>Answer</summary>

**Correct: B.** A tool call executes the instant it's dispatched, with no review step in between — a wrong `amount` or `account_id` becomes a real transaction immediately. See [Where Structured Output Shows Up in a System](/learn/structured-outputs/where-structured-output-fits-in-a-system).

- A is wrong: there's no review step described here — the call fires immediately.
- B is correct.
- C is wrong: this isn't state being carried to a later step; it's parameters to an action executing right now.
- D is wrong: this is a function call, not a database write, and column constraints wouldn't run before the refund already happened anyway.

</details>

## 5. Scenario: a 10,000-documents-per-day pipeline validates cleanly on 96% of documents on the first pass. Retries fix half of the remaining failures. A repair loop then fixes 60% of what's still left after retries. How many documents per day end up routed to human review, and does that meet a target of 20/day?

A. 20/day; meets the target
B. 80/day; does not meet the target
C. 400/day; does not meet the target
D. 4/day; meets the target

<details><summary>Answer</summary>

**Correct: B.** Do the arithmetic: 4% of 10,000 fail first-pass validation = 400/day. Retries fix half: 200 fixed, 200 remain. The repair loop fixes 60% of those 200 = 120 fixed, 80 remain. 80/day reach human review — four times the 20/day target. See [Thinking in a Reliability Budget](/learn/structured-outputs/reliability-budget-thinking).

- A is wrong: 20/day undercounts what's actually left after retries and repair.
- B is correct.
- C is wrong: 400/day is the count before retries and repair are applied at all, not the final number.
- D is wrong: 4/day is far too low — it doesn't correspond to any step in the calculation.

</details>

## 6. In the invoice pipeline, a value comes back as the correct type (a float) but numerically wrong — an OCR misread `12400.00` as `1240.00`, and the model filled in the plausible-looking figure. Which stage or mechanism is responsible for catching this?

A. Schema-constrained decoding at generation time
B. The JSON parsing step
C. Schema validation against the Pydantic model
D. None of the decoding mechanisms or the shape-validation step catch this — it needs a semantic or business-rule check, or human review

<details><summary>Answer</summary>

**Correct: D.** The value is a syntactically valid, correctly typed float that satisfies every shape constraint — nothing about layers 1 or 2 has any way to detect that it's numerically wrong. See [What One Bad Field Costs Downstream](/learn/structured-outputs/cost-of-getting-it-wrong-intuition) and [Three Layers of Reliability](/learn/structured-outputs/what-reliable-structure-really-means).

- A is wrong: schema-constrained decoding only enforces shape at generation time — it has no access to the true invoice total to compare against.
- B is wrong: JSON parsing only checks that the text is syntactically valid JSON.
- C is wrong: schema validation checks type and shape (a float, present, in range if bounded) — `1240.00` passes all of that just as easily as `12400.00` would.
- D is correct.

</details>

**Related:** [Three Layers of Reliability](/learn/structured-outputs/what-reliable-structure-really-means) · [Four Roads to Structured Output](/learn/structured-outputs/three-ways-to-get-json-overview) · [Where Structured Output Shows Up in a System](/learn/structured-outputs/where-structured-output-fits-in-a-system) · [Thinking in a Reliability Budget](/learn/structured-outputs/reliability-budget-thinking) · [The Whole Game of Structured Output](/learn/structured-outputs/the-whole-game-of-structured-output)
