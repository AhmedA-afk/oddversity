---
title: "Performance and Cost Cheatsheet"
track: "genai-app-dev"
status: live
summary: "The latency-budget-first rule, the tail metrics, the cost formula, cacheable-prefix guidance, and the sync-vs-background call, on one page."
duration: "5 min read"
---

The reference version of this module — what to check first when a feature is too slow, too expensive, or both.

## The one rule

**Set the latency budget before you build, not after.** Pick a target TTFT and total latency per feature, then let that number decide model tier, caching, and streaming — never the other way around. See [Setting a Latency Budget](/learn/genai-app-dev/latency-budgets).

## The metrics that matter — start here, then measure

| Metric | What it tells you | Where |
|---|---|---|
| TTFT (p50 / p95) | How long before the user sees anything | [Measuring Latency](/learn/genai-app-dev/measuring-latency-p50-p95) |
| Total latency (p50 / p95 / p99) | How long the full response takes | Same |
| `cache_read_input_tokens` | Whether caching is actually landing (nonzero = hit) | [Implementing Prompt Caching](/learn/genai-app-dev/implementing-prompt-caching) |
| Cost per request, by model and feature | Where spend actually concentrates | [Token Accounting and Quotas](/learn/genai-app-dev/token-accounting-and-quotas) |
| Escalation rate (if cascading) | How often the cheap model isn't enough | [Cutting Cost With a Model Cascade](/learn/genai-app-dev/cutting-cost-with-model-cascade) |

**Always check p95, never just the average.** The average is dragged toward the fast bulk of requests and hides exactly the tail your slowest users feel.

## The token-cost formula

```
cost = (input_tokens / 1,000,000) * input_price
     + (output_tokens / 1,000,000) * output_price
```

Cached tokens are billed differently: writes cost roughly 1.25x the normal input rate (paid once), reads cost roughly 0.1x the normal input rate (paid on every hit after). Confirm exact multipliers against your provider's current pricing — treat these as approximate, and verify against `usage.cache_creation_input_tokens` / `usage.cache_read_input_tokens` on real traffic rather than trusting the arithmetic alone.

## Cacheable-prefix guidance — start here, then verify

| Signal | Cache it? |
|---|---|
| Identical across many calls (system prompt, tool schema, reference doc) | Yes — put the breakpoint right after it |
| Repeated within the cache's TTL window (minutes, or hours with extension) | Yes |
| Unique per call (the user's current message) | No — keep it after the breakpoint |
| Repeated, but only across widely spaced calls (once a day) | Usually not worth it — the write premium won't be recouped |
| Contains a timestamp, session ID, or unsorted JSON ahead of the stable content | Fix this first — it silently breaks every cache hit |

Order matters: tools → system prompt → messages, stable content first, volatile content last. Full pattern: [Prompt Caching for Speed and Cost](/learn/genai-app-dev/prompt-caching).

## The sync-vs-background decision

| Expected duration | Decision |
|---|---|
| Under ~5s | Synchronous, budget it normally |
| ~5-10s | Synchronous with streaming to soften felt latency |
| ~10-30s | The messy middle — synchronous with a hard timeout and fallback, or move async; decide deliberately, don't default |
| 30s+, or duration scales with input size (pages, steps, minutes of media) | Background job — queue, worker, poll or webhook |

Full pattern: [Moving Long Tasks to Background Jobs](/learn/genai-app-dev/background-jobs-for-long-tasks) and [The Queue, Worker, and Webhook Pattern](/learn/genai-app-dev/queue-worker-webhook-pattern).

## Model tier — start here, then measure against an eval

| Task shape | Default tier |
|---|---|
| Classification, short extraction, simple rewrite | Cheapest tier that passes your eval |
| Open-ended drafting, customer-facing quality-sensitive output | Mid or strong tier |
| Multi-step reasoning, complex agentic work | Strongest tier, or a cascade with escalation |
| High-volume + latency-sensitive | Cheap tier first; escalate on low confidence rather than defaulting up |

Never route by "safety margin" alone — measure whether the cheap tier actually fails before paying for the strong one on every call. See [Cutting Cost With a Model Cascade](/learn/genai-app-dev/cutting-cost-with-model-cascade).

## Fast triage: feature is too slow

1. Check TTFT vs. total latency — is prefill (input) or generation (output) the bottleneck? [Where the Milliseconds Go](/learn/genai-app-dev/where-latency-comes-from)
2. Is there a large, stable prefix with no cache breakpoint? Add one.
3. Is `max_tokens` set far above what the feature needs? Trim it.
4. Is the task structurally long (scales with pages, steps, media length)? Move it to a background job.
5. Still slow after all of the above? Check whether a smaller model passes your eval for this specific task.

## Fast triage: feature is too expensive

1. Pull cost-per-request by feature from your [usage log](/learn/genai-app-dev/token-accounting-and-quotas) — find the actual concentration before optimizing blind.
2. Is conversation history growing unbounded? [Trim it](/learn/genai-app-dev/trimming-conversation-history).
3. Is a stable prefix being reprocessed every call? [Cache it](/learn/genai-app-dev/implementing-prompt-caching).
4. Is every request hitting the strongest model regardless of task difficulty? [Cascade it](/learn/genai-app-dev/cutting-cost-with-model-cascade).
5. Still expensive? Set a per-user or per-plan quota as a hard ceiling while you dig further.

**Related:** [Setting a Latency Budget](/learn/genai-app-dev/latency-budgets), [Performance and Cost Antipatterns](/learn/genai-app-dev/perf-cost-antipatterns), [Streaming, Caching, and Batching Together](/learn/genai-app-dev/streaming-caching-batching-together), [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking)
