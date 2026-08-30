---
title: "Rate Limits and When to Retry"
track: "genai-app-dev"
status: live
summary: "RPM and TPM are different ceilings, and whether a failed call is safe to retry depends on what it would have done."
duration: "6 min read"
---

[Rate Limits and Retry Strategies](/learn/genai-app-dev/rate-limits-and-retry-strategies) already covers the shape of a 429 and the backoff response to it. The question this lesson adds is the one that determines whether retrying is even the right instinct: safe to retry depends on more than "did it fail," and getting it wrong on a tool call can cost real money, not just latency.

## Two limits, not one

Every provider enforces at least two ceilings at once: requests per minute (RPM) and tokens per minute (TPM), and they don't move together. A chat feature sending short messages can hit RPM long before it comes close to TPM — lots of small calls. A summarization feature sending long documents can hit TPM in a handful of calls while RPM has barely moved — few calls, each one huge. Whichever ceiling you hit first is the one that governs your retry behavior, and it's worth knowing which one your feature is actually bound by before you tune anything, since a fix aimed at the wrong ceiling (batching fewer, bigger requests to save on RPM) can make a TPM-bound feature worse. [Rate Limits and Retries](/learn/python-data-apis/rate-limits-and-retries) walks the header-reading mechanics — `x-ratelimit-limit-requests`, `x-ratelimit-remaining-tokens`, and friends — in more depth than repeated here.

## Read the failure before deciding to retry

Not every failed call deserves the same response, and the category from [The Failure Modes of an LLM Call](/learn/genai-app-dev/failure-modes-of-llm-calls) is exactly the branch you need:

```text
transient (429, 5xx, timeout, connection reset)  -> safe to retry
permanent (400, 401, 403, malformed request)      -> never retry unchanged; it will fail identically
content (content_filter refusal)                  -> never retry unchanged; the input, not the network, is the problem
```

A 400 retried five times with backoff doesn't get luckier on the fifth attempt — it's the same broken request every time, and each attempt still counts against your RPM ceiling on the way to failing again. [Typed Errors and a Clean Error Boundary](/learn/genai-app-dev/try-catch-and-typed-errors) is where this branch actually gets implemented as code instead of a rule you have to remember.

## Why retrying a non-idempotent write is dangerous

Here's the case that isn't about the model call at all: your agent calls a tool, the tool executes a real side effect — sends an email, charges a card, issues a refund — and then the *response* to that tool call times out or drops before your code sees it. Naive retry logic sees "no response" and assumes "didn't happen," so it retries. If the tool call actually succeeded the first time, you now have two emails, two charges, or two refunds, and nothing in a standard retry loop would have caught it.

The distinction that matters is idempotency, not transience:

- **Idempotent operations** — reading a record, re-generating a draft that hasn't been sent yet, a `GET`-shaped tool call — are safe to retry freely. Running them twice produces the same end state as running them once.
- **Non-idempotent operations** — anything that appends, charges, sends, or mutates a count — are not safe to retry blindly, because "no response" doesn't mean "didn't happen." It means "unknown," and treating unknown as "didn't happen" is the bug.

This is exactly the authority question from [Tool Calling as Authority](/learn/genai-app-dev/tool-calling-and-authority): a tool call is a request for the application to take an action, and the application's retry policy is part of that authority boundary, not a detail below it. The actual fix — an idempotency key that lets a retried request return the original result instead of executing twice — gets the full treatment in [Idempotency and Partial-Failure Recovery](/learn/genai-app-dev/idempotency-and-partial-failure), because it deserves more than a paragraph here.

## What this sets up

Once you know a failure is transient *and* the operation is safe to retry, the remaining question is purely mechanical: how long to wait, how many times, and how to avoid every client backing off in lockstep. That's [Exponential Backoff With Jitter](/learn/genai-app-dev/exponential-backoff-with-jitter).

**Related:** [Rate Limits and Retry Strategies](/learn/genai-app-dev/rate-limits-and-retry-strategies), [Rate Limits and Retries](/learn/python-data-apis/rate-limits-and-retries), [The Failure Modes of an LLM Call](/learn/genai-app-dev/failure-modes-of-llm-calls), [Tool Calling as Authority](/learn/genai-app-dev/tool-calling-and-authority), [Idempotency and Partial-Failure Recovery](/learn/genai-app-dev/idempotency-and-partial-failure), [Exponential Backoff With Jitter](/learn/genai-app-dev/exponential-backoff-with-jitter)
