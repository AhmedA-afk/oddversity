---
title: "Backpressure, Cancellation, and Abort Propagation"
track: "genai-app-dev"
status: live
summary: "Why a closed tab doesn't stop generation by default, and the exact three-hop chain that has to be wired for it to."
duration: "8 min read"
---

> Optional depth. [A Streaming SSE Endpoint in Next.js](/learn/genai-app-dev/streaming-sse-nextjs-endpoint) and [Streaming From a Python FastAPI Backend](/learn/genai-app-dev/streaming-in-python-fastapi) both use the mechanism this lesson derives — read this when you want to understand *why* those snippets are shaped the way they are, not just that they work.

"The tab closed but the bill kept running" is not a bug in any one piece of software. It's what happens, by default, at every one of three separate hops between a user's browser and a provider's inference cluster — because *none* of those hops propagates a disconnect signal to the next one unless your code makes it do so.

## The chain of custody for an abort signal

A generation in progress has to be told to stop by something that itself has to first *be told*. Trace the path backward from where billing happens:

1. **Provider inference** stops generating output tokens the moment it receives an abort on the connection carrying the request — but only if that connection is actually closed. Nothing about the provider's side knows or cares whether a human is still watching; it only knows whether the socket is still open.
2. **Your server's request to the provider** is a connection your server holds open. Closing it is entirely your server's responsibility — the provider SDK gives you a hook (an abort signal in TypeScript, a context manager in Python), but nothing calls that hook automatically.
3. **The client's connection to your server** is the only place a "user left" signal genuinely originates. Everything upstream of this is inference from that one fact.

Each arrow in that chain — client-to-server, server-to-provider — is a translation your code has to perform explicitly. The default behavior at every hop, absent that wiring, is "keep going." That's not a design flaw; it's simply that disconnect notification isn't automatic in either HTTP or the SDKs built on it, and building it in by default would mean guessing wrong about cases where you *do* want generation to continue independent of one client's connection (a background job, a multi-viewer broadcast).

## TypeScript: AbortController end to end

The Fetch API's `Request` object exposes a `signal` that fires when the underlying connection closes — the client navigated away, the browser killed the request, or the client explicitly called `AbortController.abort()`. That's hop 3 solved for free by the platform. Hop 2 — turning that into an abort on the *upstream* provider call — is what you have to wire yourself:

```ts
export async function POST(req: Request) {
  const upstreamController = new AbortController();
  req.signal.addEventListener("abort", () => upstreamController.abort());

  const stream = client.messages.stream(
    { model, max_tokens, messages },
    { signal: upstreamController.signal }, // the SDK's per-request options bag
  );
  // ...
}
```

The `signal` option is the same per-request override mechanism the SDK uses for `timeout` on a single call — pass an `AbortSignal`, and the SDK cancels the in-flight HTTP request to the provider the instant that signal fires. Skip this wiring — relay chunks without ever touching `req.signal` — and the code still "works" in every functional test, because nothing about a normal completed request exercises the disconnect path at all. It only breaks silently, in production, exactly when a real user closes a tab mid-generation — which is precisely why this bug survives code review so often.

## Python: cancellation is cooperative, not preemptive

Python's `asyncio` cancellation model works differently, and the difference matters here. Calling `task.cancel()` doesn't stop a task instantly — it schedules a `CancelledError` to be raised at the *next* `await` point inside that task. If your code is mid-computation with no `await` in sight, cancellation waits. This is why FastAPI's `StreamingResponse` doesn't automatically stop your generator on client disconnect: nothing forces the generator to check.

The pattern that works is an explicit check inside the loop, timed to run often enough to matter:

```python
async with client.messages.stream(model=model, max_tokens=max_tokens, messages=messages) as stream:
    async for event in stream:
        if await request.is_disconnected():
            break  # exiting the loop lets __aexit__ close the upstream connection
        yield handle(event)
```

Breaking out of the loop is what triggers cancellation here — not an explicit `.abort()` call like the TypeScript SDK's `signal` option, but exiting the `async with` block, whose `__aexit__` closes the underlying HTTP connection to the provider as part of normal context-manager cleanup. `request.is_disconnected()` has to be checked on a schedule tight enough to catch a disconnect promptly — once per loop iteration is the safe default for text token deltas, since they arrive frequently and cheaply.

One more Python-specific trap: never swallow a `CancelledError` silently. If your generator wraps the loop in a broad `except Exception`, a bare `except:` clause, or (worse) `except BaseException`, it can catch and discard the cancellation itself, leaving the task running when the caller believed it had stopped. Catch specific, expected exceptions; let cancellation propagate, doing any cleanup in a `finally` block instead.

## Backpressure: the other half of the problem

Cancellation handles a client that's gone. Backpressure handles a client that's still there but consuming slower than the server is producing — a slow mobile connection, a backgrounded tab whose JS is throttled, or (more relevant for larger payloads than text) a slow consumer of streamed audio or image chunks.

Both Node's streams and Python's ASGI protocol have backpressure built in, though it shows up differently. In Node, a `WritableStream`'s `write()` call returns `false` when its internal buffer is full, signaling the producer to pause until a `drain` event fires. In ASGI (what FastAPI and other async Python frameworks run on), backpressure is implicit: the `send()` call your generator awaits doesn't resolve until the transport layer can accept more data, so an async generator that properly `await`s its writes is naturally paused by a slow client without any extra code.

For pure text-token streaming, this rarely becomes a practical bottleneck — deltas are small and infrequent relative to network throughput. It matters far more once you're streaming larger payloads, like generated audio chunks or image data, where an unbounded server-side buffer accumulating for a slow client is a real memory-growth risk rather than a theoretical one.

## What "the bill kept running" actually means

Provider billing is based on tokens actually generated up to the moment of abort — not tokens the client received, and not the request's original `max_tokens` ceiling. An abandoned request that isn't wired for cancellation keeps generating (and being billed for) output tokens for as long as the provider connection stays open, which — absent any abort — is until the model naturally reaches a stop condition. Illustratively: a generation that would have run to its full token cap costs the same whether a human reads every word or the tab closed thirty seconds in; the token meter doesn't know the difference, only your abort wiring does.

## Tradeoffs and edge cases

- **Cancellation is coarse, not pause-and-resume.** There's no way to "pause" a generation and continue it later from the same point — an abort is a hard stop. A stopped generation that the user wants to continue has to be a fresh request, which is exactly the regenerate pattern in [Stop, Regenerate, and Rendering Partial Output](/learn/genai-app-dev/stop-regenerate-and-partial-render).
- **Billing granularity is whole output tokens, not partial ones.** You can't get a partial refund for a token that was half-generated when the abort landed — the provider bills what it produced up to that point, full stop.
- **This is a per-request model, not a broadcast one.** Everything above assumes one upstream call per one connected client. A feature that fans one generation out to multiple simultaneous viewers needs a different architecture entirely — that's out of scope for the abort-propagation pattern described here.

**Related:** [A Streaming SSE Endpoint in Next.js](/learn/genai-app-dev/streaming-sse-nextjs-endpoint), [Streaming From a Python FastAPI Backend](/learn/genai-app-dev/streaming-in-python-fastapi), [Streaming Failure Modes and How to Survive Them](/learn/genai-app-dev/streaming-failure-modes), [Async Python for I/O](/learn/python-data-apis/async-python-for-io)
