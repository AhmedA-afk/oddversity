---
title: "A Streaming SSE Endpoint in Next.js"
track: "genai-app-dev"
status: live
summary: "A route handler that relays provider chunks as SSE, with correct headers, a done event, and abort-on-disconnect."
duration: "8 min read"
---

This is the server half of a working streamed chat feature: one Next.js route handler that opens a provider stream, relays it as SSE with the framing a browser expects, and stops the upstream call the moment the client walks away.

## What we're building

A `POST /api/chat` route that accepts a message list, streams the assistant's reply back as SSE, and cleanly closes on completion, error, or client disconnect. [Consuming a Token Stream in React](/learn/genai-app-dev/consuming-a-stream-in-react) builds the client that pairs with it.

## Setup

App Router, `app/api/chat/route.ts`. You need the Anthropic SDK server-side only — never in client code, per [Handling API Keys and Secrets](/learn/genai-app-dev/handling-api-keys-and-secrets):

```bash
npm install @anthropic-ai/sdk
```

```ts
// app/api/chat/route.ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
export const runtime = "nodejs"; // streaming needs a runtime that supports it
```

## Build it

### 1. Open the provider stream, wired to the incoming request's abort signal

```ts
export async function POST(req: Request) {
  const { messages } = await req.json();
  const upstreamController = new AbortController();

  // If the client disconnects, propagate that to the upstream call immediately.
  req.signal.addEventListener("abort", () => upstreamController.abort());

  const providerStream = client.messages.stream(
    {
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages,
    },
    { signal: upstreamController.signal },
  );
  // ...
```

> **Why this step?** `req.signal` fires when the browser closes the tab or the client calls `fetch`'s own `AbortController.abort()`. Forwarding it to the provider call via the SDK's per-request `signal` option is the entire fix for "the tab closed but the bill kept running" — see [Backpressure, Cancellation, and Abort Propagation](/learn/genai-app-dev/backpressure-and-cancellation) for why every hop in this chain has to be wired explicitly.

### 2. Relay chunks as SSE inside a `ReadableStream`

```ts
  const encoder = new TextEncoder();
  const sse = (event: string, data: unknown) =>
    encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of providerStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(sse("delta", { text: event.delta.text }));
          }
        }
        const final = await providerStream.finalMessage();
        controller.enqueue(sse("done", { usage: final.usage, stopReason: final.stop_reason }));
      } catch (err) {
        controller.enqueue(sse("error", { message: err instanceof Error ? err.message : "stream failed" }));
      } finally {
        controller.close();
      }
    },
    cancel() {
      upstreamController.abort(); // client-initiated ReadableStream cancel also aborts upstream
    },
  });
```

> **Why this step?** The `try/finally` guarantees a terminal SSE event fires on every path — success, provider error, or abort — so the client's reader never hangs waiting for an event that isn't coming. `cancel()` is the `ReadableStream`'s own disconnect hook, a second entry point into the same abort logic as `req.signal` above.

### 3. Return the response with headers that actually stream

```ts
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // tells nginx not to buffer this response
    },
  });
}
```

> **Why this step?** `no-transform` stops a well-meaning CDN or proxy from gzip-compressing the response — compression requires buffering the whole payload first, which defeats streaming just as thoroughly as an explicit buffering proxy does. `X-Accel-Buffering: no` is the specific header nginx checks; skip it and a stream that works in local dev can arrive at the client all at once in production. Full catalog of this failure class: [Streaming Failure Modes and How to Survive Them](/learn/genai-app-dev/streaming-failure-modes).

## Run it

```bash
curl -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Say hello in three words"}]}'
```

`-N` disables curl's own output buffering so you see events arrive incrementally rather than all at once — the same buffering trap your server headers are meant to prevent, just on the client side of a debugging session.

## Harden it

- **Heartbeat.** Some proxies drop idle connections faster than tokens arrive (a tool-heavy turn can pause for seconds). Emit a comment line (`: keep-alive\n\n`) on a timer alongside real deltas to reset any idle timer sitting between you and the client.
- **Cap generation time server-side too.** Client aborts handle the "user left" case; also set a hard `AbortSignal.timeout()` on the upstream call so a hung provider connection can't hold the route open indefinitely.
- **Never let an uncaught exception skip the `finally`.** If you add logic inside the `for await` loop, keep it inside the `try` — an unhandled throw anywhere in `start()` still needs to reach the client as an `error` event, not a silently dead connection.

## Extend it

Forward `input_json_delta` events too, and you have the raw feed for [Streaming Structured Output Into Live Components](/learn/genai-app-dev/streaming-structured-generative-ui). Add a `stop` route that looks up an in-flight request by ID and calls `.abort()` on its controller, and you have the server side of the stop button in [Stop, Regenerate, and Rendering Partial Output](/learn/genai-app-dev/stop-regenerate-and-partial-render). For a Python backend instead, the same shape is built in [Streaming From a Python FastAPI Backend](/learn/genai-app-dev/streaming-in-python-fastapi).

**Related:** [Consuming a Token Stream in React](/learn/genai-app-dev/consuming-a-stream-in-react), [How Token Streaming Works End to End](/learn/genai-app-dev/streaming-response-fundamentals), [Backpressure, Cancellation, and Abort Propagation](/learn/genai-app-dev/backpressure-and-cancellation), [Streaming Failure Modes and How to Survive Them](/learn/genai-app-dev/streaming-failure-modes)
