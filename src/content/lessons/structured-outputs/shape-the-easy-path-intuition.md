---
title: "Make the Right Answer the Easy Path"
track: "structured-outputs"
status: live
summary: "The model follows the path of least token resistance, so a reliable schema makes the correct output the easiest one to generate."
duration: "6 min read"
---

You can't argue a river into flowing uphill. You can only reshape the channel so downhill and correct point the same way. Schema design for reliability is the same move, applied to a model instead of a river.

## The analogy

Water takes the path of least resistance — always the locally lowest point, never the one you'd prefer for scenic reasons. If you want water to end up somewhere specific, you don't lecture it; you carve the channel so the lowest point *is* the destination. Carve it wrong — a shallower fork off to the side — and water finds that fork too, not because it's disobedient but because the terrain gave it an easier way down.

A model generating structured output is carving through terrain you built: the schema. At each token it commits to whatever's locally easiest given everything written so far — as [next-token prediction](/learn/llm-foundations/next-token-prediction) describes, it's a probability distribution over what comes next, and the highest-probability continuation is the one that gets taken most of the time. An ambiguous enum value, a field name that suggests the wrong intent, a required field with no honest "unknown" option — each of these is a fork in the terrain that's *easier to fall into* than the correct path, independent of whether the model "understands" the task.

## Walking it through

Take a real fork: classifying support tickets into `urgent` or `not_urgent`, with no further guidance.

1. The model reads a ticket: *"Third time this has happened, starting to look elsewhere."* No SLA breach, no outage, no dollar figure — but real frustration.
2. Two channels are cut into this schema, and both look passable: read `urgent` as "this customer sounds upset" (surface-level, easiest to reach — the words are right there) or read it as "this breaches a defined business threshold" (requires inferring a threshold that was never stated).
3. Nothing in the schema tells the model which channel is the real one. It falls into whichever is locally easier to justify from the words on the page — usually the surface reading, because it requires the least inference.
4. Now widen the channel correctly: add an `evidence` field *before* `urgency`, described as "quote the specific business impact — an SLA, an outage, a stated deadline — not the customer's tone," followed by the enum. Generating `evidence` first forces the model down the path of looking for a concrete threshold, and by the time it reaches `urgency`, the easy continuation *is* the grounded one, because that's what's sitting in context.

Nothing here is "smarter" reasoning — it's the same mechanism, redirected by reshaping which path is shortest. [Naming and Ordering Fields](/learn/structured-outputs/naming-and-ordering-fields) is this exact move generalized, and [Evidence Before Label](/learn/structured-outputs/reasoning-field-ordering-example) measures the gap it produces.

## The wrong intuition to correct

The tempting wrong picture: the model already "knows" the right answer somewhere inside it, and a badly shaped schema is just an inconvenience it has to work around — so a sterner instruction ("Be precise! Use the correct threshold!") should fix it, since the knowledge is already there. If that were true, instructions alone would close the gap. They don't, reliably, because there's no separate box holding "the right answer" that instructions can address directly. There is only the next-token distribution, conditioned on everything actually written into context so far — the schema included. An instruction competes with the schema's shape for influence over that distribution; it doesn't override it. A schema that makes the wrong path locally easier will keep producing the wrong path some fraction of the time no matter how firmly you word the instructions sitting above it, because instructions are just more tokens in the same context, not a separate authority the model consults before deciding.

This is also why [thinking before structuring](/learn/structured-outputs/thinking-then-structuring) works as a technique and not just as a style choice — it's carving the same channel earlier, before the schema's own fields even start.

## When the analogy breaks

A river is deterministic — put the same terrain in front of it twice and it carves the same channel every time. A model is not: it samples from a probability distribution, and [temperature and top-p](/learn/llm-foundations/sampling-temperature-top-p) control how often it takes a path that isn't the single most likely one. Shape the schema perfectly and the model can still, on some fraction of runs, wander into a lower-probability fork — reliability design shrinks that fraction, it doesn't zero it out. That's the case for [validation and auto-repair](/learn/structured-outputs/validation-and-auto-repair) as a second layer: catch the runs that took the unlikely path anyway.

The analogy also breaks where there's no true "downhill" to carve toward — genuinely ambiguous judgment calls where two people would label the same input differently. No amount of schema shaping manufactures a correct answer the source data doesn't actually contain; at that point you're not fixing a fragile schema, you're looking at [structured output failure modes](/learn/structured-outputs/structured-output-failure-modes) that come from the task itself, not from how it's phrased.

**Related:** [Naming and Ordering Fields](/learn/structured-outputs/naming-and-ordering-fields), [Evidence Before Label](/learn/structured-outputs/reasoning-field-ordering-example), [Four Properties of a Reliable Schema](/learn/structured-outputs/what-makes-a-schema-reliable), [Next-Token Prediction](/learn/llm-foundations/next-token-prediction)
