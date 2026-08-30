---
title: "Cut your LLM bill without hurting quality"
description: "Seven levers ordered by saving-per-hour-of-work — caching, routing, context hygiene, and the measurement that stops you optimising the wrong thing."
question: "How do I reduce the cost of my LLM application?"
level: "intermediate"
duration: "20 min"
published: "2026-08-30"
tags: ["Production", "Cost", "Performance"]
featured: false
steps:
  - "Measure cost per request before changing anything"
  - "Turn on prompt caching for the stable part of your prompt"
  - "Stop sending context that does not change the answer"
  - "Route easy requests to a smaller model"
  - "Cache whole answers for repeated questions"
  - "Cap the runaway paths: retries, agent loops, and max tokens"
related:
  - "/learn/production/token-and-cost-tracking"
  - "/learn/production/model-routing-by-task-complexity"
  - "/learn/context-engineering/context-observability-and-token-accounting"
---

Most LLM bills are not expensive because the model is expensive. They are expensive because
the same 4,000 tokens of instructions ride along on every request, a retry loop has no
ceiling, and every query — trivial or hard — goes to the largest model available.

Here are the levers in the order I would actually pull them: highest saving per hour of
work first.

## Step 0 — Measure, or you will optimise the wrong thing

You cannot do this from the provider's monthly total. Log per request: input tokens, output
tokens, cached tokens, model, endpoint, and a request type you assign yourself.

```python
import logging, time

def call_with_accounting(kind: str, **kwargs):
    started = time.monotonic()
    response = client.messages.create(**kwargs)
    usage = response.usage
    logging.info(
        "llm kind=%s model=%s in=%d out=%d cache_read=%d cache_write=%d ms=%d",
        kind, kwargs["model"], usage.input_tokens, usage.output_tokens,
        getattr(usage, "cache_read_input_tokens", 0),
        getattr(usage, "cache_creation_input_tokens", 0),
        int((time.monotonic() - started) * 1000),
    )
    return response
```

One day of this data almost always reveals that a single request type is most of the bill,
and it is usually not the one anybody guessed.

## Lever 1 — Prompt caching (largest saving, smallest effort)

If a substantial prefix of your prompt is identical across requests — a system prompt, tool
definitions, a policy document, few-shot examples — caching it means you stop paying full
price to re-send it every time. Cached input tokens are billed at a large discount by every
major provider.

The mechanic that matters: caching works on a **prefix**. Everything before your cache
breakpoint must be byte-identical between requests. So order your prompt stable-first:

```
[ system prompt ][ tool definitions ][ reference docs ] ← cache breakpoint
[ conversation history ][ this user's question ]
```

A timestamp, a user ID, or a randomly ordered document set placed near the top silently
invalidates the whole cache. If your cache hit rate is near zero, that is almost always
why. Check `cache_read_input_tokens` in the logs — this is not something to assume.

## Lever 2 — Stop sending context that does not change the answer

Ask of every block in the prompt: if I delete this, does the output get worse? Measure it,
do not guess. The usual culprits:

- **Full conversation history** on a request that only needs the last two turns.
- **Retrieved chunks nobody reads.** Sending top-20 instead of top-5 is a straight
  multiplier on cost, and past a point it *reduces* quality as well as raising the bill.
- **Verbose tool schemas.** Every tool definition is re-sent every turn. Trim the
  descriptions to what a chooser needs.
- **Politeness scaffolding** in the system prompt that no longer earns its tokens.

This is the lever with the best quality side-effect: shorter, sharper context frequently
performs better, not just cheaper.

## Lever 3 — Route by difficulty

Not every request needs the biggest model. Classification, extraction, routing, short
rewrites and formatting are usually solved by a small model at a fraction of the price and
a fraction of the latency.

```python
def choose_model(kind: str, tokens: int) -> str:
    if kind in {"classify", "extract", "route", "title"}:
        return SMALL_MODEL
    if kind == "answer" and tokens < 2000:
        return MID_MODEL
    return LARGE_MODEL
```

Do this with your eval set open. Move one request type down a tier, run the eval, keep the
change if the score holds. That is a twenty-minute experiment with a permanent payoff, and
it is defensible because you have the number.

## Lever 4 — Cache whole answers

Distinct from prompt caching: this is a plain key-value cache in front of the model, keyed
on a normalised request. If your traffic has repeats — an FAQ-shaped support bot, a docs
assistant, anything embedded in a product — the hit rate can be substantial and a hit costs
nothing at all.

```python
import hashlib, json

def cache_key(prompt: str, model: str, tenant: str) -> str:
    payload = json.dumps({"p": prompt.strip().lower(), "m": model, "t": tenant}, sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()
```

Include the tenant in the key. A cache shared across customers is a data leak, not an
optimisation. Set a TTL short enough that a document update is reflected within your
freshness promise.

## Lever 5 — Cap the runaway paths

These do not show up in average cost. They show up as a bad week.

- **Retries.** Bound them, and never retry a validation failure more than once — if the
  second attempt fails, the input is the problem and a third costs money to learn nothing.
- **Agent loops.** Every loop needs a turn limit *and* a token budget. Turn limits alone do
  not bound cost, because a single turn can carry a very large context.
- **`max_tokens`.** Set it to what the task actually needs. A default of 4096 on a task that
  outputs a sentence is paying for headroom you never use — and it removes your only guard
  against a degenerate repetition loop.
- **Per-user quotas**, if anything you run is user-facing and unauthenticated.

## Lever 6 — Batch what is not interactive

If a job does not need an answer in the next few seconds — nightly classification,
backfills, bulk enrichment — the asynchronous batch endpoints are meaningfully cheaper than
the synchronous ones at every major provider. This is free money for any workload with a
tolerance for latency, and it is usually a small change to the calling code.

## What not to do

Do not switch providers to save money before you have done lever 1 and lever 2. A cheaper
per-token price on a bloated, uncached prompt is a smaller discount than fixing the prompt,
and you pay for it with a migration and a fresh set of quality regressions.
