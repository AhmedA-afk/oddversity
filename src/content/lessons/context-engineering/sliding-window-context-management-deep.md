---
title: "Sliding Window Context Management"
track: "context-engineering"
status: live
summary: "The hybrid that fixes a plain sliding window's blind spot, and a precise way to size the window instead of guessing a number."
duration: "7 min read"
---

[Sliding windows](/learn/context-engineering/sliding-window-context-management) are the cheapest context strategy that exists, and cheap solutions have a way of hiding their real cost until the wrong turn comes along. This goes past that lesson's basic tradeoff into the mechanism that actually closes its blind spot, and the arithmetic behind picking a window size instead of guessing one — treat it as the optional extra depth once the base tradeoff makes sense to you.

## The hybrid: window plus a persistent head

A pure sliding window is a FIFO: keep the last N turns, and when turn N+1 arrives, turn 1 is simply gone. Nothing reads it, nothing captures it, it's discarded exactly like it never happened. The fix is almost the same fix as [compaction](/learn/context-engineering/summarization-for-compaction) in general, applied with a different trigger: instead of discarding the turn that's about to roll out, fold it into a small, persistent "head" segment that sits outside the window's rotation entirely. The head is never evicted; only the window rotates beneath it.

This makes the sliding window a specific instance of the same asymmetric tradeoff every compaction strategy makes: recent turns stay raw and precise (in the window), older turns get compressed but not erased (in the head). What's different from the [rolling summarizer](/learn/context-engineering/building-a-rolling-summarizer) built earlier in this module is the trigger discipline. A rolling summarizer fires when total token usage crosses a budget, so the number of raw turns it keeps varies with how long each turn happens to be. A window-plus-head fires whenever a turn is about to exit a *fixed-size* FIFO, so the raw-turn count is always exactly N regardless of content size — useful when you want predictable per-turn latency and are willing to size the window in tokens up front rather than adapt it live.

## Choosing the window size, precisely

"Pick N = 20" is not a size, it's a guess. Four things actually determine a defensible window size:

- **Reference locality.** Look at how far back, in turns, a real follow-up typically points — "as I said," "that file from before," "the number you gave me." If your logs show most backreferences resolve within the last 6-8 turns and anything older is rare, a window in that range gives headroom without waste. This is a property of your users' behavior, not a constant — measure it rather than assume it.
- **Attention falloff inside the window.** Even content that's still technically in the window doesn't get attended to uniformly — content buried in the middle of a long raw block is weaker than content near the start or the end, the effect covered in [lost in the middle](/learn/context-engineering/lost-in-the-middle). Past a certain size, growing the window further mostly adds material the model attends to poorly anyway, so bigger isn't strictly better even before cost enters the picture.
- **The actual budget, in tokens, not turns.** A window sized as "the last 15 turns" can silently blow a token budget the moment one turn is a pasted stack trace or a long document. Size the window in tokens first — using the per-segment allocation from [token budgeting strategies](/learn/context-engineering/token-budgeting-strategies) — and treat a turn count as a secondary, informal cap on top of that, never the primary constraint.
- **Task volatility.** A task where the live state changes every turn (an evolving plan, a running total) needs a smaller raw window and heavier reliance on the head, because old raw turns go *stale*, not just old. A task where users frequently reference exact earlier wording needs more raw window and a lighter head.

None of these produce one universal number. A support bot with short, self-contained tickets might run a window of 6-8 turns comfortably; a coding agent whose turns include large file diffs might need a window sized at 20K tokens that happens to hold only 3-4 turns. Size against your own measured reference locality and your own token budget, not a number borrowed from someone else's system.

## The failure, shown concretely

Here's a pure sliding window, no head, window size 8, doing exactly what it's supposed to do — and still breaking.

**Turn 1:**
> **User:** Always answer in formal English going forward — no contractions, no casual phrasing.
> **Agent:** Understood. I will respond formally throughout our conversation.

By turn 25, the window holds only turns 18 through 25. Turn 1 rolled out of the window back at turn 9, when turn 9 arrived and turn 1 became the tenth-oldest item beyond an 8-turn buffer.

**Turn 25:**
> **User:** Can you check if the build's passing?
> **Agent:** Sure, it's passing — build's green!

Nothing malfunctioned. The window did exactly what a FIFO does. The constraint from turn 1 isn't weakly remembered or partially honored — it is not present anywhere in the window the model can currently see, so there is no mechanism by which it could influence this reply. That's the failure mode named directly in [sliding window context management](/learn/context-engineering/sliding-window-context-management): not a wrong answer from bad reasoning, but a correct-looking answer produced from a context that's missing something the user has every reason to assume is still in effect.

## Fixing it with a head

The fix is small. Give the summarizer a `head` — a small, pinned set of facts extracted from turns as they're about to roll out, never itself subject to eviction:

```python
class WindowWithHead:
    def __init__(self, window_size: int, extract_fn):
        self.window_size = window_size
        self.extract_fn = extract_fn      # (turn) -> pinned fact str | None
        self.head: list[str] = []
        self.window: list[dict] = []

    def add_turn(self, role: str, content: str) -> None:
        self.window.append({"role": role, "content": content})
        if len(self.window) > self.window_size:
            evicted = self.window.pop(0)
            fact = self.extract_fn(evicted)
            if fact:
                self.head.append(fact)

    def context(self) -> list[dict]:
        parts = []
        if self.head:
            parts.append({"role": "system", "content": "Standing constraints: " + " | ".join(self.head)})
        parts.extend(self.window)
        return parts
```

With `extract_fn` recognizing turn 1 as a standing instruction and pinning it, turn 25's context now includes `Standing constraints: always respond in formal English, no contractions` regardless of the window's rotation. The same casual question at turn 25 now has the constraint sitting in context, and a reply that violates it is a model failure to follow an instruction it can see — a different, much more tractable problem than an instruction that was silently deleted. Note that `head` here is behaving less like conversation history and more like the durable state described in [memory vs. state](/learn/context-engineering/memory-vs-state-distinction) — it's exactly the kind of fact that shouldn't have been subject to windowing rules in the first place.

## Where the hybrid still isn't enough

A persistent head only protects a constraint that `extract_fn` actually recognizes as worth pinning at the moment it's about to roll out. If the extraction step misses it — because it didn't read as important yet, or was phrased indirectly — it's lost just as silently as it would be in a pure window, for the same underlying reason covered in [when compaction drops the thing that mattered](/learn/context-engineering/compaction-that-drops-key-facts). A head is a mitigation for the common case, not a guarantee.

The head also isn't unbounded. A session long enough to pin dozens of facts eventually needs the head itself to be summarized rather than simply grown forever — at that point you've arrived back at [hierarchical summarization](/learn/context-engineering/hierarchical-summarization-explained), with the head as one more layer that occasionally needs its own roll-up.

**Related:** [Sliding Windows: Rolling Off Old Turns Without Losing the Thread](/learn/context-engineering/sliding-window-context-management), [Why Compaction Is Unavoidable](/learn/context-engineering/why-compaction-is-necessary), [Memory vs State](/learn/context-engineering/memory-vs-state-distinction), [Lost in the Middle](/learn/context-engineering/lost-in-the-middle), [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies)
