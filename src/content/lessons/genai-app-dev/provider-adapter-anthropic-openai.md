---
title: "Writing Two Adapters Behind One Interface"
track: "genai-app-dev"
status: live
summary: "Implement Anthropic and OpenAI adapters against the LLMProvider interface, reconciling the three places their APIs actually disagree."
duration: "9 min read"
---

An interface is a promise until something implements it. This lesson makes good on the `LLMProvider` interface from [Designing a Common Provider Interface](/learn/genai-app-dev/building-a-provider-interface-ts) with two real adapters — and shows the exact three spots where Anthropic's and OpenAI's APIs disagree enough to need real reconciliation logic, not just a rename.

## What we're building

Two classes, `AnthropicProvider` and `OpenAIProvider`, both implementing `LLMProvider`. Both call their provider's HTTP API directly with `fetch` rather than the vendor SDK — this keeps the adapter's shape fully under your control and makes the reconciliation logic visible instead of buried inside two different SDK abstractions (see [SDK vs. Raw API](/learn/genai-app-dev/sdk-vs-raw-api) for when that tradeoff is worth it more generally). By the end, swapping which one your app uses is a one-line change.

## Setup

```bash
npm install # no SDK dependency needed — both adapters use fetch
```

Keys come from a `getSecret()` accessor rather than `process.env` directly — that indirection is built out fully in [Storing Secrets: Env, Vault, and KMS Patterns](/learn/genai-app-dev/secret-storage-env-vault-kms); for this lesson, assume it resolves to a string.

### Step 1 — The Anthropic adapter

```ts
// src/llm/anthropic-provider.ts
import type { LLMProvider } from "./provider";
import type { Message, CallOptions, CompletionResult, StreamEvent, FinishReason } from "./types";
import { getSecret } from "../secrets";

const STOP_REASON_MAP: Record<string, FinishReason> = {
  end_turn: "stop",
  stop_sequence: "stop",
  max_tokens: "length",
  tool_use: "tool_call",
};

export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic";

  private toRequestBody(messages: Message[], options: CallOptions) {
    // Disagreement #1: Anthropic takes the system prompt as a top-level
    // field, not a message with role "system".
    const system = messages.find(m => m.role === "system")?.content;
    const rest = messages.filter(m => m.role !== "system");

    return {
      model: options.model,
      max_tokens: options.maxTokens,
      system,
      messages: rest.map(m => ({
        role: m.role === "tool" ? "user" : m.role, // tool results ride in a user turn
        content: m.toolCallId
          ? [{ type: "tool_result", tool_use_id: m.toolCallId, content: m.content }]
          : m.content,
      })),
      tools: options.tools?.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      })),
    };
  }

  async complete(messages: Message[], options: CallOptions): Promise<CompletionResult> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": await getSecret("ANTHROPIC_API_KEY"),
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(this.toRequestBody(messages, options)),
    });
    const data = await res.json();

    const textBlocks = data.content.filter((b: any) => b.type === "text");
    const toolBlocks = data.content.filter((b: any) => b.type === "tool_use");

    return {
      content: textBlocks.map((b: any) => b.text).join(""),
      // Disagreement #2: tool arguments arrive as a parsed object (`input`)
      // here, not a JSON string — no parsing needed for the non-streaming path.
      toolCalls: toolBlocks.map((b: any) => ({ id: b.id, name: b.name, arguments: b.input })),
      finishReason: STOP_REASON_MAP[data.stop_reason] ?? "stop",
      // Disagreement #3: usage field names are input_tokens / output_tokens.
      usage: { inputTokens: data.usage.input_tokens, outputTokens: data.usage.output_tokens },
      raw: data,
    };
  }

  async *stream(messages: Message[], options: CallOptions): AsyncIterable<StreamEvent> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": await getSecret("ANTHROPIC_API_KEY"),
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({ ...this.toRequestBody(messages, options), stream: true }),
    });

    let finishReason: FinishReason = "stop";
    let usage = { inputTokens: 0, outputTokens: 0 };
    const toolArgFragments: Record<number, string> = {};

    for await (const event of parseSSE(res.body!)) {
      if (event.type === "message_start") {
        usage.inputTokens = event.message.usage.input_tokens;
      } else if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") {
          yield { type: "text", delta: event.delta.text };
        } else if (event.delta.type === "input_json_delta") {
          // Tool-call arguments stream as raw JSON text fragments —
          // you must buffer and parse once the block closes.
          toolArgFragments[event.index] = (toolArgFragments[event.index] ?? "") + event.delta.partial_json;
          yield { type: "tool_call_delta", index: event.index, delta: {} };
        }
      } else if (event.type === "message_delta") {
        finishReason = STOP_REASON_MAP[event.delta.stop_reason] ?? "stop";
        usage.outputTokens = event.usage.output_tokens;
      }
    }
    yield { type: "done", finishReason, usage };
  }

  async countTokens(messages: Message[], model: string): Promise<number> {
    const res = await fetch("https://api.anthropic.com/v1/messages/count_tokens", {
      method: "POST",
      headers: {
        "x-api-key": await getSecret("ANTHROPIC_API_KEY"),
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(this.toRequestBody(messages, { model, maxTokens: 1 })),
    });
    return (await res.json()).input_tokens;
  }
}

// A small SSE line-splitter — real code should use a proper parser.
async function* parseSSE(body: ReadableStream<Uint8Array>): AsyncIterable<any> {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += value;
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const data = line.replace(/^data: /, "").trim();
      if (data && data !== "[DONE]") yield JSON.parse(data);
    }
  }
}
```

> **Why this step?** Notice all three disagreement points are commented inline at the exact line that handles them — that's deliberate. When a new engineer adds a third provider later, these comments are where they'll look to find the pattern to follow.

### Step 2 — The OpenAI adapter

```ts
// src/llm/openai-provider.ts
import type { LLMProvider } from "./provider";
import type { Message, CallOptions, CompletionResult, StreamEvent, FinishReason } from "./types";
import { getSecret } from "../secrets";

const FINISH_REASON_MAP: Record<string, FinishReason> = {
  stop: "stop",
  length: "length",
  tool_calls: "tool_call",
  content_filter: "content_filter",
};

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";

  private toRequestBody(messages: Message[], options: CallOptions) {
    return {
      model: options.model,
      max_tokens: options.maxTokens,
      // Disagreement #1: system prompt is just another message here.
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        tool_call_id: m.toolCallId,
        tool_calls: m.toolCalls?.map(tc => ({
          id: tc.id,
          type: "function",
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
        })),
      })),
      tools: options.tools?.map(t => ({
        type: "function",
        function: { name: t.name, description: t.description, parameters: t.parameters },
      })),
    };
  }

  async complete(messages: Message[], options: CallOptions): Promise<CompletionResult> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${await getSecret("OPENAI_API_KEY")}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(this.toRequestBody(messages, options)),
    });
    const data = await res.json();
    const choice = data.choices[0];

    return {
      content: choice.message.content ?? "",
      toolCalls: (choice.message.tool_calls ?? []).map((tc: any) => ({
        id: tc.id,
        name: tc.function.name,
        // Disagreement #2: arguments arrive as a JSON-encoded string here,
        // not a parsed object — every call site must JSON.parse it.
        arguments: JSON.parse(tc.function.arguments),
      })),
      finishReason: FINISH_REASON_MAP[choice.finish_reason] ?? "stop",
      // Disagreement #3: field names are prompt_tokens / completion_tokens.
      usage: { inputTokens: data.usage.prompt_tokens, outputTokens: data.usage.completion_tokens },
      raw: data,
    };
  }

  async *stream(messages: Message[], options: CallOptions): AsyncIterable<StreamEvent> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${await getSecret("OPENAI_API_KEY")}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        ...this.toRequestBody(messages, options),
        stream: true,
        stream_options: { include_usage: true }, // otherwise usage never arrives in the stream
      }),
    });

    let finishReason: FinishReason = "stop";
    let usage = { inputTokens: 0, outputTokens: 0 };

    for await (const chunk of parseSSE(res.body!)) {
      const choice = chunk.choices?.[0];
      if (choice?.delta?.content) {
        yield { type: "text", delta: choice.delta.content };
      }
      if (choice?.delta?.tool_calls) {
        for (const tc of choice.delta.tool_calls) {
          // Arguments arrive as string fragments here too — buffer and
          // JSON.parse only once finish_reason signals the call is complete.
          yield { type: "tool_call_delta", index: tc.index, delta: { name: tc.function?.name } };
        }
      }
      if (choice?.finish_reason) {
        finishReason = FINISH_REASON_MAP[choice.finish_reason] ?? "stop";
      }
      if (chunk.usage) {
        usage = { inputTokens: chunk.usage.prompt_tokens, outputTokens: chunk.usage.completion_tokens };
      }
    }
    yield { type: "done", finishReason, usage };
  }

  async countTokens(messages: Message[], model: string): Promise<number> {
    // OpenAI has no token-counting endpoint — approximate locally
    // (a real implementation uses a tiktoken-equivalent tokenizer for `model`).
    return messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0);
  }
}

async function* parseSSE(body: ReadableStream<Uint8Array>): AsyncIterable<any> {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const data = line.replace(/^data: /, "").trim();
      if (data && data !== "[DONE]") yield JSON.parse(data);
    }
  }
}
```

### Step 3 — Swap providers with one line

```ts
import { AnthropicProvider } from "./llm/anthropic-provider";
import { OpenAIProvider } from "./llm/openai-provider";
import { summarize } from "./features/summarize";

const provider = process.env.LLM_PROVIDER === "openai"
  ? new OpenAIProvider()
  : new AnthropicProvider(); // <- the one line that changes

summarize(provider, "...");
```

`summarize` (from the previous lesson) never changes. Everything provider-specific is contained in the two adapter files.

## Run it

Call `complete()` against a real key for each adapter with the same messages and compare `finishReason` and `usage` — they should come back in the same shape even though the wire responses look nothing alike. That's the test that the interface is actually doing its job.

## Harden it

- **`countTokens` accuracy matters more than it looks.** The OpenAI approximation above (`length / 4`) is a rough placeholder — for real budget checks against a context window, use a proper tokenizer for the target model family, not a character-count heuristic, or you'll trim conversation history either too aggressively or not enough.
- **The SSE parsers here are simplified.** Production code should handle partial chunks split mid-line, reconnect on a dropped connection, and surface a typed error rather than throwing raw JSON parse errors — see [Error Handling for LLM Calls](/learn/genai-app-dev/error-handling-for-llm-calls).
- **Never let `raw` leak into logs or UI unfiltered** — it can contain the full prompt and completion. Redact before logging, the same instinct that governs handling keys and other secrets safely, just applied to content instead.

## Extend it

The three disagreement points above — system prompt placement, tool-argument encoding, and usage field naming — are exactly the categories the next lesson turns into a general mapping table, so a third adapter (Gemini, an open-weight host, whatever comes next) has a checklist instead of a blank page.

**Related:** [Designing a Common Provider Interface](/learn/genai-app-dev/building-a-provider-interface-ts), [Normalizing Responses: Usage, Finish Reasons, and Errors](/learn/genai-app-dev/normalizing-responses-across-providers), [When the Abstraction Leaks (and Over-Abstraction)](/learn/genai-app-dev/provider-abstraction-leaks), [Error Handling for LLM Calls](/learn/genai-app-dev/error-handling-for-llm-calls), [SDK vs. Raw API](/learn/genai-app-dev/sdk-vs-raw-api)
