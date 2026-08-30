---
title: "MCP Transports: Check Yourself"
track: "mcp"
status: live
summary: "Five scenarios on transport choice, binding, sessions behind a load balancer, and the failure that only appears on slow calls."
duration: "7 min read"
---

## 1. The integration that should not be a service

You are building a server that reads the user's local Obsidian vault and exposes a search tool. A colleague suggests deploying it as an HTTP service so the team can share one instance.

- **A.** Good idea — one deployment is easier to maintain than an install per person.
- **B.** It cannot work: each vault is on a different machine, so a shared server has nothing to read.
- **C.** It works if you add authentication, and auth is the only thing standing in the way.
- **D.** It works but you should use the legacy SSE transport for local files.

<details><summary>Answer</summary>

**Correct: B.** The resource is local by definition. A hosted server has no path to any user's vault, and no transport changes that — this is a location problem, not a protocol one. **A** assumes the server can reach the data, which is the thing that fails. **C** auth would control access to a server that still cannot see any vault. **D** the legacy transport is remote too, and is superseded regardless.

</details>

## 2. The laptop server on the coffee-shop network

Your local HTTP server runs with `host="0.0.0.0"` and no authentication, because it is "just local".

- **A.** Fine — a server on a laptop is not routable from the internet.
- **B.** Every device on the same network can reach the tools, and without auth that is full access to whatever the server touches.
- **C.** Fine as long as the port is above 1024.
- **D.** Only a problem if the tools can write; read-only tools are safe.

<details><summary>Answer</summary>

**Correct: B.** `0.0.0.0` binds every interface, including the shared Wi-Fi. Combined with no auth, anyone on the network can call every tool. Bind to `127.0.0.1`. **A** confuses internet-routable with locally reachable; the threat is the network you joined. **C** port numbers are not an access control. **D** a read tool over someone's notes, credentials or database is a serious disclosure on its own.

</details>

## 3. The intermittent failure that testing never saw

Your HTTP server keeps session state in a module-level dictionary. It passes every test. In production behind two replicas, roughly half of all sessions fail on their second request with an unknown-session error.

- **A.** The session identifier is expiring too quickly.
- **B.** The client is not returning the `Mcp-Session-Id` header.
- **C.** Session state lives in one replica's memory, and the second request reaches the other replica.
- **D.** Streamable HTTP does not support sessions; you need the legacy transport.

<details><summary>Answer</summary>

**Correct: C.** Roughly half is the tell: two replicas, no shared state, no sticky routing. Initialisation lands on A, the next call lands on B, which has never seen that session. Move state to a shared store or make the server stateless. **A** an expiry problem would correlate with elapsed time, not with a coin flip. **B** if the client never sent the header, it would fail every time, not half the time. **D** streamable HTTP supports sessions; that is what the header is for.

</details>

## 4. The slow tool that is also the flaky one

One tool takes 60–120 seconds. Over stdio it was reliable. Deployed over HTTP behind a proxy it fails perhaps a fifth of the time, with a truncated response rather than an error.

- **A.** The server is running out of memory on long calls.
- **B.** An idle timeout in the proxy or load balancer is cutting a connection that has gone quiet.
- **C.** The model is cancelling the request.
- **D.** Streamable HTTP caps response duration by design.

<details><summary>Answer</summary>

**Correct: B.** Silence on a connection is what idle timeouts act on, and network infrastructure enforces limits that a local pipe never had. Stream progress so the connection is not idle, shorten the unit of work, and make retries safe. **A** memory pressure produces errors and restarts, not truncation correlated with duration. **C** possible in principle but would not correlate with the proxy hop. **D** the protocol imposes no such cap; the infrastructure does.

</details>

## 5. One line, or several dozen

You switch a working stdio server to streamable HTTP by changing one argument in `mcp.run()`. The tools are unchanged and everything works in your browser.

- **A.** You are done — the capability surface is transport-independent.
- **B.** You now need auth, per-caller scoping inside each tool, origin validation and a session strategy before this is safe.
- **C.** You need to rewrite the tool schemas for HTTP.
- **D.** You need to switch the tools to async.

<details><summary>Answer</summary>

**Correct: B.** The one-line change moves the server from an operating-system trust boundary to no trust boundary at all. Tools that previously ran as the user must now identify a caller and scope to them, and the endpoint needs auth and origin checks. **A** true of the *capability* surface, which is exactly why the responsibility shift is easy to miss. **C** schemas are transport-independent. **D** async may help concurrency; it has nothing to do with safety here.

</details>

---

Next: [transports compared](/learn/mcp/mcp-transports-compared) and [common mistakes](/learn/mcp/mcp-transports-common-mistakes).
