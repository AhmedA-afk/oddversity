---
title: "Exponential Backoff With Jitter"
track: "genai-app-dev"
status: live
summary: "Build a reusable withRetry() that backs off exponentially, adds full jitter, respects retry-after, and enforces a budget."
duration: "8 min read"
---

You now know which failures are safe to retry — the `retryable` flag from [Typed Errors and a Clean Error Boundary](/learn/genai-app-dev/try-catch-and-typed-errors) — and which operations are safe to retry at all — the idempotency question from [Rate Limits and When to Retry](/learn/genai-app-dev/rate-limits-and-retry). What's left is purely mechanical: how long to wait between attempts, and how to keep a fleet of clients from retrying in lockstep.

## What we're building

One `withRetry()` function, used everywhere in the app that makes a retryable call: exponential delay, full jitter, a hard retry budget, and a `retry-after` override when the provider gives you one directly.

## Setup

This wraps any async function that can throw an `LLMError` (or be adapted to one) — a raw provider `chat()` call, a tool invocation you've already confirmed is idempotent, anything where a `transient` failure is expected to sometimes resolve itself.

## Build it

### Step 1: The thundering-herd problem, concretely

Say 200 concurrent requests all hit a 429 at the same instant — a real scenario the moment your traffic has any burstiness at all. Plain exponential backoff with no randomness has every one of those 200 clients wait exactly 1 second, then retry at the same instant, get rate-limited again as a group, wait exactly 2 seconds, retry together again — recreating the exact spike that caused the failure, forever, in lockstep. The fix isn't a longer delay; it's a *different* delay per client, so the retries spread out instead of re-synchronizing.

### Step 2: Full jitter

```ts
function backoffDelayMs(attempt: number, baseMs = 1000, capMs = 60_000): number {
  const exp = Math.min(capMs, baseMs * 2 ** attempt);
  return Math.random() * exp; // full jitter: uniform between 0 and the capped exponential value
}
```

"Full jitter" means the delay is drawn uniformly from `[0, exp]`, not `exp` plus a small random wobble — that's the version that actually breaks synchronization, because two clients on the same attempt number can land anywhere from near-zero to the full cap, not clustered near it.

### Step 3: Respect `retry-after` when the provider gives you one

```ts
function nextDelayMs(error: LLMError, attempt: number): number {
  if (error.retryAfterMs !== undefined) return error.retryAfterMs; // the provider knows its own recovery time; don't guess over it
  return backoffDelayMs(attempt);
}
```

A provider-supplied `retry-after` is a direct signal about when capacity frees up — more accurate than any backoff curve you could compute locally, so it always wins when present. This reads the same field populated in [Typed Errors and a Clean Error Boundary](/learn/genai-app-dev/try-catch-and-typed-errors).

### Step 4: A retry budget, not just a retry count

```ts
interface RetryOptions {
  maxAttempts?: number;   // hard cap on attempts, regardless of elapsed time
  budgetMs?: number;      // hard cap on total wall-clock time spent retrying
}

async function withRetry<T>(
  fn: () => Promise<T>,
  { maxAttempts = 5, budgetMs = 30_000 }: RetryOptions = {}
): Promise<T> {
  const start = Date.now();
  let lastError: LLMError | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (Date.now() - start > budgetMs) break; // stop even if attempts remain — the caller's deadline matters more
    try {
      return await fn();
    } catch (err) {
      const llmError = isLLMError(err) ? err : fromAnthropicError(err);
      if (!llmError.retryable) throw llmError; // permanent and content failures pass straight through, unretried
      lastError = llmError;
      const delay = nextDelayMs(llmError, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError ?? new Error("withRetry exhausted with no captured error");
}
```

A count-only budget (`maxAttempts` alone) can still let a single call spiral: five attempts at a 60-second cap each is five minutes of a user staring at a spinner. A time-based budget caps the *worst case* directly, independent of how the exponential curve happens to land. Both matter, which is why this keeps both knobs rather than picking one.

## Run it

```ts
const response = await withRetry(() => provider.chat(messages), {
  maxAttempts: 4,
  budgetMs: 15_000, // this call site tolerates at most 15s of total retry time
});
```

Different call sites should pass different budgets — a background summarization job can tolerate a much longer `budgetMs` than a synchronous chat reply the user is actively waiting on. Tie this number to the same number you set in [Setting Latency Budgets for LLM Features](/learn/genai-app-dev/latency-budgets-for-llm-features) rather than picking it arbitrarily per call site.

## Harden it

Log every retry attempt with the attempt number, the delay chosen, and the error category — not just the final outcome. When a provider's error rate climbs, this is the log line that tells you whether it's a genuine outage (many clients, many retries, most eventually succeeding) or something narrower. And make sure `withRetry` itself has a ceiling that composes sanely with a per-call timeout: five attempts at a 10-second timeout each is 50 seconds of worst case even with a tight backoff curve, which is the exact composition problem [Timeouts, Deadlines, and Circuit Breakers](/learn/genai-app-dev/timeouts-and-circuit-breakers) exists to solve — `budgetMs` here should never exceed the end-to-end deadline that lesson sets.

## Extend it

Once a single provider starts failing consistently rather than intermittently, retrying it — even with perfect jitter — stops being the right move; that's the circuit breaker's job, covered next. And once `withRetry` wraps a tool call rather than a plain chat completion, confirm the tool is idempotent before wrapping it at all — [Idempotency and Partial-Failure Recovery](/learn/genai-app-dev/idempotency-and-partial-failure) is the piece that makes retrying a side-effecting call safe rather than merely convenient.

**Related:** [Typed Errors and a Clean Error Boundary](/learn/genai-app-dev/try-catch-and-typed-errors), [Rate Limits and When to Retry](/learn/genai-app-dev/rate-limits-and-retry), [Rate Limits and Retry Strategies](/learn/genai-app-dev/rate-limits-and-retry-strategies), [Timeouts, Deadlines, and Circuit Breakers](/learn/genai-app-dev/timeouts-and-circuit-breakers), [Idempotency and Partial-Failure Recovery](/learn/genai-app-dev/idempotency-and-partial-failure)
