---
title: "Running MCP Servers: Common Mistakes"
track: "mcp"
status: live
summary: "Six operational mistakes — hosting a server that needs local access, auth without scoping, unbounded schema growth across servers, and breaking installed users with a schema change."
duration: "8 min read"
---

## 1. Hosting a server that needs local access

**You probably think** a hosted server is the professional version of a local one.

**Why it breaks:** if the server's job is reading the user's files, notes or locally authenticated applications, a hosted instance has no path to any of it. No transport fixes a location problem. The effort goes into auth and deployment before anyone notices the capability is gone.

**The correct model:** ask what the server reads. If the answer lives on the user's machine, it ships to the user's machine. Bundling it inside an app they already run is the good distribution answer, not hosting.

**How to spot it live:** early — ask "where does the data live?" before "how do we deploy it?"

## 2. Authentication mistaken for authorisation

**You probably think** adding token verification makes a shared server safe.

**Why it breaks:** middleware establishes *who is calling*. It changes nothing about what the tools return. A query that fetched everything when the server ran as one person still fetches everything when it runs for fifty, and the code reads as correct throughout.

**The correct model:** scope inside every tool, using the authenticated principal, on every query.

```python
principal = current_request().state.principal
return _search(query, owner=principal.user_id)
```

**How to spot it live:** two accounts, one query. Five minutes, and it is the difference between a working server and a disclosure.

## 3. Stateful by accident

**You probably think** you have not made a decision about session state.

**Why it breaks:** you have — a dictionary at module scope is a decision. It works with one replica. The second replica turns roughly half of all sessions into unknown-session errors, intermittently, under load, and never in testing.

**The correct model:** choose. Stateless is the better default; sessions earn their cost only when per-session setup is genuinely expensive, and then they belong in shared storage.

**How to spot it live:** search for module-level mutable state. Anything keyed by session is the answer.

## 4. Unbounded schema growth

**You probably think** each server is small, so the total is fine.

**Why it breaks:** a client connected to six servers sends every tool from all six on every request. Six modest servers become a large standing cost per turn and a selection problem — more near-identical options means more wrong choices.

**The correct model:** few sharp tools per server, servers a user can enable independently, and a gateway that presents a filtered subset once you are past two or three.

**How to spot it live:** serialise your full tool list and compare its length to a typical request. Most people have never looked, and the number is usually surprising.

## 5. Breaking installed users

**You probably think** renaming a tool or tightening a schema is a small change.

**Why it breaks:** for a published server, users have installed a version and you cannot contact them. A renamed tool disappears from their assistant with no explanation. A newly required argument turns every existing call into an error.

**The correct model:** treat schemas as a public interface. Add optional fields freely; never remove or rename in place. Keep the old name as an alias for a deprecation period, and version the server so a client can pin.

**How to spot it live:** if you cannot name how a user on last month's version finds out, the change is breaking.

## 6. No least-privilege downstream

**You probably think** the server is trusted code, so a full-access credential is fine.

**Why it breaks:** the server acts on arguments chosen by a model that has been reading untrusted content. Given a broad credential, a tool tricked into an unexpected query has an unbounded ceiling. Given a read-only one, the worst case is a read.

**The correct model:** the narrowest credential that lets the tools work. Read-only database users for read tools. Separate credentials per capability where the downstream system allows it.

**How to spot it live:** look up what your server's credential is actually permitted to do. It is usually more than the tools need.

---

Next: [deployment options compared](/learn/mcp/mcp-deployment-compared), [the operations cheatsheet](/learn/mcp/mcp-deployment-cheatsheet), and [check yourself](/learn/mcp/mcp-deployment-quiz).
