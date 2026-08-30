---
title: "Extraction Checkpoint"
track: "structured-outputs"
status: live
summary: "Test schema-filling, chunk-and-merge hazards, tool-calling extraction, tables, grounding, and confidence routing, plus a pipeline design item."
duration: "7 min read"
---

Six questions covering the module: how extraction relates to structured output in general, the specific hazards of chunking, tables, grounding, and confidence routing, and one item where you design a pipeline from a document description.

## Question 1

A model extracts a receipt into a schema-valid JSON object, but the `total` field is $10 higher than the sum of the line items. What does this tell you?

A. The extraction failed and should be rejected by your JSON validator.
B. The schema was designed incorrectly.
C. Schema conformance and factual correctness are different guarantees — this is a semantic error a shape validator can't catch.
D. The model is not capable of vision-based extraction.

<details>
<summary>Answer</summary>

**Correct: C.** The object is schema-valid — every field has the right type — but the total is wrong relative to the line items, which is an arithmetic/semantic problem, not a shape problem.

- A is wrong: a JSON validator has nothing to object to here; every field parses cleanly, so it would not flag or reject this object.
- B is wrong: the schema is fine — it captures subtotal, tax, and total, which is exactly what makes this kind of cross-check possible in the first place.
- C is correct: see [Extraction Is Schema-Filling](/learn/structured-outputs/extraction-as-a-structured-output-problem) and the worked example in [A Receipt Image to a Typed Object](/learn/structured-outputs/receipt-image-to-schema-example).
- D is wrong: it overgeneralizes one arithmetic mismatch into a blanket claim about the model's capability, which isn't what the evidence supports.

</details>

## Question 2

You chunk a 40-page contract with a 1-page overlap. A clause spans pages 15 through 17. What's the most likely failure?

A. The clause will be extracted correctly and completely by every chunk that touches it.
B. The clause will be truncated in every chunk that sees it, because a 1-page overlap isn't wide enough to contain a clause that spans three pages.
C. The extraction will fail schema validation because the clause text is too long.
D. The merge step will automatically detect that the clause is too long and split it into two separate records.

<details>
<summary>Answer</summary>

**Correct: B.** Overlap has to be sized to your longest expected entity — a 1-page overlap can't fully contain a clause spanning three pages inside any single chunk's window, so every chunk that sees part of it sees a truncated fragment.

- A is wrong: it assumes the overlap is wide enough by coincidence, but nothing here guarantees that, and the premise (overlap of 1 page vs. a 3-page clause) argues against it.
- B is correct: see the boundary hazard in [Strategies for Long Documents](/learn/structured-outputs/long-document-extraction-strategies) and the worked failure case in [Extracting Clauses from a 40-Page Contract](/learn/structured-outputs/contract-clause-extraction-example).
- C is wrong: schema validation only checks that `text` is a string of the right type — a truncated string is still a perfectly valid string.
- D is wrong: merge logic collapses duplicate or overlapping extractions of the same entity; it doesn't invent a split of one entity into two records.

</details>

## Question 3

Why does forcing a model to call a tool work as an extraction mechanism, even when the tool is never executed?

A. Because `tool_choice` automatically validates the output against a JSON Schema more strictly than any other mechanism ever could.
B. Because to produce a valid tool-call at all, the model must supply arguments matching the tool's `input_schema` — which you've defined to be your extraction schema.
C. Because tools always run in a sandboxed environment that double-checks their inputs before anything else happens.
D. Because forced tool calls bypass the need for any validation on your side.

<details>
<summary>Answer</summary>

**Correct: B.** The tool is never executed — its only role is to exist as a schema the model has to fill in order to produce a call at all, which is exactly [Tool Calling as an Extraction Mechanism](/learn/structured-outputs/tool-and-function-schemas-for-extraction) describes.

- A is wrong: strict, guaranteed-valid arguments require explicitly opting into strict schema enforcement (e.g. `strict: true`) — it isn't automatic just because you used `tool_choice`.
- B is correct.
- C is wrong: this scenario never executes the tool at all, so sandboxing is irrelevant to why the mechanism works.
- D is wrong: it's the opposite of the guidance — you still need to validate the arguments you get back, per [Forcing a Tool Call to Extract](/learn/structured-outputs/function-calling-extraction-implementation).

</details>

## Question 4

A multi-page bank statement table has 13 rows total but your extraction returns only 12, and every row that made it is individually schema-valid. What should have caught this?

A. Adding `additionalProperties: false` to the row schema.
B. A running-balance cross-check that recomputes each row's balance from the previous row's balance plus that row's amount.
C. Making every field in the row schema required instead of optional.
D. Increasing `max_tokens` on the extraction request.

<details>
<summary>Answer</summary>

**Correct: B.** A missing row isn't a field-level defect — every present row is fine on its own — so only a check that spans rows, like a running-balance reconciliation, can surface it. See [Transactions from a Bank Statement](/learn/structured-outputs/bank-statement-transactions-example).

- A is wrong: `additionalProperties: false` guards against extra unexpected fields on a row, not a missing row entirely.
- B is correct.
- C is wrong: a dropped row isn't a null-field problem; required fields wouldn't produce or reveal a 13th row that was never extracted.
- D is wrong: a token-limit truncation would typically cut off output visibly (often mid-object) rather than silently and cleanly drop one interior row while every other row and the object's shape stay perfectly well-formed — the likelier cause here is the page-boundary handoff.

</details>

## Question 5

Why is an extraction with no page number, span, or source-text field harder to trust in production, even if it's schema-valid and passes every cross-field check you currently have?

A. It isn't — cross-field checks are a complete substitute for grounding.
B. Because grounding is required by the JSON Schema specification for any array field.
C. Because your cross-field checks can only catch the errors you thought to check for; grounding is what lets a human verify the rest without re-reading the whole document.
D. Because ungrounded fields always take longer to extract than grounded ones.

<details>
<summary>Answer</summary>

**Correct: C.** Cross-field checks are powerful but finite — they only catch the specific inconsistencies you anticipated and coded for. Grounding covers everything else by making verification cheap. See [Grounding Extractions in the Source](/learn/structured-outputs/grounding-and-citations-in-extraction).

- A is wrong: no set of cross-field checks is exhaustive; grounding exists precisely for the errors those checks don't anticipate.
- B is wrong: there's no such requirement in JSON Schema — grounding is a design choice you add to a schema, not a spec rule.
- C is correct.
- D is wrong: grounding fields are typically cheap (a page number, a short text span) and don't meaningfully change extraction latency.

</details>

## Question 6 — design the pipeline

You're asked to build extraction for scanned, 300-page annual reports, pulling out `financial_figures[]` of `{label, value, unit, page}`, where a wrong figure reaching a downstream model could trigger an incorrect financial decision. Which pipeline design fits best?

A. One single call with the whole 300-page document attached, structured-output mode, no chunking, no review routing — simplest is best here.
B. Chunk with overlap sized to the longest figure-bearing table, merge on `label` and nearby `page`, require a `page` grounding field on every record, and route anything that fails a cross-field check (like a subtotal that doesn't match its components) to human review before it reaches the downstream model.
C. Skip chunking entirely and instead run the same whole-document call five times, keeping whichever output extracted the most figures.
D. Extract with a single forced tool call over the raw OCR text of all 300 pages concatenated into one string, with no schema for individual figures — just one big `text` field for a human to read later.

<details>
<summary>Answer</summary>

**Correct: B.** This combines every piece the module builds: chunking with overlap for a document far past one-call length ([Strategies for Long Documents](/learn/structured-outputs/long-document-extraction-strategies)), a keyed merge ([Chunk, Extract, Merge](/learn/structured-outputs/chunk-and-merge-extraction)), a `page` grounding field ([Grounding Extractions in the Source](/learn/structured-outputs/grounding-and-citations-in-extraction)), and confidence-based review routing calibrated to the stated high cost of a wrong figure ([Confidence and Review Routing](/learn/structured-outputs/extraction-confidence-and-review-routing)).

- A is wrong: 300 pages of scanned images is well past what a single call handles reliably, and skipping review routing ignores the explicitly stated high cost of an error.
- B is correct.
- C is wrong: "most figures extracted" isn't a proxy for "most correct" — it could just as easily reward a run that hallucinated extra figures, and it isn't a merge or validation strategy at all.
- D is wrong: one opaque `text` field defeats the point of structured extraction — no schema, no per-field grounding, and nothing a downstream system can consume automatically.

</details>

**Related:** [Extraction Is Schema-Filling](/learn/structured-outputs/extraction-as-a-structured-output-problem), [Chunk, Extract, Merge](/learn/structured-outputs/chunk-and-merge-extraction), [Tool Calling as an Extraction Mechanism](/learn/structured-outputs/tool-and-function-schemas-for-extraction), [Extracting Tables Reliably](/learn/structured-outputs/multi-field-tables-from-documents), [Grounding Extractions in the Source](/learn/structured-outputs/grounding-and-citations-in-extraction), [Confidence and Review Routing](/learn/structured-outputs/extraction-confidence-and-review-routing)
