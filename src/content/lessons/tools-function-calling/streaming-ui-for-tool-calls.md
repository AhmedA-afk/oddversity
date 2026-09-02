---
title: "A Live 'Calling search_flights…' UI"
track: "tools-function-calling"
status: live
summary: "Turn streamed tool-call deltas into a progress indicator that fills in live, with the one guard that keeps it from acting early."
duration: "7 min read"
---

A spinner tells a user nothing. "Calling `search_flights`… `{origin: AUS, destination:` " tells them the agent is doing something specific, and roughly what — for the cost of wiring the accumulator from the previous lesson into a render loop instead of a dispatch loop.

## The setup

Same `search_flights` tool from [A Sequential Booking Flow](/learn/tools-function-calling/sequential-booking-flow-worked), now streaming. The `ToolCallAccumulator` from [Parsing Streamed Argument Deltas](/learn/tools-function-calling/parsing-streamed-tool-call-deltas) is already ingesting events; this lesson is the layer on top that maps accumulator state to what a user sees, plus the one rule that keeps "showing progress" from turning into "acting early."

## Step by step

### Step 1 — render as soon as the tool name is known, before any arguments exist

```typescript
function onDeltaEvent(acc: ToolCallAccumulator, event: StreamEvent, ui: UiHandle) {
  const preview = acc.ingest(event); // wraps the provider-specific ingest from the accumulator
  if (preview === null) return;

  const buf = acc.buffers[event.index];
  ui.updateCallCard(event.index, {
    status: "in_progress",
    label: buf.name ? `Calling ${buf.name}…` : "Calling…",
    argsPreview: buf.json,
  });
}
```

> **Why this step?** The tool's `name` typically streams before its arguments do — Anthropic sends the block's name as part of the block-start event, ahead of any `input_json_delta`; OpenAI's first `tool_calls` delta usually carries `function.name` before much of `arguments` has arrived. That ordering means "Calling search_flights…" can appear on screen well before the user would otherwise see any sign of activity, which is the entire point: the label answers "what is it doing" long before the arguments answer "with what."

### Step 2 — render the argument preview as raw, unparsed text — never re-parsed JSON

```typescript
// UI: show buf.json as a monospace string, growing character by character.
// Do NOT run it through a lenient/repair JSON parser to render "prettified" fields —
// that invites exactly the false-confidence trap from the previous lesson.
```

> **Why this step?** It's tempting to make the preview look nicer by running a permissive parser over the partial buffer and rendering `origin: AUS` instead of raw `{"origin": "AUS", "dest` — but that's the same trap [Streaming Partial Tool Calls](/learn/tools-function-calling/streaming-partial-tool-calls-concept) names for execution, applied to display: a repaired partial value can *look* like a clean, confirmed field when it's actually a guess about how the string was going to end. Raw, growing text is honest about being incomplete in a way a prettified render isn't.

### Step 3 — flip the card to "ready" only on the accumulator's finalized result

```typescript
function onStopEvent(acc: ToolCallAccumulator, event: StreamEvent, ui: UiHandle) {
  const finalCall = acc.finalize(event.index);   // throws on invalid JSON — see previous lesson
  ui.updateCallCard(event.index, { status: "ready", args: finalCall.input });
  return finalCall;   // this, and only this, is what gets dispatched
}
```

> **Why this step?** This is the guard the whole lesson exists to enforce: **the UI can render from the preview buffer at any time, but only `finalize()`'s return value is allowed to reach the actual tool dispatcher.** Nothing about making progress visible relaxes the rule from [Streaming Partial Tool Calls](/learn/tools-function-calling/streaming-partial-tool-calls-concept) that execution waits for the explicit completion signal — the UI layer and the execution layer read the same accumulator, but only one of them is allowed to trigger a side effect.

### Step 4 — dispatch, and update the card once more with the real result

```typescript
async function onFinalized(finalCall: FinalizedCall, ui: UiHandle, index: number) {
  ui.updateCallCard(index, { status: "running" });
  const result = await executeTool(finalCall);   // the dispatcher from earlier lessons
  ui.updateCallCard(index, { status: "done", result });
}
```

> **Why this step?** The card now has a full lifecycle a user can actually watch: `in_progress` (name known, args streaming) → `ready` (args final, not yet run) → `running` (dispatched) → `done` (result back). Each transition is driven by a real event, not a timer or a guess — which is exactly what turns "the app seems frozen" into "I can see it's on step 3 of 4."

## Where it breaks (+fix)

**Break:** a tool with a very short argument list — a single boolean flag, say — streams its entire JSON in one delta. The card jumps straight from `in_progress` with an empty preview to `ready`, and the "filling in live" effect a longer call gets simply doesn't show for this one.
**Fix:** this isn't actually a bug — it's the accumulator working correctly on a call that happened to have nothing to stream. Don't force an artificial delay to manufacture a filling-in animation; a genuinely instant transition is honest about a genuinely small payload. Reserve the animated fill for calls whose arguments are actually large enough to benefit — the same argument-size judgment call from [Streaming Partial Tool Calls](/learn/tools-function-calling/streaming-partial-tool-calls-concept).

**Break:** the stream disconnects mid-call — network drop after `in_progress`, before any `content_block_stop` or `finish_reason` arrives. The card sits at `in_progress` forever, and nothing in the code above ever transitions it.
**Fix:** the UI layer needs its own timeout independent of the accumulator's logic — if a card hasn't advanced state in N seconds and the underlying connection reports closed or errored, transition it to an explicit `interrupted` state rather than leaving it looking like normal progress. This is a UI-level guard, not a relaxation of the finalize-before-execute rule — an interrupted card still never dispatches a call from a preview buffer.

## Takeaways

- The tool name typically streams ahead of its arguments — use that ordering to show "what" before "with what," rather than waiting for the whole payload.
- Render the raw, growing JSON string for preview, never a prettified re-parse of a partial buffer — a repaired guess can look more finished than it is.
- Exactly one function's output is allowed to trigger execution: the accumulator's `finalize()`, fired only on the provider's explicit completion signal. The UI can read the buffer freely; the dispatcher can't.

**Related:** [Parsing Streamed Argument Deltas](/learn/tools-function-calling/parsing-streamed-tool-call-deltas), [Streaming Partial Tool Calls](/learn/tools-function-calling/streaming-partial-tool-calls-concept), [Streaming Partial Tool Calls](/learn/tools-function-calling/streaming-partial-tool-calls), [A Sequential Booking Flow](/learn/tools-function-calling/sequential-booking-flow-worked)
