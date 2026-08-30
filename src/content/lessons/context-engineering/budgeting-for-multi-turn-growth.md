---
title: "Budgeting for a Conversation That Grows"
track: "context-engineering"
status: live
summary: "Project history growth across a long conversation and design trigger points that hand off to compaction before a hard truncation cliff."
duration: "7 min read"
---

An agent that works perfectly for twenty turns and then hard-fails on the twenty-second isn't unlucky — it's arithmetic that nobody projected forward. This lesson runs that arithmetic out to fifty turns, once unmanaged and once with trigger points designed in.

## The setup

Aria's history segment grows by roughly 205 tokens per round trip (a user message plus her reply, added to history) — the same rate used in [Building a Context Observability View](/learn/context-engineering/building-a-context-observability-dashboard). Her history cap is 4,500 tokens, and her fixed segments (system 700, tools 1,000, retrieval 3,800, reply headroom 2,000) leave no slack: the full budget is 12,000 tokens with nothing spare. We'll project this conversation to turn 50, first with no compaction at all, then with the trigger points that should have been there from the start.

## Step by step

#### 1. Project the unmanaged growth

| Turn | Cumulative history (raw) | Total request (fixed + retrieval + history + reply) |
|---|---|---|
| 5 | 1,025 | 8,525 |
| 10 | 2,050 | 9,550 |
| 15 | 3,075 | 10,575 |
| 20 | 4,100 | 11,600 |
| 21 | 4,305 | 11,805 |
| **22** | **4,510** | **12,010** |
| 25 | 5,125 | 12,625 |
| 50 | 10,250 | 17,750 |

The total column is `700 + 1,000 + 3,800 + history + 2,000`. At turn 21 the total is 11,805 — under the 12,000 cap, with 195 tokens to spare. At turn 22, history crosses 4,510 and the total crosses 12,010 — ten tokens over. Not a dramatic spike; a slow, entirely predictable creep that happens to cross the line on exactly this turn.

> **Why this step?** "It failed on turn 22" sounds like a strange, specific bug until you see it's just `4500 / 205 ≈ 21.95`, rounded up. Projecting the growth rate against the cap turns a mysterious failure into an arithmetic fact you could have known in advance.

#### 2. See what actually breaks

If [`enforce_budget`](/learn/context-engineering/setting-per-segment-budgets) is wired in without a compaction escape hatch, turn 22 raises `BudgetExceeded("total", 12010, 12000)` and the conversation hard-stops — a real user, mid-conversation, gets an error instead of an answer. If no budgeting was wired in at all, the provider truncates or rejects the oversized request itself, at a moment and in a way you don't control. Either way, this is the hard truncation cliff: everything is fine, then, on one specific turn, it isn't.

> **Why this step?** The failure mode matters as much as the failure turn. A budget that *only* rejects overflow, with nothing upstream to prevent it, has converted a gradual, manageable trend into a sudden, user-facing outage.

#### 3. Design the trigger points

Two thresholds, checked every turn, feeding into the compaction machinery from [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction) — this is exactly the handoff point [Why Compaction Is Necessary](/learn/context-engineering/why-compaction-is-necessary) argues for:

```python
HISTORY_CAP  = 4500
SOFT_WARN    = 0.70 * HISTORY_CAP   # 3,150 — log it
HARD_COMPACT = 0.85 * HISTORY_CAP   # 3,825 — compact now, don't wait
```

At ~205 tokens/turn, soft warn crosses around turn 16, hard compact around turn 19 — three turns of lead time between "pay attention" and "act," which is enough to run a summarization pass before the cap is anywhere close.

#### 4. Project the managed growth

Each time the hard trigger fires, compaction compresses the oldest turns and resets history to roughly 1,600 tokens — a real reduction, not a truncation. Growth resumes from there at the same rate:

| Turn | Event | History after |
|---|---|---|
| 19 | hard trigger (was 3,895) → compact | 1,600 |
| 22 | — | 2,215 |
| 30 | hard trigger (was 3,855) → compact | 1,600 |
| 41 | hard trigger (was 3,855) → compact | 1,600 |
| 50 | — | 3,445 |

History never exceeds roughly 3,900 tokens at its peak across all fifty turns — comfortably under the 4,500 cap every time, in a repeating sawtooth instead of a monotonic climb toward a cliff. Turn 22, the exact turn that broke the unmanaged version, passes here with history at a routine 2,215 tokens.

> **Why this step?** The point isn't that compaction happened three times — it's that the *trigger*, not a fixed schedule, decided when. A conversation that happened to run shorter or longer than 50 turns would still never approach the cap, because the policy reacts to the actual number, not a guessed turn count.

## Where it breaks (+fix)

This projection assumes each compaction cycle frees roughly the same amount, resetting to ~1,600 tokens every time. That assumption erodes if you're not careful about *how* you compact: summarizing "history plus the previous summary" every cycle, rather than re-summarizing the summary itself, means the compacted baseline creeps upward a little each cycle — 1,600, then 1,750, then 1,900 — and the interval between hard triggers shrinks correspondingly. Run enough cycles that way and you eventually recreate the exact cliff this design was meant to prevent, just later.

The fix is [Hierarchical Summarization](/learn/context-engineering/hierarchical-summarization): summarize *summaries*, in layers, instead of linearly appending each new compaction onto the last one, so the compacted baseline stays roughly flat across many cycles instead of drifting upward. For very long-running agent sessions specifically, see [Compacting a Long Agent Run](/learn/context-engineering/compacting-a-long-agent-run).

## Takeaways

- A hard cap breach on a specific turn number is arithmetic, not bad luck — project growth rate against cap and you'll know the turn before it happens.
- A budget with no compaction path doesn't prevent the cliff, it just names the moment you hit it.
- Trigger on a percentage of cap, checked every turn, with lead time between soft warn and hard action — not a fixed turn-count schedule.
- Verify your compaction actually resets to a stable baseline across many cycles; a summary that grows every time it's re-summarized just delays the same cliff.

**Related:** [Building a Context Observability View](/learn/context-engineering/building-a-context-observability-dashboard), [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction), [Hierarchical Summarization](/learn/context-engineering/hierarchical-summarization), [Setting Per-Segment Budgets](/learn/context-engineering/setting-per-segment-budgets)
