---
title: "Streaming Failure Modes and How to Survive Them"
track: "genai-app-dev"
status: live
summary: "Five ways a working local stream breaks in production, each with the symptom that gives it away and the fix."
duration: "7 min read"
---

Every one of these works flawlessly on `localhost`. All five show up only once real infrastructure — a proxy, a load balancer, a deploy platform — sits between your server and the browser. Here's what breaks, how to recognize it, and the fix for each.

### The mistake: a proxy buffers the whole response before forwarding it

```nginx
# default nginx behavior — proxy_buffering is on unless told otherwise
location /api/ {
  proxy_pass http://backend;
}
```

**Why it's wrong:** nginx (and many other reverse proxies) buffer upstream responses by default, collecting the full body before forwarding any of it downstream. Your server is streaming correctly — chunk by chunk, flushed as generated — but the proxy sitting in front of it reassembles those chunks into one payload before the browser ever sees the first byte.

**Symptom:** the stream works perfectly in local dev (no proxy in the path) and either loads all at once or times out entirely once deployed behind nginx, Cloudflare, or a similar layer — the classic "it worked on my machine" bug, specifically because your machine has no proxy.

**Fix:** disable buffering for the streaming route explicitly — `proxy_buffering off;` in nginx, or the equivalent for your proxy, plus the `X-Accel-Buffering: no` response header from your app itself (nginx honors this even without config changes on its side). Also disable response compression on this route: gzip requires buffering the full body to compress it, which reintroduces the exact problem you just fixed. Full header setup: [A Streaming SSE Endpoint in Next.js](/learn/genai-app-dev/streaming-sse-nextjs-endpoint).

### The mistake: an idle-connection timeout shorter than the gap between chunks

**Why it's wrong:** most infrastructure between your server and the browser — load balancers, API gateways, some corporate proxies — has an idle-connection timeout that closes a connection with no traffic for some window, often 30–60 seconds. Token generation isn't perfectly uniform: a tool-heavy turn, extended thinking, or simple provider-side variance can produce a multi-second gap with zero bytes flowing, which some idle timeouts read as a dead connection.

**Symptom:** long or complex responses drop mid-stream, consistently, at roughly the same duration every time — a strong signal it's a timeout, not a random failure, because random failures don't cluster at a fixed wall-clock interval.

**Fix:** emit a periodic SSE comment line (`: keep-alive\n\n` — the leading colon makes it a comment per the SSE spec, ignored by clients but still real traffic on the wire) on a timer shorter than the shortest idle timeout in your infrastructure path. If you control the load balancer config, raising its idle timeout is the more durable fix; the heartbeat is the fix you can ship without waiting on infra access.

### The mistake: no terminal event on every code path

```ts
for await (const event of stream) {
  controller.enqueue(sse("delta", { text: event.delta.text }));
}
// no controller.enqueue for "done" if an exception is thrown above
```

**Why it's wrong:** the client's read loop is waiting for a `done` or `error` event to know the stream is finished. If your server-side relay throws partway through and nothing catches it to emit a terminal event, the connection just closes (or hangs) with no signal the client can act on.

**Symptom:** the UI's spinner or typing indicator never resolves — it just sits there indefinitely, because the client has no way to distinguish "still generating" from "silently failed" without an explicit terminal event telling it which one happened.

**Fix:** wrap the relay loop in `try`/`catch`/`finally` (or the Python equivalent) so a terminal event fires on every path — success emits `done`, any exception emits `error` — and give the client its own hard timeout as a backstop for the case where even that guarantee somehow fails. Built out fully in [A Streaming SSE Endpoint in Next.js](/learn/genai-app-dev/streaming-sse-nextjs-endpoint) and [Streaming From a Python FastAPI Backend](/learn/genai-app-dev/streaming-in-python-fastapi).

### The mistake: the upstream call keeps running after the client disconnects

**Why it's wrong:** a client closing a tab or navigating away doesn't automatically stop your server from continuing to consume the provider's stream — that has to be wired explicitly, at every hop, from the client's disconnect through your server to the provider SDK call. Skip any hop and the generation (and the bill for it) continues for a client that's already gone.

**Symptom:** usage or billing shows tokens generated for requests with no corresponding active client — visible in provider usage logs as generation that ran to completion with nothing downstream to receive it.

**Fix:** listen for the disconnect signal your framework provides (`req.signal` in Next.js, `request.is_disconnected()` in FastAPI) and propagate it into an abort on the upstream call the moment it fires — the complete mechanism, including why each language's cancellation semantics differ, is in [Backpressure, Cancellation, and Abort Propagation](/learn/genai-app-dev/backpressure-and-cancellation).

### The mistake: the deploy platform itself doesn't support streaming responses

**Why it's wrong:** correct headers and a correctly-implemented `ReadableStream` or async generator are necessary but not sufficient — some hosting platforms buffer the entire function response before returning it, regardless of what your code does, because their execution model wasn't built around long-lived incremental responses.

**Symptom:** nothing renders until the whole response is ready, even with every header set correctly and the relay code verified to work locally against the same provider — the strongest signal this isn't a code bug at all, but a platform limitation.

**Fix:** confirm your specific deploy target supports response streaming before spending time debugging your own relay code — check whether your serverless platform's execution model streams responses incrementally or buffers them, and switch to a runtime or deployment mode that does if it doesn't.

## Pre-flight checklist

- [ ] Proxy/CDN buffering is explicitly disabled for the streaming route, and response compression is off for it.
- [ ] A heartbeat comment fires on an interval shorter than the shortest idle timeout in the infrastructure path.
- [ ] Every code path in the relay — success, error, and abort — emits a terminal event the client can act on.
- [ ] Client disconnect is wired all the way through to an upstream abort, verified by checking provider usage after a deliberately abandoned request.
- [ ] The deploy target has been confirmed (not assumed) to support incremental streaming responses.

**Related:** [A Streaming SSE Endpoint in Next.js](/learn/genai-app-dev/streaming-sse-nextjs-endpoint), [Streaming From a Python FastAPI Backend](/learn/genai-app-dev/streaming-in-python-fastapi), [Backpressure, Cancellation, and Abort Propagation](/learn/genai-app-dev/backpressure-and-cancellation), [Error Handling for LLM Calls](/learn/genai-app-dev/error-handling-for-llm-calls)
