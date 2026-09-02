---
title: "Implementing an Approval Gate"
track: "tools-function-calling"
status: live
summary: "Build the pause-and-resume state machine that interrupts a delete_records call and only executes after a human approves."
duration: "8 min read"
---

[Human-in-the-Loop Approval Gates](/learn/tools-function-calling/approval-gates-design) described what a good gate surfaces. This lesson builds the mechanism — the part that's genuinely tricky, because the agent loop has to pause *mid-turn*, potentially for minutes, and resume correctly whether the human approves, denies, or edits the call.

## What we're building

A gate that intercepts a `delete_records` call, renders a preview, and stores the loop in a `pending_approval` state instead of executing. A separate resume path — triggered later by a human's decision, often from a completely different request — either runs the original handler or injects a denial the model has to react to, then continues the loop from exactly where it paused.

## Setup

Extends the dispatcher from [Building a Registry and Dispatcher](/learn/tools-function-calling/building-a-tool-dispatcher). No new dependencies beyond something to persist pending state — a database row or, for this walkthrough, an in-memory dict — since a real approval might not resolve within the same process lifetime.

## Build it

### 1. Model the loop's states explicitly

```python
from enum import Enum
from dataclasses import dataclass, field

class LoopState(Enum):
    RUNNING = "running"
    PENDING_APPROVAL = "pending_approval"
    DONE = "done"

@dataclass
class PendingApproval:
    approval_id: str
    tool_use_id: str
    tool_name: str
    args: dict
    preview: str
    conversation_snapshot: list  # messages up to and including the tool_use

PENDING: dict[str, PendingApproval] = {}
```

> **Why this step?** Naming the states explicitly — rather than letting "waiting for approval" be an implicit condition buried in a boolean flag — is what makes resuming correct later. `conversation_snapshot` captures exactly the message history the model had when it made the call, so resuming doesn't depend on the process's in-memory conversation object still being alive; a UI round trip might outlive the request that started it.

### 2. Add a `gate` field to the registry entry

```python
@dataclass
class ToolEntry:
    name: str
    args_model: type
    handler: callable
    tier: str = "read"
    preview: callable | None = None   # (ctx, args) -> str, human-readable effect
```

```python
def preview_delete(ctx, args: "DeleteRecordsArgs") -> str:
    rows = db.fetch_preview(args.table, args.record_ids, owner_id=ctx.user_id)
    lines = [f"  - {r.id}  {r.summary!r:40}  status: {r.status}" for r in rows]
    return f"{len(rows)} records in '{args.table}' will be permanently deleted:\n" + "\n".join(lines)

@register("delete_records", DeleteRecordsArgs, tier="irreversible")
def delete_records(ctx, args: DeleteRecordsArgs):
    owned = db.filter_owned(args.table, args.record_ids, owner_id=ctx.user_id)
    if len(owned) != len(args.record_ids):
        raise PermissionError("some records are not yours to delete")
    return db.execute_delete(args.table, owned)

REGISTRY["delete_records"].preview = preview_delete
```

> **Why this step?** `preview` is a *read-only* rendering of the effect, run and shown to the human before the destructive `handler` ever runs — the same authorization check (`filter_owned`) protects both, so the preview can't show a human one set of records and delete a different set.

### 3. Intercept `tier == "irreversible"` calls in the dispatcher

```python
def dispatch(tool_use_id, name, raw_input, ctx, conversation):
    entry = REGISTRY.get(name)
    if entry is None:
        return ToolResult(tool_use_id, ok=False, content=f"error: unknown tool '{name}'")

    args = entry.args_model.model_validate(raw_input)  # ValidationError handled as before

    if entry.tier == "irreversible":
        approval_id = new_id()
        PENDING[approval_id] = PendingApproval(
            approval_id=approval_id,
            tool_use_id=tool_use_id,
            tool_name=name,
            args=args.model_dump(),
            preview=entry.preview(ctx, args) if entry.preview else str(args),
            conversation_snapshot=conversation,
        )
        return LoopState.PENDING_APPROVAL, approval_id  # no ToolResult yet — nothing ran

    output = entry.handler(ctx, args)
    return LoopState.DONE, ToolResult(tool_use_id, ok=True, content=output)
```

> **Why this step?** Validation and authorization-adjacent shape checks still run before the gate — a malformed `delete_records` call gets rejected the normal way and never reaches a human at all. The gate only fires once a call is *already* known to be well-formed; humans should review borderline judgment calls, not fix the model's typos.

### 4. The resume path

This runs later, triggered by the human's decision — a separate request entirely, possibly in a different process:

```python
def resume(approval_id: str, decision: str, edited_args: dict | None = None):
    pending = PENDING.pop(approval_id)
    entry = REGISTRY[pending.tool_name]

    if decision == "deny":
        result = ToolResult(pending.tool_use_id, ok=False,
                             content="denied by human reviewer: this action was not approved")
    elif decision == "approve":
        args = entry.args_model.model_validate(edited_args or pending.args)
        try:
            output = entry.handler(RESUMED_CTX, args)
            result = ToolResult(pending.tool_use_id, ok=True, content=output)
        except (LookupError, ValueError, PermissionError) as e:
            result = ToolResult(pending.tool_use_id, ok=False, content=f"error: {e}")
    else:
        raise ValueError(f"unknown decision: {decision}")

    messages = pending.conversation_snapshot + [tool_result_message(result)]
    return continue_agent_loop(messages)  # send back to the model, loop resumes
```

> **Why this step?** A denial isn't a system error — it's routed to the model as a normal `tool_result`, content marked as not-ok, so the model can react in-conversation ("I wasn't able to delete those tickets — want me to try a narrower set, or should I leave them?") instead of the loop just dying or the human's "no" vanishing silently. Editing (`edited_args`) re-validates through the same Pydantic model as the original call, so an edited approval can't skip validation either.

## Run it

```python
state, approval_id = dispatch("toolu_9", "delete_records",
    {"table": "support_tickets", "record_ids": ["tk_881", "tk_882", "tk_883"]},
    ctx, conversation)
# LoopState.PENDING_APPROVAL, "appr_4471"

# ... rendered in a UI, human narrows to two closed tickets and approves ...

messages = resume("appr_4471", decision="approve",
                   edited_args={"table": "support_tickets", "record_ids": ["tk_881", "tk_882"]})
# tk_883 (the open ticket) was never touched — the human's edit, not the model's original call, executed
```

## Harden it

- **Persist `PENDING` durably**, not just in a process-local dict as shown here — an approval that takes an hour needs to survive a deploy or a restart. A database row keyed on `approval_id` with a status column is the real implementation.
- **Expire pending approvals.** A `delete_records` call approved three days later, against data that's since changed, might not mean what it meant when the model asked. Set a TTL and re-validate the preview (re-run `entry.preview`) at resume time, not just at request time — reject if the underlying data has moved.
- **Re-check authorization at resume, not just at dispatch.** The user who was authorized when the call was made might have had access revoked in the interim; don't trust `conversation_snapshot`'s implicit context as still valid.
- **Log the full decision**: who approved, when, and whether the args were edited — this is your audit trail for exactly the kind of action you decided needed one.

## Extend it

Route the tier check through the policy from [Classifying Tools by Risk Tier](/learn/tools-function-calling/classifying-tool-risk-tiers) so gating is driven by the registry's `tier` field uniformly, rather than a special-cased `if name == "delete_records"` scattered through the dispatcher. And treat this pending-state pattern as the general shape for any long-running interruption, not just approvals — the same snapshot-and-resume structure applies to a gate waiting on a rate limit, a payment confirmation, or any external event the loop has to pause for.

**Related:** [Human-in-the-Loop Approval Gates](/learn/tools-function-calling/approval-gates-design), [Classifying Tools by Risk Tier](/learn/tools-function-calling/classifying-tool-risk-tiers), [Building a Registry and Dispatcher](/learn/tools-function-calling/building-a-tool-dispatcher), [Approval Gates for Sensitive Tool Calls](/learn/tools-function-calling/approval-gates-for-sensitive-tools), [Returning Results the Model Can Use](/learn/tools-function-calling/returning-results-to-the-model)
