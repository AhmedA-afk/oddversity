---
title: "Parsing Streamed Argument Deltas"
track: "tools-function-calling"
status: live
summary: "Build the accumulator that turns OpenAI's index-keyed deltas and Anthropic's input_json_delta events into one dispatchable call each."
duration: "8 min read"
---

Two providers, two different delta shapes, one real requirement: never treat a growing buffer as final until an explicit signal says it's done. This builds an accumulator for both.

## What we're building

A small stateful accumulator that ingests raw stream events from either provider and produces two things as they become available: a live, best-effort preview string for UI (may be incomplete, never trusted for execution) and a final, strictly-parsed call object per tool use, emitted only once the provider's own "this block is done" event fires.

## Setup

The two event shapes worth handling explicitly:

```python
# Anthropic: input_json_delta events carry partial_json per content block
{"type": "content_block_delta", "index": 0,
 "delta": {"type": "input_json_delta", "partial_json": "{\"city\": \"Lis"}}
# ...
{"type": "content_block_stop", "index": 0}   # explicit end-of-block signal

# OpenAI: arguments chunks keyed by tool_calls[i].index within one delta
{"choices": [{"delta": {"tool_calls": [
    {"index": 0, "id": "call_1", "function": {"name": "get_weather", "arguments": "{\"city\": \"Lis"}}
]}}]}
# ...
{"choices": [{"delta": {}, "finish_reason": "tool_calls"}]}   # explicit end-of-turn signal
```

Both shapes key by index and both give you an explicit completion signal — the field names differ, the discipline doesn't.

## Build it

### Step 1 — a buffer per tool-call index

```python
import json

class ToolCallAccumulator:
    def __init__(self):
        self.buffers: dict[int, dict] = {}   # index -> {"name": str, "json": str, "id": str}

    def _get(self, index: int) -> dict:
        return self.buffers.setdefault(index, {"name": None, "json": "", "id": None})
```

> **Why this step?** Keying by index, not by any assumption about ordering, is what survives a batch of parallel tool calls streaming in the same event sequence — [Streaming Partial Tool Calls](/learn/tools-function-calling/streaming-partial-tool-calls-concept) flags this exact case: each call's deltas interleave by index, so a single shared buffer silently corrupts every call in the batch except possibly the last.

### Step 2 — ingest deltas from either provider shape

```python
    def ingest_anthropic(self, event: dict) -> str | None:
        """Returns a live preview string, or None if this event carries no argument text."""
        if event["type"] == "content_block_delta" and event["delta"]["type"] == "input_json_delta":
            buf = self._get(event["index"])
            buf["json"] += event["delta"]["partial_json"]
            return buf["json"]
        return None

    def ingest_openai(self, delta: dict) -> str | None:
        for tc in delta.get("tool_calls", []):
            buf = self._get(tc["index"])
            if "id" in tc:
                buf["id"] = tc["id"]
            fn = tc.get("function", {})
            if "name" in fn:
                buf["name"] = fn["name"]
            if "arguments" in fn:
                buf["json"] += fn["arguments"]
            return buf["json"]
        return None
```

> **Why this step?** Both methods do the same thing structurally — append to the buffer at this index, return the buffer as a live preview — because the actual accumulation logic doesn't care which provider it's from. The difference is entirely in how each provider's event shape maps into that same append.

### Step 3 — finalize only on the explicit "done" signal, with strict parsing

```python
    def finalize(self, index: int) -> dict:
        buf = self.buffers[index]
        try:
            args = json.loads(buf["json"])
        except json.JSONDecodeError as exc:
            raise ValueError(
                f"tool call at index {index} ('{buf['name']}') was marked complete "
                f"but its buffer is not valid JSON: {exc}"
            ) from exc
        return {"id": buf["id"], "name": buf["name"], "input": args}
```

> **Why this step?** This is the one function in the whole accumulator that uses the standard, strict `json.loads` — no repair library, no leniency — because this is the only function whose output is allowed to reach `dispatch()`. A `JSONDecodeError` here is not something to paper over; per [Streaming Partial Tool Calls](/learn/tools-function-calling/streaming-partial-tool-calls-concept), a supposedly-complete buffer that doesn't parse is a real error from the provider or your accumulation, worth surfacing loudly rather than guessing around.

### Step 4 — wire completion signals from each provider into `finalize`

```python
def handle_stream_event(acc: ToolCallAccumulator, event: dict) -> dict | None:
    if event.get("type") == "content_block_delta":
        acc.ingest_anthropic(event)
        return None
    if event.get("type") == "content_block_stop":
        return acc.finalize(event["index"])
    return None
```

> **Why this step?** The finished call is only ever produced at the exact event the provider designates as "done" — `content_block_stop` here, or an equivalent check on `finish_reason == "tool_calls"` for the OpenAI path. Nothing upstream of this function is allowed to guess completeness from buffer contents alone.

## Run it

```python
acc = ToolCallAccumulator()
events = [
    {"type": "content_block_delta", "index": 0, "delta": {"type": "input_json_delta", "partial_json": '{"city": "Lis'}},
    {"type": "content_block_delta", "index": 0, "delta": {"type": "input_json_delta", "partial_json": 'bon", "unit": "c'}},
    {"type": "content_block_delta", "index": 0, "delta": {"type": "input_json_delta", "partial_json": 'elsius"}'}},
    {"type": "content_block_stop", "index": 0},
]
for event in events:
    result = handle_stream_event(acc, event)
    if result:
        print("dispatchable:", result)   # only prints once, after the stop event
    else:
        print("preview:", acc.buffers[0]["json"])
```

Three preview lines, then exactly one dispatchable result — `{"city": "Lisbon", "unit": "celsius"}` — parsed with the strict path only after the stop event, never before.

## Harden it

- **Reject a `finalize` call for an index you never saw a start event for.** A stray `content_block_stop` at an index with an empty buffer usually means an event was dropped upstream — surface that as an error, not an empty tool call.
- **Bound total buffer size per index.** A malformed or adversarial stream that never sends a stop event grows a buffer unboundedly; cap it and treat overflow as a hard error rather than exhausting memory.
- **Log the raw buffer on a parse failure.** When `finalize` raises, you want the exact string that failed to parse in your logs — that's usually enough to tell a dropped-delta bug from a genuinely malformed model output.

## Extend it

Once you can reliably distinguish "preview" from "dispatchable," you have everything [A Live 'Calling search_flights…' UI](/learn/tools-function-calling/streaming-ui-for-tool-calls) needs to render progress safely — mapping preview updates to on-screen text, and the finalized result to the actual execution trigger.

**Related:** [Streaming Partial Tool Calls](/learn/tools-function-calling/streaming-partial-tool-calls-concept), [Streaming Partial Tool Calls](/learn/tools-function-calling/streaming-partial-tool-calls), [A Live 'Calling search_flights…' UI](/learn/tools-function-calling/streaming-ui-for-tool-calls), [Parallel Tool Calls](/learn/tools-function-calling/parallel-tool-calls-mechanics)
