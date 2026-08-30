---
title: "Build an MCP server in Python and connect it to Claude"
description: "A working Model Context Protocol server with a tool, a resource and a prompt — wired into a real client — plus the lifecycle and security details the quickstarts leave out."
question: "How do I build an MCP server and actually use it from a client?"
level: "intermediate"
duration: "30 min"
published: "2026-08-30"
tags: ["MCP", "Python", "Tools"]
featured: true
steps:
  - "Install the SDK and create a server with a name"
  - "Expose one tool with a typed signature and a real docstring"
  - "Add a resource so the client can read context without calling a tool"
  - "Add a prompt so the server can ship its own workflow"
  - "Run it over stdio and register it with a client"
  - "Handle the failure modes: schema bloat, secrets, and long-running work"
related:
  - "/learn/mcp/what-is-mcp"
  - "/learn/mcp/mcp-tools-resources-and-prompts"
  - "/learn/mcp/mcp-transports-stdio-vs-http"
  - "/learn/mcp/server-design-and-permissions"
---

The Model Context Protocol solves an unglamorous problem: every assistant needs to reach
your tools, and without a standard, every assistant needs its own integration. MCP is the
adapter. A server exposes capabilities; any compliant client can use them.

What follows is a server that does something real — queries a local SQLite database — and
gets wired into a client you can actually use.

## Step 1 — Set up

```bash
pip install "mcp[cli]"
```

An MCP server is a normal Python process. It speaks the protocol over a transport, usually
stdio for local servers, which means the client launches your process and talks to it over
stdin and stdout.

That has one consequence people trip over immediately: **anything you print to stdout
corrupts the protocol stream.** Log to stderr, always.

```python
import logging, sys
logging.basicConfig(level=logging.INFO, stream=sys.stderr)
```

## Step 2 — One tool, typed properly

```python
import sqlite3
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("orders")

@mcp.tool()
def find_orders(customer_email: str, limit: int = 10) -> list[dict]:
    """Look up recent orders for one customer by their email address.

    Use this when the user asks about a specific person's order history.
    Returns the most recent orders first. Does not include cancelled orders.
    """
    db = sqlite3.connect("orders.db")
    db.row_factory = sqlite3.Row
    rows = db.execute(
        "SELECT id, placed_at, status, total_cents FROM orders"
        " WHERE customer_email = ? AND status != 'cancelled'"
        " ORDER BY placed_at DESC LIMIT ?",
        (customer_email, min(limit, 50)),
    ).fetchall()
    return [dict(r) for r in rows]
```

The type hints become the tool's input schema — this is the whole reason to write them
carefully. The docstring becomes the description the model reads when deciding whether to
call it, so write it for a reader who has to choose between your tool and four others.
"Look up recent orders for one customer by their email address" tells a model when to use
it. "Order lookup tool" does not.

Note `min(limit, 50)`. Treat every argument as attacker-influenced, because it is: the
value came from a model that was reading text you did not write.

## Step 3 — A resource, for context the model should read

Tools are for actions. Resources are for content the client can pull into context without
an action. If the model does not need to *do* anything to get it, it should be a resource.

```python
@mcp.resource("schema://orders")
def orders_schema() -> str:
    """The table definitions available to the order tools."""
    db = sqlite3.connect("orders.db")
    rows = db.execute("SELECT sql FROM sqlite_master WHERE type = 'table'").fetchall()
    return "\n\n".join(r[0] for r in rows if r[0])
```

## Step 4 — A prompt, so the server ships its own workflow

A prompt is a reusable template the server offers to the client — typically surfaced as a
slash command or a menu item. It is the most underused of the three primitives, and it is
how a server encodes the *right* way to use itself.

```python
@mcp.prompt()
def investigate_refund(order_id: str) -> str:
    """Walk through a refund investigation for one order."""
    return (
        f"Investigate order {order_id} for a refund request.\n"
        "1. Look up the order and confirm it exists and is not already refunded.\n"
        "2. Check the order status against the refund policy in schema://orders.\n"
        "3. State the recommendation and the specific evidence for it.\n"
        "Do not issue the refund. Recommend only."
    )
```

## Step 5 — Run it and register it

```python
if __name__ == "__main__":
    mcp.run()          # stdio transport by default
```

Test it standalone before you touch a client — the inspector is far faster to iterate
against than a chat window:

```bash
npx @modelcontextprotocol/inspector python server.py
```

Then register it. For Claude Desktop, add it to the config file
(`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS,
`%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "orders": {
      "command": "python",
      "args": ["/absolute/path/to/server.py"]
    }
  }
}
```

For Claude Code, `claude mcp add orders -- python /absolute/path/to/server.py`.

Use absolute paths. The client does not launch your server from the directory you think it
does, and a relative path is the single most common reason a server silently fails to
start.

## Step 6 — The failure modes

**Schema bloat eats the context window.** Every tool's name, description and full input
schema is sent to the model on every request. Twenty tools with verbose schemas is a real,
recurring tax on every single turn. Ship few tools with sharp descriptions rather than
many with vague ones, and split unrelated capabilities into separate servers the user can
enable independently.

**Secrets belong in the environment, not the arguments.** A tool argument is model-visible
and model-chosen. Read credentials from the process environment; never accept an API key
as a parameter, however convenient it looks.

**Long-running work needs to report progress.** A tool that blocks for ninety seconds looks
identical to a hung one. Either return quickly with a handle the client can poll, or emit
progress notifications.

**Anything destructive needs a human.** The model is deciding to call your tool based on
text that may include content from an untrusted source — a document, a web page, an email.
Read tools can be automatic. Write, delete, send and pay cannot. Put the confirmation in
the server's own design rather than assuming the client provides one.

**Errors should be readable.** Return "no customer found with that email address" rather
than letting an exception escape. The model is the consumer of that string and it will
often recover correctly if you tell it what went wrong.

## Where to take it next

Give the server a read-only database user. Add one integration test that starts the server,
lists the tools, and calls each one — it catches the schema regressions that are otherwise
invisible until a model behaves oddly. Then publish it to a registry so other people can
point their client at it.
