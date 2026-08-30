---
title: "MCP Transports Compared"
track: "mcp"
status: live
summary: "stdio, HTTP+SSE and streamable HTTP side by side — what each costs in deployment, auth and state, and the rule that decides between them."
duration: "9 min read"
---

A transport is how bytes move between client and server. MCP defines two, and one of them has a legacy form still in the wild, so in practice you are choosing between three shapes.

The choice follows from one question: **where does the server run, and for whom?**

## stdio

The client launches your server as a subprocess and speaks JSON-RPC over its stdin and stdout.

**How it works.** One process per client session. The client owns the lifecycle — it starts the process, and when the client exits, the process should too. There is no network, no port, no listener.

**When to use it.** Local servers. Anything touching the user's filesystem, local database, local credentials or local applications. This is the default and it should be, because it is the only transport where "who is allowed to connect" is answered by the operating system.

**What it costs you.** No remote access, no sharing between users, one process per session. Your logging discipline becomes load-bearing: stdout is the wire, so anything written there corrupts the connection.

**Where it bites.** Absolute paths in the client config, because the launching environment is not your shell. Cleanup on abnormal termination, because the client can vanish without a graceful shutdown.

## Streamable HTTP

The current remote transport. The server is an HTTP endpoint; the client POSTs JSON-RPC messages to it, and the server may respond with a single JSON body or upgrade the response to a Server-Sent Events stream when it needs to push multiple messages.

**How it works.** One endpoint handles both directions. A session identifier issued by the server on initialisation ties subsequent requests together. Because responses can be a plain body *or* a stream, the server chooses per request rather than committing up front.

**When to use it.** Servers reachable over a network: a shared team server, a hosted integration, anything multi-user or anything you want to deploy once rather than install everywhere.

**What it costs you.** Everything a public endpoint costs: authentication, authorisation, transport security, rate limiting, and a deployment. You also inherit the origin-validation problem — a browser page on another origin can attempt requests against a server bound to localhost.

**Where it bites.** Session handling. Whether your server is stateful or stateless changes how you scale it, and getting that wrong surfaces as intermittent failures behind a load balancer rather than as an obvious bug.

## HTTP + SSE (legacy)

The earlier remote transport: two endpoints, one for the client's POSTs and a separate long-lived SSE stream for server-to-client messages.

**How it works.** The client opens the SSE stream, receives an endpoint URL to POST to, and the two channels operate in parallel.

**When to use it.** Only for compatibility with clients that have not moved to streamable HTTP. It is superseded, not forbidden, and some deployed clients still expect it.

**What it costs you.** Two endpoints to secure and keep alive, a long-lived connection that proxies and load balancers frequently terminate, and no clean story for resuming after a drop.

## Side by side

| | stdio | Streamable HTTP | HTTP + SSE (legacy) |
|---|---|---|---|
| **Server location** | Same machine as the client | Anywhere reachable | Anywhere reachable |
| **Who can connect** | Whoever can run the process | Whoever your auth allows | Whoever your auth allows |
| **Endpoints** | None | One | Two |
| **Auth** | The operating system | Yours to build | Yours to build |
| **Multi-user** | No — one process per session | Yes | Yes |
| **Deployment** | Installed or launched locally | Deployed and operated | Deployed and operated |
| **Main hazard** | stdout writes; relative paths | Session and origin handling | Dropped long-lived streams |
| **Choose when** | The server touches local resources | The server is shared or hosted | A client requires it |

## The decision rule

**Does the server need access to something only present on the user's machine?** If yes, stdio. Nothing else can reach a local filesystem or a locally authenticated application, and the security model comes free.

**Is the server shared between people, or hosted by you?** If yes, streamable HTTP — and accept that you have taken on an authenticated service, not just a protocol adapter.

**Is a client demanding the legacy shape?** Support HTTP+SSE alongside streamable HTTP, and plan to drop it.

The mistake worth avoiding is reaching for HTTP because it feels more "real". A local integration served over HTTP gains an attack surface, an auth requirement and a deployment, in exchange for nothing the user asked for.

## One thing that is not a transport decision

Whether your server holds state. It is tempting to treat stdio as stateful and HTTP as stateless, but a stdio server can be written to hold nothing between calls, and an HTTP server can maintain sessions. Decide state deliberately — [stateful versus stateless servers](/learn/mcp/stateful-vs-stateless-servers) covers the trade — because it is what determines whether you can run two instances behind a load balancer.

---

Next: [transports, worked](/learn/mcp/mcp-transports-worked-example) runs the same server over both, and [the cheatsheet](/learn/mcp/mcp-transports-cheatsheet) has the configuration for each.
