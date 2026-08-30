---
title: "Where Structured Output Shows Up in a System"
track: "structured-outputs"
status: live
summary: "Same object, four different consumers, four very different tolerances for being wrong — mapped by blast radius."
duration: "7 min read"
---

The same `{amount: float}` field means something very different depending on who reads it next — a report someone might double-check, or a live transaction with no human in between.

## What it is

Structured output tends to land in one of four homes: document extraction, tool or function calls, agent state passed between steps, and direct database writes. Each has a different consumer and a different cost when the object is wrong.

## The mental model

Ask two questions about any structured object in your system: who actually reads this next, and what happens the moment it's wrong? A human reviewer catching a bad value before it matters is a very different system than code executing an action based on it with nothing in between.

## Why it works this way

**Document extraction** (invoices, receipts, resumes) usually feeds a database or a report, often with a human review step somewhere before final commit. Strictness: medium-high — wrong values have real downstream consequences, but there's often a chance to catch them. See [Structured Extraction from Documents and Images](/learn/structured-outputs/structured-extraction-from-documents-and-images) and [Receipt-Image-to-Schema Example](/learn/structured-outputs/receipt-image-to-schema-example).

**Tool and function calls** hand parameters straight to code that executes a real action — sending an email, issuing a refund, running a query. Strictness: highest. A bad parameter here doesn't get a chance to look wrong on a dashboard first; it becomes a side effect the instant the call is dispatched. See [Tool and Function Schemas](/learn/structured-outputs/tool-function-schemas) and [Function-Calling Extraction Implementation](/learn/structured-outputs/function-calling-extraction-implementation).

**Agent state passed between steps** is read by the next step of the same or another agent, which can compound a wrong or malformed value into an increasingly wrong plan several steps later. Strictness: high over the run's lifetime — a bad field early can quietly steer multiple downstream decisions before it's ever visible (see [What One Bad Field Costs Downstream](/learn/structured-outputs/cost-of-getting-it-wrong-intuition) for exactly how that compounding plays out). See [Thinking Then Structuring](/learn/structured-outputs/thinking-then-structuring) and [Discriminated Unions for Variants](/learn/structured-outputs/discriminated-unions-for-variants) for representing state that can take genuinely different shapes.

**Direct database writes** are read by whatever queries that table later, structurally checked in the best case by the DB's own column types and constraints — a type mismatch throws immediately, loudly. But a value that's the right type and the wrong content sails straight into a row and becomes "the record" until someone audits it. See [The Whole Game of Structured Output](/learn/structured-outputs/the-whole-game-of-structured-output) for this path walked end to end.

## A concrete example (shown)

Take one field, `amount: float`, through two of these homes. As part of a document-extraction report, a wrong amount skews a chart that a human might glance at and question. As a parameter to `send_refund(amount, account_id)` — a tool call — the exact same wrong value refunds the wrong sum of real money the moment the call fires, with nobody in the loop to catch it first. Same type, same shape, wildly different blast radius, because the consumer is different.

## Where it shows up

These four aren't mutually exclusive — a single agent often extracts data from a document (home 1), turns part of it into a tool-call parameter (home 2), carries the result forward as state for its next step (home 3), and eventually writes the reconciled record to a database (home 4). That chain is exactly the shape [The Whole Game of Structured Output](/learn/structured-outputs/the-whole-game-of-structured-output) walks through.

## Watch out for

- Applying the same validation strictness everywhere "because that's what we always do." A tool call that fires immediately needs synchronous, blocking validation; a report field awaiting human review can tolerate a queued repair pass instead. See [Thinking in a Reliability Budget](/learn/structured-outputs/reliability-budget-thinking).
- Treating agent state as low-risk because "it's internal, not user-facing" — internal is exactly where a compounding error hides longest before anyone looks.
- Relying on the database's own constraints as your only validation layer — they catch shape violations, not a plausible-but-wrong value that fits the schema perfectly.

## Where next

See a full pipeline through these homes in [The Whole Game of Structured Output](/learn/structured-outputs/the-whole-game-of-structured-output), and the tool-calling home in depth in [Tool and Function Schemas](/learn/structured-outputs/tool-function-schemas).

**Related:** [The Whole Game of Structured Output](/learn/structured-outputs/the-whole-game-of-structured-output) · [Tool and Function Schemas](/learn/structured-outputs/tool-function-schemas) · [Structured Extraction from Documents and Images](/learn/structured-outputs/structured-extraction-from-documents-and-images) · [What One Bad Field Costs Downstream](/learn/structured-outputs/cost-of-getting-it-wrong-intuition)
