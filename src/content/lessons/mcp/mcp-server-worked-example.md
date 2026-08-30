---
title: "Building an MCP Server, Worked: Empty File to Live Tool"
track: "mcp"
status: live
summary: "One server built line by line — a tool, a resource, a prompt — then registered with a real client, with the exact output at each step and the three places it silently fails."
duration: "12 min read"
---

Quickstarts show you a server that works. This shows you one being built, including the two moments where it stops working and what the failure actually looks like from the client's side — because those are the moments you will hit and the quickstart will not have prepared you for.

We are building a server that answers questions about a SQLite database of orders. Nothing about the domain matters; the shape does.

## Step 0 — The empty file that already fails

```python
# server.py
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("orders")

if __name__ == "__main__":
    mcp.run()
```

Run the inspector against it:

```bash
npx @modelcontextprotocol/inspector python server.py
```

**Output:** the inspector connects, and the Tools tab is empty. That is correct — a server with no tools is a valid server. It is worth seeing once, because it separates "the connection is broken" from "the connection is fine and I have exposed nothing", and those two states look identical in a chat client.

## Step 1 — A tool, and the schema it generates

```python
import sqlite3
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("orders")

@mcp.tool()
def find_orders(customer_email: str, limit: int = 10) -> list[dict]:
    """Look up recent orders for one customer by email address.

    Use when the user asks about a specific person's order history.
    Returns most recent first. Excludes cancelled orders.
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

**Output — what the client now sees:**

```json
{
  "name": "find_orders",
  "description": "Look up recent orders for one customer by email address.\n\nUse when the user asks about a specific person's order history.\nReturns most recent first. Excludes cancelled orders.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "customer_email": {"type": "string", "title": "Customer Email"},
      "limit": {"type": "integer", "title": "Limit", "default": 10}
    },
    "required": ["customer_email"]
  }
}
```

Read that carefully, because **this is the entire basis on which a model decides whether to call your tool.** Not the code. The name, the description, and the parameter names.

Two things are already doing work. `min(limit, 50)` caps a value the model chose — every argument is model-supplied and therefore attacker-influenced. And the second paragraph of the docstring says *when* to use the tool, which is what a model needs when choosing between five of them.

## Step 2 — The first silent failure

Add a debug line, the way you would in any other Python program:

```python
@mcp.tool()
def find_orders(customer_email: str, limit: int = 10) -> list[dict]:
    """..."""
    print(f"looking up {customer_email}")     # ← this breaks the server
    ...
```

**Output:** the client shows a connection error, or nothing at all, depending on which client. The inspector shows a JSON parse failure.

The server speaks the protocol over stdout. A `print()` injects text into that stream and the framing breaks. The fix is one line at the top of the file, and it belongs there before you write anything else:

```python
import logging, sys
logging.basicConfig(level=logging.INFO, stream=sys.stderr)
logging.info("looking up %s", customer_email)
```

**Output after the fix:** the tool works, and your log line appears in the client's server-log pane rather than corrupting the connection.

## Step 3 — A resource, for context that needs no action

The model does not need to *call* anything to know the table shape. That makes it a resource, not a tool.

```python
@mcp.resource("schema://orders")
def orders_schema() -> str:
    """The table definitions available to the order tools."""
    db = sqlite3.connect("orders.db")
    rows = db.execute("SELECT sql FROM sqlite_master WHERE type = 'table'").fetchall()
    return "\n\n".join(r[0] for r in rows if r[0])
```

**Output:** the client's Resources tab now lists `schema://orders`, and the host can pull it into context on its own terms — usually when the user attaches it, not automatically.

That distinction is the one people get wrong. If you had made this a `get_schema()` tool, the model would have to spend a turn calling it before it could do anything useful, on every conversation.

## Step 4 — A prompt, so the server ships its own workflow

```python
@mcp.prompt()
def investigate_refund(order_id: str) -> str:
    """Walk through a refund investigation for one order."""
    return (
        f"Investigate order {order_id} for a refund request.\n"
        "1. Look up the order; confirm it exists and is not already refunded.\n"
        "2. Check its status against the refund policy in schema://orders.\n"
        "3. State a recommendation and the specific evidence for it.\n"
        "Do not issue the refund. Recommend only."
    )
```

**Output:** the client surfaces this as a slash command or menu entry. The user picks it, supplies an order ID, and gets a consistent investigation rather than whatever they thought to type.

This is the least-used primitive and the one that most changes how a server feels. It is where you encode the *right* way to use your own tools.

## Step 5 — The second silent failure

Register with Claude Desktop:

```json
{
  "mcpServers": {
    "orders": {
      "command": "python",
      "args": ["server.py"]
    }
  }
}
```

**Output:** the server does not appear. No error dialog. Nothing in the UI to indicate anything was attempted.

Two causes, both about the environment your process is launched in rather than your code:

- `server.py` is relative, and the client's working directory is not yours.
- `python` resolves against the client's `PATH`, which is not your shell's — a virtualenv Python is almost never on it.

```json
{
  "mcpServers": {
    "orders": {
      "command": "/Users/you/project/.venv/bin/python",
      "args": ["/Users/you/project/server.py"]
    }
  }
}
```

Absolute paths for both. This single issue accounts for a large share of "my server won't start" reports, and the absence of an error message is what makes it expensive.

## What you have

Three primitives, one connection, and two failures reproduced deliberately rather than discovered at 3am. Next: [MCP transports compared](/learn/mcp/mcp-transports-compared) for when stdio is not the right choice, and [common mistakes](/learn/mcp/mcp-server-common-mistakes) for the ones this build did not trip over.
