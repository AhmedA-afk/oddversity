---
title: "Memory and Compaction Cheatsheet"
track: "context-engineering"
status: live
summary: "One page of triggers, tables, and checklists for compaction and memory - what to configure, and the defaults to start from before you measure."
duration: "6 min read"
---

Theory is in [why compaction is necessary](/learn/context-engineering/why-compaction-is-necessary) and [memory vs state](/learn/context-engineering/memory-vs-state-distinction). This is what you actually configure.

## Compaction triggers

| Trigger | How it fires | Start here, then measure |
|---|---|---|
| Budget threshold | Compact when history crosses X% of its token allocation | 70% of the history budget from [token budgeting](/learn/context-engineering/token-budgeting-strategies) |
| Fixed window (FIFO) | Evict the oldest turn whenever a new one exceeds a turn count | Only when you also have a [persistent head](/learn/context-engineering/sliding-window-context-management-deep) for standing constraints |
| Turn count | Compact every N turns regardless of size | Fragile — a few long turns blow the budget between compactions; prefer budget-threshold |
| Hard failure | Compact only after the API rejects a request | Never as your only trigger — you've already lost the graceful-fold option |

```python
def should_compact(current_tokens: int, budget: int, threshold: float = 0.7) -> bool:
    return current_tokens >= budget * threshold
```

## The keep-verbatim list

Never leave these to a summarizer's judgment — extract them as near-exact facts, not paraphrased prose:

- Decisions made, and the reason given for each
- Constraints, preferences, and prohibitions stated by the user
- Open threads: anything asked-but-unanswered or started-but-unfinished
- Exact identifiers that lose meaning if reworded: file paths, error signatures, numbers, deadlines, names

Everything else — the back-and-forth that led to a decision, a failed-then-retried tool call, small talk — compresses hard, or drops. Full treatment in [summarization for compaction](/learn/context-engineering/summarization-for-compaction-deep).

## Hierarchy levels

| Level | Granularity | Rolls up from | Refresh rate |
|---|---|---|---|
| Turn | One exchange or a tight cluster | Raw messages | Every compaction pass |
| Segment | A stretch of related work | Turn-summaries | Every ~30-50 turns, or one topic boundary |
| Session | The whole session's outcome | Segment-summaries | Once per session, or on a coarser threshold |
| Project (memory) | Durable facts that outlive the session | Session-summaries | On explicit promotion only, never automatic |

Each level is written once and never rewritten — only the level above it changes. Full mechanism in [hierarchical summarization](/learn/context-engineering/hierarchical-summarization-explained).

## Memory vs state, at a glance

| | State | Memory |
|---|---|---|
| Scope | This task, this session | This user/account, indefinitely |
| Lifecycle | Discarded when the task ends | Persists until corrected or expired |
| Written by | Every step of the task | An explicit promotion decision |
| Example | The current booking form's fields | "Prefers an aisle seat" |
| Test | Would this still make sense next month? — no | Would this still make sense next month? — yes |

Full framework in [memory vs state](/learn/context-engineering/memory-vs-state-distinction).

## Store selection guide

| Query shape | Store | Why |
|---|---|---|
| Exact key → exact value | Key-value | O(1), trivial to overwrite and audit |
| Exact term or phrase in free text | Full-text (lexical) | Cheap, no embedding pipeline, brittle to paraphrase |
| "Find things like this" over free text | Vector | Handles paraphrase and unknown query shape; no relational structure |
| "How does X relate to Y" | Knowledge graph | Multi-hop traversal; highest build cost |

Layer them rather than picking one — key-value for settings, vector or lexical for episodic recall, graph for entities and relationships. Full comparison in [structured memory stores](/learn/context-engineering/structured-memory-stores-compared).

## Write-policy checklist

- [ ] Explicit user statements ("remember that...") write immediately, at high confidence.
- [ ] Inferred patterns require a repetition threshold before promotion — one occurrence is not a preference.
- [ ] Every write carries a `written_at` and a `status`; a correction supersedes the old value instead of appending beside it.
- [ ] Facts with a short natural shelf life carry a shorter expiry than facts that are stable indefinitely.
- [ ] The read path is tested independently of the write path: a fact written in session A is confirmed present in session B's assembled context, not just present in the database.
- [ ] Re-entry injects a small, always-on set of identity-level facts (name, tone) and gates everything else behind retrieval scoped to the current session — never the whole store, every time.

Full write-policy reasoning in [what to remember, what to forget](/learn/context-engineering/what-to-remember-vs-forget) and [memory across sessions](/learn/context-engineering/cross-session-memory-architecture).

## Defaults worth starting from

| Decision | Start with | Change when |
|---|---|---|
| Compaction trigger | Budget threshold at 70% | Never revert to turn-count-only or hard-failure-only |
| Recent turns kept raw | Last 10-15 turns | Reference locality in your logs says otherwise — measure it |
| Summarization style | Abstractive narrative + extractive fact list | Never drop the extractive half for anything decision-shaped |
| Summary layers | Flat rolling summary | The session regularly needs more than one or two compaction passes — go hierarchical |
| Memory promotion | Explicit statement only | You have enough volume to set a reliable repetition threshold for inferred patterns |
| Memory re-entry | Small always-on identity set + scoped retrieval | Never "inject the whole store" as a steady-state default |
| Default memory store | Key-value for settings | Free-text recall or relational queries show up — add vector or graph alongside, don't replace |

## The one rule to keep

If you remember nothing else from this module: **a compacted or remembered fact that changes what the agent does later must survive on purpose, not by accident.** Prose can always be shortened — a decision, a constraint, or a correction has to be preserved deliberately, checked with a test, not assumed to have made it through because the summary reads fine.

**Related:** [Why Compaction Is Unavoidable](/learn/context-engineering/why-compaction-is-necessary), [When Compaction Drops the Thing That Mattered](/learn/context-engineering/compaction-that-drops-key-facts), [Memory vs State](/learn/context-engineering/memory-vs-state-distinction), [Structured Memory Stores](/learn/context-engineering/structured-memory-stores-compared), [Building a Rolling Summarizer](/learn/context-engineering/building-a-rolling-summarizer)
