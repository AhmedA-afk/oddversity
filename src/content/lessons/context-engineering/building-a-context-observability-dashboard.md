---
title: "Building a Context Observability View"
track: "context-engineering"
status: live
summary: "Turn per-turn token logs into a trend view that flags the exact turn where a segment is about to blow its cap."
duration: "7 min read"
---

One log record tells you what a turn cost. Thirty of them, lined up, tell you where the conversation is headed — and whether you'll get there before something breaks.

## The setup

Aria's history segment has a 4,500-token cap (37.5% of her 12,000-token budget, from [What a Token Budget Actually Is](/learn/context-engineering/what-a-token-budget-is)). She's already emitting the per-turn, per-segment log records built in [Measuring What Fills the Window](/learn/context-engineering/measuring-what-fills-the-window). This lesson turns that log stream into a view that catches a creeping segment *before* it breaches its cap, using one real 30-turn conversation as the running example. For clarity we'll treat the per-turn growth as a smooth ~205 tokens/turn — real conversations are noisier turn to turn, but the trend and the thresholds it crosses are what matter here.

## Step by step

#### 1. Pull the segment you care about out of the log stream

```python
def history_series(records: list[dict]) -> list[tuple[int, int]]:
    """Return (turn_number, history_tokens) pairs in order."""
    return [(i + 1, r["sections"]["conversation_history"]) for i, r in enumerate(records)]
```

> **Why this step?** A dashboard that shows every segment at once buries the one that's actually moving. Pull the series for the segment closest to its cap and watch that one — here, history, since system prompt and tool definitions are flat by construction.

#### 2. Define the thresholds as fractions of the cap, not raw numbers

```python
HISTORY_CAP = 4500
SOFT_WARN   = 0.70 * HISTORY_CAP   # 3,150 — log a warning
HARD_TRIGGER = 0.85 * HISTORY_CAP  # 3,825 — fire compaction now
```

> **Why this step?** Fractions survive a budget change; a hardcoded "warn at 3,150" doesn't. If Aria's history cap later moves to 5,000, the thresholds should move with it automatically.

#### 3. Render the trend, flagging crossings

| Turn | History tokens | % of cap | Flag |
|---|---|---|---|
| 1 | 205 | 4.6% | |
| 5 | 1,025 | 22.8% | |
| 10 | 2,050 | 45.6% | |
| 15 | 3,075 | 68.3% | |
| 16 | 3,280 | 72.9% | **soft warn** (crossed 70%) |
| 18 | 3,690 | 82.0% | |
| 19 (pre-compaction) | 3,895 | 86.6% | **hard trigger** (crossed 85%) |
| 19 (post-compaction) | 1,600 | 35.6% | compaction ran |
| 22 | 2,215 | 49.2% | |
| 25 | 2,830 | 62.9% | |
| 28 | 3,445 | 76.6% | |
| 30 | 3,855 | 85.7% | **hard trigger again** |

> **Why this step?** The raw total tells you almost nothing on its own — 3,690 tokens sounds fine until you see it's 82% of the way to a hard cap and climbing at a known rate. The percentage column, plotted against turn number, is what makes the trend visible instead of implicit.

#### 4. Act on the hard trigger, not just log it

At turn 19, the hard-trigger flag isn't decoration — it's the signal that hands off to compaction. [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction) compresses the oldest turns into a summary, and history drops from 3,895 to 1,600 tokens: a real reset, not a truncation. Growth resumes from that lower baseline at the same ~205 tokens/turn, which is exactly why the table is climbing again by turn 30 — a healthy history segment looks like a sawtooth, not a flat line or a monotonic climb (the same signature called out in [Context Observability](/learn/context-engineering/context-observability-and-token-accounting)).

Contrast this with what happens if nobody wires the hard trigger to anything: the same growth rate, left unmanaged, reaches the *actual* 4,500 cap at turn 22 — six turns after this dashboard's soft warning and three after its hard trigger. That failure is worth seeing in full, which is the subject of [Budgeting for a Conversation That Grows](/learn/context-engineering/budgeting-for-multi-turn-growth).

## Where it breaks (+fix)

This table assumes growth is smooth enough that sampling every few turns still catches the trend in time. It doesn't survive a single abnormal turn — a user pastes a 3,000-token error log at turn 20, and if your dashboard only samples every 5 turns, you won't see the spike until turn 25, by which point history is already well past the hard trigger and possibly past the cap itself.

The fix is two-part: check thresholds on *every* turn, not on a sampling schedule — the check itself is cheap, it's only the dashboard rendering that needs to be periodic — and put a ceiling on how much a single turn can add to raw history in the first place. A 3,000-token paste shouldn't go straight into the history segment; route it into a separate store or summarize it on the way in, which is the same move covered in [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication) and [Structured Memory Stores](/learn/context-engineering/structured-memory-stores) for large tool results.

## Takeaways

- A single per-turn number is a snapshot; a series across turns is a trend — the dashboard's entire value is in showing the slope, not the latest point.
- Set thresholds as fractions of the cap, and treat the hard trigger as an action (fire compaction), not a log line.
- A healthy managed segment looks like a sawtooth over time. A monotonic climb with no resets is the visual signature of a segment nobody is compacting.
- Periodic sampling misses single-turn spikes — check every turn, and bound how much any one turn can add.

**Related:** [Context Observability: Instrumenting What's Actually in the Window](/learn/context-engineering/context-observability-and-token-accounting), [Measuring What Fills the Window](/learn/context-engineering/measuring-what-fills-the-window), [Budgeting for a Conversation That Grows](/learn/context-engineering/budgeting-for-multi-turn-growth), [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction)
