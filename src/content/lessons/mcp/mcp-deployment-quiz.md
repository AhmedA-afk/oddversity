---
title: "Running MCP Servers: Check Yourself"
track: "mcp"
status: live
summary: "Six operational scenarios on deployment shape, the auth-versus-scoping gap, session state at scale, schema budget and breaking a published server."
duration: "8 min read"
---

## 1. The wrong promotion

A server reads the user's local git repositories and exposes commit search. Someone proposes hosting it so the whole team can share one instance.

- **A.** Sensible — one deployment beats twenty installs.
- **B.** It cannot work: the repositories are on individual machines and a hosted server can reach none of them.
- **C.** It works with per-user OAuth to the git provider.
- **D.** It works if each user uploads their repositories first.

<details><summary>Answer</summary>

**Correct: B.** This is a location problem, not a deployment one, and no transport solves it. **A** assumes the server can see the data. **C** would be a different server against a hosted git API — a legitimate product, but not this one, and it loses local branches and uncommitted work. **D** turns a local tool into a sync product nobody asked for.

</details>

## 2. Authenticated and still wrong

You add bearer verification to a shared server. Every request is authenticated. A colleague reports seeing another team's tickets.

- **A.** The token audience is not being checked.
- **B.** Middleware establishes who is calling; the tools still query everything. They need per-principal scoping.
- **C.** Session identifiers are colliding.
- **D.** The database connection is shared across requests.

<details><summary>Answer</summary>

**Correct: B.** The step that gets skipped when a local server goes multi-user. Authentication answers *who*; only the tool can answer *what they get*, by scoping every query. **A** an audience gap admits wrong callers rather than showing an admitted caller the wrong rows. **C** would be a session bug on top of tools that are unscoped anyway. **D** connection sharing is a performance concern, not an authorisation one.

</details>

## 3. Half the sessions fail

Deployed behind two replicas, roughly half of all sessions fail on their second request. One replica works perfectly.

- **A.** The load balancer is misconfigured for HTTP.
- **B.** Session state is in one replica's memory and the second request lands on the other.
- **C.** The health check is killing replicas mid-session.
- **D.** Tokens are being verified against a stale key cache.

<details><summary>Answer</summary>

**Correct: B.** Roughly half, with two replicas, is the signature. Make the server stateless — the better default — or move sessions to shared storage. **A** would break more than the second request of half the sessions. **C** would produce dropped connections at intervals, not a clean coin flip on the second call. **D** would fail at authentication, on the first request as often as the second.

</details>

## 4. Six servers, one slow assistant

A client is connected to six servers, each exposing eight to twelve tools. Users report the assistant has become slower, more expensive and worse at choosing tools.

- **A.** Too many connections; the client cannot keep up.
- **B.** Every tool's name, description and schema is sent on every request — a large standing cost and a harder selection problem.
- **C.** The servers are competing for the same port.
- **D.** The model needs a larger context window.

<details><summary>Answer</summary>

**Correct: B.** Around sixty tool definitions ride along on every single turn. That is cost, latency and crowding, plus more near-identical options to choose badly between. Fewer sharper tools, servers a user can toggle, or a gateway presenting a filtered subset. **A** connection count is not the bottleneck. **C** stdio servers use no ports. **D** a bigger window pays the same tax more expensively.

</details>

## 5. The silent breakage

Your published server renames `search_docs` to `search_documentation` for clarity. Users on the installed version report the assistant "forgot how to search".

- **A.** They need to restart their client.
- **B.** A rename removes the old tool for everyone who has not upgraded; keep the old name as an alias and deprecate it.
- **C.** Publish a changelog entry.
- **D.** Tool names are internal and cannot cause this.

<details><summary>Answer</summary>

**Correct: B.** For a published server the schema is a public interface and you cannot contact installed users. Add, alias and deprecate — never rename in place. **A** a restart gives them the same old version. **C** worth doing and it does not reach anyone who has already installed. **D** the name is exactly what the model selects on, so removing it removes the capability.

</details>

## 6. The credential ceiling

Your hosted server holds one database credential with full read and write access, because the tools currently only read.

- **A.** Fine — the tools only read, so nothing can write.
- **B.** Wrong: tools act on model-chosen arguments derived from untrusted content, and a broad credential sets the ceiling for anything unexpected. Use a read-only user.
- **C.** Fine as long as the tools are code-reviewed.
- **D.** Only a concern if the server is publicly reachable.

<details><summary>Answer</summary>

**Correct: B.** Least privilege bounds the damage from bugs and from injected instructions alike. A read-only credential means the worst case for a tricked tool is a read. **A** relies on today's tool set staying today's forever, and on there being no injection path into a query. **C** review reduces the chance of a bug without changing the ceiling when one gets through. **D** internal reachability narrows who can attempt it; the model reading a malicious document is already inside.

</details>

---

Next: [deployment options compared](/learn/mcp/mcp-deployment-compared) and [the operations cheatsheet](/learn/mcp/mcp-deployment-cheatsheet).
