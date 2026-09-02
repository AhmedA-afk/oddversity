---
title: "When the Abstraction Leaks (and Over-Abstraction)"
track: "genai-app-dev"
status: live
summary: "Six real ways a provider layer either leaks vendor-specific detail through or hides too much of it — with the smell and the fix for each."
duration: "8 min read"
---

A provider layer fails in exactly two directions: it leaks provider-specific detail through fields that were supposed to be generic, or it hides a provider's real feature behind a generic field that can't express it. [Why (and How Far) to Abstract the Provider](/learn/genai-app-dev/why-abstract-the-provider) drew the line between normalize and passthrough in principle. These are the six ways teams actually cross it in production.

### The mistake: raw provider errors reaching the UI

**Why it's wrong:** an adapter that doesn't catch and translate its provider's native exception lets that exception propagate all the way to a route handler, and from there, often verbatim, into an error response the client renders.

**Symptom:** a user sees `"Error: 429 rate_limit_exceeded — please retry after 12s"` in a toast, or worse, a stack trace mentioning `@anthropic-ai/sdk` in a production error page. Support tickets reference provider names your users were never supposed to know about, and a provider swap changes what error text ships to customers even though nothing about your product changed.

**Fix:** every adapter throws the `ProviderError` discriminated type from [Normalizing Responses Across Providers](/learn/genai-app-dev/normalizing-responses-across-providers) — `rateLimited | invalidRequest | authError | serverError | timeout | unknown` — and your UI layer maps that small, closed vocabulary to user-facing copy. The raw exception still exists, attached as `raw`, but only for your logs.

### The mistake: passthrough cache-control flags silently mismapped

**Why it's wrong:** a passthrough field like `providerOptions.anthropic.cacheControl` is supposed to be read only by the Anthropic adapter and ignored by every other adapter. If an adapter reads the *wrong* provider's namespace by accident — or worse, forwards an unrecognized field straight into the request body instead of dropping it — you get either a silent no-op (caching never actually applies) or a hard 400 from a provider that rejects an unexpected field.

**Symptom:** prompt caching looks configured in code but your token-usage numbers show no cached-token savings ([Normalizing Responses](/learn/genai-app-dev/normalizing-responses-across-providers) covers where that number lives), or a provider swap suddenly throws `invalidRequest` errors on requests that used to work.

**Fix:** namespace passthrough strictly (`providerOptions.anthropic`, `providerOptions.openai`, never a flat shared object) and have every adapter explicitly read only its own namespace and explicitly drop the rest — never forward an object wholesale into a provider's request body. Test this by asserting, per adapter, that an option meant for a *different* provider produces no change in the request sent.

### The mistake: hiding a provider's tool-calling behind a boolean

**Why it's wrong:** this is the over-abstraction direction — a `CallOptions` field like `enableTools?: boolean` looks clean but can't express which tools, what schema, whether calls can run in parallel, or any of the actual decisions a caller needs to make. It quietly downgrades every provider's tool-calling to whatever the least expressive one can do.

**Symptom:** a teammate asks how to pass a specific tool schema and the honest answer is "the interface doesn't support that," even though the adapter's underlying SDK call handles it fine. This is the exact case walked through in [Why (and How Far) to Abstract the Provider](/learn/genai-app-dev/why-abstract-the-provider) — worth revisiting there for the full before/after.

**Fix:** normalize the shape (a `ToolSpec[]` on `CallOptions`, as built in [Designing a Common Provider Interface](/learn/genai-app-dev/building-a-provider-interface-ts)), not the decision of whether to use it. The interface should make tool-calling *usable* generically, not *optional* as a single flag.

### The mistake: logging the unfiltered `raw` payload

**Why it's wrong:** `raw` on `CompletionResult` exists deliberately, as an escape hatch back to the untouched provider response — but it's also the field most likely to contain the full prompt, the full completion, and anything a user typed, none of which should land in a log aggregator, an error-tracking service, or a metrics dashboard without redaction.

**Symptom:** a security review or a data-handling audit finds customer message content sitting in a third-party logging service, traced back to a debug log line that dumped `result.raw` when a request looked slow.

**Fix:** treat `raw` the same way you'd treat any field carrying secrets — never log it directly. If you need it for debugging, log it to a short-retention, access-controlled store, redacted the same way [safe prompt/completion logging](/learn/genai-app-dev/logging-prompts-and-completions-safely) recommends for normalized fields.

### The mistake: silently collapsing a real content-filter block into `"stop"`

**Why it's wrong:** as covered in [Normalizing Responses Across Providers](/learn/genai-app-dev/normalizing-responses-across-providers), not every provider has a first-class `content_filter` finish reason — a blocked response can surface as an empty content block or a response-level flag instead. If your adapter's default case maps anything unrecognized to `"stop"`, a genuinely moderated response looks, to your app, identical to a normal successful completion.

**Symptom:** your moderation and safety logging shows zero content-filter events from one provider while catching a nonzero rate from another, even though both providers are filtering at similar rates — the metric is measuring your adapter's mapping gaps, not actual provider behavior.

**Fix:** check for each provider's specific block signal explicitly, in the adapter, and map it to `"content_filter"` deliberately — never let it fall through a generic default case that was written for a different purpose.

### The mistake: assuming a feature that exists on one provider exists on all of them

**Why it's wrong:** streaming tool-call support, forced tool choice, parallel tool calls, and prompt caching are not universal — some providers support a given feature, some don't, and some support a different version of it. Code that reads a passthrough field and assumes every adapter has an equivalent will work on the provider it was tested against and fail, often confusingly, the moment a different adapter handles the same call.

**Symptom:** a feature works in staging (tested against one provider) and breaks in a failover scenario (traffic lands on a backup provider from [Implementing Failover and Fallback Chains](/learn/genai-app-dev/implementing-failover-and-fallback-chains) that doesn't support the same passthrough option) — with no error, just degraded behavior nobody notices until a user reports it.

**Fix:** passthrough fields are allowed to be a no-op on providers that don't support them — that's the honest state. If a feature is load-bearing (your app breaks without it, not just degrades), it belongs in a capability check like the one from [Cost- and Capability-Aware Routing in Action](/learn/genai-app-dev/cost-and-capability-based-routing) — filter it out of the routing/failover candidate set entirely, rather than letting a request reach a provider that will silently ignore the thing you needed.

## Pre-flight checklist

Before shipping a change to any adapter or the interface itself, check:

- [ ] Does every adapter throw the normalized `ProviderError` type, never its SDK's native exception?
- [ ] Is every passthrough field namespaced per provider, and does every adapter ignore namespaces that aren't its own?
- [ ] Is there any `CallOptions` boolean that's quietly standing in for a richer, provider-specific capability?
- [ ] Is `raw` ever logged, displayed, or stored without redaction?
- [ ] Does the finish-reason mapping explicitly handle each provider's block/filter signal, rather than defaulting unrecognized values to `"stop"`?
- [ ] Does anything load-bearing depend on a passthrough field that not every provider in your failover chain actually supports?

**Related:** [Why (and How Far) to Abstract the Provider](/learn/genai-app-dev/why-abstract-the-provider), [Normalizing Responses: Usage, Finish Reasons, and Errors](/learn/genai-app-dev/normalizing-responses-across-providers), [Designing a Common Provider Interface](/learn/genai-app-dev/building-a-provider-interface-ts), [Implementing Failover and Fallback Chains](/learn/genai-app-dev/implementing-failover-and-fallback-chains), [Cost- and Capability-Aware Routing in Action](/learn/genai-app-dev/cost-and-capability-based-routing)
