---
title: "Why (and How Far) to Abstract the Provider"
track: "genai-app-dev"
status: live
summary: "The goal of a provider layer is swappability and failover, not hiding every vendor's best feature behind a least-common-denominator wrapper."
duration: "7 min read"
---

Every abstraction has a failure mode where it tries too hard: it hides the exact feature you needed. A provider layer built to make swapping vendors safe can, if you're not careful, also make it impossible to use the one feature that made you pick a vendor in the first place.

## What it is

[Building a Provider Abstraction Layer](/learn/genai-app-dev/provider-abstraction-layers) establishes the basic shape: one interface, multiple adapters, app code that never touches an SDK directly. This lesson is about the harder question that comes right after: *how much* do you normalize? The interface earns its keep from two things — swapping providers with a config change, and failing over automatically when one is down. Neither of those requires hiding what makes each provider distinct. They just require a stable shape for the parts your app logic actually branches on.

## The mental model

Draw a line down the middle of every field in a provider's request and response:

- **Normalize** what your application logic reads and branches on: the message list, the final text, token usage, and why the response ended (stop, length limit, tool call, content filter). If your retry logic, your billing code, or your UI has an `if` statement that depends on this field, it needs one shape across every provider.
- **Pass through** what only the model itself consumes: provider-specific tool-definition formats, prompt-caching control flags, reasoning-effort knobs, provider-specific sampling parameters. Your app doesn't branch on these — it just needs to be able to set them when a specific provider supports them.

A useful test: if hiding a field behind a generic name would require you to drop a capability to make the generic name fit every provider, it belongs in passthrough, not normalization. Anthropic's cache-control blocks and OpenAI's reasoning-effort parameter don't have a shared abstraction that preserves what either one actually does — so don't invent one.

## Why it works this way

Normalization is a promise: "this field means the same thing no matter which adapter produced it." That promise is only affordable for fields with a natural common meaning across vendors — usage counts, a small enum of finish reasons, a list of role-tagged messages. The moment you try to extend that promise to a genuinely provider-specific feature, you're forced into one of two bad outcomes: a lowest-common-denominator field that drops capability from whichever provider had the richer feature, or a fake normalization that leaks provider-specific values through a generic-looking field anyway (the exact failure explored in [When the Abstraction Leaks](/learn/genai-app-dev/provider-abstraction-leaks)).

Passthrough avoids both. It says: "here's an escape hatch, typed as `Record<string, unknown>` or similar, that the caller can fill in when they specifically want a provider's feature, and every adapter ignores what it doesn't recognize." You lose nothing, and swapping providers still works for the 90% of a request that's genuinely generic — you just accept that the 10% that isn't generic needs a conditional in the caller, not in the interface.

## A concrete example (shown)

Compare two ways of exposing prompt caching in a provider interface.

Over-abstracted (hides the feature to make it "generic"):

```ts
interface CallOptions {
  model: string;
  maxTokens: number;
  enableCaching?: boolean; // which parts get cached? for how long? no way to say.
}
```

This compiles, and it looks clean, but it can't express "cache the system prompt and the first three tool definitions, not the trailing user turn" — which is the actual decision a caller needs to make. It quietly downgrades every provider's caching to whatever the least flexible one can do.

Normalize the shape, pass through the control:

```ts
interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  providerOptions?: Record<string, unknown>; // e.g. { anthropic: { cacheControl: "ephemeral" } }
}
```

The message shape is still normalized — every adapter reads `role` and `content` the same way. But `providerOptions` is an explicit, typed escape hatch. The Anthropic adapter reads `providerOptions.anthropic` and sets cache breakpoints; the OpenAI adapter ignores it entirely (or reads `providerOptions.openai` for its own equivalent knob). Nothing generic was invented that didn't need to be, and nothing provider-specific was lost. This is the same pattern [the interface lesson](/learn/genai-app-dev/building-a-provider-interface-ts) uses for tool schemas.

## Where it shows up

You'll feel the wrong choice first when a teammate asks "how do I turn on prompt caching for this call?" and the honest answer is "you can't, the interface doesn't expose it" — even though the underlying SDK supports it fine. That's the signal that normalization went one field too far. You'll feel over-*under*-abstraction (too little) the opposite way: a provider-specific error code or field name shows up in application code or, worse, in a user-facing error message, because nothing normalized it on the way in.

## Watch out for

- **Normalizing before you have two providers.** With one adapter, every field looks "generic" because you have nothing to compare it against. Add the second provider before you finalize what's shared — the seams only show up in the diff.
- **Treating passthrough as a dumping ground.** If a field that started as provider-specific escape hatch is being read by application logic in three places, it has quietly become something you depend on generically — go normalize it properly instead of branching on `providerOptions.anthropic` all over your codebase.
- **Assuming symmetry that doesn't exist.** Not every provider has an equivalent for every other provider's specialty feature. Passthrough fields are allowed to be `undefined` for providers that don't support them — that's the honest state, not a bug to paper over.

## Where next

With the normalize/passthrough line drawn, the next step is turning it into an actual typed interface you can build adapters against.

**Related:** [Building a Provider Abstraction Layer](/learn/genai-app-dev/provider-abstraction-layers), [The Provider Landscape and Its Tradeoffs](/learn/genai-app-dev/provider-landscape-and-tradeoffs), [Designing a Common Provider Interface](/learn/genai-app-dev/building-a-provider-interface-ts), [When the Abstraction Leaks (and Over-Abstraction)](/learn/genai-app-dev/provider-abstraction-leaks), [Model Routing and Multi-Provider Failover](/learn/genai-app-dev/model-routing-and-failover)
