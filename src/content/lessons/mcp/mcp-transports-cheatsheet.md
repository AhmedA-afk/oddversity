---
title: "MCP Transports Cheatsheet"
track: "mcp"
status: live
summary: "Configuration for stdio and streamable HTTP, the headers that matter, binding and origin defaults, and a table of which failure points at which cause."
duration: "6 min read"
---

Decision logic is in [transports compared](/learn/mcp/mcp-transports-compared). This is the configuration.

## Pick in one line

| Situation | Transport |
|---|---|
| Server touches the user's files, apps or local credentials | **stdio** |
| Server is shared between people, or you host it | **Streamable HTTP** |
| A client only speaks the older two-endpoint form | **HTTP + SSE**, alongside streamable |

## stdio

```python
if __name__ == "__main__":
    mcp.run()            # stdio is the default
```

```json
{
  "mcpServers": {
    "notes": {
      "command": "/abs/path/.venv/bin/python",
      "args": ["/abs/path/server.py"],
      "env": { "NOTES_DIR": "/abs/path/notes" }
    }
  }
}
```

Non-negotiables:

- Logging to **stderr**, configured before other imports.
- **Absolute** interpreter path and script path.
- Cleanup registered for `SIGTERM`, `SIGINT` and `atexit`.

## Streamable HTTP

```python
mcp.run(transport="streamable-http", host="127.0.0.1", port=8765)
```

```json
{
  "mcpServers": {
    "notes": { "type": "http", "url": "https://notes.example.com/mcp" }
  }
}
```

Headers in play:

| Header | Direction | Purpose |
|---|---|---|
| `Mcp-Session-Id` | Server → client on init, then client → server | Ties requests to a session |
| `Authorization: Bearer …` | Client → server | Your auth; the protocol does not supply one |
| `Accept: text/event-stream` | Client → server | Signals the client can take a streamed response |
| `Origin` | Client → server | **Validate against an allowlist. Never reflect.** |

Defaults worth keeping:

| Setting | Local | Hosted |
|---|---|---|
| Bind address | `127.0.0.1` | Behind a proxy you control |
| TLS | Not needed on loopback | Required |
| Auth | Still add it | Required |
| Session state | In process is fine | Shared store, or stateless |
| Response cap | — | Short enough to survive proxy idle timeouts |

## Statefulness

| | Stateful | Stateless |
|---|---|---|
| Session data | Held per session | Carried per request |
| Scaling | Sticky routing or shared store | Any replica serves any request |
| Good for | Long interactive sessions, expensive setup | Everything else |

Choose before you deploy a second replica, not after.

## Failure → cause

| Symptom | Likely cause |
|---|---|
| Server never appears, no error | Relative path or wrong interpreter in the client config |
| Connects, dies on one specific tool | Something in that path writes to stdout |
| Works alone, fails intermittently in production | In-memory sessions across multiple replicas |
| Slowest tool is also the flakiest | Proxy or load-balancer timeout cutting the stream |
| Works locally, unreachable when deployed | Bound to loopback, or blocked by origin validation |
| Everyone sees everyone's data | HTTP transport with no per-caller scoping in the tool |
| Orphan processes accumulate | No cleanup on abnormal termination |

## Before exposing anything over HTTP

- [ ] Authentication middleware rejects unauthenticated requests.
- [ ] Every tool scopes its work to the authenticated caller.
- [ ] Bound to loopback locally; behind TLS when hosted.
- [ ] `Origin` validated against an allowlist.
- [ ] Session strategy decided and written down.
- [ ] Slow tools stream progress; retries are safe to repeat.
- [ ] Rate limits per caller.
