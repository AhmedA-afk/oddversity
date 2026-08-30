---
title: "Context Engineering Master Cheatsheet"
track: "context-engineering"
status: live
summary: "A consolidated reference across all eight modules: defaults, decision rules, and a build-order checklist."
duration: "9 min read"
---

Everything in this track compresses into eight decisions, made in roughly this order, every time you build a new agent or add one to an existing system. This is the page to keep open while you do that — not a substitute for the modules behind it, but the fast path once you've read them.

## The decision order

1. **Confirm context is the bottleneck.** Decide whether the task is actually limited by what's in the window, versus by the model's raw capability, per [Why Context Is the Real Bottleneck](/learn/context-engineering/why-context-is-the-real-bottleneck).
2. **Set the budget before you fill it.**
3. **Decide what's in vs. cut, and in what order.**
4. **Decide retrieval vs. stuffing**, and if retrieval, eager vs. just-in-time.
5. **Decide the compaction trigger and method** for anything that grows across turns.
6. **Guard against the specific failure modes** — rot, poisoning, drift.
7. **Design the cache-stable prefix.**
8. **Design the handoff**, if more than one agent is involved.

Do these in order. Deciding your cache layout before your budget, for instance, tends to lock in a prefix shape you'll have to redo once the budget forces a different split.

## 1. Budget defaults — start here, then measure

| Segment | Starting point | Notes |
|---|---|---|
| System instructions | 300–800 tokens | Fixed; treat as a constant once set |
| Retrieved context | 30–40% of window | Cap before you see what a query returns, not after |
| Conversation history | Capped, not unbounded | Compact or slide once it crosses the cap |
| Output reserve | Set by max output tokens, carved out first | Don't let retrieval eat into this |

Full defaults and the reasoning behind them: [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies).

## 2. Selection and ordering rules

- Relevance beats recency beats completeness — cut the least relevant item, not the oldest one, unless recency is itself the relevance signal.
- Put the highest-value material near the start or the end of context; avoid burying the one fact that matters in the middle of a long list, per [Lost in the Middle](/learn/context-engineering/lost-in-the-middle).
- Sort by a real relevance score, never by an incidental key — document ID, alphabetical order, insertion order — that happens to be convenient to compute.

## 3. Retrieval vs. JIT chooser

```text
Is the corpus small enough to fit whole, and mostly static?
  yes -> consider stuffing it once, cache the prefix
  no  -> retrieve

Does the agent know up front exactly what it needs?
  yes -> eager retrieval, fetch before the main call
  no  -> just-in-time: let the agent request more as it discovers what it needs
```

## 4. Compaction triggers

Default trigger: compact when history crosses roughly 50–60% of its allotted segment, not when the whole window is full — waiting until the window is full leaves no room for the compaction call itself. Default method: hierarchical summarization for long-running sessions, rolling old turns into a standing summary while keeping recent turns verbatim; a plain rolling window for shorter, less semantically dense histories. Never compact a segment a downstream step needs verbatim for verification — carve that piece out before summarizing the rest.

## 5. Failure-mode guards

- **Context rot** — don't let total context grow just because the window allows it; quality can drop before the window is full.
- **Poisoning** — treat retrieved and tool-sourced content as untrusted; a wrong claim early in context can bias everything reasoned after it.
- **Drift** — in multi-turn or multi-agent runs, periodically re-state the actual goal rather than trusting it survived N turns of paraphrase.

## 6. Cache layout

Static content first, in a stable order, byte-for-byte identical across calls: system instructions, then tool schemas, then any fixed reference material. Anything that changes per call — the user's latest message, a timestamp, a request ID — goes after the stable prefix, never inside or before it. One misplaced dynamic field at the top of the prompt busts the cache for everything after it. See [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design).

## 7. Handoff schema — default shape

```json
{
  "goal": "...",
  "inputs": {},
  "decisions": [],
  "artifacts": [{"kind": "", "ref": "", "note": ""}],
  "next_steps": [],
  "open_questions": []
}
```

Pointers in `artifacts`, never raw content. Every finding gets a pointer back to its source. Full derivation: [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design).

## Build-order checklist for any new agent

- [ ] Confirmed context is actually the bottleneck for this task, not model capability.
- [ ] Wrote down per-segment budgets before building the pipeline, output reserve included.
- [ ] Chose a relevance-based ordering rule, checked it against lost-in-the-middle risk.
- [ ] Made retrieval-vs-stuffing and eager-vs-JIT decisions explicitly, not by default.
- [ ] Set a compaction trigger below 100% fullness, chose a method, and carved out anything a downstream step needs verbatim.
- [ ] Named the failure modes this agent is exposed to — rot, poisoning, drift — and what guards against each.
- [ ] Ordered the prompt so static content forms a stable, cacheable prefix.
- [ ] If this agent talks to another agent: built the handoff to the schema above, isolated its context by default, and gave every finding a pointer back to its source.

**Related:** [Why Context Is the Real Bottleneck](/learn/context-engineering/why-context-is-the-real-bottleneck), [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies), [Lost in the Middle](/learn/context-engineering/lost-in-the-middle), [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design), [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design)
