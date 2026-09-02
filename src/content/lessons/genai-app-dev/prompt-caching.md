---
title: "Prompt Caching for Speed and Cost"
track: "genai-app-dev"
status: live
summary: "What actually makes a prefix cacheable, how the TTL tradeoff works, and how caching plugs into the rest of the perf-and-cost toolkit."
duration: "6 min read"
---

[Prompt Caching for Speed and Cost](/learn/genai-app-dev/prompt-caching-for-speed-and-cost) introduced the idea: cache a stable prefix, skip re-processing it on repeat calls. This lesson goes one level deeper — what makes a prefix actually eligible, how the TTL tradeoff plays out in a real request pattern, and where caching sits relative to the other levers in this module before you build it in the next lesson.

## What it is

A cache breakpoint is a marker you place in a request telling the provider "everything up to here is worth remembering." On the next call with an identical prefix up to that marker, the provider skips recomputing it and starts from where the cached state left off. It is not a summary, not an approximation, and not semantic — it's an exact match on the literal token sequence, checked in order: tool definitions, then system prompt, then messages. Change one token anywhere in that sequence, ahead of the breakpoint, and the whole thing misses.

## The mental model

Think of it as a receipt, not a memory. The provider isn't "remembering the conversation" the way a person would — it's storing a specific, addressable computed state keyed to an exact byte sequence, with an expiration stamped on it. Ask for the same receipt again before it expires and you get the discounted, faster version. Change even a stray character in what the receipt covers, or show up after it expires, and you're back to paying full price and full latency for that portion.

## Why it works this way

The reason caching is a prefix match rather than a semantic one comes straight from how the model processes a prompt: each token's internal representation depends on every token before it. Reusing a cached prefix only works because the *computation* for that stretch is provably identical when the tokens are identical — there's no shortcut for "close enough." This is also why cache reads are billed at a steep discount off normal input pricing while the first write costs somewhat *more* than an uncached call: you're paying a small premium once to make every subsequent read cheap, and that premium only pays for itself across repeated calls sharing the prefix within its lifetime.

That lifetime is the TTL tradeoff. A short default TTL (on the order of minutes) suits a request pattern with a tight burst — a user rapid-firing follow-up questions in one session. A longer, paid TTL suits a prefix reused across many separate sessions spread over hours, like a system prompt shared by every user of a feature. Picking the wrong one either pays the write premium too often (TTL too short for your traffic pattern) or holds an expensive extended-TTL cache warm for a prefix nobody calls again in time (TTL too long for how sparse your traffic actually is).

## A concrete example (shown)

A document Q&A feature sends the same 40,000-token reference manual as context on every question a user asks about it, followed by their specific question:

```
[tool definitions]                    <- part of the matched prefix
[system prompt]                       <- part of the matched prefix
[40,000-token reference manual]       <- cache breakpoint goes here
[user's question]                     <- always unique, after the breakpoint
```

The first question in a session pays full price to process all 40,000 tokens and writes them to cache. Every follow-up question in the same session — "what about section 4?", "does that apply to the enterprise tier?" — reuses the cached manual and pays only for the new question and the new answer. A session with one question sees no benefit at all; a session with ten sees the manual's cost paid essentially once instead of ten times. This is exactly the shape [Where the Milliseconds Go](/learn/genai-app-dev/where-latency-comes-from) describes as prefill cost — caching is the lever that removes it from every call after the first.

## Where it shows up

- **Any feature with a large, mostly-static system prompt or reference document** — support bots, document Q&A, coding assistants with a big style guide baked into every call.
- **Multi-turn conversations**, where the growing history up to the latest turn is itself a stable prefix on the *next* call — see [Trimming Conversation History for Context Limits](/learn/genai-app-dev/trimming-conversation-history) for how that interacts with keeping the history short enough to matter.
- **Agentic tool loops**, where the tool definitions and accumulated context are identical across every iteration of the loop — [Multi-Step Agentic Tool Loops](/learn/genai-app-dev/multi-step-agentic-tool-loops) is exactly the pattern that benefits most, because the same prefix is resent every single turn of the loop.

## Watch out for

1. **A volatile field ahead of the breakpoint.** A timestamp, a session ID, or an unsorted-JSON tool list placed before the stable content invalidates the cache on every single call, silently, because it changes the very first bytes of the "stable" prefix.
2. **Confusing "the model got faster" with "caching worked."** Verify it — the response's usage data reports cache write and cache read tokens separately; if reads are always zero across calls that should share a prefix, something upstream is breaking the match. The next lesson builds this check directly.
3. **Caching a prefix that's rarely repeated.** A prompt that's genuinely unique per call gets nothing from a breakpoint — it pays the write premium once and never earns it back. Cache the reference manual, not the user's one-off question.

## Where next

[Implementing Prompt Caching](/learn/genai-app-dev/implementing-prompt-caching) builds the breakpoints, measures the before/after numbers on a real call pattern, and adds a semantic cache on top for requests that repeat exactly.

**Related:** [Setting a Latency Budget](/learn/genai-app-dev/latency-budgets), [Where the Milliseconds Go](/learn/genai-app-dev/where-latency-comes-from), [Trimming Conversation History for Context Limits](/learn/genai-app-dev/trimming-conversation-history), [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking)
