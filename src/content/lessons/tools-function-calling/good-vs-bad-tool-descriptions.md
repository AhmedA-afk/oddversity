---
title: "Good vs. Bad Descriptions, Side by Side"
track: "tools-function-calling"
status: live
summary: "One search_orders tool, two descriptions, one user query — watch the model's tool choice and arguments diverge."
duration: "6 min read"
---

Same tool, same parameters, same underlying API. The only thing that changes between these two runs is the text in the `description` field. That's enough to change which tool gets called and what arguments it gets called with.

## The setup

The registry has two tools available to the model in both runs:

```json
[
  {
    "name": "search_orders",
    "description": "<varies — see below>",
    "input_schema": {
      "type": "object",
      "properties": {
        "query": { "type": "string" },
        "status": {
          "type": "string",
          "enum": ["pending", "shipped", "delivered", "cancelled", "refunded"]
        }
      }
    }
  },
  {
    "name": "get_order_by_id",
    "description": "Retrieve full details for a single order given its exact order ID.",
    "input_schema": {
      "type": "object",
      "properties": {
        "order_id": { "type": "string" }
      },
      "required": ["order_id"]
    }
  }
]
```

The user asks:

> "Did my order #A19273 ship yet?"

This is the query, held constant across both runs. What differs is only `search_orders`'s description.

## Version A: vague

```json
"description": "Searches orders."
```

**What the model has to work with:** three words, and a `status` enum it can't connect to the user's question because the description never explains what "order" means in this system or how `status` maps to "shipped."

**Observed behavior:** faced with "did my order #A19273 ship yet," a model with only this description frequently calls `search_orders` with `query: "A19273"` — because "searches orders" plus a string called `query` plus a string that looks searchable is the path of least resistance. It has no signal that a more precise tool exists for exact-ID lookups, because nothing in either tool's description mentions the other. The result: a search call that may return zero results (if the search index doesn't match on raw order IDs the way a keyword search expects) or multiple results if `A19273` appears as a substring elsewhere, instead of one clean lookup.

## Version B: precise

```json
"description": "Search the customer's order history by keyword, date range, or status when you don't have an exact order ID. If the user gives you a specific order number (like '#A19273' or 'order 48291'), call get_order_by_id instead — it's a direct lookup and returns more detail than search."
```

**What the model has to work with:** an explicit rule that names the sibling tool and states the exact condition — "gives you a specific order number" — that should route away from this tool.

**Observed behavior:** the same query, "did my order #A19273 ship yet," is recognized as matching the stated condition almost verbatim (an order number is present), and the model calls `get_order_by_id` with `order_id: "A19273"` instead. One clean call, correct tool, correct argument, no ambiguity about what "shipped" means because the right tool returns full order status directly.

## Where it breaks (+fix)

Version B isn't magic — it breaks too, just on a different query. Try:

> "What did I order last week?"

Here Version B correctly keeps the model on `search_orders`, because no order ID is present and the condition for switching tools doesn't fire. But if `search_orders`'s description doesn't also explain what `query` should contain for a *date-based* question — no ID, no keyword, just a time range — the model may stuff `"last week"` into `query` and expect a keyword search to understand relative dates. The fix is the same principle applied one level down: describe the `query` parameter itself, not just the tool.

```json
"query": {
  "type": "string",
  "description": "Free-text keyword search over item names, e.g. 'headphones'. Do not put dates or statuses here — use a separate mechanism for those."
}
```

This is the same lesson as the tool-level fix, applied per-field: ambiguity at any level of the schema — tool description or parameter description — produces the same failure mode, a model doing something plausible-looking with the only information it has.

## Takeaways

- The disambiguating sentence — naming the sibling tool and the exact trigger condition — is worth more than any other sentence in the description. It's cheap to write and it's the one line most vague descriptions skip.
- A precise description doesn't just change *whether* the right tool is picked; it changes the *arguments* the model fills in, because a model that understands the tool's purpose maps the user's words onto the schema more accurately.
- Fix ambiguity at the level it occurs. A wrong tool choice is a tool-description problem; a right tool with a wrong argument is usually a parameter-description problem — see /learn/tools-function-calling/writing-descriptions-models-follow-deep for the general principle and /learn/tools-function-calling/parameter-design-patterns for structuring the parameters themselves.

**Related:** /learn/tools-function-calling/writing-descriptions-models-follow-deep · /learn/tools-function-calling/writing-tool-descriptions-models-follow · /learn/tools-function-calling/descriptions-are-prompts · /learn/tools-function-calling/tool-selection-at-scale · /learn/tools-function-calling/common-tool-calling-failure-modes
