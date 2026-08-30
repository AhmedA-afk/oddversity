---
title: "Reason Freely, Then Emit Strictly"
track: "structured-outputs"
status: live
summary: "One multi-step word problem, run two ways — a single constrained call and a reason-then-structure split — with both stages' actual output shown."
duration: "7 min read"
---

Same problem, two architectures. One of them gives the arithmetic somewhere to happen before it's asked for an answer.

## The setup

The problem: *"A bakery bakes 144 muffins and packs them into boxes of 8. They sell 9 boxes in the morning and give away 2 boxes to a local shelter. How many muffins are left?"*

Three dependent steps: total boxes (`144 / 8`), boxes gone (`9 + 2`), muffins remaining (`(total - gone) × 8`). Miss or misplace any one step and the final number is wrong even though the response can still be perfectly schema-valid.

Target schema for the final answer:

```json
{
  "type": "object",
  "properties": {
    "steps": {"type": "array", "items": {"type": "string"}},
    "answer": {"type": "integer"}
  },
  "required": ["steps", "answer"],
  "additionalProperties": false
}
```

## Step by step

### Step 1 — the single-shot constrained call

Force this schema from the first token, in one call:

```python
response = client.messages.create(
    model="claude-opus-5",
    max_tokens=512,
    tools=[{
        "name": "record_solution",
        "strict": True,
        "input_schema": {
            "type": "object",
            "properties": {
                "steps": {"type": "array", "items": {"type": "string"}},
                "answer": {"type": "integer"},
            },
            "required": ["steps", "answer"],
            "additionalProperties": False,
        },
    }],
    tool_choice={"type": "tool", "name": "record_solution"},
    messages=[{"role": "user", "content": (
        "A bakery bakes 144 muffins and packs them into boxes of 8. "
        "They sell 9 boxes in the morning and give away 2 boxes to a local shelter. "
        "How many muffins are left?"
    )}],
)
```

> **Why this step?** This is the naive, obviously-reasonable-looking version: one call, one schema, `steps` right there to "show the work." But `steps` here is generated *as part of the same constrained pass* as `answer` — nothing stops the model from filling in tidy-looking step text that doesn't actually match the arithmetic that produced the final number, because the two fields aren't causally connected the way a real scratchpad-then-transcription flow would connect them.

A plausible failure from this call:

```json
{
  "steps": [
    "144 / 8 = 18 boxes total",
    "9 + 2 = 11 boxes gone",
    "18 - 11 = 7 boxes left, 7 x 8 = 63"
  ],
  "answer": 63
}
```

This is fully schema-valid — right types, right keys, an array of strings and an integer. It's also arithmetically wrong: `7 × 8 = 56`, not `63`. **This is one illustrative failure trace, not a measured error rate** — the point is that the schema's validity check has no way to catch it, because `63` is just as valid an integer as `56` is.

### Step 2 — the unconstrained reasoning pass

Now split it. First call, no schema, no tools at all:

```python
reasoning_response = client.messages.create(
    model="claude-opus-5",
    max_tokens=512,
    messages=[{"role": "user", "content": (
        "A bakery bakes 144 muffins and packs them into boxes of 8. "
        "They sell 9 boxes in the morning and give away 2 boxes to a local shelter. "
        "How many muffins are left? Work through this step by step in plain prose."
    )}],
)
reasoning_text = next(b.text for b in reasoning_response.content if b.type == "text")
```

> **Why this step?** No masking pressure at all here — the model can lay out arithmetic, double-check a step, restate a number before committing to it, exactly the way it would in ordinary chain-of-thought. Nothing has to fit inside a field boundary yet.

Representative output:

```
First, find the total number of boxes: 144 muffins / 8 per box = 18 boxes.
Next, find how many boxes are gone: 9 sold + 2 given away = 11 boxes.
That leaves 18 - 11 = 7 boxes remaining.
Since each box holds 8 muffins, 7 x 8 = 56 muffins are left.
```

### Step 3 — the constrained structuring pass

Feed that finished reasoning into a second, fully constrained call:

```python
structuring_response = client.messages.create(
    model="claude-opus-5",
    max_tokens=256,
    tools=[{
        "name": "record_solution",
        "strict": True,
        "input_schema": {
            "type": "object",
            "properties": {
                "steps": {"type": "array", "items": {"type": "string"}},
                "answer": {"type": "integer"},
            },
            "required": ["steps", "answer"],
            "additionalProperties": False,
        },
    }],
    tool_choice={"type": "tool", "name": "record_solution"},
    messages=[{"role": "user", "content": (
        f"Here is worked reasoning for a word problem:\n{reasoning_text}\n\n"
        "Break it into a list of steps and record the final numeric answer."
    )}],
)
```

> **Why this step?** This pass isn't deriving the answer — the arithmetic is already settled, visible text sitting in its input. Its only job is transcription: split the reasoning into a `steps` array and copy the final number into `answer`. That's a much narrower, much more mechanical task than "reason and format simultaneously," and it's exactly the kind of job constrained decoding is reliable at.

Result:

```json
{
  "steps": [
    "144 / 8 = 18 boxes total",
    "9 + 2 = 11 boxes gone",
    "18 - 11 = 7 boxes remaining",
    "7 x 8 = 56 muffins left"
  ],
  "answer": 56
}
```

Correct, and — notice — the `steps` array here actually *matches* the arithmetic that produced `answer`, because both were transcribed from the same settled source, not generated independently under the same masking pressure.

## Where it breaks (+ fix)

The split isn't free of failure modes of its own. If the structuring prompt in Step 3 doesn't clearly hand over the *finished* reasoning — say, it just repeats the original word problem alongside the reasoning text — the model may start reasoning again from scratch under constraint pressure, silently reintroducing Step 1's failure mode inside what was supposed to be a pure transcription pass. The fix is to make the second prompt unambiguous about the job: "here is the finished reasoning, extract from it" reads very differently to the model than "here is context, solve this."

A second real cost: this is two calls instead of one, with the latency and token spend of both. For a problem this simple, that overhead may not be worth it — this pattern earns its cost on tasks where the single-shot failure mode is a real, recurring risk, not a hypothetical one. See [Thinking Then Structuring](/learn/structured-outputs/thinking-then-structuring) for when to skip the split entirely.

## Takeaways

- A `steps` field inside the same constrained call as `answer` looks like a scratchpad but doesn't behave like one — nothing forces the two fields to be causally connected.
- Splitting into an unconstrained reasoning call and a constrained transcription call makes the connection real: the second call's job is copying, not deriving.
- The two-call cost is real (latency, tokens) and worth weighing per task — measure on your own eval before deciding it's worth paying everywhere, per [Evaluating Structured Output Quality](/learn/structured-outputs/evaluating-structured-output-quality).

**Related:** [Separating Reasoning from Structuring](/learn/structured-outputs/thinking-then-structuring-pattern), [When Tight Constraints Hurt Reasoning](/learn/structured-outputs/constraints-and-model-quality-interaction), [Thinking Then Structuring](/learn/structured-outputs/thinking-then-structuring), [Evaluating Structured Output Quality](/learn/structured-outputs/evaluating-structured-output-quality)
