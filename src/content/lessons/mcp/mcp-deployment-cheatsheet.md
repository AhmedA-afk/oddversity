---
title: "MCP Operations Cheatsheet"
track: "mcp"
status: live
summary: "Deployment shapes at a glance, the promotion checklist from local to shared, versioning rules, schema-budget maths and what to alert on."
duration: "6 min read"
---

## Pick a shape

| Situation | Ship as |
|---|---|
| Reads the user's files, apps or local credentials | **Local install** (stdio) |
| You make an app the user already runs | **Bundled** with that app |
| Central data, team or customers | **Self-hosted remote** (streamable HTTP) |
| More than ~3 internal servers | Remote **behind a gateway** |
| Generally useful, you will maintain it | **Published to a registry** |

## Promoting local → shared

In order. Skipping step 3 is the classic incident.

1. **Transport** — `mcp.run(transport="streamable-http", …)`
2. **Auth** — verify signature **and** `aud`, `iss`, `exp`; attach a principal
3. **Scope every tool** to that principal *(middleware answers who, tools answer what)*
4. **Deploy** — TLS, health check, and decide statefulness before a second replica
5. **Operate** — rate limits, least-privilege credentials, timeouts, result caps

## Statelessness

```python
mcp = FastMCP("tickets", stateless_http=True)     # prefer this
```

| | Stateless | Stateful |
|---|---|---|
| Scaling | Any replica, any request | Sticky routing or shared store |
| Failure mode | — | Intermittent unknown-session errors |
| Worth it when | Almost always | Per-session setup is genuinely expensive |

## Limits to set

| Limit | Start at | Why |
|---|---|---|
| Tool result size | ~4,000 chars / 100 rows | Results land in the context window |
| Request timeout | Under the proxy idle timeout | Silent streams get cut |
| Per-caller rate | Enough for a person, not an automation | One scripted user outweighs the rest |
| Numeric arguments | Clamped in code | Arguments are model-chosen |
| Downstream credential | Read-only where possible | Bounds a tricked tool |

## Schema budget

```
per-request schema cost ≈ Σ (name + description + JSON schema) across every
                          tool of every connected server
```

Measure it. Then: fewer, sharper tools; separate servers a user can toggle; a gateway presenting a filtered subset.

## Versioning a published server

| Change | Safe? | Do instead |
|---|---|---|
| Add an optional argument | Yes | — |
| Add a tool | Yes | — |
| Add a required argument | **No** | Add it optional, default sensibly |
| Rename a tool | **No** | Keep the old name as an alias, deprecate |
| Remove a tool | **No** | Deprecate, keep returning a clear error first |
| Narrow an argument's type | **No** | Validate at runtime, warn, then tighten |

You cannot contact users on an installed version. Assume every removal is a silent breakage.

## Alert on

- Error rate per tool, over a rolling window
- p95 tool latency
- Auth failure rate *(a spike is either a broken deploy or someone probing)*
- Token-refresh failures *(the overnight killer)*
- Result-size p95 *(catches a corpus growing under you)*

## Shutdown

```python
import atexit, signal

def cleanup(*_):
    pool.close()
    for proc in children:
        proc.terminate()

atexit.register(cleanup)
signal.signal(signal.SIGTERM, cleanup)
signal.signal(signal.SIGINT, cleanup)
```

Clients disappear without ceremony. Assume the shutdown is rude.

## Pre-promotion checklist

- [ ] The data is genuinely central — a local install would not do.
- [ ] Auth verifies audience and issuer, not just the signature.
- [ ] Every tool scopes to the principal; verified with two accounts.
- [ ] Stateless, or sessions in shared storage.
- [ ] Downstream credential is least-privilege.
- [ ] Rate limits per caller.
- [ ] Result caps with explicit truncation notes.
- [ ] Cleanup on `SIGTERM` / `SIGINT` / `atexit`.
- [ ] Smoke test and tool-selection test in CI.
