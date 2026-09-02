---
title: "The Token Cost of Tool Schemas"
track: "tools-function-calling"
status: live
summary: "Every tool schema you register is injected into context on every call — a large registry can cost thousands of tokens before the conversation even starts."
duration: "6 min read"
---

A tool schema isn't loaded once and referenced by pointer. It's re-sent, in full, as part of the request payload, on every single API call where that tool is available to the model — including the very first message of a conversation, before the user has said anything at all.

## What it is

When you register tools with a model, the entire set of schemas — every name, description, and parameter definition — is serialized and included in the context the model reasons over, on every call. This is different from how a human developer thinks about a function library: you don't "load" `search_orders` once and then just refer to it by name on later calls. The full JSON definition travels with the request every time, the same as system prompt text does. If your agent has 30 tools registered, all 30 schemas are in context whether the current turn needs one, five, or none of them.

This means the schema set has a direct, measurable token cost, and that cost is paid on every turn of a multi-turn conversation, not once per session. A verbose schema you write today taxes every future exchange, indefinitely, for as long as the tool stays registered.

## Why it works this way

The model has no persistent memory of previous requests' tool definitions — each API call is stateless from the model's point of view except for what's explicitly included in that call's context. Tool schemas aren't cached server-side the way a compiled function would be in a traditional program; they're text, sent as text, attended to as text. Providers do offer prompt caching for stable prefixes (a tool registry that doesn't change turn-to-turn is exactly the kind of stable prefix that benefits), but caching reduces the *cost* of resending, it doesn't eliminate the fact that the schema still occupies a slot in the context window the model reasons over. A cached tool definition still competes with the conversation for the model's limited attention on that turn — cost and context pressure are two separate problems, and caching only solves the first one.

The consequence compounds two ways. First, directly: tokens spent on schemas are tokens not available for conversation history, retrieved documents, or the model's own reasoning, and on models with smaller context windows or when you're already pushing up against a limit, a bloated tool registry is a real constraint, not a rounding error. Second, indirectly: a larger schema set doesn't just cost tokens, it costs *accuracy* — the more tool definitions competing for the model's attention on a given turn, the harder the tool-selection problem gets, which is the subject of /learn/tools-function-calling/tool-selection-at-scale. Token cost and selection accuracy degrade together as a registry grows, which is why trimming schemas is rarely just a cost optimization — it usually improves behavior too.

## A concrete example

Take a modest registry: 30 tools, each with a description and three to five parameters, written the way most teams write them on a first pass — a sentence or two of description, a sentence per parameter.

A single tool at this level of verbosity, formatted as it would be sent to the API:

```json
{
  "name": "search_orders",
  "description": "Search the customer's order history by keyword, date range, or status. Use this when the user doesn't already know a specific order ID.",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Free-text keyword search over item names." },
      "status": { "type": "string", "enum": ["pending", "shipped", "delivered", "cancelled", "refunded"], "description": "Filter to orders in this status." },
      "start_date": { "type": "string", "description": "Earliest order date to include, YYYY-MM-DD." },
      "end_date": { "type": "string", "description": "Latest order date to include, YYYY-MM-DD." }
    }
  }
}
```

This single definition, as JSON text, runs a little over 500 characters — call it roughly 130-150 tokens once you account for typical tokenizer behavior on JSON punctuation and camelCase-to-subword splitting (punctuation-dense JSON tokenizes less efficiently than prose, so treat this as a rough floor, not a precise count — see /learn/tools-function-calling/measuring-and-trimming-schema-tokens for how to get an exact number for your own schemas with a real tokenizer).

Multiply by 30 tools of similar complexity and you're in the range of 4,000-4,500 tokens of pure schema, sent before the user's first message is even considered. On a model with a 128k-token context window that's a few percent — tolerable in isolation. But it's paid on *every* turn of the conversation, it grows every time someone adds a tool without pruning another, and it's the first thing to reconsider when you're debugging why a long conversation is running out of room or why tool selection is getting worse as the registry grows. Thirty tools is not an unusual number for a production agent with a handful of integrations; it's easy to reach without anyone deciding to build "a big tool registry."

## Where it shows up

This is why /learn/tools-function-calling/tool-selection-at-scale exists as its own problem once a registry passes roughly a dozen tools — retrieval-based tool selection, namespacing, and progressive disclosure are all, among other things, strategies for not paying the full-registry token cost on every turn. It's also the reason /learn/tools-function-calling/measuring-and-trimming-schema-tokens is a concrete, worthwhile exercise rather than a nice-to-have: schema bloat is invisible in the UI and only shows up as a line item once you actually count.

## Watch out for

- **Treating token cost as someone else's problem because "the context window is big enough."** A large window doesn't remove the accuracy cost of a crowded registry — see /learn/tools-function-calling/tool-selection-at-scale — even when the raw token math still fits comfortably.
- **Writing verbose descriptions once and never revisiting them.** Schemas accumulate the same way code does — each addition felt necessary at the time, and nobody goes back to prune. Treat schema review as a recurring task, not a one-time pass.
- **Confusing prompt caching with cost elimination.** Caching a stable tool prefix reduces what you pay per request; it does not shrink the context window the model has to reason across on that turn.

## Where next

/learn/tools-function-calling/measuring-and-trimming-schema-tokens walks through actually counting a bloated set with a tokenizer and cutting it down with a before/after table — the practical follow-up to this lesson's conceptual case.

**Related:** /learn/tools-function-calling/token-cost-of-tool-schemas · /learn/tools-function-calling/measuring-and-trimming-schema-tokens · /learn/tools-function-calling/tool-selection-at-scale · /learn/tools-function-calling/too-many-tools-confuse-models · /learn/tools-function-calling/writing-descriptions-models-follow-deep
