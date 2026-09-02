---
title: "Orchestration Quiz"
track: "tools-function-calling"
status: live
summary: "Six questions on parallelizability, DAG ordering, streamed-JSON crashes, and picking model-driven vs code-driven control."
duration: "7 min read"
---

Six questions covering this module. Question 4 gives you a small dependency graph to order; question 5 gives you a crashing parser to diagnose.

## 1. A model is asked to check the weather in three named cities. It returns one assistant turn containing three separate `tool_use` blocks, each calling `get_weather` with a different city. What does this shape tell you about the three calls?

A. They must be executed strictly in the order the blocks appear
B. The model judged all three independent — none needs another's result — so they can be dispatched concurrently
C. This is invalid; a turn can only ever contain one tool call
D. The three calls are actually one call retried three times

<details><summary>Answer</summary>

**Correct: B.** As [Parallel Tool Calls](/learn/tools-function-calling/parallel-tool-calls-mechanics) lays out, a single turn with multiple `tool_use` blocks is exactly how a model signals a batch of calls it considers independent — none of the three `get_weather` calls needs a value only another one of them could produce.

- A mistakes the array's position for a required execution order — the wire format carries no such requirement, and dispatching all three concurrently is both valid and the point of the batched shape.
- B is correct.
- C is factually wrong about the format — multiple `tool_use` blocks in one turn is exactly what a parallel batch looks like.
- D misreads three genuinely different calls (different `city` arguments) as duplicates of one call.

</details>

## 2. `get_user(username)` returns a `user_id`, which `get_orders(user_id)` needs as an argument. Why can't these two calls be issued in the same parallel batch, no matter how the prompt is worded?

A. They technically could be batched; it's purely a stylistic choice not to
B. `get_orders` needs a `user_id` value that only exists once `get_user` has actually returned it — there's nothing to write into that argument before then
C. Different tool names can never appear in the same batch
D. Batching is disabled whenever more than one distinct tool is involved

<details><summary>Answer</summary>

**Correct: B.** [Sequential, Dependent Tool Use](/learn/tools-function-calling/sequential-multi-step-basics) frames this precisely: a dependent chain is a sequence of blanks, each filled by the call before it, and `user_id` is a blank `get_orders` cannot fill until `get_user` has returned — no phrasing changes that fact.

- A misses that this is a structural impossibility, not a style preference — the value genuinely doesn't exist yet.
- B is correct.
- C is false — many parallel batches mix distinct tool names; it's independence of data, not sameness of tool, that governs batching.
- D is false for the same reason — batching multiple distinct tools is completely normal for independent calls, per [Parallel or Sequential?](/learn/tools-function-calling/parallel-vs-sequential-decision).

</details>

## 3. Three independent tool calls each take about 2 seconds. Run with `asyncio.gather` instead of one at a time, roughly how long does the batch take, and why?

A. About 6 seconds — concurrency doesn't change total wall-clock time
B. About 2 seconds — `gather` starts all three immediately, so total time is roughly the slowest single call, not the sum of all three
C. About 0.67 seconds — concurrency divides the total time by the number of calls
D. It depends entirely on which programming language is used

<details><summary>Answer</summary>

**Correct: B.** [Executing Parallel Calls Concurrently](/learn/tools-function-calling/executing-parallel-calls-async) works this exact arithmetic: serial pays the sum of every call's latency (≈6s for three 2-second calls), while `gather` starts every coroutine immediately and returns once all are done — roughly the slowest one, ≈2s here.

- A describes the serial case, not what `gather` does.
- B is correct.
- C confuses "pay the max" with "divide the total" — concurrency doesn't shrink any individual call's own latency.
- D is a non-answer; the mechanism (concurrent dispatch vs. sequential waiting) is what determines the timing, not the language.

</details>

## 4. A DAG has node `A` with no dependencies, nodes `B` and `C` each depending only on `A`, and node `D` depending on both `B` and `C`. Using the layered topological-sort approach from this module, what are the layers, in order?

A. `[A, B, C, D]` — one node per layer, always
B. `[A]`, then `[B, C]`, then `[D]`
C. `[A, B, C]`, then `[D]`
D. `[D]`, then `[B, C]`, then `[A]` — dependents are scheduled before their dependencies

<details><summary>Answer</summary>

**Correct: B.** As built in [Building a DAG Executor](/learn/tools-function-calling/building-a-tool-dag-executor), a layer is the set of nodes whose dependencies are all already resolved: `A` has none, so it's alone in layer 1; `B` and `C` both become resolvable only once `A` finishes, and neither depends on the other, so they share layer 2; `D` needs both `B` and `C`, so it waits for layer 2 to fully resolve before forming layer 3 alone.

- A ignores that `B` and `C` genuinely share a layer — they have no dependency on each other, which is exactly what makes them a parallel pair rather than two separate sequential layers.
- B is correct.
- C incorrectly puts `B` and `C` in the same layer as `A`, before `A` has actually resolved — violating the dependency itself.
- D reverses the entire dependency direction; a DAG executor can never run a node before the nodes it depends on.

</details>

## 5. A streamed tool-call handler calls `json.loads()` on the accumulated argument buffer after every single delta, not just after the completion event, so it can update a UI as soon as possible. What's the most likely observed failure?

A. Nothing goes wrong; `json.loads` handles partial strings gracefully by design
B. The handler crashes with a JSON decode error on most deltas, because a partial buffer like `{"city": "Lis` is not valid JSON until the object is actually closed
C. The failure only appears with Anthropic's API, never with OpenAI's
D. This only fails if the tool has more than five arguments

<details><summary>Answer</summary>

**Correct: B.** [Streaming Partial Tool Calls](/learn/tools-function-calling/streaming-partial-tool-calls-concept) and [Parsing Streamed Argument Deltas](/learn/tools-function-calling/parsing-streamed-tool-call-deltas) are both built around exactly this: a strict parser run against a mid-stream buffer will fail on nearly every delta except the ones that happen to land on a coincidentally-complete-looking string, because the buffer genuinely isn't valid JSON until the final delta closes it.

- A is the core misconception — `json.loads` has no special partial-input mode; it either parses a complete, well-formed document or raises.
- B is correct.
- C is wrong — both providers stream arguments as incremental fragments; the failure mode is about when you parse, not which provider you're using.
- D is an arbitrary, unfounded threshold — the failure happens on a one-argument tool just as readily as a ten-argument one, any time you parse before the buffer is complete.

</details>

## 6. A workflow needs to guarantee that an entitlement check always runs before a support reply is drafted, for every single request, with no exceptions — this is a compliance requirement, not a preference. Which orchestration approach actually guarantees that, and why?

A. A model-driven loop with clear system-prompt instructions to always check entitlement first
B. A code-driven DAG (or fixed skeleton) where the entitlement-check node is a real edge the reply-drafting node depends on — the check either executes or the graph doesn't reach the next node
C. Neither approach can guarantee this; it's fundamentally a monitoring problem, not a design one
D. A model-driven loop, as long as you re-prompt it if it forgets

<details><summary>Answer</summary>

**Correct: B.** [Model-Driven vs. Code-Driven Orchestration](/learn/tools-function-calling/model-driven-vs-code-driven-orchestration) draws exactly this line: a model-driven loop's ordering is probabilistic no matter how well the prompt is written, while a DAG's edge is a structural guarantee — the dependent node cannot run until its dependency has, because the executor itself enforces that, not the model's judgment.

- A restates the compliance requirement as a prompting strategy — prompts shift typical behavior, they don't enforce it, which is precisely the gap a hard requirement can't tolerate.
- B is correct.
- C is too pessimistic — this is exactly the class of requirement [Chaining Calls Into a DAG](/learn/tools-function-calling/chaining-into-dag-workflows) and [Building a DAG Executor](/learn/tools-function-calling/building-a-tool-dag-executor) are built to satisfy structurally, not just monitor after the fact.
- D still relies on the model correctly recognizing it forgot and re-running the check, which is exactly the unreliability a hard compliance requirement can't accept.

</details>

**Related:** [Parallel or Sequential?](/learn/tools-function-calling/parallel-vs-sequential-decision), [Building a DAG Executor](/learn/tools-function-calling/building-a-tool-dag-executor), [Streaming Partial Tool Calls](/learn/tools-function-calling/streaming-partial-tool-calls-concept), [Model-Driven vs. Code-Driven Orchestration](/learn/tools-function-calling/model-driven-vs-code-driven-orchestration), [Orchestration Cheatsheet](/learn/tools-function-calling/orchestration-cheatsheet)
