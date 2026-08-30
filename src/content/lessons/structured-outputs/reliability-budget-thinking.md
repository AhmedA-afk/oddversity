---
title: "Thinking in a Reliability Budget"
track: "structured-outputs"
status: live
summary: "No pipeline hits 100% valid — decide the invalid rate you'll tolerate, then spend retries, repair, and review against it."
duration: "7 min read"
---

No structured-output pipeline is 100% valid, so the real design question isn't "how do we make it perfect" — it's "what invalid rate can we tolerate, and where do we spend the effort that closes the gap."

## What it is

A reliability budget is an acceptable-failure-rate decision made up front — for example, "no more than 0.5% of documents may reach the database unvalidated or wrong" — followed by treating retries, auto-repair, and human review as three different ways of spending a shared budget to stay under that number, each at a different cost per unit of reliability bought.

## The mental model

This is an SRE error budget applied to data correctness instead of uptime. You don't chase zero. You decide how much imperfection the business can actually absorb, then spend engineering and human effort where it buys the largest real reduction in invalid rate — not the largest reduction in theory.

## Why it works this way

Zero isn't attainable or economical, because model output is inherently probabilistic (see [Sampling: Temperature and Top-p](/learn/llm-foundations/sampling-temperature-top-p) and [Next-Token Prediction](/learn/llm-foundations/next-token-prediction)): some fraction of outputs will always miss on some axis. Chasing the last fraction of a percent through ever-more-elaborate prompting has sharply diminishing returns compared to catching the same failures downstream, cheaply, with retries or review.

- **Retries** are cheap per unit and catch transient issues — a truncated response, a one-off malformed field — with diminishing returns past two or three attempts.
- **Auto-repair** costs more per unit but targets a *known* bad field with a re-prompt that includes the actual validation error, which beats a blind retry for shape-error cases. See [Auto-Repair Strategies](/learn/structured-outputs/auto-repair-strategies) and [Repair Loop Implementation](/learn/structured-outputs/repair-loop-implementation).
- **Human review** is the most expensive lever per item, but it's the only one that works on cases you can't auto-fix — ambiguous source data, genuinely illegible input — and it's your only real safety net for semantic (layer 3) errors. See [Extraction Confidence and Review Routing](/learn/structured-outputs/extraction-confidence-and-review-routing).

## A concrete example (shown)

Take a 10,000-documents-per-day extraction job. Suppose, illustratively, schema-constrained extraction validates cleanly on the first pass for 97% of documents — that's 300 invalid documents a day. Say retries fix half of those on a second attempt: 150 fixed, 150 remain. A repair loop, re-prompted with the specific validation error, fixes 100 of those 150: 50 remain. Those final 50 a day go to human review, at roughly 3 minutes each — 150 minutes, about 2.5 hours of review time a day. That's a concrete, staffable number, not a vague sense that "some documents need review."

Now the budget decision becomes explicit: if the target is 0.5% reaching human review (50/day), this pipeline is already there. If the target is tighter — say 0.1%, or 10/day — you now know precisely how many percentage points of first-pass validity you need to claw back with schema or prompt improvements before it makes sense to add more review capacity, instead of guessing at either lever.

## Where it shows up

Batch document extraction, high-volume tool-calling agents, and any pipeline with a "route to human" fallback threshold — the threshold itself is a reliability-budget decision, whether or not anyone wrote it down as one.

## Watch out for

- Setting a target invalid rate before measuring the current one. You can't tell if a fix helped without a baseline — see [Building an Extraction Eval Harness](/learn/structured-outputs/building-an-extraction-eval-harness) and [Monitoring Structured Output in Production](/learn/structured-outputs/monitoring-structured-output-in-production).
- Spending the whole budget on retries when failures are systematic. A field the model consistently misreads will fail the same way on retry three as it did on retry one — that needs a schema or prompt fix, not more attempts. See [Mechanism Selection Mistakes](/learn/structured-outputs/mechanism-selection-mistakes).
- Treating human review as free because "someone's glancing at reports anyway." Routed volume has a real, budgetable time cost, as the arithmetic above makes concrete.

## Where next

See the repair loop this budget funds in [The Whole Game of Structured Output](/learn/structured-outputs/the-whole-game-of-structured-output), and what a bad field costs when the budget doesn't catch it in [What One Bad Field Costs Downstream](/learn/structured-outputs/cost-of-getting-it-wrong-intuition).

**Related:** [What One Bad Field Costs Downstream](/learn/structured-outputs/cost-of-getting-it-wrong-intuition) · [Auto-Repair Strategies](/learn/structured-outputs/auto-repair-strategies) · [The Whole Game of Structured Output](/learn/structured-outputs/the-whole-game-of-structured-output) · [Foundations Checkpoint](/learn/structured-outputs/foundations-quiz)
