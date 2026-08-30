---
title: "Deployment, Worked: One Server From Laptop to Team"
track: "mcp"
status: live
summary: "A working local server promoted to a shared service in five steps, with the specific thing that breaks at each one and what it costs to fix."
duration: "10 min read"
---

A server that works on your laptop and a server five colleagues depend on are different systems. Here is the promotion, one step at a time, with the failure each step introduces.

**Starting point:** a stdio server exposing `search_tickets` over a support database. Works locally. You want the team to use it.

## Step 1 — Change the transport

```python
mcp.run(transport="streamable-http", host="127.0.0.1", port=8765)
```

**What works:** you reach it from your own client over HTTP.

**What just broke:** nothing yet, because it is still on loopback. But the operating-system trust boundary is gone in principle — the moment this binds to a routable address, `search_tickets` is a public endpoint over customer data.

## Step 2 — Add authentication

```python
class RequireToken(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        raw = request.headers.get("authorization", "").removeprefix("Bearer ").strip()
        try:
            claims = jwt.decode(
                raw, JWKS_KEY, algorithms=["RS256"],
                audience="https://tickets.internal.example.com/mcp",
                issuer="https://auth.example.com/",
            )
        except jwt.PyJWTError:
            return JSONResponse({"error": "unauthorized"}, status_code=401)
        request.state.principal = Principal(user_id=claims["sub"], email=claims["email"])
        return await call_next(request)
```

**What works:** unauthenticated requests are rejected.

**What just broke — and this is the one people miss:** nothing about the *tools*. `search_tickets` still queries every ticket, exactly as it did when it ran as you. Five colleagues now see each other's queues, and the code looks correct.

## Step 3 — Scope every tool to the caller

```python
@mcp.tool()
def search_tickets(query: str, limit: int = 20) -> list[dict]:
    """Search support tickets assigned to your team by keyword."""
    principal = current_request().state.principal
    return _search(query, min(limit, 100), team=team_for(principal.user_id))
```

**What works:** each caller gets their own team's tickets.

**The rule:** middleware answers *who is calling*. Only the tool can answer *what they get*. Every query, every time.

**How to verify:** two accounts, one query, check for leakage. This is a five-minute test and it is the difference between a working server and an incident.

## Step 4 — Deploy it

Bind properly, put TLS in front, and add a health check:

```python
mcp.run(transport="streamable-http", host="0.0.0.0", port=8765)   # behind a proxy
```

**What works:** the team reaches `https://tickets.internal.example.com/mcp`.

**What just broke:** you scaled to two replicas for availability, and roughly half of all sessions now fail on their second request with an unknown-session error. Session state lives in one replica's memory.

**Two fixes, pick one:**

```python
# Stateless — any replica serves any request. Simpler; prefer it.
mcp = FastMCP("tickets", stateless_http=True)

# Or keep sessions, in shared storage
SESSIONS = redis.Redis(...)
```

Stateless is the right default. Sessions are worth their cost only when per-session setup is genuinely expensive.

## Step 5 — Operate it

Three things the laptop version never needed.

**Rate limits per caller.** One colleague wiring the server into an automation can generate more load than the other four combined.

```python
if not limiter.allow(principal.user_id, cost=1):
    raise ValueError("rate limit exceeded; try again shortly")
```

**Least-privilege downstream credentials.** The server holds one database credential for everyone. Make it read-only. If a tool is ever tricked into running something unexpected, the ceiling is a read.

**Timeouts and result caps.** A query that took 8 seconds locally will meet a proxy idle timeout under load, and a result that was 2,000 characters on your test data may be 200,000 on the real corpus.

```python
rows = _search(query, limit)[:100]
out = {"rows": rows, "returned": len(rows)}
if len(rows) == 100:
    out["note"] = "truncated to 100; narrow the query"
```

## The cost, honestly

| Step | Lines changed | What it bought | What it introduced |
|---|---|---|---|
| 1. Transport | 1 | Network reachability | Loss of the OS trust boundary |
| 2. Auth | ~20 | Known callers | A false sense that it is now safe |
| 3. Scoping | 1 per tool | Correct isolation | — |
| 4. Deploy | Config | Availability | Session affinity failures |
| 5. Operate | ~30 | Survives real use | An on-call surface |

**One line to change transport. Roughly fifty more to be responsible about it, and an operational commitment that does not end.**

That asymmetry is the argument for staying local when local is enough. Five colleagues who each run the stdio version have no auth, no deployment, no session problem and no on-call — at the cost of five installs.

## When the promotion is right

- The data is central and cannot live on laptops.
- Users cannot reasonably install a runtime.
- You need one audit trail across all use.
- Upgrades must be instant for everyone.

If none of those is true, the laptop version was the correct architecture.

---

Next: [deployment options compared](/learn/mcp/mcp-deployment-compared), and [common mistakes](/learn/mcp/mcp-deployment-common-mistakes).
