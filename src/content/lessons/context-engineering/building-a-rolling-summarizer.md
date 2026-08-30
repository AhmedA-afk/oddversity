---
title: "Building a Rolling Summarizer"
track: "context-engineering"
status: live
summary: "A runnable summarizer that fires on a budget threshold, folds old turns into a running summary, and keeps the last N verbatim."
duration: "8 min read"
---

Everything in [why compaction is necessary](/learn/context-engineering/why-compaction-is-necessary) and [summarization for compaction](/learn/context-engineering/summarization-for-compaction-deep) is a design discussion until it's wired to an actual trigger and an actual data structure. This lesson builds that: a small, dependency-free summarizer you can drop into an agent loop today.

## What we're building

A `RollingSummarizer` that holds a running summary plus the most recent `keep_last` turns verbatim. Every time a turn is added, it checks its own token footprint against a budget; if it's over, it folds everything except the last `keep_last` turns into an updated running summary and discards the raw text of what it folded. The design goal is the one from [summarization for compaction](/learn/context-engineering/summarization-for-compaction-deep): recent turns stay exact, everything older gets compressed, and the summary step is a pluggable function so a real LLM call can slot in later.

## Setup

Standard library only. The `budget_tokens` this summarizer enforces isn't a number you invent here — it's the history allocation that comes out of a broader per-segment budget, the kind built in [setting per-segment budgets](/learn/context-engineering/setting-per-segment-budgets) and adjusted at runtime by [dynamic budget reallocation](/learn/context-engineering/dynamic-budget-reallocation). This lesson treats that number as an input, not something it derives.

## Build it

### Step 1: A rough token estimator

```python
def estimate_tokens(text: str) -> int:
    # A real tokenizer call belongs here in production - see
    # [tokens are not words] and [counting tokens in practice]. This
    # character-based approximation is only good enough to demonstrate
    # the compaction *trigger*, not to bill against.
    return max(1, len(text) // 4)
```

> **Why this step?** Every downstream decision — whether to compact, how much got saved — depends on a token count. Keeping the estimator as one swappable function means production code can replace it with a real tokenizer without touching the summarizer's logic.

### Step 2: The summarizer's state and budget check

```python
class RollingSummarizer:
    def __init__(self, budget_tokens: int, keep_last: int, summarize_fn):
        self.budget_tokens = budget_tokens
        self.keep_last = keep_last
        self.summarize_fn = summarize_fn      # (prev_summary, folded_turns) -> new_summary
        self.running_summary = ""
        self.turns: list[dict] = []           # [{"role": ..., "content": ...}, ...]

    def _current_tokens(self) -> int:
        summary_tokens = estimate_tokens(self.running_summary)
        turn_tokens = sum(estimate_tokens(t["content"]) for t in self.turns)
        return summary_tokens + turn_tokens
```

> **Why this step?** `_current_tokens` is the number every trigger in this module — this one, and the budget-crossing checks in [dynamic budget reallocation](/learn/context-engineering/dynamic-budget-reallocation) — is built around. It counts the summary *and* the raw turns together, because both occupy the same window.

### Step 3: The compaction trigger

```python
    def add_turn(self, role: str, content: str) -> None:
        self.turns.append({"role": role, "content": content})
        self._maybe_compact()

    def _maybe_compact(self) -> None:
        if self._current_tokens() <= self.budget_tokens:
            return
        if len(self.turns) <= self.keep_last:
            return  # nothing old enough to fold yet
        to_fold, self.turns = self.turns[:-self.keep_last], self.turns[-self.keep_last:]
        self.running_summary = self.summarize_fn(self.running_summary, to_fold)
```

> **Why this step?** This is the whole mechanism from [why compaction is necessary](/learn/context-engineering/why-compaction-is-necessary): compact on a threshold crossing, not on a fixed schedule and not only after a hard failure. `to_fold` is everything except the most recent `keep_last` turns — those stay untouched, because recent turns are the ones most likely to be referenced precisely.

### Step 4: What actually goes back to the model

```python
    def context(self) -> list[dict]:
        parts = []
        if self.running_summary:
            parts.append({"role": "system", "content": f"Summary of earlier turns: {self.running_summary}"})
        parts.extend(self.turns)
        return parts
```

> **Why this step?** The agent never sees `self.turns` growing without bound — it sees the summary plus a small, fixed-size tail. This is the object you'd actually hand to the API call, not the internal state.

### Step 5: A summarize function that behaves like a real one

A real `summarize_fn` is an LLM call with the survival rules from [summarization for compaction](/learn/context-engineering/summarization-for-compaction-deep) baked into its prompt. To demonstrate the *shape* of the effect without an API dependency, this mock keeps the property that matters: its output size is bounded, regardless of how much input it folds — exactly what a real summarization call with a fixed output-length budget gives you.

```python
def mock_summarize(previous_summary: str, folded_turns: list[dict]) -> str:
    decisions = [t["content"][:40] for t in folded_turns if "DECISION" in t["content"]]
    carried = previous_summary.split(" | ") if previous_summary else []
    combined = [c for c in carried if c] + decisions
    return " | ".join(combined[-5:])   # cap: only the 5 most recent salient facts
```

> **Why this step?** Notice what this does *not* do: it doesn't concatenate every folded turn into the summary, which would just move the unbounded-growth problem one level up. It carries forward a capped set of salient facts and drops the rest — the same discipline a real summarization prompt enforces by having a fixed max-output-tokens setting.

## Run it

```python
import random
random.seed(7)

summarizer = RollingSummarizer(budget_tokens=1_200, keep_last=6, summarize_fn=mock_summarize)

sample_lines = [
    "Sure, let's look at the auth endpoint.",
    "DECISION: use JWT with a 15 minute access token, refresh via cookie.",
    "Here's the current handler code for review.",
    "That test is flaking on CI, let's rerun it.",
    "DECISION: rate limit is 100 req/min per API key.",
]

for turn in range(1, 101):
    role = "user" if turn % 2 else "assistant"
    content = random.choice(sample_lines) + f" (turn {turn})"
    summarizer.add_turn(role, content)
    if turn % 10 == 0:
        print(f"turn {turn:>3}: ~{summarizer._current_tokens()} tokens, "
              f"{len(summarizer.turns)} raw turns kept")
```

The exact numbers depend on the random draw, but the *shape* is the point, and it follows directly from the logic above: token usage climbs turn over turn as raw content accumulates, crosses 1,200, a compaction pass fires and collapses everything but the last 6 turns into `running_summary`, and the count drops back down — a sawtooth that repeats as raw content accumulates and gets compacted. Compare that to the uncompacted trace in [why compaction is necessary](/learn/context-engineering/why-compaction-is-necessary), where the same 100 turns climb in a straight line until the budget is blown once and stays blown. Here, turn 100's context is roughly the same size as turn 20's — flat, not linear in conversation length — and the `DECISION:` lines from early in the run are preserved in `running_summary` long after their original turns were discarded.

## Harden it

- **Replace `estimate_tokens` with your model's real tokenizer** before trusting the threshold in production — the character-based approximation here can be off by a meaningful margin, and a threshold set against a wrong estimator either compacts too late or wastes budget compacting too early.
- **Make `summarize_fn` a real, prompted LLM call** that follows the extractive-plus-abstractive hybrid from [summarization for compaction](/learn/context-engineering/summarization-for-compaction-deep) — the mock's `"DECISION" in content` check is a stand-in for a model actually judging what's worth keeping, and a real prompt needs to cover constraints and open threads too, not just decisions.
- **Test decision preservation directly**, not just token counts: seed a conversation with a known constraint, run enough turns to force several compaction passes, and assert the constraint's text (or its meaning) is still present in `running_summary` at the end. A summarizer that keeps tokens flat but silently drops the one fact that mattered has passed the wrong test — see [when compaction drops the thing that mattered](/learn/context-engineering/compaction-that-drops-key-facts).
- **Guard against compacting mid-tool-call.** Folding a turn that's a tool call without its matching tool result (or vice versa) produces a malformed transcript for most chat APIs. Compact between complete turns, never inside one.

## Extend it

This summarizer is intentionally flat — one running summary, no layers. The moment `running_summary` itself starts needing to be re-summarized because it's grown too large, you've hit the ceiling [hierarchical summarization](/learn/context-engineering/hierarchical-summarization-explained) is built to avoid: promote this into a two-tier structure where `running_summary` becomes a segment-level digest, and a slower-firing pass rolls segment digests into a session-level one. Pair it with an explicit [scratchpad](/learn/context-engineering/scratchpad-working-memory-patterns) for anything that's working state rather than conversational history — a plan, a checklist — since that doesn't belong inside a conversation summary at all. And see [compacting a 200-step agent run](/learn/context-engineering/compacting-a-long-agent-run) for this same mechanism sized up to a real long-running coding-agent trace.

**Related:** [Why Compaction Is Unavoidable](/learn/context-engineering/why-compaction-is-necessary), [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction-deep), [Hierarchical Summarization](/learn/context-engineering/hierarchical-summarization-explained), [Setting Per-Segment Budgets](/learn/context-engineering/setting-per-segment-budgets), [Dynamic Budget Reallocation](/learn/context-engineering/dynamic-budget-reallocation)
