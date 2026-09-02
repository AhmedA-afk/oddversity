---
title: "Router Tools and Grouped Dispatch"
track: "tools-function-calling"
status: live
summary: "A deep look at the load_toolset meta-tool pattern — loop mechanics, prompt-cache interaction, and when it beats embedding retrieval."
duration: "9 min read"
---

*This is the deferred-depth version of the meta-tool idea introduced in [Selecting From Hundreds of Tools](/learn/tools-function-calling/tool-selection-at-scale-strategies) — optional, but worth it if you're actually building this pattern rather than skimming past it.*

## What we're building

A single router tool, `load_toolset(category)`, that the model calls to expand a category's real tools into context. Unlike retrieval, nothing is pre-computed by your code before the call — the model itself decides, in-context, which category it needs and asks for it. This lesson derives the loop mechanics precisely, then works through the one detail that makes or breaks this pattern in production: how it interacts with prompt caching.

## The mechanism

The model's tool list on turn one is small and fixed, regardless of registry size:

```json
{
  "tools": [
    {
      "name": "load_toolset",
      "description": "Load the real tools for a category before using them. Categories: billing, calendar, incident_response, cost_analysis.",
      "input_schema": {
        "type": "object",
        "properties": {"category": {"type": "string", "enum": ["billing", "calendar", "incident_response", "cost_analysis"]}},
        "required": ["category"]
      }
    }
  ],
  "tool_choice": {"type": "auto"}
}
```

Turn one: the model, given a user request about an incident, calls `load_toolset("incident_response")`. Your code intercepts this the same way it intercepts any tool call — but instead of executing business logic, it expands the registry:

```python
def dispatch(tool_call):
    if tool_call.name == "load_toolset":
        category = tool_call.input["category"]
        real_tools = registry.tools_in_category(category)
        # Return the expanded list as the "result" of this call
        return {
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": f"Loaded {len(real_tools)} tools for '{category}'.",
        }, real_tools  # real_tools gets merged into `tools` on the NEXT request
    else:
        return execute_real_tool(tool_call), None
```

Turn two: the follow-up request includes `load_toolset` *plus* the 15 real `incident_response` tools now in `tools`. The model picks and calls the actual tool it needs — `page_oncall`, say — with its full schema now available.

This is structurally identical to the `search_tools(query)` meta-tool mentioned in [Tool Selection at Scale](/learn/tools-function-calling/tool-selection-at-scale) and [Retrieval Over a 200-Tool Registry](/learn/tools-function-calling/rag-over-tools-retrieval) — the difference is that `load_toolset` dispatches by a fixed category name (cheap, deterministic, no embedding call) where `search_tools` dispatches by a free-text query scored against embeddings (more flexible, costs a retrieval call). Use `load_toolset` when your domains are stable enough to enumerate in an `enum`; reach for the retrieval version when they aren't.

## Why the loop needs two turns, not one

You cannot skip straight to "let the model call the real tool" because the model cannot call a tool it hasn't seen the schema for — that's the entire premise of tool calling ([Anatomy of a Tool Call](/learn/tools-function-calling/anatomy-of-a-tool-call)). `load_toolset` exists precisely to be the thing the model *can* see, so it has a legal move available before the tool it actually wants exists in its context. This is why the pattern costs a full extra round trip per new category — it's not an optimization detail, it's the mechanism working as designed. [Progressive Disclosure and Namespacing](/learn/tools-function-calling/progressive-tool-disclosure-patterns) lists this round trip as the pattern's core cost; here's exactly where it comes from.

## Interaction with prompt caching

This is the part that's easy to get backwards. Most providers cache the prefix of your request — system prompt, tool definitions, and early messages — and charge less for cached tokens on repeat calls with an identical prefix (see [Prompt Caching Mechanics](/learn/context-engineering/prompt-caching-mechanics)). `load_toolset` changes `tools` between turn one and turn two by construction: turn one has one router tool, turn two has the router plus a whole category's worth of real tools. That's a cache-breaking change every single time a new category gets loaded, because the tool definitions live in the part of the request providers typically fold into the cached prefix.

The practical consequence: within a single conversation, once a category is loaded, keep it loaded for the rest of that conversation rather than swapping it back out — even if the model moves on to a different topic and doesn't need it anymore. Evicting a loaded category to keep `tools` small re-breaks the cache on the very next turn, trading a small context savings for a full cache miss on every remaining tool definition in the request. This is the opposite tradeoff namespacing without a meta-tool has to make (a namespace's tools are either always in `tools` or never), and it means `load_toolset` behaves less like a strict token-minimizer and more like a *lazy, monotonically growing* tool list — it starts small and gets no smaller, in exchange for a stable, cacheable prefix once things settle.

If a session realistically touches many categories over its lifetime (a long-running general-purpose agent), that monotonic growth erodes the whole point — by turn 20 you may have re-accumulated most of the registry anyway. That's the signal to cap how many categories stay loaded (evict the least-recently-used one past some limit) and accept the occasional cache miss, rather than let `tools` grow unbounded.

## When this beats pure embedding retrieval

- **Your categories are few, stable, and easy to name** — an `enum` of 5-10 categories is a much cheaper and more debuggable interface than a similarity search, and "why did the model see these tools" has a one-line answer: it called `load_toolset("billing")`.
- **You want the model steering discovery, not your code.** Pre-computed retrieval (build it in [Retrieval Over a 200-Tool Registry](/learn/tools-function-calling/rag-over-tools-retrieval)) guesses relevance from the raw user message before the model has reasoned about anything. `load_toolset` lets the model make that call *after* it's already read the request and formed an intent — often a better-informed decision, at the cost of a round trip.
- **You don't want to run an embedding pipeline at all.** No vector store, no re-embedding on description changes, no recall-at-k to tune — the tradeoff is a coarser, category-level granularity instead of query-level relevance.

It loses to retrieval when categories genuinely don't exist — a flat pool of loosely related integrations with no clean grouping has nothing for the `enum` to name.

## Takeaways

`load_toolset` trades a per-category round trip for a legible, debuggable, embedding-free selection mechanism — and its real design constraint isn't context size, it's cache stability: load categories eagerly, evict rarely, and treat the tool list as append-mostly within a session rather than something you shrink back down.

**Related:** [Selecting From Hundreds of Tools](/learn/tools-function-calling/tool-selection-at-scale-strategies), [Progressive Disclosure and Namespacing](/learn/tools-function-calling/progressive-tool-disclosure-patterns), [Retrieval Over a 200-Tool Registry](/learn/tools-function-calling/rag-over-tools-retrieval), [Prompt Caching Mechanics](/learn/context-engineering/prompt-caching-mechanics)
