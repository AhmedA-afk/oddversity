---
title: "Use Python as a small, testable AI service"
track: "python-data-apis"
status: live
summary: "An AI feature becomes maintainable when its model call is a small function with explicit inputs, validated outputs, predictable errors, and tests."
duration: "3 min read"
---

## The short answer

An AI feature becomes maintainable when its model call is a small function with explicit inputs, validated outputs, predictable errors, and tests that do not require a live model. Python helps you move quickly; the engineering discipline comes from separating pure transformations, I/O, and policy decisions.

## A useful shape

```text
request -> validate -> prepare -> model/client -> parse -> policy check -> response
```

Keep the model client behind an interface. A fake client can return a known
response so parsing, retries, and safety behavior are testable offline.

## Four examples

### Example A: pure formatter

Input: a list of invoice rows. Output: a normalized dictionary. Test it with an
empty list and a malformed amount without calling any model.

### Example B: model adapter

Input: validated support ticket. Output: a typed classification. The adapter owns
request construction; the application owns whether a classification may route a
customer.

### Boundary case: timeout

Return a retryable error or a manual-review state. Do not catch every exception
and return a plausible answer that hides an outage.

### Counterexample: global mutable prompt

Changing a module-level string during a request can create cross-request behavior
when concurrency is introduced. Pass configuration explicitly.

## An illustrative story

A prototype worked in a notebook until a second request arrived while the first
was still streaming. The fix was not more prompt text: it was moving state out of
globals, defining request ownership, and adding a concurrent test.

## Two ways to see it

### Python view

Use functions, types, exceptions, and modules to make assumptions visible.

### Service view

Every external call needs a timeout, error class, log context, and owner for the
fallback path.

## Hands-on

Build a `classify_ticket` function with a fake model client. Add tests for valid
JSON, malformed output, timeout, and an unknown category. Keep the policy that
decides “route or review” outside the model adapter.

## Checkpoint

- [ ] The happy path runs without a live provider.
- [ ] Invalid output becomes a typed failure or review state.
- [ ] Model and application policy are separate.

## What this does not solve

A clean service boundary does not guarantee model quality, data privacy, or
provider availability.

## Continue, go deeper, apply it

- Continue: Data contracts and validation
- Go deeper: API lifecycle and structured output
- Apply it: package the fake-client tests as a small command-line lab.
