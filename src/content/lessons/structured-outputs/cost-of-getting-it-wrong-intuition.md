---
title: "What One Bad Field Costs Downstream"
track: "structured-outputs"
status: live
summary: "A defect that trips the machine costs minutes; one that passes every check costs months, and that's the worse failure."
duration: "6 min read"
---

A malformed field moving through a system behaves like a manufacturing defect moving down an assembly line — and the defect that trips an alarm is not the expensive one.

## The analogy

Some defects halt the line immediately: a part doesn't fit, a sensor trips, everyone within earshot knows within seconds. Some defects pass every visual check, get boxed, and ship — surfacing only as a warranty claim months later, once it's already cost you customers and a recall. The second kind costs more, precisely because nobody caught it early enough to contain it.

## The mental simulation, run twice

**Trace A — loud crash.** An extraction returns `{"quantity": null}` for a line item, but your database column is `INTEGER NOT NULL`. Step 1: the batch insert job hits this row. Step 2: the database throws a constraint violation. Step 3: the job halts (or the row is rejected), an alert fires, someone looks at it today. Total cost: minutes to hours, contained to one row, and it announced itself the moment it happened.

**Trace B — silent poison.** An extraction returns `{"total": 1240.00}` for an invoice whose real total was `12400.00` — a decimal an OCR pass misread, and the model filled in the plausible-looking result. Step 1: the row inserts cleanly — right type, right shape, nothing a constraint would object to. Step 2: the number feeds a monthly revenue report. Step 3: the report is off by an order of magnitude on that one line, but the aggregate across thousands of invoices only shifts by a fraction of a percent — invisible at a glance. Step 4: three months later, someone reconciling against bank deposits finds an $11,160 discrepancy and has to manually trace it back through months of reports to one bad extraction. Total cost: person-days of work, discovered late, with the whole report's credibility now in question retroactively.

## The severity ladder

1. **Loud crash** (type or constraint violation) — cheapest. Fails fast, visibly, close to the source of the error.
2. **Loud rejection** (a schema or validation failure caught in code) — cheap, but only if you actually validate; see [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair). Caught before it ever reaches storage.
3. **Quiet drift** (a value that's plausible-wrong and passes every check) — expensive. No signal at the point of failure; discovered later, if ever, by an unrelated process.
4. **Silent poison at scale** (a systematic wrong value across a whole batch — a mismapped field, say) — most expensive. Not one bad row but a wrong assumption baked into thousands of rows, discovered only once the aggregate itself looks implausible.

## Why silent is worse

A loud failure costs you time proportional to fixing one specific thing. A silent failure costs you the time to first *realize anything is wrong at all* — which is unbounded — plus every decision made on the bad data in between. The severity ladder above isn't ranked by how bad the underlying value is; it's ranked by how long the value gets to do damage before someone notices.

## The wrong intuition, and the correction

The natural reading of "our pipeline has had zero crashes this month" is "our pipeline is reliable." **That's the wrong intuition.** A pipeline that never crashes but never checks semantics might simply mean every bad value found a way to look plausible enough to pass silently — an absence of loud failures is not evidence of correctness, it can be evidence you're not checking hard enough to find the failures that matter. See [Three Layers of Reliability](/learn/structured-outputs/what-reliable-structure-really-means): a crash-free pipeline has, at best, proven layers 1 and 2. It's told you nothing about layer 3. [Thinking in a Reliability Budget](/learn/structured-outputs/reliability-budget-thinking) covers measuring an actual invalid rate instead of celebrating an alert-free dashboard.

## When the analogy breaks

The assembly-line picture implies a defect is intrinsic to the part — but a structured-output value can be "correct" in one context and "poison" in another. A plausible average, filled in for a genuinely missing field, might be a perfectly fine display default and a silently corrupting input to a sum. The "defect," in that case, isn't a property of the value alone — it's a mismatch between the value and how it gets used downstream. That's part of why representing genuine absence honestly, rather than guessing a plausible value, matters — see [Representing Uncertainty in Schemas](/learn/structured-outputs/representing-uncertainty-in-schemas) and [Not-Found Sentinel Example](/learn/structured-outputs/not-found-sentinel-example).

**Related:** [Three Layers of Reliability](/learn/structured-outputs/what-reliable-structure-really-means) · [Thinking in a Reliability Budget](/learn/structured-outputs/reliability-budget-thinking) · [Structured Output Failure Modes](/learn/structured-outputs/structured-output-failure-modes) · [Representing Uncertainty in Schemas](/learn/structured-outputs/representing-uncertainty-in-schemas)
