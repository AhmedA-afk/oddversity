---
title: "Orchestration Mistakes"
track: "tools-function-calling"
status: live
summary: "Five traps in multi-step tool orchestration, each with the concrete bug it produces and the fix, from fake ordering to ballooning context."
duration: "8 min read"
---

None of these mistakes throw an error at build time. Every one of them ships fine, passes a quick manual test, and fails on a case nobody happened to try before the demo.

### The mistake: assuming a fixed ordering the model didn't promise

**Why it's wrong:** a system prompt that says "first look up the user, then the order" reads like a guarantee but isn't one — it's a strong hint the model usually follows, not an enforced sequence. [Sequential, Dependent Tool Use](/learn/tools-function-calling/sequential-multi-step-basics) draws the real line: order is only guaranteed when a *data* dependency makes the second call impossible to write before the first returns, not when your prose merely lists steps in an order.

**Symptom:** a downstream call occasionally fires with a stale or hallucinated argument, or a step gets skipped entirely — and it's intermittent, correlated with prompt phrasing or model version rather than any obvious input, which makes it painful to reproduce on demand.

**Fix:** if an order genuinely can't vary, encode it in code — a real data dependency (the model literally cannot write the call without the prior result) or a DAG edge (see [Chaining Calls Into a DAG](/learn/tools-function-calling/chaining-into-dag-workflows)) — rather than trusting prose to hold under every phrasing of every request.

### The mistake: parsing streamed JSON before it's complete

**Why it's wrong:** a partial buffer of streamed tool-call arguments is not valid JSON until the provider's explicit end-of-block signal fires. A permissive repair parser can make an incomplete buffer *look* successfully parsed — closing an unterminated string or object — while actually returning a value that was never the real, final call.

**Symptom:** a tool executes against a truncated argument — a file write with a body cut mid-sentence, a search with a city name missing its last two characters — and the failure looks like a data bug in the tool itself, not in how its input was assembled.

**Fix:** two parsers, two purposes, per [Streaming Partial Tool Calls](/learn/tools-function-calling/streaming-partial-tool-calls-concept): a lenient one for display only, and a strict one that runs exactly once, on the provider's explicit completion event, whose output is the only thing ever allowed to reach `dispatch()`. See the accumulator built in [Parsing Streamed Argument Deltas](/learn/tools-function-calling/parsing-streamed-tool-call-deltas).

### The mistake: serializing calls that could run in parallel

**Why it's wrong:** issuing three independent lookups one turn at a time — wait for the first, then ask for the second, then the third — pays the sum of every call's latency instead of roughly the slowest one, for zero correctness benefit, because none of the three ever needed another's result.

**Symptom:** an agent "feels slow" specifically on tasks that decompose into several unrelated lookups, in a way that scales roughly linearly with the number of independent things it's checking — three cities checked one at a time is visibly worse than the same three checked at once, and it gets worse every time you add a fourth.

**Fix:** apply the independence test from [Parallel or Sequential?](/learn/tools-function-calling/parallel-vs-sequential-decision) — often the fix is on the prompt side, since a system prompt that narrates steps as a numbered list can push a model toward issuing them one at a time even when nothing about the data requires it. Once the model does batch them, dispatch the batch concurrently — see [Executing Parallel Calls Concurrently](/learn/tools-function-calling/executing-parallel-calls-async) — rather than looping over a parallel batch and awaiting each call in turn, which silently throws away the win even after the model already batched correctly.

### The mistake: letting context balloon as steps accumulate

**Why it's wrong:** every tool call, every full tool result, and every intermediate assistant message from a long sequential chain stays in the message list by default — nothing trims it automatically. A ten-step debugging loop that reads five files along the way keeps all five files' full contents in context for every subsequent step, whether or not they're still relevant.

**Symptom:** later steps in a long chain get noticeably worse — the model references stale information from step 2 at step 9, or starts ignoring instructions that were clear in the system prompt but are now buried under thousands of tokens of accumulated tool output; costs and latency climb per step even though each individual call is doing the same amount of real work.

**Fix:** don't return a tool's entire raw payload into the running message history by default — trim, summarize, or reference large results instead of inlining them wholesale (see [Returning Tool Results to the Model](/learn/tools-function-calling/returning-tool-results-to-the-model)), and for a workflow whose shape is fixed, prefer a DAG that only exposes each node the slice of state it actually needs — see [Chaining Calls Into a DAG](/learn/tools-function-calling/chaining-into-dag-workflows) — over a model-driven loop that necessarily accumulates everything as it goes.

### The mistake: no iteration cap on a dependent chain

**Why it's wrong:** a sequential loop with no hard ceiling on the number of tool calls has no natural stopping point if a step's result is ambiguous enough that the model keeps re-querying, or a bug causes a tool to return something that reads as "not done yet" indefinitely.

**Symptom:** an occasional run burns far more tokens and latency than a typical one, with no error — it just keeps calling tools until something external (a timeout, a rate limit) cuts it off, and the logs show the same tool called many times in a row with only slightly different arguments.

**Fix:** cap the number of loop iterations as a hard ceiling, and treat hitting the cap as a real, surfaced error — not a silent stop that returns whatever partial answer the model had when it ran out of turns.

## Pre-flight checklist

- Any ordering your code relies on is enforced by an actual data dependency or a DAG edge — never by prose alone.
- Streamed tool-call arguments are dispatched only from the strict, post-completion parse — never from a preview buffer, however successfully a lenient parser handles it.
- Independent calls are checked against the dependency test before assuming they must run sequentially, and a parallel batch is actually dispatched concurrently once the model produces one.
- Large tool results are trimmed, summarized, or referenced rather than inlined wholesale into a growing message history.
- Every sequential loop has a hard iteration cap that surfaces as an error on exhaustion, not a silent stop.

**Related:** [Sequential, Dependent Tool Use](/learn/tools-function-calling/sequential-multi-step-basics), [Parallel or Sequential?](/learn/tools-function-calling/parallel-vs-sequential-decision), [Streaming Partial Tool Calls](/learn/tools-function-calling/streaming-partial-tool-calls-concept), [Returning Tool Results to the Model](/learn/tools-function-calling/returning-tool-results-to-the-model), [Chaining Calls Into a DAG](/learn/tools-function-calling/chaining-into-dag-workflows)
