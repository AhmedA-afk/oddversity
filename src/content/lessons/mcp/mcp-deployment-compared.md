---
title: "MCP Deployment Options Compared"
track: "mcp"
status: live
summary: "Five ways to ship a server — local install, bundled with an app, self-hosted remote, gateway-fronted and registry-published — with what each costs to operate and who it is for."
duration: "9 min read"
---

"How do I deploy an MCP server" has five reasonable answers, and the right one follows from who needs to reach it and who is willing to operate it.

## 1. Local install, per user

The user installs the server on their machine and points their client at it over stdio.

**Reach:** one machine, one user.

**Operating cost:** none for you. Real for them — they install a runtime, dependencies and a config entry, and they upgrade manually.

**Security:** the operating system. No network surface at all.

**Use when:** the server touches local resources — files, a local database, a locally authenticated application. There is no alternative in this case, so the question does not really arise.

**Where it hurts:** distribution. Every user needs the runtime and the steps, and every update is a message you send and hope they act on.

## 2. Bundled with an application

The server ships inside a product the user already has, launched by that product.

**Reach:** every user of the app, automatically.

**Operating cost:** none at runtime; you carry it in your release process instead.

**Security:** the operating system, plus whatever the host app enforces.

**Use when:** you make the application, and MCP is how you expose it to assistants. This is the cleanest distribution story available and it removes the install problem entirely.

**Where it hurts:** your release cadence becomes the server's release cadence, and you inherit compatibility with whatever client versions your users run.

## 3. Self-hosted remote

You run the server over streamable HTTP and users point their clients at a URL.

**Reach:** anyone you authorise, from anywhere.

**Operating cost:** a real service. Authentication, authorisation, TLS, rate limiting, monitoring, on-call, upgrades.

**Security:** entirely yours. See [auth approaches compared](/learn/mcp/mcp-auth-compared) — and note that per-caller scoping inside each tool is the part people forget.

**Use when:** the data is central rather than local, the audience is a team or customers, and you want one deployment rather than an install per person.

**Where it hurts:** it is a service. Everything true of running a service is now true of your MCP server, including that a bug affects everyone at once.

## 4. Behind a gateway

Several servers sit behind one endpoint that handles auth, routing, rate limiting and audit centrally.

**Reach:** whatever the gateway admits.

**Operating cost:** the gateway plus the servers, but the cross-cutting work is done once instead of per server.

**Security:** consistent by construction — a new server inherits the policy rather than reimplementing it.

**Use when:** you are past two or three internal servers, or you need one audit trail across all tool use for compliance reasons.

**Where it hurts:** a single point of failure and a single point of blast radius. A gateway misconfiguration exposes everything behind it, and every server now depends on the gateway team.

**The real reason to want one:** tool-schema budget. A gateway can present a filtered subset of tools per client rather than every tool from every server, which is otherwise a growing tax on every request.

## 5. Published to a registry

The server is listed publicly so any user can discover and install it.

**Reach:** anyone.

**Operating cost:** for a stdio server, none at runtime — but you own the supply-chain expectations: provenance, versioning, a changelog, and responding when something breaks.

**Security:** now a two-sided problem. Your users are trusting your code with whatever their client can reach, and you should expect them to check who published it.

**Use when:** the server is generally useful and you intend to maintain it.

**Where it hurts:** you cannot un-publish a version people have installed, and a breaking schema change reaches users you have no way to contact.

## Side by side

| | Local install | Bundled | Self-hosted remote | Gateway | Registry |
|---|---|---|---|---|---|
| **Who can reach it** | One user | Every app user | Whoever you authorise | Whoever the gateway admits | Anyone |
| **You operate** | Nothing | Your release process | A full service | Gateway + servers | Nothing at runtime |
| **They install** | Runtime + config | Nothing | A URL | A URL | Runtime + config |
| **Auth** | The OS | The OS | Yours to build | Central | The OS |
| **Local resources** | Yes | Yes | No | No | Yes |
| **Upgrade path** | Manual, per user | Your releases | Instant, for everyone | Instant | Manual, per user |
| **Main hazard** | Distribution | Release coupling | It is a service now | Single blast radius | Breaking installed users |

## Choosing

- **Touches the user's machine?** Local install, or bundled if you own an app they already run.
- **Central data, a team or customers?** Self-hosted remote.
- **More than about three internal servers?** Put a gateway in front, mostly for the schema budget and the audit trail.
- **Generally useful and you will maintain it?** Publish it — and version it as though people depend on it, because they will.

## The version that catches people out

Starting with self-hosted remote because it sounds more professional, for a server whose whole job is reading local files. It cannot work, and the effort spent on auth and deployment is spent before anyone notices.

---

Next: [deployment, worked](/learn/mcp/mcp-deployment-worked-example) takes one server from laptop to team, and [common mistakes](/learn/mcp/mcp-deployment-common-mistakes).
