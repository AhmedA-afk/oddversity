---
title: "Quiz: Provider Layer and Secrets"
track: "genai-app-dev"
status: live
summary: "Ten questions on interface design, retry-vs-failover, response normalization, and secret handling — confirm you're ready before shipping."
duration: "6 min read"
---

Ten questions covering the module: the `LLMProvider` interface, the retry-vs-failover boundary, response normalization pitfalls, and secret handling. The last one is a scenario — work through it before checking the answer.

## 1. Interface shape

Why does [Designing a Common Provider Interface](/learn/genai-app-dev/building-a-provider-interface-ts) deliberately keep `LLMProvider` to three methods (`complete`, `stream`, `countTokens`)?

A. Because TypeScript interfaces perform worse with more methods
B. Because every method added is one every adapter must implement correctly forever, and provider-specific needs belong in `providerOptions` instead
C. Because streaming and non-streaming calls must always be handled by separate classes
D. Because three is the maximum number of methods an interface can have in TypeScript

<details><summary>Answer</summary>

**Correct: B.** Every interface method is a maintenance obligation multiplied by every current and future adapter. Keeping the interface narrow and pushing provider-specific needs into the `providerOptions` escape hatch keeps that obligation small.

- A is false — interface size has no meaningful runtime performance cost in TypeScript; this is a maintainability argument, not a performance one.
- B is correct.
- C is false — a single adapter typically implements both `complete` and `stream`; nothing requires separate classes.
- D is false — TypeScript places no limit on interface method count; three is a deliberate design choice, not a language constraint.

</details>

## 2. Normalize or passthrough?

A team wants to expose Anthropic's prompt-caching control (which content blocks get cached, and for how long) through the shared `LLMProvider` interface. Which approach does [Why (and How Far) to Abstract the Provider](/learn/genai-app-dev/why-abstract-the-provider) recommend?

A. Add an `enableCaching: boolean` field to `CallOptions` so it's available on every provider
B. Leave caching out of the interface entirely, since only one provider supports it
C. Expose it through a namespaced `providerOptions.anthropic` field that only the Anthropic adapter reads, while other adapters ignore it
D. Add a new required method, `configureCaching()`, to the `LLMProvider` interface

<details><summary>Answer</summary>

**Correct: C.** This preserves the full expressiveness of Anthropic's caching control (which blocks, what TTL) without forcing every other provider's adapter to pretend it supports something it doesn't.

- A is the over-abstraction failure mode — a boolean can't express *which* content gets cached, so it downgrades the feature to whatever the least flexible provider can do (or to nothing at all).
- B is wrong — the point of passthrough is that you don't have to choose between "generic and useless" and "left out entirely."
- C is correct.
- D is wrong — adding a required interface method forces every adapter, including ones with no equivalent feature, to implement it.

</details>

## 3. Retry vs. failover

A request to your primary provider returns HTTP 429 with a `retry-after: 3` header. Per [Implementing Failover and Fallback Chains](/learn/genai-app-dev/implementing-failover-and-fallback-chains), what should the router do first?

A. Immediately trip the circuit and fail over to the next provider in the chain
B. Retry the same provider after the indicated wait — the provider told you exactly how long to wait
C. Surface the error to the caller immediately, since 429 is never retryable
D. Retry the same provider instantly, with no wait

<details><summary>Answer</summary>

**Correct: B.** A 429 with an explicit `retry-after` is the provider giving you the exact wait that's likely to succeed — honoring it is both correct and the fastest path back to a successful response.

- A is premature — a single 429 with guidance isn't the "sustained, provider is degraded" pattern that justifies failover; that's reserved for repeated 5xx or 429s that keep recurring.
- B is correct.
- C is wrong — 429 is explicitly retryable, that's what `retry-after` is for.
- D ignores the provider's own guidance and risks hitting the same limit again immediately.

</details>

## 4. Retry vs. failover, continued

Your primary provider returns three consecutive HTTP 500s within ten seconds. What's the correct action?

A. Keep retrying the same provider — five hundreds happen sometimes and a sixth attempt will likely succeed
B. Trip that provider's circuit and fail over to the next provider in the chain
C. Surface a fatal error to the caller, since 5xx errors are never retryable or recoverable
D. Switch the request to streaming mode, which bypasses 5xx errors

<details><summary>Answer</summary>

**Correct: B.** A repeated pattern within a short window, not an isolated blip, is exactly the signal the retry-vs-failover boundary uses to decide the same provider trying again isn't likely to help — trip the circuit and move to the next link in the chain.

- A ignores the pattern — one 500 is worth a retry, three in ten seconds is a provider having a bad day, and continuing to hammer it adds latency before you reach something that works.
- B is correct.
- C is wrong — 5xx is exactly the category failover exists to route around, not a dead end.
- D is a non sequitur — streaming mode doesn't change server-side error behavior.

</details>

## 5. Normalization pitfalls

[Normalizing Responses Across Providers](/learn/genai-app-dev/normalizing-responses-across-providers) points out that Anthropic's `end_turn` and `stop_sequence` both collapse into the normalized `"stop"` finish reason. Why does the lesson say to keep the `raw` field on `CompletionResult` rather than considering this collapse a solved problem?

A. `raw` is required by the TypeScript compiler for any discriminated union
B. Some app logic — like detecting whether a custom stop sequence was hit — needs the distinction that the normalized collapse throws away, and `raw` is the only place it still exists
C. The collapse is reversible from the normalized `finishReason` alone, so `raw` is just a convenience
D. Anthropic's API does not return a `stop_reason` field at all, so `raw` is the only source for it

<details><summary>Answer</summary>

**Correct: B.** Normalization is a deliberate, useful simplification for the common case, but it's lossy — and `raw` is the escape hatch back to the full-fidelity original for the cases that need the distinction it collapsed away.

- A is false — this has nothing to do with compiler requirements; it's an information-preservation decision.
- B is correct.
- C is false — the whole point is that the collapse is *not* reversible from the normalized value alone; that's exactly why `raw` is needed.
- D is false — Anthropic does return `stop_reason`; it's the normalization step that collapses its values into a smaller vocabulary.

</details>

## 6. Usage normalization

Why does [Normalizing Responses Across Providers](/learn/genai-app-dev/normalizing-responses-across-providers) recommend keeping a separate `cachedInputTokens` field on the normalized `Usage` type, rather than folding cached tokens into `inputTokens` and calling it done?

A. Cached and fresh tokens are usually billed at different rates, so collapsing them loses the information billing code needs to compute accurate cost
B. Providers don't allow cached token counts to be summed with fresh token counts
C. `cachedInputTokens` is required for the `countTokens` method to work at all
D. It has no real effect — it's included purely for symmetry with `outputTokens`

<details><summary>Answer</summary>

**Correct: A.** Cache-read pricing is typically lower than fresh-input pricing, so a billing or cost-budget calculation that only sees a combined `inputTokens` number will overstate cost — the split is what makes downstream cost tracking accurate.

- A is correct.
- B misstates the issue — the numbers can be summed arithmetically; the problem is losing the *pricing-relevant* distinction, not an inability to add them.
- C is false — `countTokens` is a separate, pre-request estimate unrelated to post-response usage reporting.
- D is false — it has a direct, practical effect on cost-budget and billing accuracy, not merely cosmetic symmetry.

</details>

## 7. Secrets: build-time vs. runtime

Per [Handling API Keys and Secrets Safely](/learn/genai-app-dev/secrets-and-key-management), why is baking an API key into a Docker image via a build-time `ARG`/`ENV` worse than fetching it at runtime through `getSecret()`?

A. Docker images cannot contain environment variables at all
B. Build-time secrets are frozen into every copy of the image — including registry layers and cached builds — and rotating the key in the provider dashboard doesn't remove those copies
C. Runtime secrets are always faster to fetch than build-time secrets
D. Docker automatically encrypts any value passed via `ENV`

<details><summary>Answer</summary>

**Correct: B.** The risk isn't that the build-time approach is technically incapable — it's that the key persists in every artifact copy indefinitely, with no way for a provider-side revocation to reach those copies, unlike a runtime fetch that can be cut off everywhere at once.

- A is false — Docker images can and do contain environment variables; that's exactly the mechanism being warned against.
- B is correct.
- C is a plausible-sounding but incorrect generalization — the lesson's concern is exposure surface and revocability, not fetch latency.
- D is false — Docker's `ENV` instruction does not encrypt values; they're visible in `docker history` and image layers.

</details>

## 8. Secret storage ladder

Per [Storing Secrets: Env, Vault, and KMS Patterns](/learn/genai-app-dev/secret-storage-env-vault-kms), what makes the described key rotation "zero-downtime"?

A. The old key is deleted immediately when the new key is issued
B. Both keys are valid simultaneously during the transition, and the cache TTL bounds how long any process can be running with a stale (but still valid) key
C. All running processes are restarted the instant the vault is updated
D. Zero-downtime rotation requires disabling the `getSecret()` cache entirely

<details><summary>Answer</summary>

**Correct: B.** Because the old and new keys are both active during the overlap window, and every process's cache expires within a known TTL, there's no moment where a request holds a key that's already been invalidated.

- A is the opposite of the drill described — the old key is revoked *last*, only after confirming no traffic still depends on it.
- B is correct.
- C is false — no restart is required; processes pick up the new value on their next cache-expiry fetch.
- D is false — the cache is exactly what bounds the propagation window in a predictable way; removing it would mean every `getSecret()` call hits the vault directly.

</details>

## 9. Abstraction leaks

Per [When the Abstraction Leaks (and Over-Abstraction)](/learn/genai-app-dev/provider-abstraction-leaks), what's wrong with letting a provider SDK's raw exception propagate all the way to a user-facing error message?

A. Nothing — raw exceptions are the most accurate representation of what went wrong
B. It couples your UI's error text to whichever provider happened to answer, and exposes implementation detail (vendor names, internal error codes) users were never meant to see
C. Raw exceptions cannot be caught in a `try`/`catch` block
D. It only matters for the Anthropic adapter, not the OpenAI adapter

<details><summary>Answer</summary>

**Correct: B.** A normalized `ProviderError` type exists precisely so the UI layer maps a small, closed vocabulary to user-facing copy — independent of which vendor answered a given request.

- A is wrong in this context — accuracy for debugging (where `raw` still belongs, in logs) is different from appropriateness for a user-facing message.
- B is correct.
- C is false — raw exceptions can absolutely be caught; the mistake is *not* catching and translating them before they reach the UI.
- D is false — this failure mode applies to any adapter that skips translating its native exception into the normalized `ProviderError` type.

</details>

## 10. Scenario: routing policy for a mixed workload

Your app has three request types: (1) short ticket-tag classification, high volume, (2) a single order-status tool lookup, moderate volume, (3) open-ended multi-turn troubleshooting replies, lower volume but highest business impact. You have a cheap model with unreliable tool-calling and a strong model with reliable tool-calling and a larger context window. Following the principles from [Routing: Picking a Model Per Request](/learn/genai-app-dev/model-routing-strategies) and [Cost- and Capability-Aware Routing in Action](/learn/genai-app-dev/cost-and-capability-based-routing), what's the correct routing policy?

A. Route everything to the cheap model to minimize cost, and escalate only if a customer complains
B. Route classification to the cheap model; route the tool-lookup task to the strong model regardless of its apparent simplicity, because it requires reliable tool-calling the cheap model doesn't have; route troubleshooting to the strong model for its reasoning and context needs
C. Route by request volume alone — the two highest-volume request types get the cheap model, the lowest-volume type gets the strong model
D. Route everything to the strong model, since correctness matters more than cost for a support product

<details><summary>Answer</summary>

**Correct: B.** This checks capability requirements *before* cost, exactly as [Cost- and Capability-Aware Routing in Action](/learn/genai-app-dev/cost-and-capability-based-routing) demonstrates: the tool-lookup task looks simple by length or volume, but its correctness depends on reliable tool-calling — a capability the cheap model doesn't have — so it's excluded from the cheap-model candidate set regardless of how "simple" it looks. Classification has no such requirement, so it safely routes to the cheap model. Troubleshooting needs both reasoning quality and context, so it goes to the strong model.

- A ignores capability requirements entirely and risks silent tool-call failures on the order-lookup task — exactly the misclassification failure mode the worked example warns about.
- B is correct.
- C routes on the wrong axis — volume tells you nothing about whether a task's *correctness* depends on a capability the cheap model lacks; the tool-lookup task would be misrouted by a volume-only rule.
- D is safe but leaves the cost saving from routing the classification task entirely on the table for no correctness benefit — classification has no capability requirement that the cheap model fails to meet.

</details>

**Related:** [Designing a Common Provider Interface](/learn/genai-app-dev/building-a-provider-interface-ts), [Implementing Failover and Fallback Chains](/learn/genai-app-dev/implementing-failover-and-fallback-chains), [Normalizing Responses Across Providers](/learn/genai-app-dev/normalizing-responses-across-providers), [Storing Secrets: Env, Vault, and KMS Patterns](/learn/genai-app-dev/secret-storage-env-vault-kms), [Provider Layer Cheatsheet](/learn/genai-app-dev/provider-layer-cheatsheet)
