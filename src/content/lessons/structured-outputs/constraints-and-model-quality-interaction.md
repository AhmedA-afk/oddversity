---
title: "When Tight Constraints Hurt Reasoning"
track: "structured-outputs"
status: live
summary: "Forcing an answer token before there's room to reason can make a schema-valid response wrong — and the fix costs one extra field, not a second call."
duration: "8 min read"
---

*Optional depth: this lesson derives why a specific schema shape can lower accuracy on reasoning tasks, not just describe that it can. If you just need the practical takeaway, it's in the last section.*

A schema being valid and an answer being correct are independent properties, and the gap between them gets wider, not narrower, the harder the task is.

## The setup: what a schema-first field actually asks of the model

Consider a schema for a math word problem that looks reasonable on paper:

```json
{"type": "object", "properties": {"answer": {"type": "integer"}}, "required": ["answer"]}
```

And a problem: *"A store has 84 apples. It sells 3 boxes of 12 apples each in the morning, then receives a delivery of 5 dozen more. How many apples does it have now?"*

With this schema, the very first content-bearing token the model emits has to be the start of the final numeric answer. There is no field before `answer` where intermediate arithmetic can appear. Whatever computation is needed — `84 - 36 = 48`, then `48 + 60 = 108` — has to happen entirely inside the model's internal, hidden computation during the single forward pass that produces that first digit.

## Why that's a narrower computation than it looks

This is the mechanical crux, not just an intuition: a transformer's computation *per generated token* is bounded by the depth of the network — a fixed number of layers, run once. When a model reasons in visible text, each token it writes becomes part of the input to the *next* forward pass. That's not decoration — it's more computation, spread across more steps, with intermediate results literally sitting in the context window where subsequent steps can attend to them. Chain-of-thought prompting works because it turns "solve this in one shot" into "solve this across as many shots as you need, each one seeing the last one's output."

A schema that forces `{"answer": ...}` as the very first thing generated removes that scaffolding. The model still *might* get it right — for easy arithmetic, hidden-state computation is plenty. But as the number of steps in the problem grows, the odds that all of the intermediate arithmetic completes correctly inside one hidden forward pass, with no external scratchpad to check against, go down. Errors that a visible chain of reasoning would have caught mid-stream — a sign flip, a dropped term — have no visible surface to be caught on before the answer commits.

## Making the effect concrete

Take the apples problem above and imagine running it many times under two schemas: the bare `{"answer": int}` above, and a version with a reasoning field first:

```json
{
  "type": "object",
  "properties": {
    "reasoning": {"type": "string"},
    "answer": {"type": "integer"}
  },
  "required": ["reasoning", "answer"]
}
```

Under the second schema, the tokens for `"reasoning"` are generated *before* the tokens for `"answer"` — so by the time the model commits to the answer field, the arithmetic (`84 - 36 = 48`, `48 + 60 = 108`) already exists as visible, attended-to context, the same way it would in an unconstrained chain-of-thought response.

To make the shape of the effect concrete: suppose across a batch of problems at this difficulty, the bare-answer schema gets some correct and some wrong because a step of hidden arithmetic silently slipped, while the reasoning-first schema gets most of the same problems right because the arithmetic is checkable, token by token, before the answer field is ever reached. **These are illustrative counts to show the mechanism, not a measured benchmark** — the actual gap on any real model and task depends on problem difficulty, model size, and how many reasoning steps are genuinely required. The direction of the effect — reasoning-first schemas doing better on multi-step tasks — is the mechanism-backed claim; a specific percentage is not something to assert without running your own eval on your own model and task, which is exactly the discipline in [Evaluating Structured Output Quality](/learn/structured-outputs/evaluating-structured-output-quality).

## Field order is the load-bearing detail

This only works if `reasoning` is ordered *before* `answer` in the schema and the model actually generates fields in that order. A `{"answer": int, "reasoning": string}` schema with the fields flipped gets none of the benefit — the answer is still the first thing committed, and a trailing `reasoning` field becomes post-hoc narration of a decision already made, not a scratchpad that informed it. Field order interacting with generation order is covered on its own in the schema-design side of this track.

## The mitigation, and its limit

Adding a `reasoning` (or `thinking`, or `scratchpad`) field before the answer field, inside the *same* schema and the *same* call, recovers most of the benefit of visible reasoning at the cost of one extra field and the tokens it takes to fill. This is the cheapest fix available and it's worth defaulting to on anything with real multi-step logic.

It has a limit, though: the reasoning field is still schema-constrained text, generated under the same masking pressure as everything else in the object (correct JSON string escaping, no unescaped quotes, staying inside the field). For genuinely open-ended reasoning — branching exploration, "let me reconsider" — even a same-schema reasoning field can cramp the model more than a fully unconstrained pass would. That's the case for going further: separating reasoning into its own unconstrained pass entirely, covered next in [Separating Reasoning from Structuring](/learn/structured-outputs/thinking-then-structuring-pattern), with a full worked comparison in [Reason Freely, Then Emit Strictly](/learn/structured-outputs/reason-then-emit-worked-example).

## The takeaway

Constrained decoding guarantees shape unconditionally — that guarantee never weakens. What can weaken is *correctness*, specifically on tasks where the answer depends on work that needs to happen somewhere visible before it's asked for. The fix is not "constrain less" — it's "give the reasoning a place to happen before the constraint closes around the answer."

**Related:** [What JSON Mode Does and Doesn't Promise](/learn/structured-outputs/json-mode-what-it-guarantees), [The Cost of Constraints](/learn/structured-outputs/what-constraints-cost-you), [Separating Reasoning from Structuring](/learn/structured-outputs/thinking-then-structuring-pattern), [Reason Freely, Then Emit Strictly](/learn/structured-outputs/reason-then-emit-worked-example), [Thinking Then Structuring](/learn/structured-outputs/thinking-then-structuring)
