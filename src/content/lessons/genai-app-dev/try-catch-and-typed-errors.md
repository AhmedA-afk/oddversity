---
title: "Typed Errors and a Clean Error Boundary"
track: "genai-app-dev"
status: live
summary: "Normalize every provider's errors into one typed shape at the adapter, so callers branch on category instead of parsing strings."
duration: "8 min read"
---

Once you've accepted that an LLM call fails along four different axes — see [The Failure Modes of an LLM Call](/learn/genai-app-dev/failure-modes-of-llm-calls) — the next problem is that Anthropic, OpenAI, and every other provider represent those failures differently. If your call sites are full of `err instanceof AnthropicError` or `if (err.status === 429)`, you've hardcoded a provider's error shape into business logic that shouldn't care which provider is behind it.

## What we're building

A normalized `LLMError` type, a mapping function at the provider adapter that turns any raw provider error into that type, and a single error boundary that reads the category and decides what happens next: retry, fail over, or surface to the caller. This slots directly into a [provider abstraction layer](/learn/genai-app-dev/provider-abstraction-layers) — the adapter is exactly where provider-specific error shapes should stop existing.

## Setup

Assume you already have (or are building alongside this) a provider adapter interface like the one in [Building a Provider Interface in TypeScript](/learn/genai-app-dev/building-a-provider-interface-ts) — one `chat()` function per provider, called through a common interface. Error normalization lives at that same seam.

## Build it

### Step 1: Define the normalized error type

```ts
type ErrorCategory = "transient" | "permanent" | "content" | "semantic";

interface LLMError {
  category: ErrorCategory;
  retryable: boolean;
  message: string;          // safe to log, not necessarily safe to show a user
  provider: string;
  raw: unknown;              // the original error, kept for logging/debugging only
  retryAfterMs?: number;      // present when the provider told us exactly how long to wait
}

function isLLMError(x: unknown): x is LLMError {
  return typeof x === "object" && x !== null && "category" in x && "retryable" in x;
}
```

`retryable` is stored explicitly rather than derived from `category` at every call site — `content` failures are usually not retryable, but a `content` failure caused by a transient moderation-service hiccup sometimes is, and you want one place to encode that judgment, not a re-derivation scattered across the codebase.

### Step 2: Map each provider's errors at the adapter

```ts
function fromAnthropicError(err: any, provider = "anthropic"): LLMError {
  const status = err?.status;
  if (status === 429) {
    const retryAfter = err?.headers?.get?.("retry-after");
    return {
      category: "transient", retryable: true, provider, raw: err,
      message: "rate limited",
      retryAfterMs: retryAfter ? Number(retryAfter) * 1000 : undefined,
    };
  }
  if (status === 529 || status === 500 || status === 503 || err?.name === "APIConnectionTimeoutError") {
    return { category: "transient", retryable: true, provider, raw: err, message: "provider unavailable" };
  }
  if (status === 400 || status === 401 || status === 403 || status === 404) {
    return { category: "permanent", retryable: false, provider, raw: err, message: `bad request (${status})` };
  }
  // fell through the transport-level cases — treat unknown status codes as permanent,
  // never as retryable-by-default, so a new error shape fails loud instead of retrying forever
  return { category: "permanent", retryable: false, provider, raw: err, message: "unclassified provider error" };
}

function fromOpenAIError(err: any, provider = "openai"): LLMError {
  const status = err?.status;
  if (status === 429) {
    return { category: "transient", retryable: true, provider, raw: err, message: "rate limited",
      retryAfterMs: err?.headers?.["retry-after"] ? Number(err.headers["retry-after"]) * 1000 : undefined };
  }
  if (status >= 500) return { category: "transient", retryable: true, provider, raw: err, message: "provider unavailable" };
  if (status === 400 || status === 401) return { category: "permanent", retryable: false, provider, raw: err, message: `bad request (${status})` };
  return { category: "permanent", retryable: false, provider, raw: err, message: "unclassified provider error" };
}
```

This is the same normalization work covered for successful responses in [Normalizing Responses Across Providers](/learn/genai-app-dev/normalizing-responses-across-providers) and for the adapter shape generally in [Provider Adapter: Anthropic + OpenAI](/learn/genai-app-dev/provider-adapter-anthropic-openai) — applied here to the failure path instead of the success path. A response and an error are the same kind of provider-specific shape that needs one normalization point.

### Step 3: Fold in content and semantic categories after a successful transport call

A response can come back with HTTP 200 and still be a `content` or `semantic` failure — that check happens after the transport-level try/catch, not inside it:

```ts
function checkCompletion(response: NormalizedResponse): LLMError | null {
  if (response.stopReason === "content_filter") {
    return { category: "content", retryable: false, provider: response.provider, raw: response, message: "content filtered" };
  }
  if (response.stopReason === "max_tokens") {
    return { category: "content", retryable: true, provider: response.provider, raw: response, message: "truncated output" };
    // retryable here means "worth retrying with a larger max_tokens budget," not "retry unchanged"
  }
  return null; // transport and content both clean — semantic checking happens in output validation, not here
}
```

Semantic failures (confidently wrong output) aren't caught at this layer at all — nothing about the response shape flags them. That's the job of [Output Validation and Moderation Gates](/learn/genai-app-dev/output-validation-and-moderation), which runs after this boundary, not inside it.

### Step 4: One error boundary that decides the outcome

```ts
async function handleLLMError(error: LLMError): Promise<"retry" | "failover" | "surface"> {
  if (error.category === "transient" && error.retryable) return "retry";
  if (error.category === "permanent") return "surface"; // config problem — retrying can't help, page someone
  if (error.category === "content" && error.message === "content filtered") return "surface"; // honest refusal, not a bug
  if (error.category === "content" && error.retryable) return "retry"; // truncation — retry with adjusted params
  return "failover"; // unclassified or repeated transient failure — try the backup provider
}
```

Every call site funnels through this one function instead of re-deciding retry-vs-surface-vs-failover from scratch. That decision then feeds directly into [Exponential Backoff With Jitter](/learn/genai-app-dev/exponential-backoff-with-jitter) for the retry path and [model routing and failover](/learn/genai-app-dev/model-routing-and-failover) for the failover path.

## Run it

```ts
try {
  const response = await provider.chat(messages);
  const contentError = checkCompletion(response);
  if (contentError) throw contentError;
  return response;
} catch (err) {
  const llmError = isLLMError(err) ? err : fromAnthropicError(err);
  const action = await handleLLMError(llmError);
  if (action === "retry") return withRetry(() => provider.chat(messages));
  if (action === "failover") return backupProvider.chat(messages);
  throw llmError; // surface — the caller decides what the user sees
}
```

Notice the caller never inspects a status code or a provider-specific error class. It reads `category`, gets back one of three verbs, and acts on the verb.

## Harden it

Keep `raw` on every `LLMError` even though you never show it to a user — it's the difference between a log line that says "provider error" and one that lets you reproduce the exact failure. Attach a request or correlation ID to every `LLMError` too, so a support ticket referencing a bad response can be traced back to the exact call, provider, and category that produced it — this is the seam [structured logging](/learn/genai-app-dev/logging-prompts-and-completions-safely) hangs off of.

## Extend it

This type is the load-bearing piece the rest of this module builds on: [Exponential Backoff With Jitter](/learn/genai-app-dev/exponential-backoff-with-jitter) reads `retryable` and `retryAfterMs` directly, and [Timeouts, Deadlines, and Circuit Breakers](/learn/genai-app-dev/timeouts-and-circuit-breakers) counts `transient` failures per provider to decide when to trip. Add new provider adapters by writing one more `fromXError` function — every downstream consumer of `LLMError` needs no changes at all.

**Related:** [The Failure Modes of an LLM Call](/learn/genai-app-dev/failure-modes-of-llm-calls), [Building a Provider Interface in TypeScript](/learn/genai-app-dev/building-a-provider-interface-ts), [Provider Adapter: Anthropic + OpenAI](/learn/genai-app-dev/provider-adapter-anthropic-openai), [Exponential Backoff With Jitter](/learn/genai-app-dev/exponential-backoff-with-jitter), [Timeouts, Deadlines, and Circuit Breakers](/learn/genai-app-dev/timeouts-and-circuit-breakers)
