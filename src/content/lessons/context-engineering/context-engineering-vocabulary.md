---
title: "Context Engineering Vocabulary"
track: "context-engineering"
status: live
summary: "One page mapping every core term in this track to a one-line definition and the module that actually teaches it."
duration: "5 min read"
---

This track uses these terms constantly, from here on, without re-defining them each time. Bookmark this page instead of re-deriving meaning from context every time one shows up.

## Start here, then measure

Before reaching for any term below as a fix, do these two things, in order:

1. **Measure the actual payload** — segment it and count real tokens per segment (see [Counting Tokens in Practice](/learn/context-engineering/counting-tokens-in-practice)) before deciding anything needs fixing.
2. **Diagnose which failure category it is** — missing content, buried content, duplicated content, or accumulated content — before picking a technique. The glossary below is organized so the term you need follows directly from that diagnosis.

## The glossary

| Term | One-line definition | Home module |
|---|---|---|
| **Context window** | The bounded, re-read-every-token span of input a model conditions on for one call. | [Context Window Anatomy](/learn/context-engineering/context-window-anatomy) |
| **Token** | The actual unit a model counts against its window — not a word, and not reliably estimated by character count outside plain English prose. | [Tokens Are Not Words](/learn/context-engineering/tokens-are-not-words) |
| **Budget** | An explicit, pre-decided allocation of tokens per segment (system, history, retrieval, output) rather than filling the window until something breaks. | [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies) |
| **Relevance filtering** | Cutting retrieved or historical content down to what's actually pertinent before it enters the payload, rather than passing everything through. | [Relevance Filtering](/learn/context-engineering/relevance-filtering) |
| **Recency effect** | The model's tendency to weight content near the end of the context more heavily. | [Context Ordering and Recency Effects](/learn/context-engineering/context-ordering-and-recency-effects) |
| **Primacy effect** | The model's tendency to also weight content at the very start of the context more heavily than the middle. | [Context Ordering and Recency Effects](/learn/context-engineering/context-ordering-and-recency-effects) |
| **Lost in the middle** | The reliability drop for content that sits in neither the start nor the end of a long context — the practical consequence of recency and primacy combined. | [Lost in the Middle](/learn/context-engineering/lost-in-the-middle) |
| **Retrieval vs. stuffing** | The choice between fetching only the relevant slice of a corpus per query versus pasting the whole corpus into every call. | [Retrieval vs Context Stuffing](/learn/context-engineering/retrieval-vs-context-stuffing) |
| **JIT (just-in-time) loading** | Fetching a piece of context only at the moment it's actually needed, instead of front-loading everything a task might conceivably use. | [Just-in-Time Context Loading](/learn/context-engineering/just-in-time-context-loading) |
| **Progressive tool disclosure** | Exposing only the tool definitions relevant to where a conversation currently is, instead of every tool's schema on every call. | [Progressive Tool Disclosure](/learn/context-engineering/progressive-tool-disclosure) |
| **Compaction** | Replacing older context with a smaller summarized form to reclaim budget without discarding the gist. | [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction) |
| **Hierarchical summarization** | Compacting in layers — turn-level, then session-level, then further — so detail degrades gracefully instead of all at once. | [Hierarchical Summarization](/learn/context-engineering/hierarchical-summarization) |
| **Sliding window** | Keeping only the most recent N turns verbatim and dropping or compacting anything older on a rolling basis. | [Sliding Window Context Management](/learn/context-engineering/sliding-window-context-management) |
| **Scratchpad** | A working-memory space (often a dedicated message or field) the model uses to reason or track state within a task, distinct from the final answer. | [Scratchpad and Working Memory Patterns](/learn/context-engineering/scratchpad-and-working-memory-patterns) |
| **Memory vs. state** | Memory is what persists across sessions in a durable store; state is what's tracked for the current run — different lifetimes, different mechanisms. | [Conversation Memory and State](/learn/context-engineering/conversation-memory-and-state) |
| **Structured memory store** | A durable, queryable record (not a replayed transcript) that an agent reads from and writes to across sessions. | [Structured Memory Stores](/learn/context-engineering/structured-memory-stores) |
| **Context rot** | The measurable quality decline that comes from a low ratio of relevant-to-total tokens, distinct from and possible well before hitting the hard window limit. | [Context Rot](/learn/context-engineering/context-rot) |
| **Context poisoning** | A fact or instruction entering the context — often via retrieved or tool content — that misleads later generation, sometimes maliciously (prompt injection), sometimes just by being wrong and sticking. | [Context Poisoning and Distraction](/learn/context-engineering/context-poisoning-and-distraction) |
| **Tool output deduplication** | Removing duplicate or near-duplicate tool results and retrieved chunks before they double-count against the budget. | [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication) |
| **KV cache** | The provider-side reuse of attention key/value tensors for a repeated prefix — a compute optimization, not a form of memory the model has. | [The KV Cache](/learn/llm-foundations/the-kv-cache) |
| **Prompt caching** | The application-facing feature built on the KV cache: structure a stable prefix so repeated calls are cheaper and faster. | [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design) |
| **Context handoff** | Passing a purpose-built, compact payload from one agent to another (or to a specialist sub-agent) instead of forwarding an entire transcript. | [Context Handoff Between Agents](/learn/context-engineering/context-handoff-between-agents) |
| **Multi-source merging** | Combining context pulled from more than one source (search, tools, memory) into one coherent payload without duplicating overlapping facts. | [Multi-Source Context Merging](/learn/context-engineering/multi-source-context-merging) |
| **Context observability** | Instrumenting what's actually in the window on real traffic — segment sizes, token counts — instead of reasoning about it from memory. | [Context Observability and Token Accounting](/learn/context-engineering/context-observability-and-token-accounting) |

## Suggested decision order for building any agent's context

When you're building a new agent's context pipeline from scratch, work through these in order — later steps assume earlier ones are already in place:

1. **Set the budget.** Decide per-segment token allocations before writing retrieval or history logic — [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies).
2. **Choose retrieval over stuffing** for anything larger than a small, static corpus — [Retrieval vs Context Stuffing](/learn/context-engineering/retrieval-vs-context-stuffing).
3. **Order what you include** so load-bearing content sits at the start or end, never buried mid-payload — [Context Ordering and Recency Effects](/learn/context-engineering/context-ordering-and-recency-effects).
4. **Deduplicate before insertion**, not after — tool results and retrieved chunks alike — [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication).
5. **Compact history** on a schedule, not only when something breaks — [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction).
6. **Externalize durable facts** into memory rather than hoping they survive compaction — [Conversation Memory and State](/learn/context-engineering/conversation-memory-and-state).
7. **Structure for cache hits** once the shape above is stable — [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design).
8. **Instrument it.** Measure segment sizes on real traffic and re-check this order whenever the agent changes — [Context Observability and Token Accounting](/learn/context-engineering/context-observability-and-token-accounting).

**Related:** [The Whole Game of Context Engineering](/learn/context-engineering/the-whole-game-of-context-engineering) · [Context Window Anatomy](/learn/context-engineering/context-window-anatomy) · [Why Context Is the Real Bottleneck](/learn/context-engineering/why-context-is-the-real-bottleneck)
