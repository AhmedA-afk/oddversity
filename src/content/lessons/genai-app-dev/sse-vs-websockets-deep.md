---
title: "SSE vs WebSockets: Choosing a Transport"
track: "genai-app-dev"
status: live
summary: "Four ways to get tokens from server to browser, what each costs your infrastructure, and why SSE wins by default."
duration: "7 min read"
---

[SSE vs. WebSockets for Streaming LLM Output](/learn/genai-app-dev/sse-vs-websockets) makes the core case for SSE. This lesson widens the comparison to every transport teams actually reach for — including the two naive options that seem simpler and cost more — and turns the decision into a table you can point at in a design review.

## Server-Sent Events (SSE)

An SSE response is an ordinary HTTP response that never closes: `Content-Type: text/event-stream`, and the server keeps writing `data: ...\n\n` lines as they become available. The browser (or your `fetch` call) reads the body incrementally instead of waiting for it to end.

**How it works:** one HTTP request, one long-lived response, server-to-client only.
**When it wins:** any "ask once, receive a stream of chunks until done" shape — which is what a chat completion is.
**Failure mode:** intermediary proxies that buffer the full response before forwarding it (see [Streaming Failure Modes](/learn/genai-app-dev/streaming-failure-modes)) silently turn your stream back into a blocking call.
**Relative cost:** lowest. Rides existing HTTP infrastructure — load balancers, CDNs, and API gateways already understand plain HTTP; no protocol upgrade, no new connection type to provision for.

## WebSockets

A WebSocket starts as an HTTP request that upgrades to a persistent, full-duplex TCP-like channel. Once open, either side can send a frame at any time, with no request/response pairing required.

**How it works:** one handshake, then a bidirectional socket that stays open until either side closes it.
**When it wins:** the model needs to *receive* a continuous stream while generating — live voice input with barge-in, a collaborative session where multiple users' events feed one generation, or an agent that needs the client to be able to cancel individual in-flight steps over the same channel rather than a side-channel request.
**Failure mode:** load balancers and some corporate proxies don't cleanly support the upgrade, or silently kill idle sockets — a socket with no traffic for 60 seconds can be dropped by an intermediary that has no idea it's supposed to be long-lived.
**Relative cost:** highest. You provision and monitor a stateful connection per active user, need sticky sessions or a shared pub/sub layer if you scale horizontally across multiple server instances, and reimplement reconnection and ordering yourself — WebSockets give you no delivery guarantees for free.

## Raw chunked HTTP streaming (no SSE framing)

This is what most `fetch`-based streaming clients actually consume under the hood: a `ReadableStream` response body with no `data:` prefixes or event names, just raw bytes (often newline-delimited JSON) that the client parses itself.

**How it works:** identical transport to SSE — a long-lived HTTP response — but without the `text/event-stream` framing convention, so you invent your own delimiter and parsing rules.
**When it wins:** when you're not using the browser's native `EventSource` anyway (most POST-based streaming isn't, since `EventSource` can't send a request body) and you want a slightly smaller payload than SSE's `data:`/blank-line overhead, or you're streaming to a non-browser client that has no SSE parser available.
**Failure mode:** you lose SSE's built-in event-typing and the ecosystem of tooling (browser devtools understand `text/event-stream` natively) — debugging a raw byte stream is strictly harder, and you'll likely reinvent an ad hoc version of SSE's framing anyway.
**Relative cost:** same infrastructure cost as SSE, slightly higher engineering cost, since you own the framing format yourself with no standard to lean on.

## Polling

The naive baseline: the client sends a request every N milliseconds asking "is there more yet," and the server replies with whatever's accumulated since last time.

**How it works:** repeated short-lived HTTP requests instead of one long-lived one.
**When it wins:** never, for token streaming specifically — it's included here as the thing teams reach for before they know better, usually because it feels simpler to reason about than a persistent connection.
**Failure mode:** either you poll too slowly and add real latency between generation and display, or you poll too fast and multiply your request volume (and your server's connection-handling load) for no benefit — you're paying HTTP handshake overhead on every poll instead of once.
**Relative cost:** deceptively high. No persistent connection to manage, but request volume scales with poll frequency × concurrent users, and every poll is a full request/response round trip even when there's nothing new to say.

## Decision table

| | SSE | WebSockets | Raw chunked HTTP | Polling |
|---|---|---|---|---|
| Direction | Server → client | Bidirectional | Server → client | Client-initiated, repeated |
| Rides plain HTTP | Yes | No (protocol upgrade) | Yes | Yes |
| Browser auto-reconnect | Yes (native `EventSource`), no (fetch-stream) | No — you write it | No — you write it | Trivially, it's just the next request |
| Proxy/CDN friendliness | Good | Requires explicit support | Good | Excellent |
| Infra cost at scale | Low | High (stateful, sticky sessions) | Low | Moderate–high (request volume) |
| Fits "ask once, stream tokens" | Exactly | Overkill | Exactly, DIY framing | Poorly — adds latency or load |
| Fits live bidirectional interrupt | No (side-channel abort only) | Yes, natively | No | No |

## How to choose

**Default to SSE.** It's the transport every major provider's own streaming API uses, it matches the one-way shape of a chat completion exactly, and it costs the least in infrastructure and operational complexity. [A Streaming SSE Endpoint in Next.js](/learn/genai-app-dev/streaming-sse-nextjs-endpoint) and [Streaming From a Python FastAPI Backend](/learn/genai-app-dev/streaming-in-python-fastapi) both build on this default.

**Reach for WebSockets only when the client must send while the server is generating on the same channel** — live audio input, a multi-user session feeding one generation, or a tool loop where the client needs to interrupt individual steps rather than the whole request. If you don't have that requirement, a WebSocket buys you nothing SSE doesn't already give you, at several times the operational cost.

**Skip raw chunked HTTP unless you have a specific reason to avoid SSE's framing** — a non-browser consumer with no SSE parser, or a marginal payload-size concern that actually matters at your scale. For nearly everyone, SSE's standard framing is worth the few extra bytes per chunk.

**Never reach for polling for token-level output.** It's the option that looks simplest to implement and is, in practice, the most expensive at scale and the worst user experience of all four.

**Related:** [SSE vs. WebSockets for Streaming LLM Output](/learn/genai-app-dev/sse-vs-websockets), [How Token Streaming Works End to End](/learn/genai-app-dev/streaming-response-fundamentals), [A Streaming SSE Endpoint in Next.js](/learn/genai-app-dev/streaming-sse-nextjs-endpoint), [Streaming Failure Modes and How to Survive Them](/learn/genai-app-dev/streaming-failure-modes)
