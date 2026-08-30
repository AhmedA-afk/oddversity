---
title: "Compacting a 200-Step Agent Run"
track: "context-engineering"
status: live
summary: "One long coding-agent trace, a compaction schedule designed for it, and a check that the agent can still finish the job afterward."
duration: "8 min read"
---

Every technique in this module is easy to evaluate in isolation and hard to evaluate together. This lesson runs one real-shaped trace — a coding agent chasing an intermittent bug across roughly 200 tool-call turns — through an actual compaction schedule, end to end, and checks the one thing that matters: does the agent still finish the task.

## The setup

**Task:** "Fix the intermittent 500 error on the checkout endpoint." The agent reads files, runs the test suite, tries fixes, reads more files, and eventually finds and patches the bug — roughly 200 turns, each including tool output (file contents, test runs) that averages about 2,500 tokens per turn, the same profile as the uncompacted trace in [why compaction is necessary](/learn/context-engineering/why-compaction-is-necessary). With the same 170,000-token history budget from that lesson, an uncompacted run hits the wall at turn 68 — well inside a single working session.

The compaction schedule for this run has three tiers, matching the tools already built earlier in this module rather than inventing new ones:

| Content | Treatment | Why |
|---|---|---|
| Last 15 turns | Kept fully raw | Most likely to be referenced precisely — the file just edited, the error just seen |
| Turns older than 15, in batches of ~40 | Rolled into segment digests, then a session digest | [Hierarchical summarization](/learn/context-engineering/hierarchical-summarization-explained) — each fact compressed once, not re-flattened every pass |
| Full file contents, full test logs | Never re-entered into context at all | Reproducible on demand from disk/CI — a pointer, not a copy, the same discipline as [reference by pointer, not value](/learn/context-engineering/reference-by-pointer-not-value) |
| Hypotheses tried, current plan | Written to an external [scratchpad](/learn/context-engineering/scratchpad-working-memory-patterns) | Structured working state, not conversational history — shouldn't be subject to a summarizer's judgment at all |

## Step by step

### Turns 1-40: the first segment digest

At the 40-turn mark, turns older than the last 15 get folded. This batch was mostly file exploration and a first failed fix attempt:

```text
SEGMENT 1 (turns 1-40): Explored checkout module structure. Reproduced the
500 error locally by replaying a sample request. First hypothesis: race
condition in the payment-confirmation callback. Attempted fix: added a
lock around the callback handler. Result: error still reproduces — ruled out.
```

> **Why this step?** Note what's in here versus what isn't: the ruled-out hypothesis and its outcome survive, because that's exactly the "decisions and open threads" survival list from [summarization for compaction](/learn/context-engineering/summarization-for-compaction-deep). The specific file contents read along the way don't survive in the digest at all — they're on disk, re-readable if anything later needs them again.

### The scratchpad, updated in parallel

Independent of the conversational digests, the scratchpad accumulates the same kind of record built in [scratchpad and working-memory patterns](/learn/context-engineering/scratchpad-working-memory-patterns), but as structured entries rather than prose:

```json
{
  "plan": ["Reproduce locally", "Isolate root cause", "Patch and add regression test"],
  "tried": [
    {"hypothesis": "race condition in payment callback", "result": "ruled out - lock didn't fix it"},
    {"hypothesis": "stale cache read on retry", "result": "ruled out - cache disabled, still fails"}
  ]
}
```

> **Why this step?** By turn 130 there will be four or five ruled-out hypotheses. If that list only existed inside the segment digests, it would be competing for space with everything else being summarized and would degrade the same way any digest degrades under repeated compression. Kept in the scratchpad, it survives every compaction pass unchanged, because compaction never touches it.

### Turn 130: the actual root cause

```text
Found it: checkout/handlers.py:212 raises KeyError: 'idempotency_key' when
a request retries after a client timeout, because the retry strips the
header. This is intermittent because it only fires on client-side retries,
not the first attempt.
```

This turn is still within the last-15-raw window when it happens, so nothing is lost yet — but it won't stay there. By turn 145, it's aged past the raw window and becomes segment-digest material.

### Turns 100-140: the second segment digest, and where detail gets lost

```text
SEGMENT 3 (turns 100-140): Continued investigation. Root cause found: a
KeyError in the checkout handler triggered by request retries. Working
on a patch.
```

> **Why this step?** Compare this to the actual finding at turn 130. The exact file, line number, and key name — `checkout/handlers.py:212`, `idempotency_key` — didn't make it into the digest. "A KeyError in the checkout handler" is a faithful summary of *that* something was found, but it's not the same fact as *what* was found, precisely enough to act on later without re-deriving it.

## Where it breaks (+fix)

By turn 185, the agent is writing a regression test and needs the exact error signature — the file, the line, the missing header name — to assert against. The session-level digest by now is even coarser than the segment digest above, and it doesn't have the specific string either. If the agent has to fall back on "a KeyError in the checkout handler," it either re-reads the file from scratch to rediscover the line (wasted turns, on a fact it already had once) or writes a vaguer, weaker regression test than the bug deserves.

The fix is the same guard named in [when compaction drops the thing that mattered](/learn/context-engineering/compaction-that-drops-key-facts): anything that reads as a load-bearing, exact fact — an error signature, a file path, a line number — should be captured as an extractive, near-verbatim note the moment it's discovered, not left to survive purely through however the next summarization pass happens to paraphrase it. In this run, the turn-130 finding should have been written straight into the scratchpad's notes the instant it was found:

```json
"notes": {"root_cause": "checkout/handlers.py:212 - KeyError 'idempotency_key' on client retry (header stripped)"}
```

With that one line in the scratchpad, turn 185 reads it back exactly, regardless of how many compaction passes the surrounding conversation has been through by then.

## The token profile, before and after

```python
avg_tokens_per_turn = 2_500
window_budget = 170_000

# Uncompacted: every turn accumulates forever
uncompacted = [turn * avg_tokens_per_turn for turn in range(1, 201)]

# Compacted: last-15 raw + capped digest layers + capped scratchpad
KEEP_RAW, DIGEST_CAP, SCRATCHPAD_CAP = 15, 1_500, 800
compacted = [min(turn, KEEP_RAW) * avg_tokens_per_turn + DIGEST_CAP + SCRATCHPAD_CAP
             for turn in range(1, 201)]

print(f"uncompacted @ turn 68:  {uncompacted[67]:,} tokens  (budget {window_budget:,})")
print(f"compacted   @ turn 200: {compacted[-1]:,} tokens  (budget {window_budget:,})")
```

```text
uncompacted @ turn 68:  170,000 tokens  (budget 170,000)
compacted   @ turn 200: 39,800 tokens  (budget 170,000)
```

The uncompacted trace hits the budget exactly at turn 68 and can't continue. The compacted trace is still at roughly 40,000 tokens — a flat number, not a growing one, since it's dominated by the fixed-size raw window plus two capped digest layers — with 130 more turns of headroom left in the same budget by the time the agent actually finishes.

## Verifying the agent still finishes

The check that matters isn't the token count, it's whether compaction cost the agent anything it needed. Replay the last stretch — turns 185 through 200 — using only what a compacted context would actually contain: the session digest, the two most recent segment digests, the scratchpad (with the corrected root-cause note), and the last 15 raw turns. The agent should be able to: state the root cause precisely, write a regression test that asserts against the real error condition, and confirm it doesn't propose re-trying either of the two hypotheses already logged as ruled out in the scratchpad. If it re-suggests "maybe it's a race condition in the payment callback" at turn 190, that's a concrete, catchable regression — the scratchpad existed specifically to prevent it, and a test that seeds `tried` and then asserts the agent doesn't repeat an entry in it is a direct, automatable version of this check.

## Takeaways

- A compaction schedule for a long run isn't one mechanism — it's three, layered on purpose: a raw window for what's recent, a hierarchy for what's aging, and an external scratchpad for structured facts that shouldn't be subject to a summarizer's judgment at all.
- Bulky, reproducible content (file contents, full logs) doesn't belong in any context tier — externalize it as a pointer the agent can re-fetch, rather than paying to carry a copy through every compaction pass.
- The token profile flattens because the raw window and the digest layers are each individually capped — flat isn't automatic, it's a direct consequence of designing every tier with a fixed ceiling.
- A token graph proves compaction is cheap. It doesn't prove compaction is safe. Only replaying the task's actual completion against the compacted context — and checking it doesn't repeat a dead end or lose a load-bearing fact — proves that.

**Related:** [Why Compaction Is Unavoidable](/learn/context-engineering/why-compaction-is-necessary), [Hierarchical Summarization](/learn/context-engineering/hierarchical-summarization-explained), [Scratchpad and Working-Memory Patterns](/learn/context-engineering/scratchpad-working-memory-patterns), [When Compaction Drops the Thing That Mattered](/learn/context-engineering/compaction-that-drops-key-facts), [Building a Rolling Summarizer](/learn/context-engineering/building-a-rolling-summarizer)
