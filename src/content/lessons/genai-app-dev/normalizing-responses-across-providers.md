---
title: "Normalizing Responses: Usage, Finish Reasons, and Errors"
track: "genai-app-dev"
status: live
summary: "The full mapping table for usage fields, finish reasons, error taxonomies, and streaming chunks — and where normalization loses information."
duration: "9 min read"
---

> **Optional depth.** [Writing Two Adapters Behind One Interface](/learn/genai-app-dev/provider-adapter-anthropic-openai) showed the three disagreement points inline, with enough mapping code to make two adapters work. This lesson generalizes that into the full table and the code you'd hand a teammate adding a third provider — read it when you're building that, not before.

Your retry logic branches on `finishReason`. Your billing pipeline sums `usage`. Your error handler pattern-matches on error type. Every one of those is a place where an unnormalized field forks your business logic per vendor without you noticing until the second provider's traffic hits it.

## The four places providers disagree

Every provider's real API disagrees with every other one in roughly the same four places: what they call token counts, what vocabulary they use for why a response ended, how they shape an error, and how they frame a streamed response. None of these disagreements are arbitrary — each vendor's shape reflects a real design decision on their end — but your app needs one shape regardless of whose decision it was.

## Usage: field names first, semantics second

The field-name mismatch is the shallow part. Anthropic and OpenAI already appeared side by side in [the adapters lesson](/learn/genai-app-dev/provider-adapter-anthropic-openai):

| Concept | Anthropic | OpenAI |
|---|---|---|
| Input tokens | `usage.input_tokens` | `usage.prompt_tokens` |
| Output tokens | `usage.output_tokens` | `usage.completion_tokens` |
| Cached input tokens | `usage.cache_read_input_tokens` | `usage.prompt_tokens_details.cached_tokens` |

The deeper issue is semantics, not names: **cached tokens are usually billed at a different rate than fresh ones**, and if your normalized `Usage` type only has `inputTokens` and `outputTokens`, you've thrown away the information your billing code needs to compute an accurate cost. The fix is to normalize the shape *and* keep the distinction that matters economically:

```ts
export interface Usage {
  inputTokens: number;        // total, including cached
  outputTokens: number;
  cachedInputTokens?: number; // subset of inputTokens billed at cache-read rate
}

function normalizeAnthropicUsage(u: any): Usage {
  return {
    inputTokens: u.input_tokens,
    outputTokens: u.output_tokens,
    cachedInputTokens: u.cache_read_input_tokens ?? 0,
  };
}

function normalizeOpenAIUsage(u: any): Usage {
  return {
    inputTokens: u.prompt_tokens,
    outputTokens: u.completion_tokens,
    cachedInputTokens: u.prompt_tokens_details?.cached_tokens ?? 0,
  };
}
```

This feeds directly into [prompt caching](/learn/genai-app-dev/prompt-caching-for-speed-and-cost) and [cost budgets](/learn/genai-app-dev/cost-budgets-and-usage-tracking) — both need the cached/fresh split to report accurate numbers, and both break silently (reporting inflated cost) if you normalized it away.

## Finish reasons: a lossy but necessary collapse

Providers don't just use different names for "why did the response end" — they use different *granularities*. Anthropic's `stop_reason` and OpenAI's `finish_reason` don't line up one-to-one:

| Normalized `FinishReason` | Anthropic `stop_reason` | OpenAI `finish_reason` |
|---|---|---|
| `stop` | `end_turn`, `stop_sequence` | `stop` |
| `length` | `max_tokens` | `length` |
| `tool_call` | `tool_use` | `tool_calls` |
| `content_filter` | *(no direct equivalent — see below)* | `content_filter` |
| `error` | *(surfaced as an HTTP error, not a stop reason)* | *(surfaced as an HTTP error, not a stop reason)* |

Two precise tradeoffs are worth stating rather than glossing over:

**Anthropic collapses two distinct stop reasons into your one `"stop"`.** `end_turn` (the model finished naturally) and `stop_sequence` (the model hit a string you told it to stop at) are different events with different implications — if your app relies on `stopSequences` to terminate structured output at a delimiter, you may need the un-normalized `stop_reason` for that specific check. That's what `raw` on `CompletionResult` (from [the interface lesson](/learn/genai-app-dev/building-a-provider-interface-ts)) is for: normalize for the common case, keep the escape hatch for the case that needs the original.

**Anthropic has no first-class `content_filter` stop reason** the way OpenAI does — a blocked response typically surfaces differently (an empty content block, or a response-level flag depending on API version). Mapping "no clear equivalent" to `"stop"` by default is a real information loss: your moderation logging would silently miss a class of blocked responses from one provider while catching it from the other. The honest fix is to check for provider-specific block signals explicitly in each adapter and map them to `"content_filter"` rather than letting them fall through to the default case — see [When the Abstraction Leaks](/learn/genai-app-dev/provider-abstraction-leaks) for exactly this failure mode.

## Error taxonomies: the `ProviderError` type

HTTP status codes overlap more than response bodies do, but not perfectly — and the error *body* shape (where the human-readable message lives, what field names the error type) differs enough that raw exceptions from two SDKs are not comparable. Build one discriminated type every adapter throws instead of letting the raw exception propagate:

```ts
export type ProviderError =
  | { kind: "rateLimited"; retryAfterMs?: number; raw: unknown }
  | { kind: "invalidRequest"; message: string; raw: unknown }
  | { kind: "authError"; raw: unknown }
  | { kind: "serverError"; status: number; raw: unknown }
  | { kind: "timeout"; raw: unknown }
  | { kind: "unknown"; raw: unknown };

function normalizeAnthropicError(err: any): ProviderError {
  const status = err.status;
  if (status === 429) return { kind: "rateLimited", retryAfterMs: parseRetryAfter(err), raw: err };
  if (status === 401 || status === 403) return { kind: "authError", raw: err };
  if (status === 400) return { kind: "invalidRequest", message: err.error?.message ?? "invalid request", raw: err };
  if (status >= 500) return { kind: "serverError", status, raw: err };
  if (err.code === "ETIMEDOUT") return { kind: "timeout", raw: err };
  return { kind: "unknown", raw: err };
}
```

`kind` is exactly the vocabulary [the failover router's error classifier](/learn/genai-app-dev/implementing-failover-and-fallback-chains) switches on to decide retry vs. failover vs. fatal — that decision only works if every adapter throws this same shape instead of its provider's native exception. `raw` stays attached at every branch, for the same reason `CompletionResult.raw` exists: normalization for logic, an escape hatch for debugging.

## Streaming chunk formats

This is where the wire shapes diverge the most. Anthropic's SSE stream sends *named event types* — `message_start`, `content_block_delta`, `message_delta`, `message_stop` — each with a different payload shape you switch on. OpenAI sends one chunk type repeatedly, with the state (is this a content delta? a tool-call delta? the final chunk?) encoded in which fields of `choices[0].delta` are present.

Neither shape is wrong — they reflect different design choices about where to put state (in the event type vs. in which fields are populated) — but your streaming UI code should never see either one directly. That's why [the interface lesson](/learn/genai-app-dev/building-a-provider-interface-ts) defines a deliberately small `StreamEvent` union:

```ts
export type StreamEvent =
  | { type: "text"; delta: string }
  | { type: "tool_call_delta"; index: number; delta: Partial<ToolCall> }
  | { type: "done"; finishReason: FinishReason; usage: Usage };
```

Every adapter's job is folding its provider's native event stream — however many named types or however many delta-field combinations it uses — down to this union before yielding. [The adapters lesson](/learn/genai-app-dev/provider-adapter-anthropic-openai) shows both foldings in full; the pattern generalizes to any provider you add later: enumerate the native event/chunk shapes, then write the `if`/`switch` that maps each one to one of these three cases.

## Where this feeds forward

A fully normalized response — usage with the cache split preserved, a finish reason with `raw` as backup, a typed `ProviderError`, and a folded stream — is what makes provider-agnostic [observability](/learn/genai-app-dev/observability-for-genai) and [safe prompt/completion logging](/learn/genai-app-dev/logging-prompts-and-completions-safely) possible in the first place. If normalization is done here, once, correctly, nothing downstream needs to know or care which provider actually answered.

**Related:** [Writing Two Adapters Behind One Interface](/learn/genai-app-dev/provider-adapter-anthropic-openai), [Designing a Common Provider Interface](/learn/genai-app-dev/building-a-provider-interface-ts), [Implementing Failover and Fallback Chains](/learn/genai-app-dev/implementing-failover-and-fallback-chains), [When the Abstraction Leaks (and Over-Abstraction)](/learn/genai-app-dev/provider-abstraction-leaks), [Observability for GenAI](/learn/genai-app-dev/observability-for-genai)
