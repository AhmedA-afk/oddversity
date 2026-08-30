---
title: "Build an AI feature around a request lifecycle"
track: "genai-app-dev"
status: live
summary: "An AI API call is one step in a request lifecycle: validate input, assemble context, call the model, parse the result, check policy and semantics."
duration: "3 min read"
---

## The short answer

An AI API call is one step in a request lifecycle: validate input, assemble context, call the model, parse the result, check policy and semantics, then return or escalate. Structured output reduces shape ambiguity, but the application must still validate meaning, handle failure, and keep provider-specific behavior behind a boundary.

## The lifecycle

```text
request -> validate -> compose -> call -> stream or collect -> parse -> verify -> act
```

Give every step an explicit timeout and error class. A partial stream is not the
same as a valid final answer.

## Four examples

### Example A: FAQ answer

Return `{answer, sources, needs_review}`. The application checks that sources are
present when the answer makes a policy claim.

### Example B: batch extraction

Process a list of invoices independently, record per-item errors, and allow a
retry without reprocessing successful items.

### Boundary case: valid JSON, wrong meaning

`{"priority":"low"}` can satisfy a schema while omitting the required reason or
using a label that the workflow does not support. Add semantic validation.

### Counterexample: retry every error

Retrying a malformed request wastes capacity; retrying a timeout may be sensible.
Classify errors before choosing retry, fallback, or user-visible failure.

## An illustrative story

A demo looked reliable until one answer was cut off mid-sentence by a network
disconnect. The UI treated any received text as success. Adding a completion state,
server-side validation, and a retry button fixed the application boundary.

## Two ways to see it

### Model view

The model produces a probabilistic completion under a context and configuration.

### Product view

The application owns validity, permissions, user messaging, persistence, and
recovery.

## Hands-on

Implement a fake provider with success, timeout, malformed output, partial stream,
and rate-limit fixtures. Return a typed result for each and test that only the
success path reaches the final action.

## Checkpoint

- [ ] Shape and semantic validation are separate.
- [ ] Partial, retryable, and permanent failures differ.
- [ ] The final action is gated by application code.

## What this does not solve

An excellent lifecycle cannot guarantee factuality or stable provider behavior;
that needs retrieval, evaluation, monitoring, and a fallback.

## Continue, go deeper, apply it

- Continue: Tool calling and authority
- Go deeper: Observability, cost, and latency
- Apply it: draw the lifecycle for one feature and add an error fixture for each boundary.
