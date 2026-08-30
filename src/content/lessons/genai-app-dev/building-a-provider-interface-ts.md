---
title: "Designing a Common Provider Interface"
track: "genai-app-dev"
status: live
summary: "Write a typed LLMProvider interface exposing complete, stream, and countTokens so the rest of your app never imports a vendor SDK directly."
duration: "8 min read"
---

Every lesson after this one in this module — the adapters, the failover router, the response normalization — builds on one typed interface. Get its shape right once and everything downstream gets simpler; get it wrong and you'll be threading a new field through six files every time a provider adds a feature.

## What we're building

An `LLMProvider` interface in TypeScript, with a Python `Protocol` that mirrors it, covering three operations every provider-touching feature in your app actually needs: generate a full completion, stream one token at a time, and count tokens before you send a request (for budget checks and context-window trimming — see [Context Limits and Trimming](/learn/genai-app-dev/trimming-conversation-history)). We'll also define the normalized request and response types that make [why-abstract-the-provider](/learn/genai-app-dev/why-abstract-the-provider)'s normalize/passthrough line concrete in code.

## Setup

No dependencies yet — this lesson is pure types and one in-memory fake adapter so you can see the interface work end to end before wiring up a real SDK in [Writing Two Adapters Behind One Interface](/learn/genai-app-dev/provider-adapter-anthropic-openai). If you're following along in a real project:

```bash
mkdir -p src/llm
touch src/llm/types.ts src/llm/provider.ts
```

### Step 1 — Define the shared vocabulary

Start with the pieces every provider needs to agree on: messages, tool specs, and the finish-reason enum. These are the "normalize" side of the line from [Why (and How Far) to Abstract the Provider](/learn/genai-app-dev/why-abstract-the-provider).

```ts
// src/llm/types.ts

export type Role = "system" | "user" | "assistant" | "tool";

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface Message {
  role: Role;
  content: string;
  toolCallId?: string;      // set on role "tool": which call this answers
  toolCalls?: ToolCall[];   // set on role "assistant": calls the model made
  providerOptions?: Record<string, unknown>; // escape hatch — see why-abstract-the-provider
}

export interface ToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
}

// A small, closed vocabulary every provider's real finish reason maps onto.
export type FinishReason = "stop" | "length" | "tool_call" | "content_filter" | "error";

export interface Usage {
  inputTokens: number;
  outputTokens: number;
}

export interface CallOptions {
  model: string;
  maxTokens: number;
  temperature?: number;
  tools?: ToolSpec[];
  stopSequences?: string[];
  providerOptions?: Record<string, unknown>;
}
```

> **Why this step?** Every one of these fields is something application code branches on — retry logic checks `finishReason`, billing code reads `usage`, the tool loop reads `toolCalls`. If it's not in this shared vocabulary, an adapter has nowhere honest to put it, which is exactly the kind of leak this module keeps coming back to.

### Step 2 — Define the response and streaming shapes

```ts
// src/llm/types.ts (continued)

export interface CompletionResult {
  content: string;
  toolCalls: ToolCall[];
  finishReason: FinishReason;
  usage: Usage;
  raw: unknown; // the original provider payload, for debugging — never branch on this
}

export type StreamEvent =
  | { type: "text"; delta: string }
  | { type: "tool_call_delta"; index: number; delta: Partial<ToolCall> }
  | { type: "done"; finishReason: FinishReason; usage: Usage };
```

> **Why this step?** `raw` matters as much as the normalized fields — see [Normalizing Responses Across Providers](/learn/genai-app-dev/normalizing-responses-across-providers) for why you always keep an escape hatch back to the untouched payload instead of normalizing so aggressively that debugging requires reading adapter source. The `StreamEvent` union is deliberately small: three cases cover every provider's SSE stream once the adapter has done its job, which is what makes your streaming UI code provider-agnostic.

### Step 3 — Write the interface itself

```ts
// src/llm/provider.ts
import type { Message, CallOptions, CompletionResult, StreamEvent } from "./types";

export interface LLMProvider {
  readonly name: string;

  complete(messages: Message[], options: CallOptions): Promise<CompletionResult>;

  stream(messages: Message[], options: CallOptions): AsyncIterable<StreamEvent>;

  countTokens(messages: Message[], model: string): Promise<number>;
}
```

Three methods, no more. `complete` and `stream` are the two ways any feature actually consumes a model. `countTokens` is separate from both because you often need it *before* deciding what to send — trimming history to fit a [context window](/learn/genai-app-dev/trimming-conversation-history), or picking which model in a routing chain can even accept the request.

> **Why this step?** Keeping the interface to three methods is a deliberate constraint, not an oversight. Every method you add here is one every adapter must implement, correctly, forever. Anything that's only needed by one provider goes in `providerOptions`, not in a new interface method.

### Step 4 — A minimal fake adapter, to prove the shape works

Before wiring a real SDK, confirm the interface is usable with a trivial in-memory implementation:

```ts
// src/llm/fake-provider.ts
import type { LLMProvider } from "./provider";
import type { Message, CallOptions, CompletionResult, StreamEvent } from "./types";

export class FakeProvider implements LLMProvider {
  readonly name = "fake";

  async complete(messages: Message[], options: CallOptions): Promise<CompletionResult> {
    const lastUser = messages.filter(m => m.role === "user").at(-1);
    return {
      content: `echo: ${lastUser?.content ?? ""}`,
      toolCalls: [],
      finishReason: "stop",
      usage: { inputTokens: messages.length * 10, outputTokens: 5 },
      raw: null,
    };
  }

  async *stream(messages: Message[], options: CallOptions): AsyncIterable<StreamEvent> {
    const result = await this.complete(messages, options);
    for (const word of result.content.split(" ")) {
      yield { type: "text", delta: word + " " };
    }
    yield { type: "done", finishReason: result.finishReason, usage: result.usage };
  }

  async countTokens(messages: Message[], model: string): Promise<number> {
    return messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0);
  }
}
```

> **Why this step?** This is the fastest way to catch a bad interface design: if a trivial fake adapter feels awkward to write, a real one implementing Anthropic's or OpenAI's actual SDK will be worse. Notice `stream` is built on top of `complete` here purely for the fake — real adapters do the reverse, streaming natively and assembling a `complete` result by consuming their own stream when a caller wants the non-streaming form.

### Step 5 — Code the app against the interface, never the SDK

```ts
// src/features/summarize.ts
import type { LLMProvider } from "../llm/provider";

export async function summarize(provider: LLMProvider, text: string): Promise<string> {
  const result = await provider.complete(
    [
      { role: "system", content: "Summarize in one sentence." },
      { role: "user", content: text },
    ],
    { model: "default", maxTokens: 100 },
  );
  return result.content;
}
```

`summarize` never imports `@anthropic-ai/sdk` or `openai`. It takes an `LLMProvider` and calls the interface. Swapping providers, adding a second provider, or wrapping this in a failover router all become changes at the call site that constructs the provider — never here.

## Run it

```ts
import { FakeProvider } from "./llm/fake-provider";
import { summarize } from "./features/summarize";

const provider = new FakeProvider();
summarize(provider, "Long article text here...").then(console.log);
// -> "echo: Long article text here..."
```

Swap `new FakeProvider()` for a real adapter later and `summarize` doesn't change at all — that's the whole point of the exercise.

## Harden it

A few things worth adding before this interface meets real traffic:

- **A discriminated `ProviderError` type**, not raw exceptions, so callers can pattern-match on `rateLimited | invalidRequest | serverError | unknown` instead of parsing error message strings. Covered fully in [Normalizing Responses: Usage, Finish Reasons, and Errors](/learn/genai-app-dev/normalizing-responses-across-providers).
- **A default `providerOptions` of `{}`** in adapters rather than `undefined`, so downstream code can do `options.providerOptions?.anthropic ?? {}` without a null check chain everywhere.
- **An `abortSignal?: AbortSignal` on `CallOptions`** so callers can cancel a `stream()` — required for cancel/regenerate behavior in a streaming chat UI.

## Extend it

### The Python parallel

The same interface as a `Protocol`, for a Python backend:

```python
from typing import Protocol, AsyncIterator, Literal, TypedDict

Role = Literal["system", "user", "assistant", "tool"]

class ToolCall(TypedDict):
    id: str
    name: str
    arguments: dict

class Message(TypedDict, total=False):
    role: Role
    content: str
    tool_call_id: str
    tool_calls: list[ToolCall]
    provider_options: dict

class Usage(TypedDict):
    input_tokens: int
    output_tokens: int

FinishReason = Literal["stop", "length", "tool_call", "content_filter", "error"]

class CompletionResult(TypedDict):
    content: str
    tool_calls: list[ToolCall]
    finish_reason: FinishReason
    usage: Usage
    raw: object

class LLMProvider(Protocol):
    name: str

    async def complete(self, messages: list[Message], model: str, max_tokens: int) -> CompletionResult: ...

    def stream(self, messages: list[Message], model: str, max_tokens: int) -> AsyncIterator[dict]: ...

    async def count_tokens(self, messages: list[Message], model: str) -> int: ...
```

`Protocol` gives you structural typing — any class with these methods satisfies `LLMProvider` without inheriting from it, which mirrors how the TypeScript `interface` works and keeps adapters decoupled from a shared base class.

Next, implement two real adapters against this interface — one for Anthropic, one for OpenAI — and see exactly where their SDKs disagree.

**Related:** [Why (and How Far) to Abstract the Provider](/learn/genai-app-dev/why-abstract-the-provider), [Writing Two Adapters Behind One Interface](/learn/genai-app-dev/provider-adapter-anthropic-openai), [Normalizing Responses Across Providers](/learn/genai-app-dev/normalizing-responses-across-providers), [SDK vs. Raw API](/learn/genai-app-dev/sdk-vs-raw-api), [Building a Provider Abstraction Layer](/learn/genai-app-dev/provider-abstraction-layers)
