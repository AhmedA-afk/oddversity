---
title: "Transports, Worked: The Same Server Over stdio and HTTP"
track: "mcp"
status: live
summary: "One server exposed both ways, with the exact code diff, the client configuration for each, and the four things that change the moment it leaves the local machine."
duration: "10 min read"
---

The clearest way to understand the transport choice is to take one server and move it. Almost nothing about the tools changes. Almost everything about the responsibilities does.

## The server, over stdio

```python
import logging, sys
logging.basicConfig(level=logging.INFO, stream=sys.stderr)

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("notes")

@mcp.tool()
def search_notes(query: str, limit: int = 5) -> list[dict]:
    """Search the user's local notes by keyword. Returns matching excerpts."""
    return _search(query, min(limit, 20))

if __name__ == "__main__":
    mcp.run()
```

Client config:

```json
{
  "mcpServers": {
    "notes": {
      "command": "/Users/you/notes/.venv/bin/python",
      "args": ["/Users/you/notes/server.py"]
    }
  }
}
```

**What is true here.** One process per session, started by the client. No port, no listener, nothing reachable from the network. The question "who is allowed to call `search_notes`?" is answered by the operating system: whoever can run this process as this user.

## The same server, over streamable HTTP

The diff is two lines.

```python
if __name__ == "__main__":
    mcp.run(transport="streamable-http")     # listens on a port
```

Client config:

```json
{
  "mcpServers": {
    "notes": {
      "type": "http",
      "url": "https://notes.internal.example.com/mcp"
    }
  }
}
```

**What just changed.** Four things, none of them in the tool code.

### 1. Anyone who can reach the URL can call your tools

There is no operating-system boundary any more. Until you add authentication, `search_notes` is a public endpoint that reads someone's notes.

```python
from starlette.middleware.base import BaseHTTPMiddleware

class RequireToken(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        token = request.headers.get("authorization", "").removeprefix("Bearer ").strip()
        principal = verify(token)                 # your own verification
        if not principal:
            return JSONResponse({"error": "unauthorized"}, status_code=401)
        request.state.principal = principal
        return await call_next(request)
```

And the tool must now scope its work to the caller, because there is a caller:

```python
@mcp.tool()
def search_notes(query: str, limit: int = 5) -> list[dict]:
    """Search your notes by keyword. Returns matching excerpts."""
    principal = current_request().state.principal
    return _search(query, min(limit, 20), owner=principal.user_id)
```

**Output if you skip this step:** every user sees every user's notes, and the tool code looks entirely correct while doing it.

### 2. Sessions become explicit

Over stdio, the process *is* the session. Over HTTP, the server issues a session identifier on initialisation and the client returns it on subsequent requests.

```
POST /mcp                       → 200, Mcp-Session-Id: 01J8...
POST /mcp  Mcp-Session-Id: 01J8… → 200
```

If you keep per-session state in process memory and then run two replicas behind a load balancer, request two lands on the replica that has never heard of that session. The symptom is intermittent failure under load and perfect behaviour in testing.

Either keep sessions in shared storage, or make the server stateless and carry what you need per request.

### 3. Origin and binding matter

A local HTTP server bound to `0.0.0.0` is reachable from the network. A local HTTP server that accepts any `Origin` can be driven by a web page the user visits.

```python
# Bind to loopback for a local HTTP server
mcp.run(transport="streamable-http", host="127.0.0.1", port=8765)
```

And validate `Origin` against an allowlist rather than reflecting it.

### 4. Long responses need a stream, and streams get dropped

Over stdio, a slow tool just takes a while. Over HTTP, a response that takes ninety seconds meets proxy timeouts, load-balancer idle limits and mobile networks.

Streamable HTTP lets the server upgrade a response to SSE and push progress. Use it for anything slow, and design for the stream being cut — the client should be able to retry without repeating a side effect.

## What did not change

The tool signatures, the schemas, the descriptions, the validation, the error handling. That is the point of the protocol: the capability surface is transport-independent.

## The comparison, concretely

| | stdio | Streamable HTTP |
|---|---|---|
| Lines changed in the server | — | 1 (`transport=`) |
| Lines added to make it safe | 0 | Auth middleware, per-caller scoping, origin checks, session strategy |
| Who can call the tool | Whoever runs the process | Whoever your auth admits |
| Fails under load by | Not applying | Session affinity, dropped streams |

**One line to switch transports; several dozen to be responsible about it.** That asymmetry is the whole lesson, and it is the reason to stay on stdio until something genuinely requires otherwise.

---

Next: [transports compared](/learn/mcp/mcp-transports-compared) for the decision rule, and [common mistakes](/learn/mcp/mcp-transports-common-mistakes) for what goes wrong in each.
