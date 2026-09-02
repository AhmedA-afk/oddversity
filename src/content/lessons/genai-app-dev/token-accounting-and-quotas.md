---
title: "Token Accounting and Per-User Quotas"
track: "genai-app-dev"
status: live
summary: "Log tokens, cost, and model per request, then enforce per-user quotas with a graceful over-limit response instead of a surprise bill."
duration: "7 min read"
---

[Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking) makes the case for instrumenting spend. This lesson builds the two things that turn that instrumentation into something enforceable: a usage log you can query per user, and a quota check that runs before the model call goes out.

## What we're building

A logging layer that records tokens, cost, and model for every request using the normalized usage fields every provider adapter should expose, a quota check that blocks or degrades a request before it's sent once a user is over their plan's limit, and a daily rollup query for billing and alerting.

## Setup

This assumes a [provider abstraction layer](/learn/genai-app-dev/provider-abstraction-layers) that already normalizes each response into a common shape — see [Normalizing Responses Across Providers](/learn/genai-app-dev/normalizing-responses-across-providers) if you haven't built that yet. The examples below assume a normalized `Usage` object with `input_tokens`, `output_tokens`, and `model`, regardless of which provider actually served the request.

```bash
pip install anthropic
```

## Build it

### Define the usage row and a pricing table

```python
from dataclasses import dataclass
from datetime import datetime, timezone

# $ per 1M tokens — keep this table next to your provider adapter, not scattered in code
PRICING = {
    "claude-opus-5":   {"input": 5.00,  "output": 25.00},
    "claude-sonnet-5": {"input": 2.00,  "output": 10.00},
    "claude-haiku-4-5": {"input": 1.00, "output": 5.00},
}

@dataclass
class UsageRow:
    timestamp: str
    user_id: str
    feature: str
    model: str
    input_tokens: int
    output_tokens: int
    cost_usd: float

def compute_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    rates = PRICING[model]
    return (input_tokens / 1_000_000) * rates["input"] + (output_tokens / 1_000_000) * rates["output"]
```

> **Why this step?** A pricing table that lives next to the adapter, keyed by the exact model string you call, means a cost figure is never eyeballed — it's computed the same way every time, and a model migration is a one-line table update instead of a search-and-replace across the codebase.

### Log every call, success or failure

```python
_usage_log: list[UsageRow] = []  # stand-in for a real table

def log_usage(user_id: str, feature: str, model: str, usage) -> UsageRow:
    row = UsageRow(
        timestamp=datetime.now(timezone.utc).isoformat(),
        user_id=user_id,
        feature=feature,
        model=model,
        input_tokens=usage.input_tokens,
        output_tokens=usage.output_tokens,
        cost_usd=compute_cost(model, usage.input_tokens, usage.output_tokens),
    )
    _usage_log.append(row)
    return row
```

> **Why this step?** This has to run on every call, wired into the same place the [provider adapter](/learn/genai-app-dev/provider-adapter-anthropic-openai) returns its normalized response — not sprinkled ad hoc at call sites, or you'll find features that quietly never got instrumented.

### Enforce a per-user, per-plan quota before the call goes out

```python
PLAN_DAILY_LIMITS = {"free": 50_000, "pro": 1_000_000, "enterprise": None}  # tokens/day, None = unlimited

class QuotaExceeded(Exception):
    def __init__(self, user_id: str, used: int, limit: int):
        self.user_id, self.used, self.limit = user_id, used, limit
        super().__init__(f"user {user_id} used {used}/{limit} tokens today")

def tokens_used_today(user_id: str) -> int:
    today = datetime.now(timezone.utc).date().isoformat()
    return sum(
        r.input_tokens + r.output_tokens
        for r in _usage_log
        if r.user_id == user_id and r.timestamp.startswith(today)
    )

def check_quota(user_id: str, plan: str):
    limit = PLAN_DAILY_LIMITS.get(plan)
    if limit is None:
        return
    used = tokens_used_today(user_id)
    if used >= limit:
        raise QuotaExceeded(user_id, used, limit)
```

> **Why this step?** Checking the quota *before* the request goes out, not after, is what actually caps spend — logging usage after the fact tells you what happened, but only a pre-flight check prevents the next request from happening at all.

### Return a graceful over-limit response, not a bare error

```python
def handle_request(user_id: str, plan: str, feature: str, model: str, **call_kwargs):
    try:
        check_quota(user_id, plan)
    except QuotaExceeded as e:
        return {
            "error": "quota_exceeded",
            "message": "Daily usage limit reached. Upgrade your plan or try again after midnight UTC.",
            "used": e.used,
            "limit": e.limit,
            "retry_after": "next UTC day",
        }

    response = client.messages.create(model=model, **call_kwargs)
    log_usage(user_id, feature, model, response.usage)
    return {"content": response.content}
```

> **Why this step?** A raw 429 or a stack trace at the quota boundary reads as a bug to the user. A structured response the client can render as "you're over your plan" — with what they can do about it — is the same instinct as [graceful degradation in error handling](/learn/genai-app-dev/error-handling-for-llm-calls), applied to a business limit instead of a provider failure.

## Run it

```python
handle_request("u_free_1", "free", "chat-reply", "claude-sonnet-5",
                max_tokens=512, messages=[{"role": "user", "content": "Summarize this."}])
# Runs normally until the free plan's 50,000 daily tokens are used, then returns
# {'error': 'quota_exceeded', 'used': 50310, 'limit': 50000, ...}
```

## Harden it

- **Roll usage up daily for billing and alerting**, keyed by feature so finance and engineering read the same source of truth:

```python
from collections import defaultdict

def daily_rollup(date_str: str) -> dict:
    totals = defaultdict(lambda: {"tokens": 0, "cost_usd": 0.0, "requests": 0})
    for r in _usage_log:
        if not r.timestamp.startswith(date_str):
            continue
        key = r.feature
        totals[key]["tokens"] += r.input_tokens + r.output_tokens
        totals[key]["cost_usd"] += r.cost_usd
        totals[key]["requests"] += 1
    return dict(totals)
```

- **Alert on the rollup, not just the raw log** — a feature whose daily cost triples week over week is worth a page even if no single user hit a quota.
- **Reconcile the token-derived cost against the provider invoice monthly.** Your table is an estimate computed from usage fields; catching drift here early usually means catching a pricing table that's gone stale after a model migration.

## Extend it

A hard per-request quota check is the blunt version. A softer version routes an over-budget user to a cheaper model instead of blocking them outright, using the same [routing policy](/learn/genai-app-dev/model-routing-strategies) you'd use for cost-based routing generally — see [Cost- and Capability-Based Routing](/learn/genai-app-dev/cost-and-capability-based-routing). Pairing quotas with [prompt caching](/learn/genai-app-dev/prompt-caching) also directly raises the number of requests a fixed token budget actually buys a user, since cached tokens bill at a steep discount.

**Related:** [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking), [Normalizing Responses Across Providers](/learn/genai-app-dev/normalizing-responses-across-providers), [Cost- and Capability-Based Routing](/learn/genai-app-dev/cost-and-capability-based-routing), [Prompt Caching for Speed and Cost](/learn/genai-app-dev/prompt-caching)
