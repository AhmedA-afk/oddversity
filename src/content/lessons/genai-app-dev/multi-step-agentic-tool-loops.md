---
title: "Multi-Step Tool Loops and Where They Go Wrong"
track: "genai-app-dev"
status: live
summary: "The deferred rigor on longer agent loops — state accumulation, loop detection, cost budgets, and precisely why a fixed iteration cap isn't enough."
duration: "9 min read"
---

*This is optional depth. [Implementing the Tool-Call Loop](/learn/genai-app-dev/implementing-a-tool-call-loop) is enough to ship a working tool loop; this lesson is for when that loop needs to run longer, autonomously, without a human watching every round.*

A tool loop that runs two or three iterations per request is easy to reason about — you can eyeball the transcript. Past roughly five or six iterations, a new class of failure appears that a simple iteration cap doesn't catch: the loop *converges on the cap* without converging on an answer, spending every iteration doing something plausible-looking that never actually finishes the task.

## Why state accumulation is the real constraint, not iteration count

`MAX_ITERATIONS` bounds the number of round-trips, but it says nothing about what's accumulating inside `messages` on each one. Every iteration appends an assistant turn (the tool call) and a user turn (the tool result) to the array fed into the next call. If a tool result averages 300 tokens, eight iterations add roughly:

```text
8 iterations x (tool call + tool result) ≈ 8 x (50 + 300) = 2,800 tokens
```

on top of whatever the conversation already carried in. This is precisely the [context budget](/learn/genai-app-dev/context-limits-and-trimming) arithmetic from earlier in this module, now compounding *within a single request* instead of across a saved conversation's lifetime. A loop that trims history between ordinary chat turns but doesn't apply the same `fitToBudget()` logic inside its own iterations will eventually feed the model a context so bloated with old tool results that the model's attention to the actual goal degrades — and degraded attention inside a tool loop doesn't look like an error message, it looks like the model re-asking a question it already has the answer to, three iterations in.

## Loop detection: catching repetition the cap alone won't

A model stuck in a bad pattern — retrying the same tool call with the same arguments because it misread a valid result as a failure, say — will happily do so right up until `MAX_ITERATIONS` fires. The cap stops it, but only after burning every iteration. Detecting the repetition earlier means fingerprinting each proposed tool call and checking it against recent history before executing it again:

```typescript
function toolCallFingerprint(name: string, input: object): string {
  return `${name}:${JSON.stringify(sortKeys(input))}`;
}

function detectRepeat(history: string[], fingerprint: string, threshold = 2): boolean {
  const recentMatches = history.filter((f) => f === fingerprint).length;
  return recentMatches >= threshold;
}
```

The tradeoff here is real, not cosmetic: a threshold of 1 (stop on the first repeat) will false-positive on legitimate re-checks — a model polling a job status tool while waiting for it to finish is *supposed* to call the same tool with the same arguments repeatedly. A threshold of 2 or 3 tolerates that pattern while still catching a loop that's actually stuck. Where that threshold should sit is task-specific: polling-style tools need a higher tolerance than one-shot lookups, so a single global threshold across all tools in a loop under-serves one category or the other. The more precise fix is a per-tool threshold, keyed by whether the tool is inherently idempotent-and-pollable or not.

## Cost and step budgets are two different ceilings

An iteration cap bounds *steps*; it does not bound *spend*, and the two diverge whenever tool results vary widely in size. Eight iterations that each return a 50-token result cost nothing like eight iterations that each return a 5,000-token document. Track both, independently:

```typescript
type LoopBudget = { maxIterations: number; maxTokens: number };

function withinBudget(state: { iterations: number; tokensUsed: number }, budget: LoopBudget): boolean {
  return state.iterations < budget.maxIterations && state.tokensUsed < budget.maxTokens;
}
```

The reason this needs to be a conjunction of two independent checks, not one derived from the other, is that they fail for different underlying reasons: hitting `maxIterations` usually means the task genuinely needs more steps than expected (a legitimate case to reconsider the cap), while hitting `maxTokens` usually means individual steps are returning more data than the loop should be feeding whole into every subsequent call — a signal to summarize or paginate a tool's results rather than raise the cap.

## Deciding when to stop is a policy question, not just a mechanism

`runToolLoop()` from the implementation lesson stops when the model returns text with no further tool calls — that's a *sufficient* stopping signal, but for a longer autonomous sequence it's not the only one you want. Three distinct stopping conditions, each catching something the others miss:

1. **Natural completion** — the model returns a final answer with no pending tool calls. The common case, and the only one the basic loop checks for.
2. **Budget exhaustion** — iteration or token ceiling reached, as above. A hard stop regardless of what the model was doing.
3. **Confidence-gated stop** — for a loop making decisions with real consequences (see [Tool Calls Are Requests for Authority](/learn/genai-app-dev/tool-calling-as-authority)), require the model to explicitly signal completion confidence via a dedicated `finish` tool rather than inferring completion from the *absence* of a tool call, since a model can also stop calling tools because it's confused, not because it's done.

```typescript
const finishTool = {
  name: "finish",
  description: "Call this when the task is complete or cannot proceed further.",
  input_schema: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["complete", "blocked"] },
      summary: { type: "string" },
    },
    required: ["status", "summary"],
  },
};
```

Requiring an explicit `finish` call turns "the model stopped" into "the model reported *why* it stopped" — a `blocked` status routes cleanly to a human, where a silent stop on confusion would otherwise look identical to success in your logs.

## A runaway loop, traced

Concretely, here's the failure this section exists to prevent. A research agent is asked to "find the current status of ticket #8842." The ticket-lookup tool returns `{ "status": "pending_customer_response", "lastUpdated": "3 days ago" }`. The model, uncertain whether "pending" is a final state, calls the same lookup again with slightly reworded reasoning in between, gets the identical result, and repeats — eight times, until `MAX_ITERATIONS` fires and the loop throws with no useful answer, having spent eight calls' worth of tokens establishing nothing.

The guards from this lesson catch it at different points: fingerprint-based repeat detection flags the identical tool call at the third repetition, well before the iteration cap; a `finish` tool, if the model had been required to call it, would have forced the model to either commit to "complete: the ticket is pending customer response" or explicitly report "blocked: uncertain whether this is a final state" — either of which is more useful than silently exhausting the budget.

## Tradeoffs, stated precisely

None of these guards are free. Fingerprint-based repeat detection costs a small amount of bookkeeping per iteration and requires per-tool tuning to avoid false-positiving on legitimate polling. A `finish` tool adds one more decision the model has to make correctly, which is one more place for it to fail, in exchange for a stopping signal you can actually distinguish from confusion. Tracking token budget alongside iteration count means carrying token accounting through a code path that would otherwise just be a loop counter. Each guard trades a small amount of complexity for a specific failure mode it closes — add them in proportion to how autonomous and how consequential the loop actually is, not uniformly to every tool call your app makes.

**Related:** [Implementing the Tool-Call Loop](/learn/genai-app-dev/implementing-a-tool-call-loop), [Context Limits and Why History Must Be Trimmed](/learn/genai-app-dev/context-limits-and-trimming), [Tool Calls Are Requests for Authority](/learn/genai-app-dev/tool-calling-as-authority), [Tool-Calling Authority Mistakes](/learn/genai-app-dev/tool-call-authority-mistakes)
