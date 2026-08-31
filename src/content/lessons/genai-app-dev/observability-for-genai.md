---
title: "Observability for GenAI Features"
track: "genai-app-dev"
status: live
summary: "Normal APM tells you a request was slow. GenAI observability has to tell you what the model was asked and why it answered that way."
duration: "7 min read"
---

Your APM dashboard says the `/summarize` endpoint took 4.2 seconds and returned 200. It cannot tell you the prompt was 6,000 tokens because a trimming bug let history grow unbounded, or that the model called a tool twice before giving up and guessing. That gap is what GenAI observability closes.

## What it is

Observability for a GenAI feature means every request produces enough structured, queryable data to answer *why* it behaved the way it did — not just *whether* it succeeded. Concretely, that's five kinds of signal per request: a trace spanning every step (prompt assembly, provider call, tool loop, validation), token counts and cost, latency broken out by step and by tail percentile, the sequence of tool calls made, and a signal about output quality — a validation failure, a low eval score, a user's thumbs-down. A request without these is a black box the moment something looks wrong.

## The mental model

Treat a GenAI request like a distributed transaction, not a single function call. A normal API endpoint mostly does one expensive thing — a database query, maybe a cache lookup. A GenAI request routinely does several: assemble a prompt from history and retrieved context, call a provider that itself takes seconds, parse and validate structured output, maybe loop through two or three tool calls before it's done. Each of those steps can be the slow one, the expensive one, or the one that produced garbage — and a single "request took 4.2s, returned 200" log line collapses all of that into one number that explains nothing.

## Why it works this way

Two properties of GenAI requests specifically defeat traditional APM. First, **failure is often silent and probabilistic** — a request that returns 200 with a wrong or degraded answer looks identical to a good one in an error-rate dashboard, which is the same problem [Feature Flags and Gradual Rollout](/learn/genai-app-dev/feature-flags-and-gradual-rollout) exists to contain at the rollout layer; observability is what gives that rollout mechanism something real to measure. Second, **the request has internal structure that matters** — a slow response could be a slow provider call, a tool loop that iterated five times, or output validation that failed and retried. Without spans for each step, "it's slow" and "why is it slow" require two completely different investigations instead of one trace.

## A concrete example (shown)

A single request, traced end to end, makes the difference immediate:

```json
{
  "trace_id": "req_8f21ab",
  "spans": [
    { "name": "assemble_prompt", "ms": 4,   "tokens_in": 1840 },
    { "name": "provider_call",   "ms": 210, "model": "claude-sonnet-5", "tokens_out": 40 },
    { "name": "tool_call:lookup_order", "ms": 890, "ok": true },
    { "name": "provider_call",   "ms": 1720, "tokens_out": 312 },
    { "name": "validate_output", "ms": 2,   "ok": true }
  ],
  "total_ms": 2826,
  "prompt_version": "v15",
  "cost_usd": 0.0091
}
```

The dashboard-level number — 2.8 seconds — tells you nothing actionable. The trace tells you the tool call to `lookup_order` cost 890ms of that, which is a database index problem, not a model problem, and that the second provider call (after the tool result came back) is the other 1.7s — a genuinely different fix.

## Where it shows up

Every production GenAI feature needs this, but it matters most exactly where things are already unusual: a request that took an outlier-long time (see [Latency Budgets for LLM Features](/learn/genai-app-dev/latency-budgets-for-llm-features) for the p95/p99 framing this feeds), a cost spike that [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking) flags, or a quality regression a canary rollout halts on. In every one of those cases, the trace is what turns "something's wrong" into "here's exactly what."

## Watch out for

- **Logging the raw completion text as an unstructured string.** A log line with the model's whole answer pasted into a message field isn't queryable — you can't filter by prompt version, group by tool-call count, or compute a p95 latency for one step. Structure first, readability second.
- **Measuring only the request-level total.** A 4-second average hides that assembling the prompt is always fast and the tool loop is always the tail — without per-step timing you optimize the wrong thing.
- **Treating traces and completion logs as the same pipeline.** Traces are operational metadata (timings, token counts, versions) and can usually be kept broadly; the completion text itself carries user content and needs the redaction and access controls [Logging Prompts and Completions Safely](/learn/genai-app-dev/logging-prompts-and-completions-safely) covers. Conflating them means either the traces are too locked-down to be useful, or the completions are too open to be safe.

## Where next

[Instrumenting Requests With Tracing](/learn/genai-app-dev/instrumenting-with-tracing) builds the trace structure shown above for real, and [Logging Prompts and Completions Safely](/learn/genai-app-dev/logging-prompts-and-completions-safely) covers the separate, stricter pipeline for the content itself. Once both exist, [Evals and Regression Testing for Prompts](/learn/genai-app-dev/evals-and-regression-testing) is what turns the quality signal from "someone noticed" into a repeatable check.

**Related:** [Instrumenting Requests With Tracing](/learn/genai-app-dev/instrumenting-with-tracing), [Logging Prompts and Completions Safely](/learn/genai-app-dev/logging-prompts-and-completions-safely), [Canary and Percentage-Based Rollout](/learn/genai-app-dev/canary-and-percentage-rollout), [Latency Budgets for LLM Features](/learn/genai-app-dev/latency-budgets-for-llm-features), [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking)
