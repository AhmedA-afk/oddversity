---
title: "Selecting From Hundreds of Tools"
track: "tools-function-calling"
status: live
summary: "The strategy space for large tool registries — retrieval, namespacing, meta-tools, and progressive disclosure — and when to reach for each."
duration: "6 min read"
---

Once a registry crosses a few dozen tools, "send them all, every call" stops being an option — see [Why More Tools Means Worse Choices](/learn/tools-function-calling/too-many-tools-confuse-models) for why. This lesson maps the four architectural responses, and frames the three lessons that each go deep on one.

## What it is

Four distinct strategies, usually combined rather than chosen exclusively, for keeping the model's per-call candidate set small even as the underlying catalog grows large:

1. **Retrieval** — embed every tool's name and description offline; at request time, retrieve the top-k most relevant and inject only those.
2. **Namespacing / grouping** — organize tools into named domains (`billing.*`, `calendar.*`) so the model (or your code) can reason at the group level before the individual level.
3. **Hierarchical meta-tools** — give the model a small router tool it calls to expand a category's real tools into context on demand, instead of you pre-computing relevance.
4. **Progressive disclosure** — reveal tools gradually as the conversation or task narrows, driven by context rather than by a retrieval query.

## The mental model

Think of these as answering two different questions that get conflated:

- **"Which tools are relevant to what the user just said?"** — that's a search problem, and retrieval is the search-shaped answer to it.
- **"Which tools are relevant to what kind of task this is?"** — that's a classification/structure problem, and namespacing, meta-tools, and progressive disclosure are the structural answers.

A registry with genuinely unpredictable, cross-cutting queries (a general-purpose research agent with 300 API integrations) leans on retrieval. A registry with clean domain boundaries known ahead of time (a support agent: billing, shipping, account, returns) leans on structure — namespacing and meta-tools cost less to build and are easier to debug than a retrieval pipeline, because "why did the model see these tools" has a legible answer (it picked category X) instead of a similarity score.

Most production systems at real scale (100+ tools) use both layers: structure to get from "everything" down to a domain's worth of tools (tens), then retrieval or a tight `auto` choice to get from there down to the handful that matter this turn.

## Why it works this way

All four strategies attack the same root cause from different angles: the schema block the model reads is a real cost paid on every call — in tokens ([Token Cost of Tool Schemas](/learn/tools-function-calling/token-cost-of-tool-schemas)) and in selection accuracy ([Why More Tools Means Worse Choices](/learn/tools-function-calling/too-many-tools-confuse-models)). Retrieval shrinks it by relevance-per-query. Namespacing shrinks it by exploiting stable domain structure that doesn't need to be re-derived every call. Meta-tools shrink it by moving the expansion decision to the model itself, mid-loop, so you don't have to pre-compute it. Progressive disclosure shrinks it by tying visibility to task state rather than to either a query or a fixed category. None of them are exclusive — they compose, and which one leads depends on whether your registry's structure is closer to "a flat pool of loosely related capabilities" or "a set of clean domains."

## A concrete example (shown)

A 200-tool DevOps assistant, layered:

```
Turn 1 (namespacing): model sees 8 category tools:
  ["deploy_tools", "monitoring_tools", "incident_tools", "cost_tools", ...]

Turn 2 (meta-tool expansion): model calls load_toolset("incident_tools"),
  which injects the real 15 incident-response tools into context.

Turn 3 (retrieval within the loaded set, optional): if the 15 incident
  tools themselves overlap (three ways to page someone), a lightweight
  keyword or embedding match narrows further before the final call.
```

The model never sees more than a few dozen real schemas in any single call, even though the underlying registry is 200 tools deep.

## Where it shows up

- **Retrieval** dominates in agent platforms wired to many independent MCP servers, where tool relevance genuinely varies query-to-query and there's no clean pre-existing taxonomy.
- **Namespacing** dominates in first-party multi-domain products (a single company's support bot, an internal ops assistant) where the domains are known at design time and rarely change.
- **Meta-tools** dominate when you want the *model* driving discovery — useful when the right domain depends on reasoning the model has already done in-context, not something your code can infer from the raw query alone.
- **Progressive disclosure** dominates in long-running agent sessions where the task narrows over time — early turns see broad categories, later turns see only what the established task needs.

## Watch out for

- **Building retrieval before you've measured that flat `auto` selection is actually failing.** Retrieval adds a real pipeline (embeddings, a vector store, a top-k cutoff to tune) — see [Selection Accuracy at 5, 50, and 200 Tools](/learn/tools-function-calling/measuring-selection-accuracy-vs-count) for how to find your actual threshold before building it.
- **Namespacing that doesn't match how users actually ask.** If "cancel my subscription" could plausibly be billing or account, forcing a single category pick loses the request when the model guesses wrong — [Progressive Disclosure and Namespacing](/learn/tools-function-calling/progressive-tool-disclosure-patterns) covers this failure directly.
- **Stacking all four strategies at once on a registry that doesn't need it.** Each layer adds a decision the model or your code can get wrong; start with the cheapest fix (tighten descriptions, trim the flat list) before reaching for the full stack — [Scaling Tools Cheatsheet](/learn/tools-function-calling/scaling-tools-cheatsheet) has the size-to-technique mapping.

## Where next

The next three lessons are the deep dives: [Retrieval Over a 200-Tool Registry](/learn/tools-function-calling/rag-over-tools-retrieval) builds the embedding-and-top-k pipeline end to end, [Progressive Disclosure and Namespacing](/learn/tools-function-calling/progressive-tool-disclosure-patterns) compares the structural approaches, and [Router Tools and Grouped Dispatch](/learn/tools-function-calling/tool-namespacing-and-grouping) goes deep on the meta-tool pattern specifically.

**Related:** [Tool Selection at Scale](/learn/tools-function-calling/tool-selection-at-scale), [Why More Tools Means Worse Choices](/learn/tools-function-calling/too-many-tools-confuse-models), [Progressive Tool Disclosure](/learn/context-engineering/progressive-tool-disclosure), [Token Cost of Tool Schemas](/learn/tools-function-calling/token-cost-of-tool-schemas)
