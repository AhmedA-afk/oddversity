---
title: "How Token Streaming Works End to End"
track: "genai-app-dev"
status: live
summary: "The full chunk-by-chunk pipeline from provider to server to screen, and the exact points where you can still intervene."
duration: "6 min read"
---

[Streaming Responses to the UI](/learn/genai-app-dev/streaming-responses-to-the-ui) covers the shape of the win: tokens appear as they're generated instead of all at once. This lesson is the plumbing underneath it — the actual event sequence a provider emits, what your server does with each one, and the handful of moments where your code gets to look at the stream before it reaches the user.

## What it is

A streamed completion isn't one blob broken into pieces after the fact — it's a live sequence of typed events, each carrying a small piece of the final message. A typical Anthropic Messages API stream looks like this, in order:

```
message_start        — message metadata: id, model, empty content
content_block_start  — a new block begins (text, thinking, or tool_use)
content_block_delta  — an incremental piece of that block (repeats many times)
content_block_stop   — that block is complete
content_block_start  — a second block might start (e.g. a tool call after text)
...
message_delta        — stop_reason and usage, once generation is essentially done
message_stop         — the terminal event; nothing more is coming
```

Each `content_block_delta` for a text block carries a `text_delta` with a few characters or words — not necessarily exactly one token, and not necessarily a whole word either. Your relay and your client both have to treat these as arbitrary-length fragments, not fixed units.

## The mental model

Think of the stream as a typed event log, not a string. Your server's job is to read that log and re-emit the parts your client needs, in the same order, without waiting for the log to finish. Your client's job is to read *that* re-emitted log and fold each event into UI state — almost always by appending text to whatever bubble is currently "open" and switching to a new one when a `content_block_start`/`content_block_stop` pair tells it to.

## Why it works this way

The event-per-block, delta-within-block structure exists because a single turn can contain more than one kind of content — plain text, a tool call, or (on models with extended thinking) a reasoning block — and each of those needs its own accumulation logic. A UI that just concatenates every delta into one string works fine until a response contains a `tool_use` block, at which point the JSON arguments for that tool call get mixed into the same string as the visible text, corrupting both. Reading the block boundaries, not just the deltas, is what keeps text and tool-call fragments from colliding.

## A concrete example (shown)

Server-side relay in TypeScript, forwarding only the text deltas as SSE while watching for a reason to cut the stream off early:

```ts
for await (const event of stream) {
  if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
    accumulated += event.delta.text;

    // You can inspect the stream here, before anything reaches the client.
    if (containsBannedPhrase(accumulated)) {
      stream.abort();          // stop the upstream call — stop paying for more tokens
      controller.enqueue(sse("error", { message: "Response blocked by policy" }));
      break;
    }

    controller.enqueue(sse("delta", { text: event.delta.text }));
  }
  if (event.type === "message_stop") {
    controller.enqueue(sse("done", { usage: finalUsage }));
  }
}
```

That `containsBannedPhrase` check is the point worth noticing: nothing forces you to relay every delta untouched. Because the stream passes through your server before it reaches the client, you have a live checkpoint to validate partial content or cut generation off entirely — something a single blocking response never gives you, since by the time you see any of it, you see all of it.

## Where it shows up

This pipeline is what [A Streaming SSE Endpoint in Next.js](/learn/genai-app-dev/streaming-sse-nextjs-endpoint) and [Streaming From a Python FastAPI Backend](/learn/genai-app-dev/streaming-in-python-fastapi) both build concretely — one relay loop, two languages. It's also the substrate [Streaming Structured Output Into Live Components](/learn/genai-app-dev/streaming-structured-generative-ui) builds on, except there the deltas being accumulated are JSON fragments from a `tool_use` block instead of prose.

## Watch out for

- **Assuming one delta equals one token or one word.** Providers batch differently and can change batching behavior between models or requests. Code that expects `event.delta.text` to always be a single token breaks the day that assumption stops holding, silently mis-rendering spacing.
- **Losing block boundaries when mixing text and tool calls.** If a turn produces text, then a tool call, then more text, blindly concatenating every `text_delta` across the whole stream interleaves unrelated content. Track which `content_block_start` index you're accumulating into.
- **Treating a mid-stream cutoff as free.** Calling `stream.abort()` when you spot a policy violation stops *further* generation, but tokens already generated before the cutoff are already billed — see [Backpressure, Cancellation, and Abort Propagation](/learn/genai-app-dev/backpressure-and-cancellation) for exactly what abort does and doesn't undo.

## Where next

Once the pipeline itself is clear, the next decision is what carries it from your server to the browser — and that's a transport choice with real infrastructure consequences, covered in [SSE vs WebSockets: Choosing a Transport](/learn/genai-app-dev/sse-vs-websockets-deep).

**Related:** [Streaming Responses to the UI](/learn/genai-app-dev/streaming-responses-to-the-ui), [A Streaming SSE Endpoint in Next.js](/learn/genai-app-dev/streaming-sse-nextjs-endpoint), [Guardrails and Input Validation](/learn/genai-app-dev/guardrails-and-input-validation), [Backpressure, Cancellation, and Abort Propagation](/learn/genai-app-dev/backpressure-and-cancellation)
