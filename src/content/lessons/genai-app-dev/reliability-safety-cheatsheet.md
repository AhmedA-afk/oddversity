---
title: "Reliability and Safety Cheatsheet"
track: "genai-app-dev"
status: live
summary: "The whole module on one page - error routing, the backoff recipe, the timeout triad, guard checklists, and the HITL rule."
duration: "5 min read"
---

A dense reference for hardening a feature you're about to ship, not a first read — if any row here doesn't make sense, the lesson it links to has the reasoning.

## Error category to action

| Category | Example | Retry? | Action |
|---|---|---|---|
| Transient | 429, 5xx, timeout, connection reset | Yes | [Backoff with jitter](/learn/genai-app-dev/exponential-backoff-with-jitter), then failover if the breaker trips |
| Permanent | 400, 401, 403, unknown model name | No | Surface — fix the request, don't retry it |
| Content | `content_filter`, refusal in prose | Usually no | Surface an honest fallback; retry only if the fix is a changed request (e.g. larger `max_tokens`) |
| Semantic | Confidently wrong, well-formed output | N/A — not a call failure | [Output validation](/learn/genai-app-dev/output-validation-and-moderation) and, if it triggers, [human review](/learn/genai-app-dev/human-in-the-loop-review) |

Full taxonomy: [The Failure Modes of an LLM Call](/learn/genai-app-dev/failure-modes-of-llm-calls). The type that makes this a branch instead of a checklist: [Typed Errors and a Clean Error Boundary](/learn/genai-app-dev/try-catch-and-typed-errors).

## Backoff with jitter — start here, then measure

```ts
function backoffDelayMs(attempt: number, baseMs = 1000, capMs = 60_000): number {
  const exp = Math.min(capMs, baseMs * 2 ** attempt);
  return Math.random() * exp; // FULL jitter — uniform [0, exp], not exp plus a wobble
}
```

- **Base delay:** 1s — start here, then measure against your provider's actual recovery time.
- **Cap:** 60s — start here, then measure against your latency budget.
- **Max attempts:** 3-5 for a synchronous user-facing call; higher is fine for a background job.
- **Retry budget:** a wall-clock ceiling (e.g. 15-30s), not just an attempt count — five attempts at a slow timeout each can still blow past what a user will tolerate.
- **Always honor `retry-after`** when the provider sends one — it beats any computed delay.

Never retry without checking `retryable` first. Full build: [Exponential Backoff With Jitter](/learn/genai-app-dev/exponential-backoff-with-jitter).

## The timeout / deadline / breaker triad

```text
timeout:   bounds ONE attempt        — start here: 10-15s for a synchronous chat call
deadline:  bounds the WHOLE request  — wraps every retry combined; must be >= budgetMs above
breaker:   bounds continued TRAFFIC  — trips after N failures in a rolling window, cools down, half-opens to probe
```

- No timeout at all is the single most common cause of one slow provider taking down unrelated requests — held connections exhaust the pool.
- A deadline with no breaker still lets every fresh request individually discover an outage and pay the full retry cost.
- A breaker with no half-open probe stays open after the provider recovers, until someone manually resets it.

Full mechanism: [Timeouts, Deadlines, and Circuit Breakers](/learn/genai-app-dev/timeouts-and-circuit-breakers). Pairs with [failover](/learn/genai-app-dev/model-routing-and-failover) once the breaker trips.

## Input guard checklist

- [ ] Size and type limits enforced before the request touches the model.
- [ ] Untrusted content (user input, retrieved documents, tool output, fetched pages) is delimited — tags plus an explicit system-level sentence about what the tags mean — never concatenated raw into the prompt.
- [ ] A lightweight keyword/pattern tripwire logs suspected injection attempts for visibility, understood as a tripwire, not the actual defense.
- [ ] Tool call arguments are validated in code against real state (does the order exist, is the amount within bounds) regardless of how confident the model sounded producing them.

Full build: [Input Validation and Prompt-Injection Defense](/learn/genai-app-dev/input-validation-and-injection-defense).

## Output guard checklist

- [ ] Schema validation first, before any policy or confidence check runs.
- [ ] A policy/moderation check, independent of schema validity — well-formed JSON can still contain something that shouldn't ship.
- [ ] A confidence threshold — **start at 0.75, then measure** against reviewer override rate and tune from there, not from feel.
- [ ] A named fallback path for blocked output — never an empty string, never a silent drop.

Full build: [Output Validation and Moderation Gates](/learn/genai-app-dev/output-validation-and-moderation).

## The HITL routing rule

```text
                low confidence          high confidence
high stakes     always review           spot-check / sample
low stakes      auto-ship + let         auto-ship, no review
                user correct
```

Route by stakes **and** confidence, never by "is this AI-generated" alone — reviewing everything drowns the queue; reviewing nothing lets the top-left quadrant through unchecked. Reasoning: [When to Put a Human in the Loop](/learn/genai-app-dev/human-in-the-loop-review). Queue mechanics: [Building a Review Queue](/learn/genai-app-dev/building-a-review-queue). Worked example: [An Escalation and Approval Flow](/learn/genai-app-dev/escalation-and-approval-flow).

## The one idempotency rule

Before wrapping any tool call in a retry: is it a read, or does it write? If it writes (charge, send, refund, delete, increment), it needs a deterministic idempotency key before it gets a retry wrapper — not after. Full mechanism: [Idempotency and Partial-Failure Recovery](/learn/genai-app-dev/idempotency-and-partial-failure).

## The five antipatterns to grep for before launch

1. A retry wrapper around a non-idempotent write with no idempotency key.
2. A provider call with no explicit timeout.
3. Backoff with no jitter (fixed exponential delay, same for every client).
4. A `catch` block that returns `""`, `null`, or `[]` instead of classifying and routing the failure.
5. A `content_filter` refusal retried as if it were a crash.

Full catalog with symptoms: [Reliability Antipatterns](/learn/genai-app-dev/reliability-antipatterns).

**Related:** [The Failure Modes of an LLM Call](/learn/genai-app-dev/failure-modes-of-llm-calls), [Typed Errors and a Clean Error Boundary](/learn/genai-app-dev/try-catch-and-typed-errors), [Exponential Backoff With Jitter](/learn/genai-app-dev/exponential-backoff-with-jitter), [Timeouts, Deadlines, and Circuit Breakers](/learn/genai-app-dev/timeouts-and-circuit-breakers), [Reliability Antipatterns](/learn/genai-app-dev/reliability-antipatterns), [Quiz: Reliability and Safety](/learn/genai-app-dev/quiz-reliability-safety)
