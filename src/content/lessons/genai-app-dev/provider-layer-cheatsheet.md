---
title: "Provider Layer Cheatsheet"
track: "genai-app-dev"
status: live
summary: "One-page reference for the interface shape, the failover decision tree, the normalization field map, and the secret-storage ladder."
duration: "5 min read"
---

Everything in this module, compressed to the shape you'll actually reach for when adding a provider or debugging a routing decision at 2am.

## The interface — start here, then measure

```ts
interface LLMProvider {
  readonly name: string;
  complete(messages: Message[], options: CallOptions): Promise<CompletionResult>;
  stream(messages: Message[], options: CallOptions): AsyncIterable<StreamEvent>;
  countTokens(messages: Message[], model: string): Promise<number>;
}
```

Three methods. Nothing provider-specific belongs here — see the normalize/passthrough list below. Full build: [Designing a Common Provider Interface](/learn/genai-app-dev/building-a-provider-interface-ts).

## Normalize vs. passthrough

| Normalize (shared shape, every adapter) | Passthrough (`providerOptions.<vendor>`, escape hatch) |
|---|---|
| Messages (`role`, `content`, tool calls) | Prompt-caching control flags |
| `Usage` (input/output/cached tokens) | Reasoning-effort / thinking-budget knobs |
| `FinishReason` enum | Provider-specific sampling parameters |
| `ProviderError` kind | Provider-native tool-schema extensions |
| `StreamEvent` (text / tool_call_delta / done) | Anything only one vendor's model consumes |

Test: if forcing a field into a generic name would drop a real capability, it's passthrough, not normalize. Full reasoning: [Why (and How Far) to Abstract the Provider](/learn/genai-app-dev/why-abstract-the-provider).

## Failover decision tree — start here, then measure

```
error arrives
├─ 401 / 403                         → FATAL, surface immediately, never retry/fail over
├─ 429 with retry-after              → RETRY same provider, honor the wait
├─ network timeout / ECONNRESET      → RETRY same provider, capped backoff + jitter
├─ 5xx, repeated in a short window   → FAILOVER, trip circuit, next provider in chain
├─ sustained 429 (not backing off)   → FAILOVER, trip circuit, next provider in chain
└─ unrecognized error                → FAILOVER (default — never blind-retry the unknown)
```

Rule of thumb: **retry when trying the same provider again is likely to succeed; fail over when it isn't.** Full build with circuit-breaker state: [Implementing Failover and Fallback Chains](/learn/genai-app-dev/implementing-failover-and-fallback-chains).

**Streaming failover boundary:** only safe to swap providers before the first chunk reaches the client. After that, surface the error and let the UI offer regenerate — never restart a response mid-stream on a different provider.

## Normalization field map

| Concept | Anthropic | OpenAI | Normalized |
|---|---|---|---|
| Input tokens | `usage.input_tokens` | `usage.prompt_tokens` | `usage.inputTokens` |
| Output tokens | `usage.output_tokens` | `usage.completion_tokens` | `usage.outputTokens` |
| Cached tokens | `usage.cache_read_input_tokens` | `usage.prompt_tokens_details.cached_tokens` | `usage.cachedInputTokens` |
| Natural stop | `end_turn` / `stop_sequence` | `stop` | `"stop"` |
| Hit token cap | `max_tokens` | `length` | `"length"` |
| Tool call | `tool_use` | `tool_calls` | `"tool_call"` |
| Content blocked | *(no direct field — check adapter-specific signal)* | `content_filter` | `"content_filter"` |
| System prompt | top-level `system` field | a message with `role: "system"` | a `Message` with `role: "system"` |
| Tool args (non-streaming) | parsed object (`input`) | JSON string (`function.arguments`) | parsed `Record<string, unknown>` |

Full derivation, plus the `ProviderError` type and streaming-chunk folding: [Normalizing Responses: Usage, Finish Reasons, and Errors](/learn/genai-app-dev/normalizing-responses-across-providers).

## Secret storage ladder — start here, then measure

| Stage | Backend | Rotation |
|---|---|---|
| Local dev | `.env`, gitignored, `.env.example` committed | Manual, edit and restart |
| Staging | Platform-native store (Vercel/Netlify env, cloud secret manager) | Update store, redeploy or short cache TTL |
| Production | Vault/KMS behind one `getSecret()` accessor, cached with a bounded TTL | Issue new key → write to vault → wait out cache TTL → confirm no old-key traffic → revoke old key |

All three sit behind one `getSecret(name): Promise<string>` — no adapter ever reads `process.env` directly. Full build plus the pre-commit guard: [Storing Secrets: Env, Vault, and KMS Patterns](/learn/genai-app-dev/secret-storage-env-vault-kms).

**Threat model, one line:** a leaked key is a bearer credential — whoever has the string can spend on your account, no further proof required. Build-time secrets (baked into an image or bundle) persist in every artifact copy; runtime secrets (fetched from a store) can be revoked everywhere at once. Full reasoning: [Handling API Keys and Secrets Safely](/learn/genai-app-dev/secrets-and-key-management).

## In-app layer vs. gateway — the one-line rule

Single product, custom routing logic → build the in-app layer. Many apps, one org, centralized keys and governance → a gateway. Prototyping, no ops appetite → a hosted aggregator. Already committed to one cloud vendor → their multi-model endpoint. Full comparison: [Build Your Own Layer or Use a Gateway?](/learn/genai-app-dev/gateway-vs-in-app-abstraction).

## The two leak directions

**Leak** (provider detail escapes through a field meant to be generic): a raw SDK exception reaching the UI, an unrecognized passthrough field forwarded verbatim into a request body, `raw` logged unfiltered, a real content-filter block silently mapped to `"stop"`.

**Over-abstraction** (a real capability hidden behind a generic field that can't express it): `enableTools?: boolean` instead of a typed `ToolSpec[]`, a caching flag with no way to say what gets cached.

Both, with the fix for each: [When the Abstraction Leaks (and Over-Abstraction)](/learn/genai-app-dev/provider-abstraction-leaks).

## Quick pre-adapter checklist

Before wiring in a new provider:

- [ ] Map its finish/stop reasons onto the closed `FinishReason` enum — check explicitly for its content-filter signal, don't let it fall through a default.
- [ ] Map its usage fields, preserving the cached/fresh token split if it has one.
- [ ] Write a `normalize<Provider>Error` function returning the shared `ProviderError` type — never let its native exception propagate.
- [ ] Fold its streaming events/chunks down to the three-case `StreamEvent` union.
- [ ] Namespace any provider-specific option under `providerOptions.<name>`, and confirm other adapters ignore it.
- [ ] Add it to the routing catalog with real capability flags (tool-calling reliability, context window) — not assumed defaults.
- [ ] Add it as a link in the `FailoverRouter` chain, from a genuinely different infrastructure than any existing link.

**Related:** [Designing a Common Provider Interface](/learn/genai-app-dev/building-a-provider-interface-ts), [Implementing Failover and Fallback Chains](/learn/genai-app-dev/implementing-failover-and-fallback-chains), [Normalizing Responses Across Providers](/learn/genai-app-dev/normalizing-responses-across-providers), [Storing Secrets: Env, Vault, and KMS Patterns](/learn/genai-app-dev/secret-storage-env-vault-kms), [When the Abstraction Leaks (and Over-Abstraction)](/learn/genai-app-dev/provider-abstraction-leaks)
