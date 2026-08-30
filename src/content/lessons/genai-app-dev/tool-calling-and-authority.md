---
title: "Treat tool calls as requests for authority"
track: "genai-app-dev"
status: live
summary: "A tool call is not an action; it is a model-generated request that the application may authorize, reject, or send for approval."
duration: "3 min read"
---

## The short answer

A tool call is not an action; it is a model-generated request that the application may authorize, reject, or send for approval. Define narrow schemas, validate arguments in code, separate read from write tools, and log the reason and actor for consequential actions.

## The authority boundary

```text
model proposes -> application validates -> policy authorizes -> tool executes -> result is inspected
```

Never let tool descriptions be the only permission system. Treat user text,
retrieved pages, and tool results as potentially untrusted content.

## Four examples

### Example A: read-only lookup

`get_order(order_id)` can return status. Validate that the user may access that
order before the database call.

### Example B: draft versus send

Expose `draft_email` and `send_email` separately. The latter requires a confirmed
recipient, a review step, and an audit record.

### Boundary case: ambiguous amount

If the model says “refund 100” without currency or order ID, reject the request or
ask for clarification. Do not infer the most expensive interpretation.

### Counterexample: broad shell tool

“Run any command” turns a language model into an unbounded authority bridge. Use a
small allowlist or a purpose-built function with explicit inputs.

## An illustrative story

A shopping assistant was allowed to cancel an order after reading an attached
email. The email contained an instruction aimed at the assistant, not the shopper.
Separating untrusted content from authorization and requiring confirmation removed
the surprising path.

## Two ways to see it

### Agent-builder view

Tools make a model useful by connecting language to real state.

### Security view

Every tool expands the attack surface and must have a smaller authority than the
person or service that owns it.

## Hands-on

Define three tools for a mock support assistant: read ticket, draft response, send
response. Add schemas, permission checks, a confirmation token, and a fake audit
log. Test direct, indirect, and missing-argument requests.

## Checkpoint

- [ ] Read and write capabilities are separated.
- [ ] Authorization is enforced outside the model.
- [ ] Consequential actions have approval and an audit trail.

## What this does not solve

Least privilege reduces impact but does not prevent every unsafe or misleading
recommendation. You still need evaluation, monitoring, and incident response.

## Continue, go deeper, apply it

- Continue: Agents versus workflows
- Go deeper: Server design and permissions
- Apply it: write a tool policy that names the actor, resource, scope, and approval state.
