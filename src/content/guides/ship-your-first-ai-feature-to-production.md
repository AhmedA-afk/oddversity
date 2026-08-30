---
title: "Ship your first AI feature to production"
description: "The checklist between a working prototype and something you can leave running — timeouts, fallbacks, logging, cost caps, and the failure states users will actually hit."
question: "What do I need to do before putting an LLM feature in front of real users?"
level: "intermediate"
duration: "25 min"
published: "2026-08-30"
tags: ["Production", "Reliability", "Operations"]
featured: false
steps:
  - "Decide what happens when the model is unavailable"
  - "Bound every call with a timeout and a token cap"
  - "Log the request, the response, and the cost"
  - "Design the failure state a user will actually see"
  - "Put a cost ceiling and a rate limit in front of it"
  - "Set up the one alert that matters"
related:
  - "/learn/production/observability-cost-and-latency"
  - "/learn/production/load-shedding-and-graceful-degradation"
  - "/learn/production/on-call-playbooks-for-ai"
---

The prototype works. The gap between that and something you can leave running over a
weekend is almost entirely operational, and it is not large — but every item on this list
is one somebody has been paged for.

## 1. Decide the degraded state before you need it

Providers have outages. Rate limits engage. A model gets deprecated on a schedule you did
not read. Answer this before launch: **when the model is unavailable, what does the user
see?**

The options, in descending order of preference:

- **A cheaper path.** Keyword search instead of semantic search. A template instead of a
  generated summary. Users get something.
- **A cached result**, clearly marked as not fresh.
- **An honest error** that names the situation and does not lose the user's input.

The one unacceptable option is a spinner that never resolves, and it is the default if you
do not choose.

```python
async def summarise(text: str) -> Summary:
    try:
        return await call_model(text, timeout=8)
    except (RateLimitError, APIStatusError, asyncio.TimeoutError):
        logging.warning("summary degraded to extractive fallback")
        return extractive_summary(text)   # first sentences, deterministic, always works
```

A fallback that requires the model is not a fallback.

## 2. Bound every call

Three limits, all of them mandatory:

- **A timeout**, shorter than your user's patience and shorter than your web server's own
  request timeout. If you stream, this is a time-to-first-token deadline, not a total.
- **`max_tokens`**, sized to the task. It is your only guard against a repetition loop
  billing you for pages of nothing.
- **A retry policy** — at most two, exponential backoff with jitter, and only on transient
  errors. Retrying a 400 is a bug that costs money.

```python
from tenacity import retry, stop_after_attempt, wait_exponential_jitter, retry_if_exception_type

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential_jitter(initial=1, max=10),
    retry=retry_if_exception_type((RateLimitError, APIConnectionError)),
    reraise=True,
)
def call_model(**kwargs):
    return client.messages.create(timeout=8, **kwargs)
```

## 3. Log enough to debug tomorrow's complaint

When someone reports "it gave me a weird answer" next Tuesday, you need to reconstruct that
call. At minimum, per request: a request ID that also reaches the user-facing error, the
model and version, prompt version or hash, input and output token counts, latency, stop
reason, and whether a fallback fired.

Log the prompt and completion too, but decide the retention and redaction policy *first* —
prompts routinely contain personal data, and an unbounded log of them is a liability that
grows on its own. Redact at the boundary, set a TTL, and write down which is which.

The **stop reason** is the field people forget and then need. A completion that ended
because it hit the token limit looks like a normal short answer in the database and like a
truncation bug to the user.

## 4. Design the failure state users see

Three states need real design, not a default:

**Slow.** Stream if you can — perceived latency is most of the complaint. If you cannot,
show what stage it is at. A progress indicator that names the step reads as working; a
generic spinner reads as broken.

**Wrong.** Give users a one-click way to say so, attached to the request ID. This is both
your incident detection and, over time, the highest-quality eval data you will ever get,
because it is real inputs that really failed.

**Refused or empty.** When the system genuinely cannot answer, say which and offer the next
step — a search, a human, a different phrasing. "I don't have information about that in the
documentation" plus a support link is a good outcome. A confident invention is not.

## 5. Cap the spend and the rate

Two independent controls, because they fail in different ways:

- **A provider-side budget alert**, so a runaway costs you an email rather than a month's
  budget.
- **Your own per-user and per-tenant rate limit**, applied before the call. A single
  automated client hitting an unauthenticated endpoint is the standard way this goes wrong,
  and it is cheap to prevent.

If any surface is public and unauthenticated, assume it will be scraped for free inference.
Put a quota on it from day one.

## 6. One alert worth having

Do not start with a dashboard nobody opens. Start with one alert on **error rate per
request type over a rolling window**, and one on **p95 latency**. Those two catch the large
majority of real incidents.

Add a **cost-per-request** alert next. It is the one that catches the subtle regressions —
a prompt change that quietly doubled the context, a cache breakpoint that stopped matching,
a retry loop that now fires on a class of input it never used to see.

## The pre-launch checklist

- [ ] There is a defined behaviour when the provider is down, and it has been tested by
      actually blocking the API.
- [ ] Every call has a timeout, a `max_tokens`, and a bounded retry.
- [ ] Requests are logged with an ID, tokens, latency, and the stop reason.
- [ ] Prompt and completion logging has an explicit retention and redaction policy.
- [ ] Users can report a bad answer, and the report carries the request ID.
- [ ] A rate limit exists per user or tenant.
- [ ] A provider budget alert exists.
- [ ] The eval set runs in CI and gates deploys.
- [ ] The model version is pinned, and someone owns the upgrade.

That last one matters more than it looks. Model versions move. Pin explicitly, and treat a
version bump like a dependency upgrade: run the evals, read the diff, ship it deliberately.
