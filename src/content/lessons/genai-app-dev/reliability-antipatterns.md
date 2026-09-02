---
title: "Reliability Antipatterns"
track: "genai-app-dev"
status: live
summary: "Five specific ways reliability code causes the exact incident it was meant to prevent, and the fix for each one."
duration: "7 min read"
---

Every mistake below passed code review somewhere, because each one looks reasonable in isolation — retry on failure, catch the exception, keep going. The problem only shows up under real traffic, which is exactly when it's most expensive to discover.

### The mistake: retrying a non-idempotent write

```ts
// tool call charges a card; the response times out before your code sees it
async function chargeCard(orderId: string, amount: number) {
  return await withRetry(() => paymentTool.charge(orderId, amount));
}
```

**Why it's wrong.** `withRetry` treats "no response" as "didn't happen" and tries again. But a timeout on the *response* doesn't mean the charge didn't execute — it means you don't know. If it did execute, the retry charges the card a second time.

**Symptom.** Duplicate charges that correlate with periods of elevated latency or provider flakiness, not with any bug in the charge logic itself — support tickets about being billed twice for one order, and nothing in the application logs shows an obvious double-call because each attempt looks like a normal, isolated retry.

**Fix.** Never wrap a non-idempotent call in a generic retry without an idempotency key that lets the second attempt return the original result instead of executing again. [Rate Limits and When to Retry](/learn/genai-app-dev/rate-limits-and-retry) draws this line at a policy level; [Idempotency and Partial-Failure Recovery](/learn/genai-app-dev/idempotency-and-partial-failure) builds the actual key.

### The mistake: no timeout on the provider call

```ts
const response = await fetch(providerUrl, { method: "POST", body: payload });
// no `signal`, no AbortController, no timeout — the SDK's default may not save you
```

**Why it's wrong.** Without an explicit timeout, a request that should take two seconds and instead takes two minutes doesn't fail — it hangs, holding a connection (and often a thread) the whole time.

**Symptom.** Under normal load everything looks fine; the moment one provider degrades, unrelated requests start timing out too, because the connection pool is exhausted by calls stuck waiting on the degraded provider. It reads like a general outage, not a single slow dependency.

**Fix.** Set an explicit per-call timeout on every provider call, and an end-to-end deadline wrapping the whole retry sequence. [Timeouts, Deadlines, and Circuit Breakers](/learn/genai-app-dev/timeouts-and-circuit-breakers) is the full mechanism.

### The mistake: retry storms with no jitter

```ts
async function retryFixed(fn: () => Promise<any>, attempts = 5) {
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); } catch { await sleep(1000 * 2 ** i); }
  }
}
```

**Why it's wrong.** Every client that fails at the same moment computes the exact same delay and retries at the exact same instant, recreating the traffic spike that caused the failure in the first place — the backoff curve is right, but with no randomness it synchronizes clients instead of spreading them out.

**Symptom.** A brief provider hiccup turns into a sustained, self-reinforcing wave of 429s that outlasts the original blip by many multiples, visible in request logs as periodic spikes at exactly the backoff intervals.

**Fix.** Full jitter — draw the delay uniformly from `[0, exp]`, not a fixed exponential value. [Exponential Backoff With Jitter](/learn/genai-app-dev/exponential-backoff-with-jitter) walks the exact function.

### The mistake: swallowing errors into an empty string

```ts
async function getSummary(text: string): Promise<string> {
  try {
    return await model.summarize(text);
  } catch {
    return ""; // "handled" — nothing crashes
  }
}
```

**Why it's wrong.** An empty string isn't a safe fallback — it's a silent lie that everything worked. Nothing throws, nothing logs the actual failure category, and every caller downstream has to independently guess whether an empty result means "the source text was empty" or "the call failed."

**Symptom.** A feature that appears to work in testing (failures are rare) starts silently returning blank content in production, and it surfaces as a confused user report — "why is my summary blank" — days before anyone finds it in an error dashboard, because there's no error to find.

**Fix.** Catch the failure, classify it with the [typed error](/learn/genai-app-dev/try-catch-and-typed-errors) boundary, and either surface an honest fallback message or propagate the failure — never coerce it into a value that's indistinguishable from a legitimate empty result.

### The mistake: treating a content refusal as a crash

```ts
try {
  const response = await provider.chat(messages);
  return response;
} catch (err) {
  return await withRetry(() => provider.chat(messages)); // retries everything that reaches here
}
```

If the SDK surfaces a `content_filter` stop reason as a thrown error rather than a normal response, this code retries it — with the identical input, against the identical policy, every time.

**Why it's wrong.** A refusal isn't the model malfunctioning; it's the model doing exactly what a policy told it to do. Retrying with unchanged input reproduces the same refusal every single time, at the cost of a full retry budget for zero chance of a different outcome.

**Symptom.** A feature that occasionally returns "I can't help with that" instead retries silently for several seconds, uses up its retry budget, and then either surfaces the same refusal anyway or times out — worse latency for an outcome that was already determined on the first attempt.

**Fix.** Classify content failures separately from transient ones, as [The Failure Modes of an LLM Call](/learn/genai-app-dev/failure-modes-of-llm-calls) lays out, and route a refusal to a fallback message or a rephrase prompt — never to a blind retry.

## Pre-flight checklist

Before a feature that calls an LLM ships to real traffic, check it against every mistake above:

- [ ] Every provider call has an explicit timeout, and the retry sequence around it has an end-to-end deadline.
- [ ] Every retry wrapper checks `retryable` on a typed error before retrying — nothing retries a `permanent` or `content` failure by default.
- [ ] Any retry that touches a side-effecting write (charge, send, refund, delete) is idempotency-keyed, not just retried.
- [ ] Backoff delays use full jitter, not a fixed exponential curve.
- [ ] No catch block returns an empty string, empty array, or `null` as if it were a legitimate result — every failure either surfaces honestly or gets classified and routed.

**Related:** [The Failure Modes of an LLM Call](/learn/genai-app-dev/failure-modes-of-llm-calls), [Typed Errors and a Clean Error Boundary](/learn/genai-app-dev/try-catch-and-typed-errors), [Exponential Backoff With Jitter](/learn/genai-app-dev/exponential-backoff-with-jitter), [Timeouts, Deadlines, and Circuit Breakers](/learn/genai-app-dev/timeouts-and-circuit-breakers), [Idempotency and Partial-Failure Recovery](/learn/genai-app-dev/idempotency-and-partial-failure), [Reliability and Safety Cheatsheet](/learn/genai-app-dev/reliability-safety-cheatsheet)
