---
title: "The Failure Modes of an LLM Call"
track: "genai-app-dev"
status: live
summary: "An LLM call fails on four different axes at once - transient, permanent, content, and semantic - and each needs its own fix."
duration: "7 min read"
---

An LLM call returning HTTP 200 tells you almost nothing about whether it actually succeeded. Success and failure live on more than one axis at once, and the fix for one axis is often the wrong move — sometimes actively harmful — on another.

## What it is

Every LLM call can fail in four distinct ways:

- **Transient.** A 429 rate limit, a 5xx server error, a timeout, a dropped connection. The request never produced a real answer, and the same call tried again in a moment might succeed. This is the one category that behaves like a normal flaky API.
- **Permanent.** A 400 with a malformed request body, a 401 with an expired key, a 404 for a model name that doesn't exist. Nothing about waiting and trying again changes the outcome — the request is broken in a way that's true right now and will still be true in five seconds.
- **Content.** The call completed successfully at the transport level, but the model (or a moderation layer sitting in front of it) declined to fully comply: a `stop_reason` of `content_filter`, a response truncated because it hit `max_tokens` mid-thought, a refusal written out as ordinary prose. Nothing crashed. The model just didn't give you what you asked for.
- **Semantic.** The call completed, the model complied with the letter of the request, and the output is well-formed — and wrong. A fabricated API parameter, a citation to a paper that doesn't exist, a plausible-sounding number nobody generated from real data. Nothing in the HTTP response, the stop reason, or the JSON schema flags this one. It's the hardest category and the one most systems have no code path for at all.

[Error Handling for LLM Calls](/learn/genai-app-dev/error-handling-for-llm-calls) covers the first three of these at the level of a single `try/catch`; this lesson is the taxonomy the rest of this module builds on, semantic failure included.

## The mental model

Don't think of an LLM call as having one outcome with a status code attached. Think of it as three yes/no questions, asked in sequence, where each question is answerable only if the one before it passed:

```text
Did the transport succeed?        no -> transient or permanent
Did the model comply?             no -> content
Is what it said true or useful?   no -> semantic
```

A 200 status answers only the first question. It says nothing about whether the model did what you asked, and nothing at all about whether what it said is correct. Code that only checks the status code is answering question one and silently assuming yes to the other two.

## Why it works this way

An LLM API is really two systems stacked on top of each other, and only the bottom one is checked by anything outside your own code. The bottom layer is a network service like any other — it can be overloaded, misconfigured, or handed bad input, and it fails the way APIs have always failed. The top layer is a probabilistic text generator whose output is syntactically valid by construction (it's always going to be well-formed text, and usually well-formed JSON if you asked for it) but isn't fact-checked, compliance-checked, or truth-checked by anything the provider runs on your behalf. The provider's guarantee stops at "I ran inference and returned tokens." Everything past that — did it answer the actual question, is the claim inside it real — is your problem, not theirs, and no amount of retrying fixes a semantic failure because the model isn't malfunctioning when it produces one. It's doing exactly what it was asked: generating a plausible continuation.

## A concrete example (shown)

Four responses to four different calls, all worth noticing look nothing alike:

```json
// transient — retry with backoff
{ "type": "error", "error": { "type": "rate_limit_error", "message": "Number of requests has exceeded your rate limit." } }
```

```json
// permanent — do not retry, fix the request
{ "type": "error", "error": { "type": "invalid_request_error", "message": "max_tokens: 999999 exceeds the maximum allowed value" } }
```

```json
// content — the call succeeded; the model declined
{ "id": "msg_01...", "stop_reason": "content_filter", "content": [] }
```

```json
// semantic — 200 OK, valid JSON, fabricated field
{ "stop_reason": "end_turn",
  "content": [{ "type": "text",
    "text": "{\"order_id\": \"ORD-88213\", \"refund_policy_section\": \"4.2(c)\"}" }] }
```

The fourth one is the dangerous one precisely because it looks identical, byte for byte, to a correct response. There is no section 4.2(c) — the model invented a policy citation that reads exactly like a real one.

## Where it shows up

Streaming responses truncate mid-JSON when a tool call's arguments hit `max_tokens` before the closing brace — a content failure that looks like malformed output rather than a stop-reason you can check directly. Some providers and moderation layers wrap a refusal in ordinary prose inside a 200 response instead of a distinct stop reason, so a naive integration renders "I can't help with that" as if it were the answer. And semantic failures tend to surface two or three steps downstream of where they were generated — a support bot recommends a plan that was discontinued last quarter, and nobody notices until a customer calls in confused.

## Watch out for

- **Collapsing everything into one `catch` and retrying blindly.** A permanent error retried five times with backoff wastes five round trips of latency and burns your rate-limit budget on calls that can never succeed — see [Rate Limits and When to Retry](/learn/genai-app-dev/rate-limits-and-retry) for the branch you're skipping.
- **Treating a content refusal as a crash.** A `content_filter` stop reason isn't a bug in your code or an outage at the provider — retrying with the identical input just reproduces the same refusal. This exact mistake gets its own entry in [Reliability Antipatterns](/learn/genai-app-dev/reliability-antipatterns).
- **Having no code path for semantic failure at all.** Because nothing throws, nothing pages anyone, and nothing shows up in error-rate dashboards, semantic failures are invisible unless you deliberately build something to catch them — which is the entire reason [Output Validation and Moderation Gates](/learn/genai-app-dev/output-validation-and-moderation) and [human review](/learn/genai-app-dev/human-in-the-loop-review) exist as separate concerns from error handling.

## Where next

[Typed Errors and a Clean Error Boundary](/learn/genai-app-dev/try-catch-and-typed-errors) turns these four categories into an actual type your code can branch on instead of a mental checklist. From there, the transient side gets its own depth later in this module's retry and backoff lessons; the content and semantic sides get theirs in the input- and output-guard lessons that follow.

**Related:** [Error Handling for LLM Calls](/learn/genai-app-dev/error-handling-for-llm-calls), [Typed Errors and a Clean Error Boundary](/learn/genai-app-dev/try-catch-and-typed-errors), [Rate Limits and When to Retry](/learn/genai-app-dev/rate-limits-and-retry), [Output Validation and Moderation Gates](/learn/genai-app-dev/output-validation-and-moderation), [When to Put a Human in the Loop](/learn/genai-app-dev/human-in-the-loop-review), [Reliability Antipatterns](/learn/genai-app-dev/reliability-antipatterns)
