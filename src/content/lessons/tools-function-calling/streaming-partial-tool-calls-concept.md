---
title: "Streaming Partial Tool Calls"
track: "tools-function-calling"
status: live
summary: "A tool call's JSON is complete only once the stream ends — treat any earlier snapshot of it as a preview, never as input."
duration: "6 min read"
---

Every tool call so far in this module has been treated as arriving whole — a complete, valid JSON object your harness can parse and dispatch the moment it shows up. Streaming breaks that assumption on purpose, and the fix is a discipline, not a library.

## What it is

When a model streams its response, a tool call's `name` and `arguments` don't appear atomically — they arrive as a sequence of token-level deltas over the course of the stream, the same way streamed text arrives word by word. Anthropic emits `input_json_delta` events carrying a `partial_json` fragment per delta; OpenAI emits incremental `arguments` string chunks keyed by the tool call's index in the batch. Either way, what you receive event by event is a string being built up, not a JSON object you can hand to `json.loads` — until the very last delta lands, the buffer you're holding is, by construction, not valid JSON.

## The mental model

Think of the argument JSON as a sentence being typed onto your screen one character at a time, and you being asked "what does this sentence say?" after every single character. Most of the time, the honest answer is "I don't know yet — it's not finished." `{"city": "Lis` is not a truncated fact about Lisbon; it's not a fact about anything, because the object it belongs to doesn't exist as a well-formed value until the closing brace shows up. Anchors [Streaming Partial Tool Calls](/learn/tools-function-calling/streaming-partial-tool-calls) makes this same point about the mechanism — deltas concatenate into valid JSON, individual deltas don't stand alone as valid JSON.

## Why it works this way

Providers stream tool calls the same way they stream everything else — token by token, as the model generates them — because that's the one mechanism they have for giving you anything before generation finishes. There's no special "send the whole tool call atomically, but stream the text" mode, because the model isn't holding a finished JSON object in some buffer waiting to flush it; it's generating tokens in sequence and the JSON only becomes a JSON object once enough tokens exist to close every open brace, bracket, and quote.

That has a direct consequence for anything reading the stream: **the only way to know a tool call's arguments are actually complete is an explicit signal from the provider that the block is done** — Anthropic's `content_block_stop`, OpenAI's `finish_reason` on that tool call — never a heuristic like "the buffer parses as JSON now." A heuristic like that can be *wrong in the safe direction* (a nested object that happens to close early looks complete but isn't) just as easily as it can be wrong in the dangerous direction.

## A concrete example (shown)

A `write_file` call streaming in, watched delta by delta:

```text
delta 1: {"path": "src/con
delta 2: fig.json", "content": "{\n  \"retr
delta 3: ies\": 3,\n  \"timeout_ms\": 5000\n}"
delta 4: }
```

After delta 2, the buffer is `{"path": "src/config.json", "content": "{\n  \"retr` — not valid JSON by any parser, strict or lenient, because a string literal is still open. After delta 3, the buffer *might* parse successfully if a permissive repair parser guesses the right closing characters — but it still isn't the real, final call, because delta 4 hasn't arrived. Only after the provider's explicit "block done" signal, following delta 4, is this buffer the actual tool call anyone should act on.

## Where it shows up

Any UI that wants to show tool-call activity before the call finishes — a live "calling `write_file`…" indicator, a progress view for a long argument like a multi-paragraph document body. It also shows up, more subtly, wherever a batch of parallel tool calls streams in the same event sequence: each call's deltas interleave by index, so a harness has to track a separate buffer per tool-call index, not one buffer for the whole turn.

## Watch out for

- **Dispatching on a buffer that merely looks parseable.** A permissive JSON-repair parser closing an unterminated string can produce a value that parses cleanly but is *wrong* — a truncated number, a string cut mid-word — and looks exactly as valid as the real, complete result. Parseable is not the same claim as complete.
- **Forgetting the per-call buffer when calls batch.** A stream carrying two parallel tool calls interleaves both calls' deltas by index in one event sequence — accumulating into a single shared buffer silently corrupts both calls' JSON.
- **Treating the "done" event as optional to check.** Skipping the explicit end-of-block signal and instead guessing completeness from timing (no new delta for N milliseconds) is a race condition waiting for a slow network hiccup to trigger it.

## Where next

[Parsing Streamed Argument Deltas](/learn/tools-function-calling/parsing-streamed-tool-call-deltas) builds the actual accumulator — for both providers' delta shapes — that gets this right. [A Live 'Calling search_flights…' UI](/learn/tools-function-calling/streaming-ui-for-tool-calls) is what you build on top of it once accumulation is solid.

**Related:** [Streaming Partial Tool Calls](/learn/tools-function-calling/streaming-partial-tool-calls), [Parsing Streamed Argument Deltas](/learn/tools-function-calling/parsing-streamed-tool-call-deltas), [Parallel Tool Calls](/learn/tools-function-calling/parallel-tool-calls-mechanics), [A Live 'Calling search_flights…' UI](/learn/tools-function-calling/streaming-ui-for-tool-calls)
