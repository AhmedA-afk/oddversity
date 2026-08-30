---
title: "MCP Primitives Cheatsheet"
track: "mcp"
status: live
summary: "Which primitive for which job, the decorator for each, who controls it, and the truncation and negotiation defaults that keep a server well-behaved."
duration: "5 min read"
---

## The choice, in one table

| You want | Primitive | Controlled by | Costs a turn? | In every request's schema? |
|---|---|---|---|---|
| The model to take an action | **Tool** | Model | Yes | Yes |
| A fetch depending on arguments the model chooses | **Tool** | Model | Yes | Yes |
| Content the model should simply have | **Resource** | Host / user | No | No |
| A reusable workflow offered as a command | **Prompt** | User | No | No |
| The server to ask the client's model something | **Sampling** | Server → client | — | No |
| The server to ask the user something mid-call | **Elicitation** | Server → user | — | No |
| The client to tell the server which directories are in scope | **Roots** | Client | — | No |

**The deciding question:** if the model must spend a turn calling it merely to *know* something, it is a resource.

## Tool

```python
@mcp.tool()
def find_order(order_id: str) -> dict:
    """Look up one order by its ID.

    Use when the user names a specific order. Does not search by customer —
    use find_orders for that.
    """
```

- Type hints become the schema; the docstring is the selection criterion.
- Clamp numbers, validate paths and identifiers.
- Return errors as readable messages, never as empty results.

## Resource

```python
@mcp.resource("policy://refunds")
def refund_policy() -> str:
    """The current refund policy, effective 2026-01-01."""

@mcp.resource("order://{order_id}")          # templated
def order_resource(order_id: str) -> str: ...
```

- URI scheme is yours. Keep it stable — clients may store references.
- Say in the docstring how current the content is.

## Prompt

```python
@mcp.prompt()
def check_refund_eligibility(order_id: str) -> str:
    """Check whether an order can be refunded under current policy."""
    return (
        f"Using policy://refunds, assess order {order_id}.\n"
        "State the clause, the deadline and any conditions.\n"
        "If the policy is silent, say so rather than inferring.\n"
        "Do not issue the refund. Recommend only."
    )
```

The instructions users would never think to add — decline when silent, recommend rather than act, cite the clause — belong here.

## Result size

```python
MAX_ROWS, MAX_CHARS = 50, 4000

rows = fetch(query)[:MAX_ROWS]
out = {"rows": [summarise(r) for r in rows], "returned": len(rows)}
if len(rows) == MAX_ROWS:
    out["note"] = "truncated to 50 rows; narrow the query for more"
```

| Result kind | Start with |
|---|---|
| Row set | 50 rows, summarised fields only |
| Free text | ~4,000 characters, truncation stated |
| Binary or file | A reference, not the bytes |
| Error | One readable sentence naming the cause |

## Capability negotiation

Check before you use; degrade when absent.

| Capability | If unsupported |
|---|---|
| Sampling | Do the work in code, or return a result that asks the user |
| Elicitation | Ask for the missing value in the tool's error message |
| Resource subscriptions | Fall back to the client re-reading |
| Roots | Default to a configured directory and say which |

## Quick smells

| Smell | Likely fix |
|---|---|
| A tool called identically every conversation | Make it a resource |
| Zero prompts on a server with a clear workflow | Ship the workflow as a prompt |
| Works in one client, silent in another | An unnegotiated capability |
| Model output degrades after a tool call | Result too large; truncate |
| Model answers without calling the tool it needed | Content should be a resource, not a tool |
