---
title: "Learn the primitives and lifecycle of MCP-style tool connections"
track: "mcp"
status: live
summary: "The Model Context Protocol (MCP) gives AI applications a common way to connect clients and servers that expose capabilities such as tools, resources."
duration: "3 min read"
---

## The short answer

The Model Context Protocol (MCP) gives AI applications a common way to connect clients and servers that expose capabilities such as tools, resources, and prompts. The protocol standardizes interaction; it does not decide whether a tool is safe or whether a client should grant access. Lifecycle, capability negotiation, transport, and authorization remain important boundaries.

## The primitives

Think in four questions: who is the client, who is the server, what capability is
being offered, and which user or service authorizes its use? A resource can supply
context; a tool can request an action; a prompt can package reusable guidance.

## Four examples

### Example A: read-only resource

A server exposes project documentation as resources. The client can retrieve a
permitted page without granting write access.

### Example B: narrowly scoped tool

A server offers `list_open_issues` with a repository identifier. The client still
checks user access and should not assume the name makes the call safe.

### Boundary case: capability mismatch

The client expects a tool that the server does not advertise. Handle negotiation
explicitly and degrade to a known fallback.

### Counterexample: protocol equals trust

A correctly formatted message can still request an unsafe action. Protocol
interoperability is not authorization or validation.

## An illustrative story

A developer connected a useful server and assumed the host would show every
permission clearly. A later update added a write-capable tool. The lesson was to
review capabilities at connection time and keep a host-level policy.

## Two ways to see it

### Integration view

Shared primitives reduce bespoke adapters across hosts and servers.

### Security view

Each advertised capability is an authority proposal requiring identity, scope,
consent, and monitoring.

## Hands-on

Create a local mock client and server that negotiate two capabilities: a read-only
resource and a write-capable tool. Log initialization, capability discovery,
authorization, invocation, and shutdown. Test a missing capability and denied use.

## Checkpoint

- [ ] Client, server, capability, and authorization are distinct.
- [ ] Lifecycle events are observable.
- [ ] Missing or denied capabilities have a safe fallback.

## What this does not solve

Using a standard protocol does not make a server trustworthy, a resource correct,
or a tool appropriate for every user.

## Continue, go deeper, apply it

- Continue: Server design and permissions
- Go deeper: Tool calling and authority
- Apply it: write a capability inventory and approval rule for a mock server.
