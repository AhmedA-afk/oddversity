---
title: "Design MCP servers with narrow capabilities"
track: "mcp"
status: live
summary: "An MCP server should expose the smallest useful capabilities, document inputs and side effects, enforce authorization independently of the model."
duration: "3 min read"
---

## The short answer

An MCP server should expose the smallest useful capabilities, document inputs and side effects, enforce authorization independently of the model, and return errors that help the client recover. A server description is an interface contract, not a permission grant.

## Server checklist

For every capability document identity, resources, read/write effects, input
schema, output meaning, rate limit, audit event, and failure behavior. Keep secrets
out of tool results and make destructive actions explicit.

## Four examples

### Example A: resource server

Expose a project file as a resource with path normalization, permission checks,
size limits, and source metadata.

### Example B: issue creation

Require repository scope, title/body validation, deduplication, and a confirmation
token. Return the created issue ID for audit and retry safety.

### Boundary case: path traversal

A request containing `../` should be rejected or resolved inside an allowed root.
Do not rely on the model to sanitize a path.

### Counterexample: one “admin” tool

A catch-all tool hides side effects and makes evaluation difficult. Split reads,
drafts, and writes so policy can be specific.

## An illustrative story

A server had excellent schemas but leaked an internal error containing a database
connection hint. The fix included output scrubbing, stable error classes, and a
test that treats tool output as untrusted.

## Two ways to see it

### Protocol view

Clear capabilities make clients interoperable and failures diagnosable.

### Threat-model view

Every capability is an attack surface with preconditions, impact, and containment.

## Hands-on

Build a local server with a read resource and a draft/write tool. Add path,
identity, input, output, rate, and audit checks. Run tests for valid access,
denied access, malformed input, traversal, and duplicate invocation.

## Checkpoint

- [ ] Side effects and permissions are visible in the interface.
- [ ] Validation and authorization happen outside model text.
- [ ] Errors are safe, typed, and testable.

## What this does not solve

Narrow tools reduce blast radius but cannot remove compromised credentials,
misconfigured hosts, or unsafe human approval processes.

## Continue, go deeper, apply it

- Continue: Regression gates and online signals
- Go deeper: Deployment, versioning, and incidents
- Apply it: publish a capability manifest and a negative-test suite.
