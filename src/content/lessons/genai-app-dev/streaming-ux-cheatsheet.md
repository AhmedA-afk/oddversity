---
title: "Streaming and Chat UX Cheatsheet"
track: "genai-app-dev"
status: live
summary: "Transport decision, endpoint and client checklists, required chat affordances, and the abort chain — one page."
duration: "5 min read"
---

The reference version of this module: what to reach for by default, what every streaming endpoint and client needs before shipping, and the shape of a multimodal message.

## Transport — start here, then measure

| Situation | Use |
|---|---|
| Chat completion, one-way token push | **SSE** — start here |
| Live voice input with interruption, multi-user session feeding one generation | WebSockets |
| Non-browser consumer with no SSE parser | Raw chunked HTTP (own your framing) |
| Anything token-level | Never polling |

Full comparison: [SSE vs WebSockets: Choosing a Transport](/learn/genai-app-dev/sse-vs-websockets-deep).

## Streaming endpoint checklist

- [ ] `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `X-Accel-Buffering: no`.
- [ ] Every code path — success, provider error, client abort — emits a terminal SSE event (`done` or `error`). Never let a connection just close with no signal.
- [ ] Client disconnect (`req.signal` in Node, `request.is_disconnected()` in Python) is wired to abort the upstream provider call.
- [ ] A heartbeat comment (`: keep-alive\n\n`) fires on an interval shorter than the shortest idle timeout in your infra path.
- [ ] Response compression is disabled for this route — gzip requires buffering the full body first, which defeats streaming.

Built out fully: [A Streaming SSE Endpoint in Next.js](/learn/genai-app-dev/streaming-sse-nextjs-endpoint), [Streaming From a Python FastAPI Backend](/learn/genai-app-dev/streaming-in-python-fastapi).

## Streaming client checklist

- [ ] In-flight streaming text lives in its own state slot, separate from committed message history — append there, merge once, at the end.
- [ ] A synchronous guard (a ref, not a state variable) blocks double-submit at the instant of the click, not after the network call resolves.
- [ ] Auto-scroll only fires when the user was already near the bottom before new content arrived.
- [ ] The input draft is cleared only after a send is confirmed, and restored on failure.
- [ ] Stop calls `AbortController.abort()` and commits whatever partial text arrived — never discards it.

Built out fully: [Consuming a Token Stream in React](/learn/genai-app-dev/consuming-a-stream-in-react), [Chat UX That Doesn't Feel Broken](/learn/genai-app-dev/chat-ux-that-doesnt-feel-broken).

## Required chat affordances

| Affordance | Why it's not optional |
|---|---|
| Stop button | Without it, users sit through answers they've already decided to discard, burning token budget for nothing. |
| Regenerate | Splice the stale turn out of history before resending — otherwise the model continues the broken attempt instead of starting fresh. |
| Disabled-while-generating input | Prevents double-submit; the guard must be synchronous, set on click, not on response. |
| Error with retry, not a dead end | Store the user's message the instant they send it, independent of whether a response ever arrives, so a failure never costs them their own words. |
| Partial-render safety | Unbalanced markdown (an open code fence) can swallow the rest of the page — balance fences before every render, not just the final one. |

Full worked scenario: [Stop, Regenerate, and Rendering Partial Output](/learn/genai-app-dev/stop-regenerate-and-partial-render).

## The abort-propagation pattern

Three hops, each requiring explicit wiring — nothing here happens automatically:

```
client disconnects  →  your server's request object signals it  →  you call .abort() / exit the context manager  →  provider stops generating
```

| Hop | TypeScript | Python |
|---|---|---|
| Client → your server | `req.signal` fires on disconnect | `await request.is_disconnected()` — check it, don't wait for a push |
| Your server → provider | `client.messages.stream(params, { signal })` | Break the loop → `async with` block's `__aexit__` closes the connection |

Skip either hop and generation (and billing) continues after the user is gone. Full derivation: [Backpressure, Cancellation, and Abort Propagation](/learn/genai-app-dev/backpressure-and-cancellation).

## Multimodal message shape — quick reference

| Source | Shape | Use when |
|---|---|---|
| Inline base64 | `{ type: "image", source: { type: "base64", media_type, data } }` | One-off, not hosted anywhere yet |
| Hosted URL | `{ type: "image", source: { type: "url", url } }` | Already reachable publicly, no need to re-download |
| File reference | `{ type: "document", source: { type: "file", file_id } }` | Same asset reused across many requests |

Resize images to roughly 1568px on the long edge before upload — most models downscale internally anyway, so pre-resizing costs nothing in quality. Full path from file picker to call: [From File Upload to a Multimodal Call](/learn/genai-app-dev/uploading-and-sending-images).

## Pre-flight checklist

- [ ] SSE is the default transport unless the feature genuinely needs bidirectional interrupt.
- [ ] Terminal events fire on every relay code path, verified by deliberately triggering an error.
- [ ] Abort propagation is verified by abandoning a request mid-stream and checking provider usage, not just assumed from the code.
- [ ] Every required chat affordance (stop, regenerate, disabled input, error/retry, partial-render safety) is present, not just the happy path.
- [ ] Multimodal messages pick the cheapest correct source shape for how many times the asset will be referenced.

**Related:** [How Token Streaming Works End to End](/learn/genai-app-dev/streaming-response-fundamentals), [Streaming Failure Modes and How to Survive Them](/learn/genai-app-dev/streaming-failure-modes), [Backpressure, Cancellation, and Abort Propagation](/learn/genai-app-dev/backpressure-and-cancellation), [Chat UX That Doesn't Feel Broken](/learn/genai-app-dev/chat-ux-that-doesnt-feel-broken)
