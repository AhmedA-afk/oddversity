---
title: "Separating Reasoning from Structuring"
track: "structured-outputs"
status: live
summary: "Splitting a task into an unconstrained reasoning pass and a constrained structuring pass protects quality on one side and validity on the other."
duration: "6 min read"
---

*This extends [Thinking Then Structuring](/learn/structured-outputs/thinking-then-structuring). That lesson introduces the scratchpad-then-schema idea; this one is about the architecture — where the split actually happens, and why it protects two different things at once.*

The two-pass pattern isn't just "let it think first." It's a trade where each side of the split is protecting something the other side would otherwise put at risk.

## What it is

Thinking-then-structuring is any architecture that separates a task into two distinct phases with two distinct decoding regimes: an unconstrained phase where the model reasons in free text, and a constrained phase where it commits to a schema. The split can happen three ways in practice — a trailing field inside one schema (the `{reasoning, answer}` shape from [When Tight Constraints Hurt Reasoning](/learn/structured-outputs/constraints-and-model-quality-interaction)), a native reasoning channel like Claude's extended thinking followed by a tool call in the same request, or two fully separate API calls where the first response's text becomes the second call's input. All three draw the same line — reasoning happens with no masking pressure, structuring happens with full masking pressure — they just draw it at different granularities.

## The mental model

Think of it as two workers with different jobs and different tools. The first worker's only job is to get the *content* right — they get a blank page, no form to fill out, free to cross things out and reconsider. The second worker's only job is to get the *shape* right — they take the first worker's finished notes and transcribe them onto a rigid form, one box at a time, unable to write outside the lines. Neither worker is doing the other's job, and that's the point: asking one worker to reason *and* stay inside a form at the same time is asking them to do both jobs badly at once.

## Why it works this way — protecting both sides

The split isn't only about protecting reasoning quality, though that's the half [the deep-dive on constraint pressure](/learn/structured-outputs/constraints-and-model-quality-interaction) focuses on. It protects two different failure modes simultaneously:

- **On the reasoning side:** free text has no masking pressure at all, so the model can explore, backtrack ("wait, that's not right, let me redo this"), and lay out intermediate work exactly the way [chain-of-thought](/learn/prompt-engineering/what-prompt-engineering-is) benefits from — none of which fits comfortably inside a schema's field boundaries.
- **On the structuring side:** a fully constrained pass, working from reasoning that's already settled, has an easier job than a pass that has to reason *and* stay valid at the same time — it's just transcribing a conclusion into fields, which is exactly the kind of narrow, mechanical task constrained decoding is best at. This also means the structuring pass is shorter and cheaper, since it isn't spending tokens re-deriving the answer.

Put together: the reasoning pass is unconstrained because reasoning needs room, and the structuring pass is fully constrained because transcription needs a guarantee. Neither phase is doing the job the other phase is better suited for.

## A concrete example (shown)

Two-call version, using Claude's tool use for the structuring half:

```python
# Pass 1 — unconstrained reasoning, no tools, no schema
reasoning_response = client.messages.create(
    model="claude-opus-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": (
        "A store has 84 apples, sells 3 boxes of 12, then gets 5 dozen more. "
        "Work through this step by step in plain prose."
    )}],
)
reasoning_text = next(b.text for b in reasoning_response.content if b.type == "text")

# Pass 2 — constrained structuring, fed the finished reasoning
structuring_response = client.messages.create(
    model="claude-opus-5",
    max_tokens=256,
    tools=[{
        "name": "record_answer",
        "strict": True,
        "input_schema": {
            "type": "object",
            "properties": {"answer": {"type": "integer"}},
            "required": ["answer"],
            "additionalProperties": False,
        },
    }],
    tool_choice={"type": "tool", "name": "record_answer"},
    messages=[{"role": "user", "content": (
        f"Here is worked reasoning:\n{reasoning_text}\n\n"
        "Record the final numeric answer."
    )}],
)
```

The first call never sees a schema — it's free to reason however it needs to. The second call never has to reason — the arithmetic is already settled text sitting in its context, so the constrained pass is genuinely just transcription, the easiest possible job for a masked decode.

## Where it shows up

- Multi-step math or logic tasks where an early arithmetic error would otherwise ride silently into a schema-valid wrong answer
- Ambiguous classification where the model needs to weigh evidence before committing to a category
- Any pipeline where a human reviewer benefits from seeing *why* an answer was reached, not just the answer itself — the reasoning pass output is a legible audit trail for free

## Watch out for

- **Splitting on tasks with no real reasoning to protect.** A simple field extraction gains nothing from a reasoning pass and just adds latency and cost — reserve the split for tasks with genuine multi-step decision-making, per [Thinking Then Structuring](/learn/structured-outputs/thinking-then-structuring)'s guidance on when to skip it.
- **Letting the structuring pass re-derive the answer instead of transcribing it.** If the second prompt doesn't clearly hand over the finished reasoning, the model may reason again under constraint pressure — reintroducing the exact problem the split was meant to avoid.
- **Forgetting the reasoning pass still needs a parser.** Unconstrained text has no shape guarantee at all; you're trading "will the final object be well-formed" (solved) for "can I reliably locate the conclusion in free text to hand to pass two" (still your job).

## Where next

For a full input-to-output trace of this pattern on a multi-step problem, including both stages' raw output, see [Reason Freely, Then Emit Strictly](/learn/structured-outputs/reason-then-emit-worked-example).

**Related:** [Thinking Then Structuring](/learn/structured-outputs/thinking-then-structuring), [When Tight Constraints Hurt Reasoning](/learn/structured-outputs/constraints-and-model-quality-interaction), [Reason Freely, Then Emit Strictly](/learn/structured-outputs/reason-then-emit-worked-example), [Tool / Function Schemas](/learn/structured-outputs/tool-function-schemas)
