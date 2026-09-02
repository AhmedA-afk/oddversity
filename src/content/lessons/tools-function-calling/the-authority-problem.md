---
title: "The Confused-Deputy Problem"
track: "tools-function-calling"
status: live
summary: "An agent running with its own broad credentials can be steered into acting beyond the end user's actual rights."
duration: "7 min read"
---

Who is actually acting when a tool runs — the user who typed the request, or the service account your agent authenticates as? If your dispatcher can't answer that precisely, per call, you have a confused deputy: a program with more authority than the party it's acting for, that can be tricked into using that extra authority on someone else's behalf.

## What it is

"Confused deputy" is an old security term (predates LLMs by decades) for a program that has legitimate authority to do something, gets fooled into using that authority for the wrong purpose. The classic non-AI example: a compiler that writes to a billing log file using its own broad filesystem permissions, tricked by a malicious flag into overwriting a different file the *caller* had no right to touch. The compiler wasn't compromised — it just conflated "I have permission to write here" with "the caller who asked me to should be allowed to."

A tool-calling agent is a deputy in exactly this sense. It typically runs with one set of credentials — an API key, a service account, a database connection — that's more powerful than any single end user's rights, because it has to serve many users or many actions. The moment the model can be steered (by a user's request, by a prior tool result, by [injected content](/learn/tools-function-calling/tool-results-as-injection-vector)) into calling a tool with arguments that reach outside what *this particular caller* should be able to touch, you have the same bug the compiler had.

## The mental model

Keep two authority levels distinct at every point in your system:

- **The agent's authority**: what the service account / API key the dispatcher runs as is *capable* of doing. Often broad, because it serves every user of the system.
- **The end user's authority**: what *this specific person*, in *this specific request*, should be allowed to do. Always narrower, usually scoped to their own data.

A safe dispatcher checks the second on every call, using the second as the actual constraint — never assuming that "the agent can do it" means "this call should be allowed." The gap between the two is exactly the blast radius a confused-deputy exploit can reach.

## Why it works this way

Broad credentials exist for good operational reasons — provisioning a narrow, single-purpose credential per user per tool is often impractical, and connection pools, caching, and rate limits usually want to be shared. But that convenience means the code path between "model decided to call a tool" and "tool executed" is the *only* place enforcing who's really allowed to do what. If that path trusts the model's own claims about identity or scope — reading a `user_id` out of `tool_call.input`, say — an attacker doesn't need to steal credentials at all. They just need to get the model to fill in a different id than the one it should, through a crafted prompt, a manipulated document, or an over-eager "helpful" inference. The credential was never breached; the deputy was just confused about whose authority it was exercising.

## A concrete example

A support agent has one tool:

```python
class DeleteRecordsArgs(BaseModel):
    table: str
    record_ids: list[str]
```

```python
@register("delete_records", DeleteRecordsArgs, tier="irreversible")
def delete_records(ctx, args: DeleteRecordsArgs):
    # BAD: runs with the agent's own admin DB credentials,
    # no check that ctx.user_id actually owns these records.
    return db.execute(f"DELETE FROM {args.table} WHERE id IN %s", (args.record_ids,))
```

The dispatcher authenticates to the database as a service account with delete rights across every table — that's the agent's authority. Nothing here checks the *end user's* authority: whether `ctx.user_id` is even permitted to delete from `table`, let alone whether they own `record_ids`. A user asking the agent to "clean up my old test records" and a user who's been socially engineered (or whose earlier tool result was poisoned) into asking it to delete `record_ids` belonging to someone else hit the exact same code path, with the exact same result: the agent's admin credentials do the deleting either way.

The fix narrows the check to the end user's actual rights, not the agent's capability:

```python
@register("delete_records", DeleteRecordsArgs, tier="irreversible")
def delete_records(ctx, args: DeleteRecordsArgs):
    if args.table not in ctx.user_deletable_tables:
        raise PermissionError("not permitted on this table")
    owned = db.filter_owned(args.table, args.record_ids, owner_id=ctx.user_id)
    if len(owned) != len(args.record_ids):
        raise PermissionError("some records are not yours to delete")
    return db.execute_delete(args.table, owned)
```

The service account's capability didn't change — it's still an admin connection. What changed is that the *check* is now scoped to `ctx.user_id`'s actual rights, computed from your system's source of truth, not from anything in `args`. This is also exactly the kind of call [Classifying Tools by Risk Tier](/learn/tools-function-calling/classifying-tool-risk-tiers) marks `irreversible` and routes through an [approval gate](/learn/tools-function-calling/approval-gates-design) regardless — belt and suspenders, because authorization bugs happen even when you're careful.

## Where it shows up

- **Multi-tenant SaaS agents** — a support or ops agent whose database credential spans all tenants, where the per-call check is the only thing preventing cross-tenant access.
- **Agents with OAuth-connected tools** — a "read my calendar" tool that was actually granted broad scope (all calendars in a workspace, not just the user's), where the agent could technically read anyone's.
- **Agents that chain tool calls** — a result from one call (a file path, a record id) feeds into the next call's arguments; if that first result was attacker-influenced, the second call inherits authority it shouldn't have. See [chaining tools into workflows](/learn/tools-function-calling/chaining-tools-into-workflows) for how far that chain can run before anyone checks.

## Watch out for

- **Provisioning one shared, broad credential and calling scoping "the model's job."** The model has no enforcement power — it can only be asked nicely. Scoping has to happen in code that runs regardless of what the model intended.
- **Trusting identity fields inside tool arguments.** If `args.user_id` or `args.account_id` decides whose data gets touched, and the model produced `args`, you've handed the model the pen that signs the authorization. `ctx.user_id`, from the authenticated session, is the only trustworthy identity.
- **Scoping per tool but not per user.** A tool marked "safe" because it only touches one table can still be a confused deputy if it doesn't check *which rows* in that table this caller owns.

## Where next

[Never Trust the Model's Arguments](/learn/tools-function-calling/validating-tool-arguments) covers the validation half of this same boundary in more depth. [Classifying Tools by Risk Tier](/learn/tools-function-calling/classifying-tool-risk-tiers) shows how to make gating for exactly this kind of call a matter of policy rather than a check someone has to remember to write.

**Related:** [Never Trust the Model's Arguments](/learn/tools-function-calling/validating-tool-arguments), [Classifying Tools by Risk Tier](/learn/tools-function-calling/classifying-tool-risk-tiers), [Tool Calling and Authority](/learn/genai-app-dev/tool-calling-and-authority), [From tool_call to Function Call](/learn/tools-function-calling/execution-authority-model), [Tool Results Are an Injection Vector](/learn/tools-function-calling/tool-results-as-injection-vector)
