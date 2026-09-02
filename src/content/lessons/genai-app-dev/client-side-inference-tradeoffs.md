---
title: "Client-Side Inference: When It Makes Sense"
track: "genai-app-dev"
status: live
summary: "The decision rule for running inference in the browser instead of calling the server, and where it stops paying off."
duration: "6 min read"
---

Everything else in this module assumes the model call happens on a server you control. This lesson is about the deliberate exception — and why it stays an exception rather than becoming the default.

## What it is

[Client-Side LLM Inference in the Browser](/learn/genai-app-dev/client-side-inference) covers the mechanics: a small quantized model, WebGPU or WASM, running entirely inside the user's tab. This lesson is the decision layer on top of that — when the tradeoffs actually favor it, and the decision rule you can apply before reaching for it. [Where the LLM Boundary Lives](/learn/genai-app-dev/where-the-llm-boundary-lives) sets the default assumption for this whole track: inference runs server-side, behind your API, where you control the model, the keys, and the cost. Client-side inference is the one place this module deliberately breaks that default, and it's worth being explicit about why breaking it is sometimes correct instead of treating it as an oversight.

## The mental model

Run the decision as a four-question filter, in order, and stop at the first "no":

1. **Does the task fit in a small model?** Roughly 1B-8B parameters, quantized. Classification, short rewriting, autocomplete-style completion, and simple extraction fit. Open-ended reasoning, long-form generation, and anything needing broad world knowledge generally don't — that gap versus a frontier API model is real and won't close by tuning harder.
2. **Does the use case actually need one of the four properties a server call can't give you** — privacy by construction, offline capability, sub-100ms local latency, or zero marginal cost at scale? If the honest answer is "it would just be nice," that's not enough; a server call with normal [latency budgeting](/learn/genai-app-dev/latency-budgets) covers "nice" more cheaply than shipping a model download.
3. **Can you tolerate the cold-start cost?** A multi-hundred-megabyte download on first use, cached afterward. Fine for a feature a user returns to repeatedly; a poor fit for a one-shot interaction where the download costs more attention than the feature saves.
4. **Can you tolerate device variance?** A user on a five-year-old laptop with no WebGPU support gets the slow WASM fallback or nothing at all. If the feature has to work reliably for everyone, that variance is a real constraint, not a rounding error.

A "yes" through all four is the narrow slice where client-side inference is the right call. A "no" at any step means the server-side default from [Where the LLM Boundary Lives](/learn/genai-app-dev/where-the-llm-boundary-lives) still applies.

## Why it works this way

The four properties in question two aren't features a bigger, better client-side model would eventually deliver more of — they're structural consequences of *where* the computation happens, not *how good* the model is. Privacy by construction only holds because no request ever leaves the device; a server call with a strict retention policy is a promise, while local inference is a fact. Zero marginal cost only holds because the user's own hardware pays for the compute; that's true even for a mediocre small model and false even for a brilliant server-side one. This is why the decision rule filters on *use case shape* before it ever asks about model quality — a task that's a poor fit for a small model stays a poor fit no matter how much WebGPU support improves.

## A concrete example (shown)

A journaling app wants to flag entries that read as emotionally distressed, so it can gently suggest a resource. Running that classification server-side means every private journal entry crosses the network and lands in a request log somewhere, even if it's deleted immediately after. Running it client-side with a small classifier means the text never leaves the device — for a feature reading deeply personal content, that property is worth more than the quality gap between a small local classifier and a frontier model, because the frontier model's better nuance doesn't matter if the privacy concern stops users from writing honestly in the first place.

Contrast that with the same app's "expand this entry into a longer reflection" feature — open-ended generation, no hard latency requirement, and privacy is already handled by not sending the *output* anywhere the user didn't ask for. That one stays server-side; the decision rule fails at question one before it even reaches the privacy question.

## Where it shows up

- **Sensitive-input features** where privacy by construction changes what users are willing to type at all — intake forms, journaling, anything screening personal content.
- **Offline-first products** — field tools, kiosks, flaky-connection environments — where [Model Routing and Multi-Provider Failover](/learn/genai-app-dev/model-routing-and-failover) has nothing to fail over *to*.
- **Sub-100ms interactions** — autocomplete, inline spell-fixing — where even an aggressively optimized server round-trip, per [Where the Milliseconds Go](/learn/genai-app-dev/where-latency-comes-from), can't beat local compute on pure network physics.

## Watch out for

1. **Reaching for it because it's "free" rather than because the use case needs it.** Zero marginal cost only wins once you've paid for the download and the quality gap is acceptable — a mediocre local model that frustrates users costs more in churn than the API calls it saved.
2. **Skipping the offline/failure UX.** A model that hasn't finished downloading yet, or a device with no WebGPU support, needs a real fallback state — not a silently broken feature.
3. **Assuming this replaces server-side cost control.** It's a narrow exception for specific features, not a general cost-optimization strategy — for everything else in your app, [prompt caching](/learn/genai-app-dev/prompt-caching) and [model cascades](/learn/genai-app-dev/cutting-cost-with-model-cascade) are the levers that actually move your bill.

## Where next

If the decision rule says server-side, the rest of this module — caching, cascades, background jobs — is where the real cost and latency wins are. If it says client-side, [Client-Side LLM Inference in the Browser](/learn/genai-app-dev/client-side-inference) has the runtime and library details.

**Related:** [Client-Side LLM Inference in the Browser](/learn/genai-app-dev/client-side-inference), [Where the LLM Boundary Lives](/learn/genai-app-dev/where-the-llm-boundary-lives), [Setting a Latency Budget](/learn/genai-app-dev/latency-budgets), [Model Routing and Multi-Provider Failover](/learn/genai-app-dev/model-routing-and-failover)
