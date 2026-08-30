---
title: "SDK vs Raw API vs Framework: Choosing Your Layer"
track: "genai-app-dev"
status: live
summary: "Four ways to build the same streaming chat endpoint, compared on control, lock-in, and how much you write yourself."
duration: "7 min read"
---

Pick a layer before you write a line of the feature, because switching later means rewriting the request path, not swapping a config value. Here's the same task — a streaming chat endpoint — built four different ways.

## Raw HTTP API

You call the provider's REST endpoint directly with `fetch` or `requests`, and parse the server-sent-event stream yourself, chunk by chunk.

```ts
const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "x-api-key": key, "content-type": "application/json" },
  body: JSON.stringify({ model, max_tokens: 512, stream: true, messages }),
});
const reader = res.body!.getReader();
// manually decode bytes, split on "\n\n", parse each "data: {...}" line
```

**When it wins:** you need to see and control exactly what crosses the wire — debugging an unfamiliar provider behavior, or building your own abstraction layer that other approaches would just get in the way of. **Failure mode:** you're now maintaining a hand-rolled SSE parser, which is easy to get subtly wrong (partial chunks split mid-event, reconnection on drop) and easy to under-test because it only breaks under real network conditions, not in a local dev loop. **Relative cost:** highest ongoing maintenance, zero dependency risk.

## Provider SDK

The official client library (`@anthropic-ai/sdk`, `openai`) wraps the same request in a typed method and hands you an async iterator over parsed events instead of raw bytes.

```ts
const stream = await anthropic.messages.stream({ model, max_tokens: 512, messages });
for await (const event of stream) {
  if (event.type === "content_block_delta") process(event.delta.text);
}
```

**When it wins:** you're building on one provider and want typed requests/responses and stream parsing handled for you, without taking on a framework's opinions about your app's structure. **Failure mode:** the abstraction is provider-specific — event shapes, error classes, and retry behavior are all that provider's own conventions, so a second provider means learning a second SDK from scratch, not reusing this code. **Relative cost:** low maintenance, moderate lock-in to one vendor's API surface.

## Vercel AI SDK

A thin, multi-provider layer purpose-built for the app-development surface: normalized streaming across providers, framework hooks (`useChat` for React) that manage stream state on the client, and a consistent tool-calling interface regardless of which model answers.

```ts
import { streamText } from "ai";
const result = streamText({ model: anthropic("claude-sonnet-4-5"), messages });
return result.toDataStreamResponse();
```

**When it wins:** you're building a chat or streaming UI in a JS/TS framework and want the client-side stream-state plumbing (partial messages, loading state, stop/regenerate) handled without writing it by hand — see [Consuming a Stream in React](/learn/genai-app-dev/consuming-a-stream-in-react) for what that plumbing looks like underneath. **Failure mode:** it's focused on the request/response/stream surface, not orchestration — reach for it on a multi-step agent pipeline with retrieval and memory, and you'll be fighting it or building alongside it rather than using it. **Relative cost:** low boilerplate, a real dependency, but a narrow one — dropping to the provider SDK underneath is a supported escape hatch, not a rewrite.

## LangChain

The broadest of the four: chains, agents, memory, retrievers, and integrations across many vector stores and tools, all expressed through its own abstractions (`Runnable`, `AgentExecutor`).

```python
from langchain_anthropic import ChatAnthropic
model = ChatAnthropic(model="claude-sonnet-4-5", streaming=True)
for chunk in model.stream(messages):
    process(chunk.content)
```

**When it wins:** the feature is genuinely multi-part — retrieval plus tool use plus multi-step reasoning — and you want the integrations assembled rather than wired by hand one at a time. **Failure mode:** debugging a failed request often means stepping through framework internals rather than your own code, and the API has changed enough across major versions that a year-old example may not run as written. **Relative cost:** lowest boilerplate for complex pipelines, highest lock-in to the framework's own concepts and its release cadence.

## Decision table

| Team size / situation | Feature complexity | Reach for |
|---|---|---|
| Solo or small team, one provider | Single call or simple streaming | Provider SDK |
| Small team, need multi-provider or fast UI iteration | Streaming chat UI, JS/TS stack | Vercel AI SDK |
| Any team, want to see every byte on the wire | Building your own abstraction layer | Raw HTTP API |
| Team assembling retrieval + tools + multi-step flows | Genuinely multi-part pipeline | LangChain (or an equivalent orchestration framework) |

## How to choose

Start from what's actually varying in your feature, not from what's popular this year. A single streaming endpoint on one provider almost never needs LangChain's surface area — you'd be importing an agent framework to make one HTTP call. Conversely, hand-rolling SSE parsing for a straightforward chat UI is time spent re-solving a problem the Vercel AI SDK already solved, unless you have a specific reason to own that code.

The default for most teams building a single-provider or dual-provider streaming feature in a JS/TS stack: **Vercel AI SDK**, dropping to the raw provider SDK for any call that needs something the framework doesn't expose yet — that's the escape hatch, not a full rewrite, because the framework is a layer *on top of* the SDK, not a replacement for it. In Python, or for genuinely multi-step pipelines regardless of language, the equivalent tradeoff is provider SDK first, framework only once the orchestration need is real and specific.

None of these choices are permanent. Plenty of features start on the raw API to learn the shape of the problem, move to an SDK once that shape is settled, and add a framework only when a second provider or a multi-step pipeline makes the boilerplate real rather than hypothetical. [SDK vs Raw API vs Framework](/learn/genai-app-dev/sdk-vs-raw-api) covers the same three-way tradeoff for a simpler, non-streaming call if you want the un-complicated version of this decision first.

**Related:** [SDK vs Raw API vs Framework](/learn/genai-app-dev/sdk-vs-raw-api), [Scaffolding a GenAI Project From Zero](/learn/genai-app-dev/scaffolding-a-genai-project), [Streaming Responses to the UI](/learn/genai-app-dev/streaming-responses-to-the-ui), [Provider Abstraction Layers](/learn/genai-app-dev/provider-abstraction-layers)
