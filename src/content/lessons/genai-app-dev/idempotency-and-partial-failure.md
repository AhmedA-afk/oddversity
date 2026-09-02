---
title: "Idempotency and Partial-Failure Recovery"
track: "genai-app-dev"
status: live
summary: "The deferred rigor behind every non-idempotent retry warning in this module - the key, the dedupe, and the exact failure it prevents."
duration: "9 min read"
---

> **Optional depth.** Everywhere else in this module, "make sure the write is idempotent" was a warning with the mechanism deferred to here. If you're building a feature where every tool call reads data or produces a fresh, unsent draft, you can skip this one for now. If anything an agent touches sends, charges, or mutates a persistent count, this is not optional.

## The problem, stated precisely

A tool call has three possible outcomes, not two: it succeeds and you know it, it fails and you know it, or it's in a state you cannot distinguish from the other two — you sent the request, and you never got a response back. That third state is the one naive retry logic gets wrong, because it silently treats "no response" as "didn't happen," when the honest answer is "unknown."

This isn't a hypothetical edge case — it's the normal behavior of a network under load. A request can succeed on the provider's side and have its *response* dropped by a timeout, a proxy restart, a client crash, or a connection reset, all after the side effect already executed. [The Failure Modes of an LLM Call](/learn/genai-app-dev/failure-modes-of-llm-calls) covers what to do when a call clearly fails; this lesson is about the harder case, where you genuinely don't know.

## At-least-once, not exactly-once

Almost every retry system you'll build — and almost every one a provider builds on their own infrastructure — gives you **at-least-once delivery**, not exactly-once. This isn't a bug to route around; it's a fundamental consequence of not being able to distinguish "request lost before execution" from "response lost after execution" without more information than a bare retry has access to. Getting exactly-once semantics *for free* from the network is not on the table; you have to build it, and the way you build it is by making the operation itself safe to receive more than once.

That reframes the goal: you're not trying to prevent a duplicate request from ever being sent. You're trying to make a duplicate request harmless when it inevitably is.

## The mechanism: idempotency keys

An idempotency key is a client-generated identifier attached to a request, such that the server can recognize "I've already fully processed this exact request" and return the original result instead of executing again:

```ts
async function chargeCard(orderId: string, amount: number): Promise<ChargeResult> {
  const idempotencyKey = `charge_${orderId}_${amount}`; // deterministic — same inputs, same key

  return await withRetry(() =>
    paymentProvider.charge({
      orderId,
      amount,
      idempotencyKey, // the provider, not the client, does the deduping
    })
  );
}
```

The key has to be **deterministic from the operation's own inputs**, not randomly generated per attempt — a fresh UUID on every retry defeats the entire mechanism, because the second attempt would look like a brand-new request to the provider instead of a retry of the first. `orderId` plus `amount` is often enough; if the same order can be legitimately charged twice for different reasons (a partial charge, then a second one), include something that distinguishes them, like a client-side transaction ID.

The server side of this contract: when the provider receives a request with a key it's already fully processed, it returns the stored result of the *original* execution — the same charge ID, the same amount, the same status — rather than running the charge logic a second time. This is why the mechanism has to live on the provider (or your own service, for an internal write), not purely on the client: the client retrying with the same key only helps if something on the receiving end actually checks.

## Recovering when the response is lost but the action executed

Here's the exact sequence that produces a duplicate charge without this mechanism, and what changes with it:

**Without an idempotency key:**

```text
1. Client sends charge request for order X, amount $50
2. Provider executes the charge successfully
3. Response is lost in transit (timeout, network blip)
4. Client sees no response, assumes failure, retries
5. Provider has no way to know this is a retry — executes a second, distinct charge
6. Order X is now charged $100
```

**With a deterministic idempotency key:**

```text
1. Client sends charge request for order X, amount $50, key "charge_X_50"
2. Provider executes the charge, stores the result against key "charge_X_50"
3. Response is lost in transit
4. Client sees no response, assumes failure, retries with the SAME key "charge_X_50"
5. Provider recognizes the key, returns the stored result from step 2 — no new charge executes
6. Order X is charged $50, exactly once, and the client still gets a valid response
```

The client's behavior doesn't change at all between these two sequences — it still can't tell the difference between "lost before executing" and "lost after executing," and it still retries in both cases. What changes is that retrying is now safe regardless of which one actually happened, because the safety moved to the server side of the exchange instead of depending on the client guessing correctly.

## When you don't control the provider

Not every tool call goes through a provider that supports idempotency keys — an internal microservice, a third-party API with no such concept, a legacy system. When you can't push the dedupe to the receiving end, build it on your own side instead: record every proposed action with its deterministic key *before* attempting it, and check that record before attempting anything with a key you've already seen.

```python
def execute_once(key: str, action: Callable[[], dict]) -> dict:
    existing = action_log.get(key)
    if existing is not None:
        return existing["result"]  # already attempted — don't run it again

    action_log.insert(key, status="in_progress")
    result = action()  # if this crashes before returning, the log entry stays "in_progress"
    action_log.update(key, status="done", result=result)
    return result
```

This closes the exactly-once-effect gap for a client-controlled write but introduces its own partial-failure case: the process can crash between executing the action and recording the result, leaving a key stuck at `in_progress` forever. There's no way to fully eliminate that gap with a synchronous check alone — the honest fix is a reconciliation job that periodically inspects `in_progress` entries older than some threshold and checks the *actual* downstream state (did the charge really happen?) rather than trusting the log's status field blindly.

## Tradeoffs, precisely

- **Storage cost.** Every idempotency key needs to be retained for at least as long as a retry could plausibly arrive — long enough to cover your retry budget and any manual replay, not indefinitely. Keeping keys forever is safe but not free; keeping them too briefly reopens the duplicate-execution window for a late retry.
- **Key collisions.** A key derived from insufficiently unique inputs — `orderId` alone, for an order that's legitimately charged more than once — causes the opposite failure: a real second charge gets deduped away and silently dropped. Precision in what goes into the key matters as much as determinism.
- **This is a floor, not a guarantee of correctness.** Idempotency prevents the *side effect* from executing twice. It says nothing about whether the side effect was the right one to execute in the first place — that's still the job of the validation and review layers earlier in this module.

## Where next

[Rate Limits and When to Retry](/learn/genai-app-dev/rate-limits-and-retry) is where this module first drew the line between safe and unsafe retries; [Reliability Antipatterns](/learn/genai-app-dev/reliability-antipatterns) catalogs the duplicate-charge failure this lesson exists to prevent. If your feature reaches an actual tool with real side effects, this is the piece that has to be in place before [Exponential Backoff With Jitter](/learn/genai-app-dev/exponential-backoff-with-jitter) gets applied to it.

**Related:** [Rate Limits and When to Retry](/learn/genai-app-dev/rate-limits-and-retry), [Exponential Backoff With Jitter](/learn/genai-app-dev/exponential-backoff-with-jitter), [Reliability Antipatterns](/learn/genai-app-dev/reliability-antipatterns), [Tool Calling as Authority](/learn/genai-app-dev/tool-calling-and-authority), [The Failure Modes of an LLM Call](/learn/genai-app-dev/failure-modes-of-llm-calls)
