---
title: "Parallel Tool Calls"
track: "tools-function-calling"
status: live
summary: "The wire-level shape of a batched tool-call turn, and what your harness owes the model before it will continue."
duration: "6 min read"
---

[Parallel Tool Calls](/learn/tools-function-calling/parallel-tool-calls) covers why batching independent calls into one turn is worth doing. This lesson is about the mechanics underneath it: what that turn actually contains, and the exact contract your harness has to honor before the model will pick back up.

## What it is

A sequential exchange is a series of *turns* — model responds, you run one tool, you reply, model responds again. A parallel exchange collapses several of those tool calls into a single turn: one assistant response containing more than one `tool_use` block, each with its own id, name, and arguments. The model isn't calling one tool and then immediately calling another in the same breath — it's emitting the whole batch as one message, before any of them have run.

```json
{
  "role": "assistant",
  "content": [
    {"type": "tool_use", "id": "call_1", "name": "get_weather", "input": {"city": "Tokyo"}},
    {"type": "tool_use", "id": "call_2", "name": "get_weather", "input": {"city": "Paris"}},
    {"type": "tool_use", "id": "call_3", "name": "get_weather", "input": {"city": "Lima"}}
  ]
}
```

Three `tool_use` blocks, one message. Compare that to three sequential turns, which would be three separate assistant messages, each preceded by a `tool_result` for the one before it. The batching is visible directly in the message structure — it's not something your harness infers from timing.

## The mental model

Think of a single-call turn as the model asking one question and waiting for the answer before it can ask the next. A parallel turn is the model asking three questions it already knows it needs, all at once, because none of the three depends on hearing an answer to any of the others first. The model isn't smarter in the parallel case — it's just recognized, from the shape of the task, that nothing about "weather in Paris" changes based on what "weather in Tokyo" comes back as.

## Why it works this way

The API doesn't have a separate "parallel mode" — it's the same tool-use response format either way. What changes is only how many `tool_use` blocks land in one `content` array. That's a deliberate design choice: it means your harness doesn't need to branch on whether it's handling "the sequential case" or "the parallel case" as different code paths. It needs to handle one thing correctly — *a turn can contain one or more tool calls* — and both single and batched calls fall out of that same handling.

## A concrete example (shown)

The contract your harness owes back is stricter than it looks. For the three-city batch above, you must return one `tool_result` per `tool_use`, each one referencing the matching `id`:

```json
{
  "role": "user",
  "content": [
    {"type": "tool_result", "tool_use_id": "call_1", "content": "{\"tempC\": 31, \"conditions\": \"clear\"}"},
    {"type": "tool_result", "tool_use_id": "call_2", "content": "{\"tempC\": 19, \"conditions\": \"rain\"}"},
    {"type": "tool_result", "tool_use_id": "call_3", "content": "{\"tempC\": 22, \"conditions\": \"cloudy\"}"}
  ]
}
```

Three things about this are non-negotiable:

- **Every `tool_use_id` from the batch needs a matching `tool_result`.** Send back two results for a three-call batch and most providers reject the turn outright — a partial reply isn't valid, because the model has no way to know which call you skipped versus which one you're still running.
- **The order in the reply doesn't have to match the order in the request**, but the `id` linkage does — matching by position instead of by id is a common integration bug once a batch has more than one or two calls in it, because it happens to work while ids and positions line up and breaks the first time they don't.
- **You send them all back together, in one reply message,** not as three separate messages trickling in — even if you ran them one after another internally.

## Where it shows up

Anywhere a task decomposes into several independent lookups: comparing prices across vendors, pulling metrics from three services for one dashboard, checking several accounts in one review pass. It's the natural batching whenever "gather N things, then reason once" fits better than "gather one thing, reason, gather the next."

## Watch out for

- **Treating a batch as a single unit of failure.** If one of three calls errors, the other two still executed successfully and the model still needs their results — see [Executing Parallel Calls Concurrently](/learn/tools-function-calling/executing-parallel-calls-async) for isolating failures per call instead of failing the whole batch.
- **Silently serializing a batch you could run concurrently.** Nothing about the wire format requires you to *execute* the three calls concurrently just because they arrived together — but running them one at a time when nothing stops you from running them together throws away the entire latency win this shape exists to provide.
- **Assuming every model batches the same way.** Not every provider or every prompt triggers multi-block turns the same way, and some require an explicit setting. Confirm your batching actually shows up as one turn with multiple blocks, not three quick sequential turns that only look parallel from a distance.

## Where next

[Executing Parallel Calls Concurrently](/learn/tools-function-calling/executing-parallel-calls-async) builds the harness side of this — actually running a batch concurrently with `asyncio.gather` and handling one failure among several. [Parallel or Sequential?](/learn/tools-function-calling/parallel-vs-sequential-decision) covers the judgment call of when a batch like this should happen at all.

**Related:** [Parallel Tool Calls](/learn/tools-function-calling/parallel-tool-calls), [Executing Parallel Calls Concurrently](/learn/tools-function-calling/executing-parallel-calls-async), [Sequential, Dependent Tool Use](/learn/tools-function-calling/sequential-multi-step-basics), [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-tool-errors-and-retries)
