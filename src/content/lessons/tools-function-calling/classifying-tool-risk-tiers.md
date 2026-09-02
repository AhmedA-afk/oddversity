---
title: "Classifying Tools by Risk Tier"
track: "tools-function-calling"
status: live
summary: "Sort every tool into read, write, or irreversible, and let the dispatcher enforce gating from that tag instead of ad hoc checks."
duration: "6 min read"
---

If gating is decided call by call, in code scattered across handlers, it'll be inconsistent — someone adds a new destructive tool and forgets the gate. Risk tiers make gating a property of the registry, checked once, in one place, instead of a habit every tool author has to remember.

## What it is

A risk tier is a label on each tool entry that says how much scrutiny a call to it needs before it runs. Three tiers cover almost everything:

- **read** — no side effects. Querying data, searching, reading a file. Safe to auto-run; log it, don't gate it.
- **write** — has a side effect, but a reversible or low-blast-radius one. Updating a record, sending a Slack message to a private channel, creating a draft. Log it, and gate it only if the specific call crosses a threshold (a large dollar amount, a bulk update) rather than every write uniformly.
- **irreversible / high-blast-radius** — can't be cleanly undone, or reaches far beyond the current conversation. Deleting data, sending money, posting publicly, merging code. Always gate, no exceptions baked into the code path.

This tiers *tools*, not actions in the abstract — you tag `delete_records` once in the registry, and every call to it inherits the tier, rather than someone deciding per call whether "this particular delete feels risky."

## The mental model

The dispatcher should be able to answer "does this call need a human?" by reading one field off the registry entry — never by re-deriving the answer from the tool's name or purpose at dispatch time. That's what makes gating a *policy*, enforced structurally, instead of an ad hoc judgment call that depends on whoever wrote the handler remembering to add a check. [Implementing an Approval Gate](/learn/tools-function-calling/implementing-an-approval-gate) showed exactly this: the gate fires on `entry.tier == "irreversible"`, not on a hardcoded tool name.

## Why it works this way

The alternative — deciding gate-worthiness inline, per handler — fails the way most un-centralized security checks fail: it works for every tool someone thought carefully about, and silently doesn't exist for the next one added under deadline pressure. Centralizing the tier in the registry means adding a new tool forces an explicit choice ("what tier is this?") rather than an implicit default of "no gate, because nobody added one." A registry that requires `tier` as a non-optional field at registration time makes "I forgot to tier this tool" a startup error instead of a production incident.

## A concrete example (shown)

Tagging tools and wiring the dispatcher to branch on the tag:

```python
@register("search_orders", SearchOrdersArgs, tier="read")
def search_orders(ctx, args): ...

@register("update_shipping_address", UpdateAddressArgs, tier="write")
def update_shipping_address(ctx, args): ...

@register("issue_refund", RefundArgs, tier="write")
def issue_refund(ctx, args): ...

@register("delete_customer_account", DeleteAccountArgs, tier="irreversible")
def delete_customer_account(ctx, args): ...
```

```python
def dispatch(tool_use_id, name, raw_input, ctx, conversation):
    entry = REGISTRY.get(name)
    if entry is None:
        return ToolResult(tool_use_id, ok=False, content=f"error: unknown tool '{name}'")

    args = entry.args_model.model_validate(raw_input)

    if entry.tier == "read":
        return ToolResult(tool_use_id, ok=True, content=entry.handler(ctx, args))

    if entry.tier == "write" and not needs_gate(entry, args):  # e.g. amount under a threshold
        return ToolResult(tool_use_id, ok=True, content=entry.handler(ctx, args))

    # "write" over threshold, or "irreversible" unconditionally
    return start_approval(entry, args, tool_use_id, conversation)
```

Notice `issue_refund` is `write`, not `irreversible` — a refund *can* be reversed operationally (re-charge, adjust the ledger), so it's gated conditionally, only past a size threshold in `needs_gate`, rather than every refund interrupting the loop. `delete_customer_account` has no such conditional — it's always gated, because "irreversible" isn't a spectrum.

## Where it shows up

Any system with more than a handful of tools eventually needs this, but it matters most once tools are added by more than one person or team — the registry-level tier is the only thing keeping a new contributor's `bulk_export_and_delete` tool from shipping ungated by accident. It's also the natural place to hang the risk-tier metadata that a [tool-selection](/learn/tools-function-calling/tool-selection-at-scale) system or an audit log might want to query later — "show me every irreversible-tier call this agent made this week."

## Watch out for

- **Tiering by tool category instead of by actual effect.** A generic `run_sql` tool isn't uniformly "write" — `SELECT` and `DROP TABLE` through the same tool have wildly different blast radii. Where one tool can express multiple effect levels, inspect the call (not just the tool name) to pick the tier, as noted in [Approval Gates for Sensitive Tool Calls](/learn/tools-function-calling/approval-gates-for-sensitive-tools).
- **Letting "write" become a dumping ground.** If everything that isn't a pure read gets lumped into "write" with no threshold logic, you either gate too much (interruption fatigue) or too little (a write with real consequences slips through ungated). Define the threshold explicitly per tool, not as an afterthought.
- **Treating the tier as a suggestion the model can see and reason about, rather than an enforcement mechanism.** The model doesn't need to know a tool's tier to use it correctly — the tier governs what your dispatcher does after the call is proposed, not what the model is told to do.

## Where next

[Human-in-the-Loop Approval Gates](/learn/tools-function-calling/approval-gates-design) and [Implementing an Approval Gate](/learn/tools-function-calling/implementing-an-approval-gate) cover the gate mechanism this tiering feeds into. [The Confused-Deputy Problem](/learn/tools-function-calling/the-authority-problem) is worth revisiting once tiers are in place — a tool correctly tiered as "write" still needs its own authorization check; tiering controls *whether a human looks*, not *whether the call is allowed*.

**Related:** [Human-in-the-Loop Approval Gates](/learn/tools-function-calling/approval-gates-design), [Implementing an Approval Gate](/learn/tools-function-calling/implementing-an-approval-gate), [Building a Registry and Dispatcher](/learn/tools-function-calling/building-a-tool-dispatcher), [Approval Gates for Sensitive Tool Calls](/learn/tools-function-calling/approval-gates-for-sensitive-tools), [The Confused-Deputy Problem](/learn/tools-function-calling/the-authority-problem)
