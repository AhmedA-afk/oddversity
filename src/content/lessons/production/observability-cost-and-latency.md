---
title: "Observe quality, cost, and latency as one production system"
track: "production"
status: live
summary: "Production AI needs traces that connect user intent, inputs, retrieval, model calls, tool actions, outputs, errors, cost, and latency."
duration: "3 min read"
---

## The short answer

Production AI needs traces that connect user intent, inputs, retrieval, model calls, tool actions, outputs, errors, cost, and latency. Optimize these together: a cheap fast answer that is wrong or unsafe is not a successful service. Redact sensitive content and define retention before collecting traces.

## What to measure

Track request outcome, time to first token or result, total latency, retries,
tokens or provider units, cache hits, retrieval quality, tool errors, escalation,
and sampled human or automated quality signals. Keep correlation IDs so one user
request can be followed across steps.

## Four examples

### Example A: slow retrieval

The model is fast but the index is slow. A trace that separates retrieval and
generation points to the right fix.

### Example B: latency versus quality

A reranker improves evidence selection but adds latency. Compare quality gain,
tail latency, and cost on the same slices before removing it.

### Boundary case: retry storm

An upstream rate limit causes every request to retry at once. Add backoff,
jitter, caps, and a degraded response or queue.

### Counterexample: log everything

Full prompts and outputs may contain private data and still fail to explain a
semantic error. Use redaction, sampling, structured events, and a safe fixture.

## An illustrative story

A service met its average latency goal while users on mobile waited too long. The
tail was dominated by retries from one dependency. Percentiles and dependency
spans exposed the issue that an average hid.

## Two ways to see it

### Debugging view

A trace lets you locate which step failed and reproduce it safely.

### FinOps and trust view

Every token, retry, and stored output has a cost, privacy implication, and owner.

## Hands-on

Instrument a mock RAG request with spans for validation, retrieval, model call,
parsing, and policy. Inject a slow dependency and a rate limit. Produce a report
with p50/p95-style latency fields, retry count, cost proxy, and redaction check.

## Checkpoint

- [ ] One request can be traced across components.
- [ ] Quality, latency, cost, and safety signals are connected.
- [ ] Logs have redaction and retention rules.

## What this does not solve

Observability tells you what happened; it does not decide the acceptable quality,
privacy boundary, or rollback threshold.

## Continue, go deeper, apply it

- Continue: Deployment, versioning, and incidents
- Go deeper: Grounding, citations, and context budgets
- Apply it: create a trace schema and a dashboard specification for one feature.
