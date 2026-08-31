---
title: "Measuring Latency: p50, p95, and TTFT"
track: "genai-app-dev"
status: live
summary: "Instrument every call for TTFT and total latency, then aggregate to percentiles instead of trusting the average."
duration: "7 min read"
---

You can't hold a [latency budget](/learn/genai-app-dev/latency-budgets) accountable without measuring against it, and a single average number will actively lie to you about whether you're meeting it.

## What we're building

A latency-recording wrapper around your LLM calls that captures time-to-first-token and total duration for every request, tagged by model and route, plus an aggregation step that turns raw samples into p50/p95/p99 — the numbers that actually tell you what users experience.

## Setup

You need three things: a way to hook into the start of a request, a way to detect the first streamed token, and somewhere durable to write the samples (a table, not a log line you'd have to grep — the same principle as [usage tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking)). This example uses Python with the `anthropic` SDK's streaming interface and a simple in-memory list standing in for your metrics store (Postgres, a time-series DB, or a metrics pipeline in production).

```bash
pip install anthropic
```

## Build it

### Record TTFT and total latency around a streaming call

Wrap the call so the clock starts before the request goes out, and stops the moment the first content delta arrives.

```python
import time
import anthropic

client = anthropic.Anthropic()

def timed_call(model: str, route: str, **kwargs):
    start = time.monotonic()
    ttft = None
    text = []

    with client.messages.stream(model=model, **kwargs) as stream:
        for event in stream:
            if event.type == "content_block_delta" and ttft is None:
                ttft = time.monotonic() - start
            if event.type == "content_block_delta" and event.delta.type == "text_delta":
                text.append(event.delta.text)
        final = stream.get_final_message()

    total = time.monotonic() - start
    record_latency(model=model, route=route, ttft=ttft, total=total,
                    output_tokens=final.usage.output_tokens)
    return "".join(text)
```

> **Why this step?** TTFT and total latency answer different questions. TTFT tells you how long a user stares at nothing before anything happens — the number [chat UX](/learn/genai-app-dev/designing-chat-ux) cares about most. Total latency tells you how long the full job takes — what matters for a summarization button, not a chat bubble. Recording both means you can pick the right one per feature instead of conflating them.

### Store samples with the dimensions you'll want to slice by

```python
from dataclasses import dataclass, field

@dataclass
class LatencySample:
    model: str
    route: str
    ttft: float
    total: float
    output_tokens: int
    timestamp: float = field(default_factory=time.time)

_samples: list[LatencySample] = []

def record_latency(model, route, ttft, total, output_tokens):
    _samples.append(LatencySample(model, route, ttft, total, output_tokens))
```

> **Why this step?** A latency number without `model` and `route` attached is nearly useless the moment you run more than one feature or compare two models — you'll want to answer "is the summarizer slow, or is Sonnet slow everywhere?" and that requires the dimension on every row, not reconstructed later from timestamps.

### Aggregate to percentiles, not an average

```python
import statistics

def percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    k = (len(ordered) - 1) * p
    f, c = int(k), min(int(k) + 1, len(ordered) - 1)
    return ordered[f] + (ordered[c] - ordered[f]) * (k - f)

def summarize(route: str, model: str | None = None):
    rows = [s for s in _samples if s.route == route and (model is None or s.model == model)]
    ttfts = [s.ttft for s in rows]
    totals = [s.total for s in rows]
    return {
        "n": len(rows),
        "ttft_p50": percentile(ttfts, 0.50),
        "ttft_p95": percentile(ttfts, 0.95),
        "total_p50": percentile(totals, 0.50),
        "total_p95": percentile(totals, 0.95),
        "total_p99": percentile(totals, 0.99),
    }
```

> **Why this step?** The average is dragged toward the bulk of fast, unremarkable requests and hides the slow tail. p95 tells you the latency that 1 in 20 users actually experiences — the number your budget should be checked against, because a budget that only holds at p50 fails one user in two.

## Run it

```python
for _ in range(50):
    timed_call(
        model="claude-sonnet-5",
        route="chat-reply",
        max_tokens=1024,
        messages=[{"role": "user", "content": "Summarize the plan in three bullets."}],
    )

print(summarize("chat-reply", "claude-sonnet-5"))
# {'n': 50, 'ttft_p50': 0.41, 'ttft_p95': 0.88, 'total_p50': 2.1, 'total_p99': 4.7, ...}
```

The gap between `ttft_p50` and `ttft_p95` in a real production sample is the number worth staring at. If p95 is 3-4x p50, something — a cold cache, an occasional retry, a specific input shape — is producing a bad experience for a meaningful slice of requests, even though "on average" everything looks fine.

## Harden it

- **Bucket by request shape, not just route.** A route that handles both 200-token and 8,000-token inputs will show a bimodal latency distribution that a single percentile line flattens out. Tag samples with an input-size bucket if that variance matters for your feature.
- **Watch p95 over time, not as a one-off snapshot.** A p95 that creeps upward week over week as your system prompt grows is the same silent regression a cost dashboard catches for spend — see [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking) for the parallel pattern.
- **Alert on the budget, not just log it.** Wire p95 breaching your [latency budget](/learn/genai-app-dev/latency-budgets) for two consecutive windows into a real alert, the same way you'd alert on an error-rate spike.

## Extend it

Feed `record_latency` into a real tracing pipeline instead of an in-memory list — this is exactly the shape [Observability for GenAI](/learn/genai-app-dev/observability-for-genai) and [Instrumenting With Tracing](/learn/genai-app-dev/instrumenting-with-tracing) build out for a full request, including retrieval and tool-call spans alongside the model call itself. Once TTFT and total latency are flowing into that pipeline, they join token counts and cost as the three numbers every dashboard in this module assumes exist.

**Related:** [Setting a Latency Budget](/learn/genai-app-dev/latency-budgets), [Where the Milliseconds Go](/learn/genai-app-dev/where-latency-comes-from), [Observability for GenAI](/learn/genai-app-dev/observability-for-genai), [Instrumenting With Tracing](/learn/genai-app-dev/instrumenting-with-tracing), [Streaming Responses to the UI](/learn/genai-app-dev/streaming-responses-to-the-ui)
