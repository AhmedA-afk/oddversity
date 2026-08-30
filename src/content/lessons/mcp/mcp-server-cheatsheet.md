---
title: "MCP Server Cheatsheet"
track: "mcp"
status: live
summary: "The shapes to copy — server skeleton, tool, resource, prompt, client registration, and the six checks to run before you ship."
duration: "6 min read"
---

Theory is in [what MCP is](/learn/mcp/what-is-mcp) and [tools, resources and prompts](/learn/mcp/mcp-tools-resources-and-prompts). This is what you type.

## The skeleton, with the logging fix first

```python
import logging, sys
logging.basicConfig(level=logging.INFO, stream=sys.stderr)  # never stdout

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("orders")

if __name__ == "__main__":
    mcp.run()                    # stdio transport
```

## Which primitive

| You want | Primitive | Who triggers it |
|---|---|---|
| The model to take an action or fetch conditionally | **Tool** | The model |
| Content the client should read into context | **Resource** | The host or the user |
| A reusable workflow offered as a command | **Prompt** | The user |
| The server to ask the client's model something | **Sampling** | The server |
| The server to ask the user something mid-call | **Elicitation** | The server |

Rule of thumb: if the model must spend a turn calling it just to *know* something, it should probably be a resource.

## Tool

```python
@mcp.tool()
def find_orders(customer_email: str, limit: int = 10) -> list[dict]:
    """Look up recent orders for one customer by email address.

    Use when the user asks about a specific person's order history.
    Does not cover billing disputes — use find_dispute for those.
    """
    ...
```

- Type hints become the input schema. Write them precisely.
- The docstring is the selection criterion, not documentation. Say *when*, and say what it does not cover.
- Clamp every numeric argument. Validate every path and identifier.

## Resource

```python
@mcp.resource("schema://orders")
def orders_schema() -> str:
    """The table definitions available to the order tools."""
    ...

@mcp.resource("order://{order_id}")          # templated
def order(order_id: str) -> str:
    ...
```

## Prompt

```python
@mcp.prompt()
def investigate_refund(order_id: str) -> str:
    """Walk through a refund investigation for one order."""
    return f"Investigate order {order_id}...\nDo not issue the refund. Recommend only."
```

## Registering with a client

```json
{
  "mcpServers": {
    "orders": {
      "command": "/absolute/path/.venv/bin/python",
      "args": ["/absolute/path/server.py"],
      "env": { "ORDERS_DB": "/absolute/path/orders.db" }
    }
  }
}
```

Config locations:

| Client | Path |
|---|---|
| Claude Desktop (macOS) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Desktop (Windows) | `%APPDATA%\Claude\claude_desktop_config.json` |
| Claude Code | `claude mcp add orders -- /abs/python /abs/server.py` |

**Absolute paths for both `command` and `args`.** A relative path is the most common silent startup failure, and the client's `PATH` will not contain your virtualenv.

## Secrets

```python
import os
API_KEY = os.environ["SERVICE_API_KEY"]      # from env, never a tool argument
```

A tool argument is model-visible and model-chosen. A credential must never be either.

## Testing

```bash
npx @modelcontextprotocol/inspector python server.py    # interactive
```

Then one integration test in CI:

```python
def test_tools_are_callable():
    tools = client.list_tools()
    assert {t.name for t in tools} == EXPECTED_NAMES
    for name, args in SMOKE_ARGS.items():
        result = client.call_tool(name, args)
        assert not result.isError, f"{name} failed: {result}"
```

That single test catches stdout pollution, startup failures, schema regressions and broken handlers — most of what actually breaks.

## Pre-ship checklist

- [ ] Logging goes to stderr, configured before other imports.
- [ ] Every tool description says when to use it and what it excludes.
- [ ] Every numeric argument clamped; every path and identifier validated.
- [ ] Errors return a readable message, not an empty result.
- [ ] Credentials come from the environment.
- [ ] Anything irreversible requires confirmation.
- [ ] Absolute paths in the client config.
- [ ] Tool schemas measured against a typical request — few sharp tools, not many vague ones.

## Defaults worth starting from

| Decision | Start with | Change when |
|---|---|---|
| Transport | stdio | The server must serve remote or multiple users |
| Tools per server | Under about 10 | Never — split into another server instead |
| Numeric argument cap | Clamp to a sane maximum in code | Never remove it |
| Tool result size | Truncate to a few thousand characters | The consumer genuinely needs more |
| Destructive actions | Human confirmation, always | Never |
