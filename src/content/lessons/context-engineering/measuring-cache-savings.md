---
title: "Measuring Cache Savings"
track: "context-engineering"
status: live
summary: "Walk one six-turn session through actual cache usage numbers to see exactly when a caching fix breaks even and how much it saves."
duration: "7 min read"
---

"Caching should be saving us money" is a hope. This walks one concrete session, turn by turn, through the actual `usage` numbers a caching-aware request produces, to turn that hope into a number you can defend.

## The setup

A support agent has a 2,600-token stable prefix — a 2,000-token system prompt plus 600 tokens of tool schemas, unchanged across the whole session — following the layout from [Ordering for Cache Hits](/learn/context-engineering/ordering-for-cache-hits), with a single cache breakpoint placed right after that prefix. The conversation runs six turns; for clarity, this example isolates the effect of caching just the stable 2,600-token prefix and doesn't add a second breakpoint for the growing conversation history — a real system would likely add one (see [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design-deep)), trading a bit more complexity for a bit more savings.

To make the arithmetic concrete without depending on any provider's live pricing page, this example uses cost *ratios* rather than dollar amounts: a fresh (uncached) token costs 1.0 unit, a cache-write token costs 1.25 units, and a cache-read token costs 0.1 units. These ratios mirror Anthropic's published prompt-caching multipliers as one real, documented example of the shape a caching provider's pricing takes — check your own provider's current numbers, since they can change, but the *shape* (write costs a bit more than normal, reads cost far less) is the durable part.

## Step by step

### Step 1: Establish the no-caching baseline

Without caching, the 2,600-token stable prefix gets fully reprocessed on every one of the six turns, since nothing distinguishes it from the rest of the request:

```
6 turns x 2,600 tokens x 1.0 unit/token = 15,600 units
```

> **Why this step?** You need a baseline to know whether a change actually helped. "Turns are cheaper now" is meaningless without a number for what they cost before.

### Step 2: Capture turn 1's actual usage with caching enabled

```
Turn 1 usage: cache_creation_input_tokens=2600, cache_read_input_tokens=0, input_tokens=45
```

Cost of the stable-prefix portion this turn: `2,600 x 1.25 = 3,250 units` — more expensive than the uncached baseline of 2,600 units for that same turn. This is expected: turn 1 always pays a premium to populate the cache. Nothing has been saved yet.

> **Why this step?** If you stop measuring here, caching looks like a net loss. The entire point of this walkthrough is to not stop here.

### Step 3: Capture turn 2's actual usage and find the break-even point

```
Turn 2 usage: cache_read_input_tokens=2600, cache_creation_input_tokens=0, input_tokens=52
```

Cost of the stable-prefix portion this turn: `2,600 x 0.1 = 260 units` — against an uncached cost of 2,600 units for the same content, that's a saving of 2,340 units on turn 2 alone. Turn 1's premium over baseline was `3,250 - 2,600 = 650` units. Turn 2's saving of 2,340 units clears that 650-unit deficit more than three times over.

> **Why this step?** This is the number that actually matters: the design change is already net-positive by the *second* turn of the session, not after some long amortization period. A stable prefix that's read even once after being written has already paid for itself.

### Step 4: Extrapolate across the remaining turns

Turns 3 through 6 each read the same cached prefix:

```
4 more turns x 2,600 tokens x 0.1 unit/token = 1,040 units
```

Total cost across all six turns, stable-prefix portion only:

```
turn 1 (write):        3,250 units
turns 2-6 (5 reads):    5 x 260 = 1,300 units
                        ---------------------
total with caching:     4,550 units
```

Against the no-caching baseline of 15,600 units, that's a reduction of `15,600 - 4,550 = 11,050 units`, or about 71% of what this portion of the spend would otherwise have cost — and the reduction gets larger, not smaller, the longer the session runs, since only the first turn ever pays the write premium.

### Step 5: Note the latency side, qualitatively

Beyond the cost multiplier, a cache read also skips the compute-heavy prefill pass over those 2,600 tokens entirely — see [KV Cache and Context Prefixes](/learn/context-engineering/kv-cache-and-context-prefixes) for why that recomputation is what a cache hit avoids. The exact latency improvement depends on your provider, model, and prefix size, so it isn't quoted here as a number — but it's a real, separately measurable effect worth tracking alongside cost, not a side benefit you have to take on faith.

> **Why this step?** Cost and latency both trace back to the same underlying mechanism (skipped recomputation), but they're measured differently and can diverge under load — track both rather than assuming one implies the other.

## Where it breaks (+fix)

- **The gap between turns exceeds the cache TTL.** If turn 2 arrives after the cache entry has expired — a user who takes a long lunch mid-conversation — it shows up as `cache_creation_input_tokens=2600` again instead of a read, paying the write premium a second time. The fix isn't to panic about one re-write; it's to expect it as a normal cost of sessions with long idle gaps, and to choose a longer TTL if your provider supports one and your traffic pattern has frequent gaps.
- **A single volatile token creeps into the "stable" prefix.** If something upstream reintroduces a timestamp or session ID ahead of the breakpoint, every turn reverts to `cache_creation_input_tokens=2600, cache_read_input_tokens=0` — indistinguishable, from the usage numbers alone, from simply never having enabled caching. See [Cache and Merge Mistakes](/learn/context-engineering/cache-invalidation-mistakes) for the full list of ways this happens silently.

## Takeaways

The savings here come from exactly one thing: the 2,600-token prefix was stable and got reused. Not from a smaller prompt, not from a cheaper model, not from any change to what the agent actually does — purely from the fact that the same bytes showed up at the front of the request more than once and the provider recognized it. That's the throughline for the whole caching half of this module: prefix stability is the asset, and everything in [Ordering for Cache Hits](/learn/context-engineering/ordering-for-cache-hits) and [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design-deep) exists to protect it.

**Related:** [How Prompt Caching Works](/learn/context-engineering/prompt-caching-mechanics) · [Ordering for Cache Hits](/learn/context-engineering/ordering-for-cache-hits) · [Context Observability and Token Accounting](/learn/context-engineering/context-observability-and-token-accounting) · [Token Accounting: A Per-Turn Ledger](/learn/context-engineering/token-accounting-per-turn-ledger)
