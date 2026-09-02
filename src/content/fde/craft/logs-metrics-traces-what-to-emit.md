---
title: "Logs, metrics, traces: what to emit so 3am you can find it"
phase: craft
module: reliability-and-observability
kind: lesson
summary: The minimum viable observability for a service you will not be watching, built for the person who gets paged at 3 a.m. and has never seen your code, whether that person is you on a different customer's site or someone on the customer's own team.
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Write structured log lines that let someone reconstruct a failed request without asking you what happened.
  - Choose three or four metrics for a new service that would actually change what you do if they moved.
  - Decide when a distributed trace earns its complexity and when a correlation id threaded through logs is enough.
sources:
  - https://www.zenml.io/llmops-database/forward-deployed-engineering-for-enterprise-llm-deployments
  - https://www.krishnaik.in/liveclass2/Forward_Deployed_Engineer?id=14
---

Colin Jarvis, who heads forward deployed engineering at OpenAI, names "extensive telemetry" as one pillar of the preferred technical stack his team pushes into every engagement. That is a deliberate emphasis, not a generic best practice repeated out of habit. On a product team, a missing metric is an inconvenience you fix next sprint. On an engagement, a missing metric is the reason nobody, including you, can answer "what happened" when the customer asks three weeks after you have moved to a different account.

The three kinds of telemetry, logs, metrics, and traces, answer three different questions. Confusing them is the most common way teams end up with either too little signal or an unreadable flood of it.

## Logs answer: what happened, in this one case

A log line is evidence about one specific event. The test for whether a log line is useful is whether it lets a stranger reconstruct what happened without access to your memory of writing the code.

```python
import logging
import json

logger = logging.getLogger("triage")

def log_event(level, message, **fields):
    logger.log(level, json.dumps({"message": message, **fields}))

log_event(
    logging.INFO,
    "ticket_routed",
    correlation_id=req.correlation_id,
    ticket_id=ticket.id,
    queue=result.queue,
    matched_rule=result.matched,
    duration_ms=round(elapsed * 1000, 1),
)
```

Three things make this useful rather than noise. It is structured (JSON, not a sentence with values interpolated in), so it can be grepped, filtered, and aggregated rather than only read. It carries a correlation id that threads through every log line touched by the same request, so a support engineer can pull every line for one failed ticket with a single filter. And it names the outcome, not just the attempt: `ticket_routed`, not `processing ticket`.

**What never goes in a log line:** a customer's name, email, phone number, government id, or free-text content that might contain any of those. Under India's Digital Personal Data Protection Act 2023, and under GDPR or HIPAA elsewhere, logs are a place personal data leaks silently, because nobody treats a log statement with the same scrutiny as a database write. Log the ids, not the content.

## Metrics answer: how is the system doing, in aggregate

A metric is a number tracked over time, useful precisely because it discards the detail of any one event in exchange for showing you a trend. The RED method is a reasonable minimum for a service under a customer deadline: **rate** of requests, **errors** as a fraction of requests, and **duration** at a percentile that reflects the slow tail, not just the average.

```python
from prometheus_client import Counter, Histogram

requests_total = Counter("triage_requests_total", "Total requests", ["outcome"])
request_duration = Histogram("triage_request_duration_seconds", "Request duration")

def handle_triage(ticket):
    with request_duration.time():
        try:
            result = route(ticket)
            requests_total.labels(outcome="routed").inc()
            return result
        except Exception:
            requests_total.labels(outcome="error").inc()
            raise
```

Choose metrics by asking a specific question first: what number, if it moved, would change what you do? "Error rate crossed 5%" changes what you do. "Total lines of code executed" does not. Krish Naik's bootcamp module on observability makes the same point in practice: instrument for decisions, not for dashboards that look thorough and answer nothing.

Resist the temptation to instrument everything on day one. Three or four metrics that someone will actually look at beat twenty that nobody does. Add more once you know what question keeps coming up.

## Traces answer: where did the time go, across systems

A trace follows one request across every service and external call it touches, with timing for each hop. It earns its complexity when a request crosses three or more systems you do not fully control, because that is exactly the situation where "which hop was slow" cannot be answered by a single service's logs.

For a smaller integration, a correlation id threaded consistently through every log line, at every hop, gets you most of the same value without the operational cost of running a tracing backend. Reach for full distributed tracing when the number of hops or the number of engagement services makes a single correlation id searchable across systems no longer enough to reconstruct the timeline by hand.

## The minimum viable version for a two-week engagement

You do not need an observability platform. You need three things, buildable in an afternoon:

1. **Structured JSON logs with a correlation id on every line**, shippable to whatever the customer already has, even if that is just a file the customer's ops team can `grep`.
2. **A handful of counters and a duration histogram** for the operations that matter, exposed on a `/metrics` endpoint or logged as periodic summary lines if the customer has no metrics backend at all.
3. **A documented way to find the correlation id for a specific customer complaint**, usually a ticket id or a timestamp, written into the README so the customer's own team can self-serve the first question: "did this actually run, and what happened?"

That third item is the one teams skip and the one that determines whether you get paged at 3 a.m. or the customer's own on-call engineer can answer their own question without you.

## Do this now

Add structured logging with a correlation id, three metrics chosen by the "would this change what I do" test, and one paragraph in your README titled "how to find out what happened to a specific request" to a service you have already built in this phase.
