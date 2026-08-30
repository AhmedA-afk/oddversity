---
title: "Progressive Tool Disclosure"
track: "context-engineering"
status: live
summary: "Why revealing tools in stages beats registering all of them, with a phased router that cuts schema tokens and tool-selection misfires."
duration: "8 min read"
---

*This is a deep-dive — it goes past the basic case for hiding tools to the mechanics of a phased router, and states precisely what it costs and where it stops paying off.*

[Progressive Tool Disclosure](/learn/context-engineering/progressive-tool-disclosure) makes the core argument: every registered tool costs tokens on every turn whether it's called or not, and a long undifferentiated list also degrades selection accuracy. This lesson goes one level deeper — into how a phased disclosure system is actually structured, and the two costs (tokens, misfires) it's trading against the one cost it adds (an extra routing step).

## Why "register everything" degrades, precisely

A tool definition isn't just its name — it's a `name`, a `description`, and a full JSON Schema `parameters` block, and all three get re-sent on every single turn of a conversation, not once at the start. A toolset of 40 tools with moderately complex parameters can run to several thousand tokens of schema alone, paid on every turn regardless of which tool (if any) gets called that turn.

The token cost is the easier one to see. The selection cost is subtler: tool choice is a classification problem the model solves at inference time, and every additional near-duplicate option (a `search_users` next to a `find_users` next to a `lookup_user_by_id`) adds a way to pick wrong. This isn't a vague claim about "more choices being worse" — it's the same signal-to-noise dynamic [Signal to Noise in Context](/learn/context-engineering/signal-to-noise-in-context) covers for document content, applied to tool schemas: the model has to find the one relevant option inside a pile that includes many that will never apply this turn, and every irrelevant option is doing purely negative work for that turn.

## Building a phased router

The fix is structural, not cosmetic: don't present the full toolset as one flat list. Present a **small, always-resident core** plus a **lookup mechanism** for everything else, and load full schemas for the long tail only right before they're used. Concretely, that's usually two layers:

**Layer 1 — categories, always visible.** Instead of 40 tool schemas, the model sees a handful of category names with one-line descriptions: `"file_ops — read, write, and search files"`, `"git_ops — commit, branch, diff"`, `"db_ops — query and inspect the database"`. This costs a few hundred tokens total, not several thousand.

**Layer 2 — full schemas, fetched on demand.** A single `list_tools(category)` or `ToolSearch`-style function returns the full definitions for one category. The model's first move on an unfamiliar task becomes "look up the git tools" rather than "scan all 40 and hope the right one stands out." Once the model has decided it needs `git_commit`, that one schema (not the other 39) is what actually enters context.

This is the identical index-then-hydrate shape as [The Just-in-Time Loading Pattern](/learn/context-engineering/just-in-time-context-loading-pattern) — a cheap index sits in context permanently, and the expensive payload (here, a full tool schema instead of a document) hydrates only on demand. Progressive tool disclosure is that pattern applied to the tool-definition budget specifically.

## A router that phases tools by task stage

A second, complementary strategy phases by *task stage* rather than by category lookup. If you can cheaply classify what kind of turn is happening — a lightweight router model, a keyword match, or simply which subagent handled the previous turn — you load only the tool cluster that phase needs, without the model having to ask.

```python
PHASE_TOOLSETS = {
    "research": ["web_search", "read_file", "grep"],
    "editing": ["read_file", "write_file", "run_tests"],
    "review": ["read_file", "post_comment", "resolve_thread"],
}

def tools_for_phase(phase: str, all_tools: dict) -> list[dict]:
    names = PHASE_TOOLSETS.get(phase, [])
    return [all_tools[n] for n in names if n in all_tools]
```

A research-phase turn never sees `write_file` or `post_comment` — not because they're forbidden, but because they're irrelevant to this phase and their schemas would only add noise. A subagent architecture gets this almost for free: a subagent spun up specifically to fix a failing test doesn't need deployment tools registered at all, which is the same narrowing [Subagent Context Isolation](/learn/context-engineering/subagent-context-isolation) achieves for context generally, applied here to the tool list specifically.

## What this actually costs

Progressive disclosure isn't free — it adds a routing decision. In the category-lookup design, that's a full extra round-trip: the model has to recognize it needs a category, call the lookup, then act on what it gets back, versus seeing everything and picking in one shot. In the phase-based design, the cost is upstream — something has to classify the phase correctly, and a misclassified phase hides the tool the model actually needed, which is a worse failure than "tool was visible but not chosen."

That tradeoff has a rough crossover point. For toolsets under roughly 15–20 tools, the token savings and selection-accuracy gain from disclosure are usually smaller than the cost of the extra round-trip or the risk of a phase misclassification — just register everything. The case for disclosure strengthens as the toolset grows past a few dozen, and strengthens further the larger the fraction of tools that are rarely called on any given turn — a toolset where most tools are used constantly gains little from hiding them, since they'd get fetched right back almost every time anyway.

## Measuring whether it's working

Two numbers tell you whether a disclosure design is earning its keep: **tool-definition tokens per turn** (should drop sharply versus flat registration) and **tool-selection error rate** (wrong tool called, or right tool with wrong arguments — should drop or hold steady, not rise). If token cost drops but misfires rise, the categories are probably drawn wrong — a tool the model needs is buried in a category name that doesn't suggest it, so the lookup step itself is failing silently.

**Related:** [Progressive Tool Disclosure](/learn/context-engineering/progressive-tool-disclosure) · [The Just-in-Time Loading Pattern](/learn/context-engineering/just-in-time-context-loading-pattern) · [Signal to Noise in Context](/learn/context-engineering/signal-to-noise-in-context) · [Subagent Context Isolation](/learn/context-engineering/subagent-context-isolation) · [Just-in-Time Context Loading](/learn/context-engineering/just-in-time-context-loading)
