---
title: "Antipatterns in Your First GenAI Feature"
track: "genai-app-dev"
status: live
summary: "Five mistakes nearly every first GenAI feature makes, each with the snippet that causes it and the one-line fix."
duration: "7 min read"
---

None of these mistakes require you to be careless. Every one of them is the natural result of a demo that worked, shipped as-is. Here's what to catch before that happens.

### The mistake: no output validation

```ts
const result = await callModel(prompt);
return Response.json(JSON.parse(result.text)); // ships whatever comes back
```

**Why it's wrong:** `JSON.parse` succeeding tells you the text was valid JSON — it tells you nothing about whether the fields you need are present, correctly typed, or within any bounds you care about. A model that returns `{"priority": "urgent-ish"}` when your UI only knows `"low" | "medium" | "high"` passes this check and breaks downstream anyway.

**Symptom:** the feature works reliably in your own testing and then breaks on real user input in a way that's hard to reproduce — because it's not the JSON parser failing, it's a field silently having a value nothing else expects.

**Fix:** validate against an explicit schema, not just JSON-parseability — see [Structured Output in Apps](/learn/genai-app-dev/structured-output-in-apps) for what a real check looks like beyond `try { JSON.parse(...) }`.

### The mistake: temperature left high on a structured task

```ts
const result = await client.messages.create({
  model, max_tokens: 200, messages, // no temperature set — inherits the SDK default
});
```

**Why it's wrong:** most SDK defaults sit in a range tuned for conversational variety, not extraction accuracy. Leaving it unset on a task with one correct output shape — extraction, classification, anything a database column depends on — invites exactly the kind of run-to-run inconsistency [Temperature, top_p, and max_tokens in Practice](/learn/genai-app-dev/tuning-sampling-params-in-an-app) demonstrates directly.

**Symptom:** the same input, run twice, comes back with a different field order, a slightly reworded value, or a type mismatch (`"340"` versus `340`) — intermittently, which makes it look like a flaky bug rather than a parameter choice.

**Fix:** set `temperature` explicitly and low (0–0.2) any time output feeds a parser or a schema. Never rely on the default matching your task.

### The mistake: the key shipped to the client

```ts
// inside a client component
const client = new Anthropic({ apiKey: "sk-ant-..." }); // bundled into the browser JS
```

**Why it's wrong:** anything in client-side code ships to every visitor's browser, in plaintext, inside the JS bundle — it is not hidden, only unnoticed so far. [Where the LLM Boundary Belongs in Your Architecture](/learn/genai-app-dev/where-the-llm-boundary-lives) covers why this specific mistake is one of the few in this list that costs real money the moment someone finds it, not just correctness.

**Symptom:** unexplained usage or billing spikes with no corresponding traffic increase in your own logs — because the calls aren't coming through your app at all.

**Fix:** move the call behind your own server route; the client calls your API, your server holds the key. See [Handling API Keys and Secrets](/learn/genai-app-dev/handling-api-keys-and-secrets) for what to do with the key once it's server-side.

### The mistake: no timeout

```ts
const result = await callModel(prompt); // awaits indefinitely if the provider hangs
return Response.json(result);
```

**Why it's wrong:** a network call with no timeout is a promise that the rest of your system's timeout budget doesn't know about. A provider outage or an unusually slow generation doesn't fail fast — it hangs, tying up a request (and, in many runtimes, a worker) until something further up the stack gives up, if anything does.

**Symptom:** occasional requests that take far longer than any observed normal case, sometimes long enough to trip an unrelated proxy or platform timeout with a generic error that gives no hint the LLM call was the cause.

**Fix:** wrap every call with an explicit timeout (`AbortController` in TS, a client-level timeout in Python) shorter than any timeout above it in the stack, and decide up front what happens on timeout — retry, fallback, or a clear error to the user.

### The mistake: treating the model's text as trusted

```ts
const reply = await callModel(customerMessage);
sendEmail({ to: customer.email, body: reply.text }); // sent without a human or a check
```

**Why it's wrong:** model output is generated text, not verified fact or pre-approved content — it can be wrong, off-tone, or (if the input included attacker-controlled text) manipulated by instructions hidden inside that input. Treating it as safe to act on directly skips every check a normal feature would apply to user-influenced content before it goes out under your name.

**Symptom:** an occasional reply that's factually wrong, off-brand, or — in the worst case — follows an instruction that was smuggled into the input rather than the one your prompt intended.

**Fix:** put a validation or moderation step between generation and action for anything irreversible (sending, deleting, charging) — see [Guardrails and Input Validation](/learn/genai-app-dev/guardrails-and-input-validation), and for anything high-stakes enough to warrant it, a human review step before the action fires, covered later under [Human-in-the-Loop Review Queues](/learn/genai-app-dev/human-in-the-loop-review-queues).

## Pre-flight checklist

Before a first GenAI feature reaches real users, confirm:

- [ ] Output is validated against an explicit schema, not just checked for parseability
- [ ] `temperature` is set explicitly, matched to whether the task needs one correct shape or benefits from variety
- [ ] The API key exists only in server-side environment variables — never in client-shipped code
- [ ] Every provider call has an explicit timeout shorter than any timeout above it in the stack
- [ ] Anything irreversible the model's output triggers has a validation (or human review) step before it fires

**Related:** [The Deterministic Shell Around a Probabilistic Core](/learn/genai-app-dev/what-makes-a-feature-genai), [Where the LLM Boundary Belongs in Your Architecture](/learn/genai-app-dev/where-the-llm-boundary-lives), [Structured Output in Apps](/learn/genai-app-dev/structured-output-in-apps), [GenAI Feature Starter Checklist](/learn/genai-app-dev/genai-feature-starter-checklist)
