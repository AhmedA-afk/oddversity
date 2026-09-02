---
title: "Never Trust the Model's Arguments"
track: "tools-function-calling"
status: live
summary: "Model-supplied arguments are untrusted input — validate type, range, and allowed values, then check authorization separately."
duration: "6 min read"
---

A JSON schema tells the model what shape you'd like its arguments in. It does not enforce anything — the model can still emit a syntactically valid call with semantically wrong values, and nothing on the model's side stops it. Validation is where "well-formed" becomes "safe to act on."

## What it is

Argument validation is the check your dispatcher runs between receiving `tool_call.input` and calling the real handler. It has two layers that are easy to conflate but need to stay separate:

- **Shape validation** — is `amount` a number, is `invoice_id` a string matching the expected format, is a required field present at all. This is what a JSON Schema or a Pydantic model catches automatically.
- **Business and authorization validation** — is this a *reasonable* amount, does this invoice belong to the user who's actually asking, is this action allowed for this caller right now. Nothing generates this for you; you write it by hand, every time, for every tool.

Treat every field in `tool_call.input` the way you'd treat a field in an HTTP request body from an anonymous client — because functionally, that's what it is. The model is not malicious by default, but it is also not a trusted internal caller: it can hallucinate, be manipulated by [injected content](/learn/tools-function-calling/tool-results-as-injection-vector) it read earlier in the conversation, or simply be wrong in a way that happens to look plausible.

## The mental model

Two questions, asked separately, for every tool call:

1. **Is this input well-formed?** (shape validation — types, ranges, enums, patterns)
2. **Is the requester allowed to do this, to this specific resource, right now?** (authorization — checked against your system's source of truth, not the model's claims)

A call can pass #1 and still be catastrophic if you skip #2. `{"user_id": "usr_882", "action": "delete"}` is perfectly well-typed. Whether *this* caller is allowed to delete *that* user's data is a question the schema has no opinion on.

## Why it works this way

The model composes arguments from context — prior turns, retrieved documents, tool results from earlier in the same loop. Any of those sources can be wrong or adversarial, and the model has no reliable way to tell the difference between "the user told me this account's id is 4471" and "a webpage I fetched told me this account's id is 4471." Validation is the point in the system where you stop trusting provenance and start checking facts against your own database.

This is the same discipline you'd apply to any external API response — see [Parsing and Validating API Responses](/learn/python-data-apis/parsing-and-validating-api-responses) — except here the "external" source is a model that's often *more* persuasive-sounding than a flaky API, which makes it easier to under-scrutinize.

## A concrete example (shown)

A support tool lets an agent fetch account details:

```python
class GetAccountArgs(BaseModel):
    account_id: str
```

```python
@register("get_account", GetAccountArgs, tier="read")
def get_account(ctx, args: GetAccountArgs):
    # BAD: no ownership check — args.account_id is fully model-controlled.
    return db.accounts.get(args.account_id)
```

This passes shape validation every time — `account_id` is a string — and it's a live cross-tenant read. Any conversation where the model can be nudged (by the user, by injected tool output, by its own confusion about which account is "the current one") into passing a different `account_id` than the one the logged-in user owns will happily return someone else's data. Nothing here required a bug in the model; it required the absence of a check in the handler.

The fix adds exactly the layer-2 check:

```python
@register("get_account", GetAccountArgs, tier="read")
def get_account(ctx, args: GetAccountArgs):
    account = db.accounts.get(args.account_id)
    if account is None or account.owner_id != ctx.user_id:
        raise LookupError("account not found")  # not "not authorized" — don't confirm existence
    return account
```

Note the error message deliberately doesn't distinguish "doesn't exist" from "exists but isn't yours" — leaking that distinction lets a model (or an attacker driving it) enumerate valid ids.

## Where it shows up

Every tool that takes an id, a path, a filter, or a free-text field as an argument needs this. It's most visible in multi-tenant systems (accounts, orgs, documents scoped to a user) but applies just as much to file paths (`../../etc/passwd` via a `filename` argument), SQL fragments passed as `where` clauses, and URLs passed to a `fetch` tool that could be redirected to an internal service. [Building a Registry and Dispatcher](/learn/tools-function-calling/building-a-tool-dispatcher) shows both layers wired into one dispatcher end to end.

## Watch out for

- **Validating shape and calling it done.** A Pydantic model that accepts any string for `account_id` has validated nothing about *whose* account it is. Shape validation and authorization are both mandatory, not substitutes for each other.
- **Reading authorization fields out of the model's own arguments.** If `tool_call.input` contains a `user_id` or `role` field and your handler trusts it, you've let the model set its own permissions — this is exactly the [confused-deputy](/learn/tools-function-calling/the-authority-problem) failure. Authorization context comes from the authenticated session, never from `input`.
- **Confirming existence in error messages.** "Account not found" and "not authorized" should read identically to the model when the real answer is "exists, but not yours" — otherwise you've built an oracle for enumerating other users' ids.

## Where next

[Building a Registry and Dispatcher](/learn/tools-function-calling/building-a-tool-dispatcher) shows a full runnable dispatcher with both validation layers. [The Confused-Deputy Problem](/learn/tools-function-calling/the-authority-problem) goes deeper on why authorization has to come from outside the model's own text.

**Related:** [Building a Registry and Dispatcher](/learn/tools-function-calling/building-a-tool-dispatcher), [The Confused-Deputy Problem](/learn/tools-function-calling/the-authority-problem), [Parsing and Validating API Responses](/learn/python-data-apis/parsing-and-validating-api-responses), [Executing Tool Calls Safely](/learn/tools-function-calling/executing-tool-calls-safely), [Tool Results Are an Injection Vector](/learn/tools-function-calling/tool-results-as-injection-vector)
