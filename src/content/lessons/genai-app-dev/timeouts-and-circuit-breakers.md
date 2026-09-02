---
title: "Timeouts, Deadlines, and Circuit Breakers"
track: "genai-app-dev"
status: live
summary: "Three distinct mechanisms - per-call timeout, end-to-end deadline, and a circuit breaker - that together stop one slow provider becoming a full outage."
duration: "7 min read"
---

Retries and jitter, from the last lesson, assume the provider is basically healthy and occasionally hiccups. This lesson is about the case where that assumption is wrong: a provider that's genuinely down, or genuinely slow, and what stops your app from going down with it.

## What it is

Three separate mechanisms, often confused for one another, that need to work together:

- **A per-call timeout** bounds how long any single request is allowed to hang before your code gives up on it and treats it as a transient failure.
- **An end-to-end deadline** bounds how long the *whole* operation — including every retry — is allowed to take before the user or caller gets an answer, timeout or not.
- **A circuit breaker** tracks a provider's recent failure rate and, once it crosses a threshold, stops sending it new requests for a cooldown period instead of letting every fresh request try and fail against it.

Each solves a different failure that the other two don't touch.

## The mental model

Picture them as three concentric rings around a single provider call, each answering a different question:

```text
timeout:   "how long until I give up on THIS attempt?"
deadline:  "how long until I give up on the WHOLE request, retries included?"
breaker:   "how long until I stop even TRYING this provider?"
```

A timeout without a deadline lets retries compound: five attempts at a 10-second timeout is 50 seconds of worst case, even with perfect backoff logic layered on top — this is exactly the composition trap flagged at the end of [Exponential Backoff With Jitter](/learn/genai-app-dev/exponential-backoff-with-jitter). A deadline without a breaker still lets every *new* request pile onto a provider that's fully down, each one burning its own timeout and retry budget before failing — no individual request violates its budget, but the provider gets hammered by every request in the system simultaneously, which can be what keeps it down longer.

## Why it works this way

A missing timeout is the single most common way one slow dependency becomes a full outage. If a provider call has no timeout at all — the default in more SDKs than you'd expect — a request that would normally take two seconds and instead takes two minutes doesn't fail, it just... hangs. In a threaded or connection-pooled server, that held connection is now unavailable for every other request until it resolves, so a handful of stuck calls to one degraded provider can exhaust your whole pool and take down requests that have nothing to do with the LLM feature at all. The timeout doesn't fix the slow provider — it converts "hangs forever, taking resources with it" into "fails fast, in a shape your error boundary already knows how to handle" (see [Typed Errors and a Clean Error Boundary](/learn/genai-app-dev/try-catch-and-typed-errors)).

A circuit breaker exists for a related but distinct reason: once a provider's failure rate is high enough that most calls are failing anyway, continuing to send it traffic costs you latency and cost for near-zero chance of success, and it can actively slow the provider's own recovery by adding load exactly when it's least able to handle it. Stopping traffic for a cooldown window, then sending a small number of probe requests to check recovery, is strictly better than hammering a provider that's already underwater — and it's the mechanism that makes automatic [failover](/learn/genai-app-dev/model-routing-and-failover) actually kick in, rather than every request independently discovering the outage on its own.

## A concrete example (shown)

The composition problem, with numbers:

```text
Per-call timeout:        10s
Retries (with backoff):  4 attempts
Naive worst case:        4 x 10s = 40s, before any backoff delay is even added
```

A 10-second end-to-end deadline caps this directly, regardless of how many retries the backoff logic would otherwise attempt:

```ts
async function callWithDeadline<T>(fn: () => Promise<T>, deadlineMs: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), deadlineMs);
  try {
    return await fn(); // fn should thread controller.signal into the actual request
  } finally {
    clearTimeout(timer);
  }
}
```

And a minimal circuit breaker, tracking failures in a rolling window per provider:

```ts
type BreakerState = "closed" | "open" | "half_open";

class CircuitBreaker {
  private state: BreakerState = "closed";
  private failures: number[] = []; // timestamps of recent transient failures
  private openedAt = 0;

  constructor(private threshold = 5, private windowMs = 30_000, private cooldownMs = 20_000) {}

  canCall(): boolean {
    if (this.state === "open" && Date.now() - this.openedAt > this.cooldownMs) {
      this.state = "half_open"; // let exactly one probe through to test recovery
      return true;
    }
    return this.state !== "open";
  }

  recordFailure() {
    const now = Date.now();
    this.failures.push(now);
    this.failures = this.failures.filter((t) => now - t < this.windowMs);
    if (this.failures.length >= this.threshold) {
      this.state = "open";
      this.openedAt = now;
    }
  }

  recordSuccess() {
    if (this.state === "half_open") this.failures = []; // probe succeeded — fully close
    this.state = "closed";
  }
}
```

Five consecutive failures in a 30-second window trips it; a single stray timeout doesn't. That's deliberate — a breaker that opens on one failure is indistinguishable from no retry logic at all.

## Where it shows up

A chat UI where the model provider is degraded but not fully down looks, without a timeout, like the whole app hanging — the spinner never resolves and the user has no idea whether to wait or reload. Background jobs without a deadline can sit in a queue for the full retry budget, blocking downstream steps that were waiting on them. And a fan-out of concurrent tool calls, each with its own timeout but no shared breaker, means a genuinely down provider gets hit by every one of those concurrent calls independently, instead of the second call noticing the first one already failed and short-circuiting immediately.

## Watch out for

- **No timeout set at all.** Check your SDK or HTTP client's actual default — "no timeout" is common enough that it's worth verifying rather than assuming a sane default exists.
- **A deadline that only covers one retry, not the sequence.** The deadline needs to wrap the entire `withRetry` call, not sit inside the loop as another per-attempt timeout in disguise.
- **A breaker with no half-open probe.** A breaker that opens and never checks again stays open even after the provider fully recovers, until someone manually resets it — the half-open state is what makes recovery automatic instead of requiring a human to notice and intervene.

## Where next

With the resilience triad in place — timeout, deadline, breaker — the remaining gap is what happens to the *content* of a call that succeeds at the transport level but shouldn't be trusted as-is. That's [Input Validation and Prompt-Injection Defense](/learn/genai-app-dev/input-validation-and-injection-defense) on the way in and [Output Validation and Moderation Gates](/learn/genai-app-dev/output-validation-and-moderation) on the way out.

**Related:** [Exponential Backoff With Jitter](/learn/genai-app-dev/exponential-backoff-with-jitter), [Model Routing and Multi-Provider Failover](/learn/genai-app-dev/model-routing-and-failover), [Typed Errors and a Clean Error Boundary](/learn/genai-app-dev/try-catch-and-typed-errors), [Setting Latency Budgets for LLM Features](/learn/genai-app-dev/latency-budgets-for-llm-features), [Reliability Antipatterns](/learn/genai-app-dev/reliability-antipatterns)
