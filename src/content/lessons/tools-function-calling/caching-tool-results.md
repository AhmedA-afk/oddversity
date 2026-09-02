---
title: "Caching Tool Results Across Calls"
track: "tools-function-calling"
status: live
summary: "Cache deterministic, non-stale reads keyed on tool name plus normalized arguments — and never cache a write."
duration: "6 min read"
---

The dispatcher you built in [Building a Registry and Dispatcher](/learn/tools-function-calling/building-a-tool-dispatcher) runs the real handler on every call, even when it just ran the exact same call two turns ago. That's correct by default and wasteful in the common case — this lesson is about which calls are safe to skip re-running, and which ones must never be skipped.

## What it is

A cache in front of the dispatcher: before calling `entry.handler`, check whether this exact tool name plus these exact arguments already has a stored result, and if so, return it without touching the real system at all. The interesting work isn't the lookup — it's deciding, per tool, whether that shortcut is ever safe to take. [Caching Tool Results Across Calls](/learn/tools-function-calling/tool-result-caching) goes deep on the mechanics — key construction, TTLs, session-scoped versus cross-session stores, invalidation strategy. This lesson sits one level up: it's about making that decision *safely*, inside the execution-safety model this module has been building, where the cost of caching the wrong thing isn't just staleness — it's a tool call that silently didn't happen.

## The mental model

Ask one question per tool, honestly: **if I serve a stored result instead of running this handler again, is anything different about the world as a result?** For a pure read against slow-changing data — "what's this product's description" — the answer is no, and caching is free latency and cost savings. For anything that changes state when it runs — `send_email`, `charge_card`, `create_ticket` — the answer is trivially yes: the entire point of calling it was to make something happen, and a cache hit means that something didn't happen while the model's transcript says it did. That gap between the model's belief about the world and the world's actual state is worse than the latency caching was meant to save.

This is a stricter, execution-safety framing of the same read/write split from [Classifying Tools by Risk Tier](/learn/tools-function-calling/classifying-tool-risk-tiers) — a `read`-tier tool is close to caching-safe by construction; anything tiered `write` or `irreversible` should default to never cached, full stop, unless you can prove idempotence tool by tool.

## Why it works this way

A cache hit is, from the model's point of view, indistinguishable from a fresh call — that's the entire design goal, and it's exactly what makes caching a write dangerous rather than merely wasteful. The model asked for `send_email` believing an email would be sent; the dispatcher matched a cached key and returned a stored "sent successfully" result without invoking the real handler at all. The model's belief and the world's state have now silently diverged, and nothing in the transcript reveals it — the [tool result](/learn/tools-function-calling/returning-results-to-the-model) looks exactly like a real send. This is a different failure mode than a wrong or noisy result: it's a *convincing* result that happens to be describing an event that didn't occur.

## A concrete example (shown)

```python
CACHE: dict[str, ToolResult] = {}

def cache_key(name: str, args: BaseModel) -> str:
    canonical = json.dumps(args.model_dump(), sort_keys=True)
    return f"{name}:{hashlib.sha256(canonical.encode()).hexdigest()}"

def dispatch_cached(tool_use_id, name, raw_input, ctx):
    entry = REGISTRY[name]
    args = entry.args_model.model_validate(raw_input)

    if entry.tier == "read" and entry.cacheable:
        key = cache_key(name, args)
        if key in CACHE:
            return CACHE[key]
        result = ToolResult(tool_use_id, ok=True, content=entry.handler(ctx, args))
        CACHE[key] = result
        return result

    # write and irreversible tiers: never consult or populate the cache
    return ToolResult(tool_use_id, ok=True, content=entry.handler(ctx, args))
```

The gate here is `entry.tier == "read"`, checked *before* `entry.cacheable` is even consulted — a `write`-tier tool never reaches the cache logic at all, regardless of whether someone accidentally marked it `cacheable=True`. That ordering is deliberate: it makes "never cache a write" a structural property of the dispatcher, not a convention every tool author has to remember to respect, the same way [Classifying Tools by Risk Tier](/learn/tools-function-calling/classifying-tool-risk-tiers) makes gating structural rather than ad hoc.

For a session where the model looks up `get_product(sku="SKU-118")` three times while comparing options, this turns three database round trips into one — cheap to build, and the failure mode if you get it wrong (serving a slightly stale product description) is genuinely low-stakes, which is exactly the profile that makes a tool cache-safe in the first place.

## Where it shows up

Lookup tools with slow-changing backing data — product catalogs, documentation search, schema introspection — are the easy, obviously-safe case. Time-sensitive reads (`get_current_time`, `check_inventory`) need either no caching or a short TTL, since a stale answer there is actively wrong, not just outdated — see [Caching Tool Results Across Calls](/learn/tools-function-calling/tool-result-caching) for TTL guidance and cross-session store design. Every side-effecting tool — anything tiered `write` or `irreversible` in this module's vocabulary — belongs in the never-cache category without exception.

## Watch out for

- **Caching a "read" that has a side effect disguised as one.** A `mark_notification_read` tool named like a read but mutating state on every call is a write wearing a read's name — tier by actual effect, not by what the tool sounds like, the same caution called out in [Classifying Tools by Risk Tier](/learn/tools-function-calling/classifying-tool-risk-tiers).
- **A global cache key that ignores who's asking.** Caching `get_my_permissions()` under a key that doesn't include the user id serves one user's permissions to the next user who happens to trigger the same call — an authorization leak with the same shape as the [confused-deputy](/learn/tools-function-calling/the-authority-problem) failure, just introduced by the cache layer instead of the dispatcher.
- **Trusting `entry.cacheable` alone, with no tier gate in front of it.** A boolean flag anyone can flip is one careless edit away from caching a write — put the tier check first, as shown above, so a mistake there fails safe.

## Where next

[Caching Tool Results Across Calls](/learn/tools-function-calling/tool-result-caching) is the deep reference on key construction, TTL choice, and cross-session stores once you know which tools are safe to touch at all.

**Related:** [Caching Tool Results Across Calls](/learn/tools-function-calling/tool-result-caching), [Classifying Tool Risk Tiers](/learn/tools-function-calling/classifying-tool-risk-tiers), [Returning Results the Model Can Use](/learn/tools-function-calling/returning-results-to-the-model), [Building a Registry and Dispatcher](/learn/tools-function-calling/building-a-tool-dispatcher)
