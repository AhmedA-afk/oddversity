---
title: "Measuring and Trimming Schema Tokens"
track: "tools-function-calling"
status: live
summary: "Count a bloated 12-tool registry with a real tokenizer, then cut it down by roughly 40% without losing behavior — with a before/after table."
duration: "8 min read"
---

"Trim your schemas" is easy advice and hard to act on without numbers. This lesson builds the measurement step first — so you're cutting based on what's actually expensive, not on a guess — then does the cutting and re-measures to confirm nothing broke.

## What we're building

A small script that takes a tool registry (a list of schema dicts, the same shape you'd send to a provider's API) and reports its token footprint, tool by tool. Then a worked pass at trimming a 12-tool registry using that script's output as the guide, with a before/after table showing where the savings actually came from.

## Setup

You need a real tokenizer, not a character-count approximation — character counts are consistently off for JSON because of how punctuation-heavy, camelCase, and snake_case text tokenizes differently from prose. `tiktoken` is a reasonable stand-in for this exercise; the exact count will differ slightly by provider and model, but the *relative* savings from trimming are what matters here, and those hold regardless of which tokenizer you count with.

```bash
pip install tiktoken
```

## Build it

### Step 1: a counting function

```python
import json
import tiktoken

enc = tiktoken.get_encoding("cl100k_base")

def count_tokens(obj) -> int:
    text = json.dumps(obj, separators=(",", ":"))
    return len(enc.encode(text))

def registry_report(tools: list[dict]) -> None:
    total = 0
    for tool in tools:
        n = count_tokens(tool)
        total += n
        print(f"{tool['name']:<28} {n:>5} tokens")
    print(f"{'TOTAL':<28} {total:>5} tokens")
```

> **Why this step?** Serializing with `json.dumps(obj, separators=(",", ":"))` matches the compact form providers actually transmit — no extra whitespace inflating the count. Reporting per-tool, not just a registry total, is what tells you *which* tools to spend your trimming effort on; without it you're editing blind.

### Step 2: the bloated registry

Twelve tools, written the way a first pass usually looks — complete, but verbose, with some real duplication between tools that grew up independently.

```python
tools_v1 = [
  {
    "name": "search_orders",
    "description": "This tool allows you to search through the customer's entire order history. You can use it to search by a keyword, by a date range, or by filtering on the current status of the order. It is useful when the user is asking about their orders but does not have a specific order ID in mind.",
    "input_schema": {
      "type": "object",
      "properties": {
        "query": {"type": "string", "description": "A free text keyword or phrase to search for within the order's item names or notes."},
        "status": {"type": "string", "description": "The status to filter orders by. Can be one of pending, shipped, delivered, cancelled, or refunded."},
        "start_date": {"type": "string", "description": "The earliest date, in YYYY-MM-DD format, that an order should have been placed on to be included in the results."},
        "end_date": {"type": "string", "description": "The latest date, in YYYY-MM-DD format, that an order should have been placed on to be included in the results."}
      }
    }
  },
  {
    "name": "get_order_by_id",
    "description": "This tool retrieves the full details of a single specific order, given that you already know the exact order ID that you are looking for. It returns more detail than the search tool does.",
    "input_schema": {
      "type": "object",
      "properties": {"order_id": {"type": "string", "description": "The exact unique identifier of the order to retrieve."}},
      "required": ["order_id"]
    }
  },
  {
    "name": "cancel_order",
    "description": "This tool cancels an order that has not yet shipped. It should be used whenever the customer wants to cancel or stop an order from being fulfilled.",
    "input_schema": {
      "type": "object",
      "properties": {"order_id": {"type": "string", "description": "The exact unique identifier of the order to cancel."}, "reason": {"type": "string", "description": "An optional free text explanation of why the order is being cancelled, for internal records."}},
      "required": ["order_id"]
    }
  }
  # ... 9 more tools of similar verbosity in the full set
]
```

> **Why this step?** This is deliberately realistic bloat, not a straw man — "This tool allows you to..." preambles, restating the parameter name inside its own description, and duplicated phrasing across tools (`"the exact unique identifier of the order"` shows up in both `get_order_by_id` and `cancel_order`) are exactly what accumulates when several people add tools independently over months.

### Step 3: measure the baseline

```python
registry_report(tools_v1)
```

```
search_orders                  118 tokens
get_order_by_id                 52 tokens
cancel_order                    68 tokens
... (9 more tools) ...
TOTAL                         1,240 tokens
```

*(Illustrative counts for this worked example — run it on your own registry for real numbers; the exact figures will vary by tokenizer and by your actual schemas.)*

> **Why this step?** You need a baseline before you cut anything, and you need it broken out per tool — in a real 12-tool set this size, three or four verbose tools typically account for a disproportionate share of the total, which tells you where to spend your trimming effort first instead of shaving a few tokens off everything evenly.

### Step 4: trim with a rule, not a vibe

Apply one rule consistently: cut every "this tool allows you to" / "this tool retrieves" preamble down to the sentence that actually carries information, remove the "when to use it" duplication between the tool description and any redundant parameter descriptions, and de-duplicate any phrasing repeated verbatim across tools by moving it once into whichever tool most needs it.

```python
tools_v2 = [
  {
    "name": "search_orders",
    "description": "Search the customer's order history by keyword, date range, or status. Use when the user doesn't have a specific order ID.",
    "input_schema": {
      "type": "object",
      "properties": {
        "query": {"type": "string", "description": "Keyword search over item names or notes."},
        "status": {"type": "string", "enum": ["pending", "shipped", "delivered", "cancelled", "refunded"]},
        "start_date": {"type": "string", "description": "YYYY-MM-DD, inclusive."},
        "end_date": {"type": "string", "description": "YYYY-MM-DD, inclusive."}
      }
    }
  },
  {
    "name": "get_order_by_id",
    "description": "Retrieve full order details by exact order ID. Prefer over search_orders when the user gives a specific order number.",
    "input_schema": {
      "type": "object",
      "properties": {"order_id": {"type": "string"}},
      "required": ["order_id"]
    }
  },
  {
    "name": "cancel_order",
    "description": "Cancel an order that hasn't shipped yet.",
    "input_schema": {
      "type": "object",
      "properties": {"order_id": {"type": "string"}, "reason": {"type": "string", "description": "Optional internal note."}},
      "required": ["order_id"]
    }
  }
  # ... remaining 9 tools trimmed the same way
]
```

> **Why this step?** Notice `status` moved from a prose-described free string to an `enum` — that's not just shorter, it's a strict accuracy improvement per /learn/tools-function-calling/enum-vs-freeform-parameters. Trimming and correctness aren't in tension here; a lot of verbosity was standing in for structure the schema should have been carrying itself. Also notice `order_id`'s description disappeared entirely once the parameter name plus the tool-level description already made its meaning unambiguous — a description that repeats what the name and type already say is pure cost.

## Run it

```python
registry_report(tools_v2)
```

```
search_orders                   71 tokens
get_order_by_id                 34 tokens
cancel_order                    41 tokens
... (9 more tools) ...
TOTAL                          ~740 tokens
```

| | v1 (baseline) | v2 (trimmed) | Change |
|---|---|---|---|
| `search_orders` | 118 | 71 | -40% |
| `get_order_by_id` | 52 | 34 | -35% |
| `cancel_order` | 68 | 41 | -40% |
| Registry total (12 tools) | ~1,240 | ~740 | -40% |

*(Illustrative — the exact percentage depends on how verbose your v1 actually is; treat the ~40% figure as a realistic order of magnitude for a first trimming pass on a never-reviewed registry, not a guarantee.)*

## Harden it

A token count going down proves nothing about behavior on its own — a schema can get shorter and *worse* if you trim the sentence that was doing real disambiguation work. Before trusting the trimmed set, run a small eval: take 10-15 representative user queries that exercise the registry (including at least one pair of queries designed to probe every tool that's easily confused with a neighbor, like `search_orders` vs `get_order_by_id`), run them against both `tools_v1` and `tools_v2`, and diff the tool choices and arguments.

```python
def eval_registry(tools, queries, call_model):
    results = {}
    for q in queries:
        response = call_model(tools=tools, message=q)
        results[q] = (response.tool_name, response.tool_args)
    return results

before = eval_registry(tools_v1, eval_queries, call_model)
after = eval_registry(tools_v2, eval_queries, call_model)

for q in eval_queries:
    if before[q] != after[q]:
        print(f"DIVERGED on: {q!r}\n  before: {before[q]}\n  after:  {after[q]}")
```

Anything that diverges is a signal to look at, not necessarily a regression — sometimes trimming *fixes* a call (the enum conversion above is a common source of a divergence that's actually an improvement). But every divergence should be looked at deliberately rather than assumed benign.

## Extend it

Run `registry_report` in CI against your actual tool registry file and fail the build if the total crosses a threshold you set — this turns schema bloat from something you notice months later into something a pull request flags immediately. Pair it with the eval step above running on the same trigger, so a token-reducing change and a behavior-preserving change are checked together rather than as two separate, easy-to-skip steps.

**Related:** /learn/tools-function-calling/token-cost-of-schemas-deep · /learn/tools-function-calling/token-cost-of-tool-schemas · /learn/tools-function-calling/enum-vs-freeform-parameters · /learn/tools-function-calling/schema-design-common-mistakes · /learn/tools-function-calling/tool-schema-design-cheatsheet
