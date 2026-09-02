---
title: Retries, idempotency and backoff
phase: craft
module: reliability-and-observability
kind: lesson
summary: How to make an integration survive a flaky upstream without double-charging, double-booking, or hammering a system that is already struggling, when the code has to work unattended on a customer's infrastructure you cannot watch.
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Classify an upstream failure as retryable or not before writing any retry logic.
  - Implement exponential backoff with jitter and a hard retry budget for an outbound call.
  - Design an idempotency key so a retried write cannot be applied twice.
artifact: An outbound integration client with a typed retry policy, a documented retry budget, and one test proving a duplicate send does not duplicate the effect.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
  - https://vibeengines.com/roadmap/forward-deployed-engineer
---

[Webhooks, idempotency, and retries that do not double-charge](/roles/forward-deployed-engineer/foundations/webhooks-idempotency-and-retries) covers what to do when someone else's system calls yours and might call it twice. This lesson covers the other direction: your service is calling a customer's system, or a vendor's, and that system will occasionally be slow, briefly down, or rate limiting you, and your code has to keep working without a human watching it.

Vinoo Ganesh lists reliability, specifically adding retries and idempotency to an integration and writing a runbook, among the traits he trains engineers on before they go into the field. Vibe Engines' roadmap for the role names "reliability and incident response" as a distinct station separate from ordinary feature work. The reason both single it out: on an engagement, you usually will not be paged when this breaks. The failure surfaces three days later as a customer asking why 40 accounts were created twice.

## Classify the failure before you retry it

Not every error should be retried, and retrying the wrong kind of error makes things worse, not better.

| Failure | Retry? | Why |
|---|---|---|
| Connection timeout, DNS failure | Yes | Almost always transient |
| HTTP 502, 503, 504 | Yes | The upstream or a proxy in front of it is overloaded, briefly |
| HTTP 429 (rate limited) | Yes, honouring `Retry-After` | The upstream told you exactly how long to wait |
| HTTP 500 with a body describing a bad request | No | The request itself is invalid; retrying sends the same broken request forever |
| HTTP 401, 403 | No | A token problem, not a transient one; retrying will not fix an expired credential |
| HTTP 200 with an error encoded in the body | Depends | Some vendors return success codes for business failures; read the body before deciding |

That last row is the one that catches people. A corporate proxy or a misconfigured vendor gateway can return `200 OK` with an HTML error page in the body. Treat "is this actually success" as a question you answer by parsing content, not by trusting the status code alone.

## Exponential backoff with jitter, and a hard budget

Retrying immediately, three times in a row, on a system that is already overloaded makes the overload worse. Exponential backoff spaces retries out geometrically; jitter randomises the spacing slightly so that many clients retrying the same failing upstream do not all retry in lockstep and create a new wave of load the moment the backoff window ends.

```python
import random
import time
import httpx

RETRYABLE_STATUSES = {502, 503, 504, 429}

def call_with_backoff(fn, max_attempts=5, base_delay=0.5, max_delay=20.0):
    for attempt in range(1, max_attempts + 1):
        try:
            response = fn()
            if response.status_code not in RETRYABLE_STATUSES:
                return response
        except httpx.TransportError:
            if attempt == max_attempts:
                raise
        else:
            if attempt == max_attempts:
                return response  # exhausted budget, caller decides what to do

        delay = min(max_delay, base_delay * (2 ** (attempt - 1)))
        delay += random.uniform(0, delay * 0.25)  # jitter
        time.sleep(delay)
```

The retry budget matters as much as the backoff shape. Five attempts over roughly thirty seconds is a reasonable default for a synchronous customer-facing call. A background batch job pulling from a paginated API can tolerate a much longer budget, because nobody is staring at a spinner. Set the budget deliberately and write it down; "retry forever" is not a policy, it is a way to turn a five-minute vendor outage into a queue that never drains.

## Idempotency: making a retry safe to repeat

Backoff controls when you retry. Idempotency controls what happens if the first attempt actually succeeded and the retry is unnecessary duplication, which happens more than intuition suggests: a request can time out on your side after the upstream already processed it.

The standard pattern is an idempotency key: a value you generate once per logical operation and send with every attempt, so the receiving system can recognise a retry and return the original result instead of repeating the effect.

```python
import uuid

def create_account(customer_data, idempotency_key=None):
    key = idempotency_key or str(uuid.uuid4())
    return call_with_backoff(lambda: httpx.post(
        "https://vendor.example.com/v1/accounts",
        json=customer_data,
        headers={"Idempotency-Key": key},
        timeout=10,
    ))
```

Generate the key once, outside the retry loop, and reuse it across every attempt for the same logical operation. Generating a new key per attempt defeats the entire purpose. If the upstream API does not support idempotency keys, which many internal or older enterprise systems do not, build the equivalent yourself: check for an existing record with the same natural key, such as customer id plus operation type, before writing, and make the check part of the same transaction as the write.

## When not to retry at all

Some operations are inherently unsafe to retry blindly regardless of idempotency machinery: sending a one-time password, charging a card without a supported idempotency key, or triggering an external notification like an SMS. For these, prefer failing loudly and surfacing the failure to a human or a dead-letter queue over silently retrying and risking a duplicate side effect the customer will notice immediately.

## Runbooks come from the same discipline

Every retry policy you write implies a failure mode: what happens when the budget is exhausted. Write that down as part of the integration, not as an afterthought. [Runbooks, and staying calm during the CEO demo crisis](/roles/forward-deployed-engineer/craft/runbooks-and-the-ceo-demo-crisis) covers turning "what happens when this finally gives up" into something a human, possibly not you, can act on at 3 a.m.

## Do this now

Take an outbound call in a service you have built, and add: a classification of which failures are retryable, exponential backoff with jitter and a stated budget, and an idempotency key generated once per logical operation. Write one test that sends the same idempotency key twice and asserts the effect happened once.
