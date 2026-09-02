---
title: "Building a Registry and Dispatcher"
track: "tools-function-calling"
status: live
summary: "Build a typed tool registry and dispatcher that validates arguments with Pydantic and rejects malformed calls cleanly."
duration: "8 min read"
---

You've seen the shape of a dispatcher in [From tool_call to Function Call](/learn/tools-function-calling/execution-authority-model). Now build one you could actually drop into a project: a registry mapping tool names to typed handlers, and a dispatcher that validates before it executes.

## What we're building

A small `ToolRegistry` that tools register into, each with a Pydantic model describing its arguments; a `dispatch()` function that looks up the tool, validates the model's raw JSON against that Pydantic model, and only then calls the real handler. When validation fails, it returns a structured error the model can read and correct on its next turn — it never crashes, and it never runs the handler with garbage input.

## Setup

You'll need `pydantic` (v2). Everything else is standard library.

```bash
pip install pydantic
```

## Build it

### 1. Define the argument models

Every tool gets its own Pydantic model. This is where types, ranges, and allowed values live — the same discipline you'd want from [Never Trust the Model's Arguments](/learn/tools-function-calling/validating-tool-arguments).

```python
from pydantic import BaseModel, Field, field_validator

class GetInvoiceArgs(BaseModel):
    invoice_id: str = Field(..., pattern=r"^inv_[a-zA-Z0-9]{4,32}$")

class RefundArgs(BaseModel):
    invoice_id: str = Field(..., pattern=r"^inv_[a-zA-Z0-9]{4,32}$")
    amount_cents: int = Field(..., gt=0, le=1_000_000)  # cap: $10,000
    reason: str = Field(..., min_length=3, max_length=280)

    @field_validator("reason")
    @classmethod
    def no_control_chars(cls, v: str) -> str:
        if any(ord(c) < 32 for c in v):
            raise ValueError("reason must be plain text")
        return v
```

> **Why this step?** `gt=0, le=1_000_000` isn't boilerplate — it's a business rule made structural. The model can *ask* to refund $50,000, but the type it must fit through caps it at $10,000 before your handler code ever runs. That's a guardrail an attacker (or a confused model) can't argue past with clever phrasing.

### 2. Define the registry entry

Each tool bundles its name, its argument model, its handler function, and (used later in [Classifying Tools by Risk Tier](/learn/tools-function-calling/classifying-tool-risk-tiers)) a risk tier.

```python
from dataclasses import dataclass
from typing import Callable, Any

@dataclass
class ToolEntry:
    name: str
    args_model: type[BaseModel]
    handler: Callable[["RequestContext", BaseModel], Any]
    tier: str = "read"  # "read" | "write" | "irreversible"

REGISTRY: dict[str, ToolEntry] = {}

def register(name: str, args_model: type[BaseModel], tier: str = "read"):
    def decorator(fn):
        REGISTRY[name] = ToolEntry(name, args_model, fn, tier)
        return fn
    return decorator
```

> **Why this step?** A registry that's a plain dict keeps the dispatcher dumb — it never has a branch per tool name. Adding a tool means registering it, not editing a big `if/elif` chain in the dispatcher, which is exactly the kind of coupling that causes someone to forget the validation step for tool #47.

### 3. Wire up two tools

```python
@register("get_invoice", GetInvoiceArgs, tier="read")
def get_invoice(ctx, args: GetInvoiceArgs):
    invoice = db.invoices.get(args.invoice_id)
    if invoice is None or invoice.owner_id != ctx.user_id:
        raise LookupError("invoice not found")
    return {"id": invoice.id, "total_cents": invoice.total_cents, "status": invoice.status}

@register("issue_refund", RefundArgs, tier="write")
def issue_refund(ctx, args: RefundArgs):
    invoice = db.invoices.get(args.invoice_id)
    if invoice is None or invoice.owner_id != ctx.user_id:
        raise LookupError("invoice not found")
    if args.amount_cents > invoice.total_cents:
        raise ValueError("refund exceeds invoice total")
    return payments.refund(invoice.id, args.amount_cents, reason=args.reason)
```

> **Why this step?** `invoice.owner_id != ctx.user_id` is the authorization check — separate from and after the shape validation. `ctx.user_id` comes from the authenticated session, never from the model's arguments. This is the [confused-deputy](/learn/tools-function-calling/the-authority-problem) check: shape-valid is not the same as allowed.

### 4. The dispatcher itself

```python
from pydantic import ValidationError

@dataclass
class ToolResult:
    tool_use_id: str
    ok: bool
    content: Any

def dispatch(tool_use_id: str, name: str, raw_input: dict, ctx: "RequestContext") -> ToolResult:
    entry = REGISTRY.get(name)
    if entry is None:
        return ToolResult(tool_use_id, ok=False,
                           content=f"error: unknown tool '{name}'")

    try:
        args = entry.args_model.model_validate(raw_input)
    except ValidationError as e:
        # Compact, model-readable — not a Python traceback.
        problems = "; ".join(f"{err['loc']}: {err['msg']}" for err in e.errors())
        return ToolResult(tool_use_id, ok=False,
                           content=f"error: invalid arguments — {problems}")

    try:
        output = entry.handler(ctx, args)
    except (LookupError, ValueError) as e:
        return ToolResult(tool_use_id, ok=False, content=f"error: {e}")

    return ToolResult(tool_use_id, ok=True, content=output)
```

> **Why this step?** Three failure paths, three distinct messages: unknown tool, bad shape, bad business logic. Each becomes a `tool_result` the model can actually act on — retry with a fixed `amount_cents`, apologize to the user, whatever's appropriate — instead of the loop dying on an unhandled exception. This is the input side of what [Returning Results the Model Can Use](/learn/tools-function-calling/returning-results-to-the-model) covers for the output side.

## Run it

```python
ctx = RequestContext(user_id="user_42")

# A well-formed call
result = dispatch("toolu_1", "get_invoice", {"invoice_id": "inv_ab12"}, ctx)
# ToolResult(ok=True, content={...})

# A malformed call — the model hallucinated a string where an int belongs
result = dispatch("toolu_2", "issue_refund",
    {"invoice_id": "inv_ab12", "amount_cents": "a lot", "reason": "customer request"}, ctx)
# ToolResult(ok=False, content="error: invalid arguments — ('amount_cents',): Input should be a valid integer")

# A call that violates the business rule baked into the type
result = dispatch("toolu_3", "issue_refund",
    {"invoice_id": "inv_ab12", "amount_cents": 5_000_000, "reason": "customer request"}, ctx)
# ToolResult(ok=False, content="error: invalid arguments — ('amount_cents',): Input should be less than or equal to 1000000")
```

None of these three calls reached `payments.refund`. That's the whole point: the dispatcher's job is making bad input dead-end before it becomes a side effect.

## Harden it

- **Never leak internals in the error string.** `f"{e}"` on a `ValueError` you wrote is safe; a raw exception from a database driver might contain a connection string. Wrap third-party exceptions and re-raise your own before they reach `dispatch`.
- **Log the raw call before validation runs**, tool name and raw arguments, tied to a request id — so a rejected call still leaves an audit trail, not just the accepted ones.
- **Time-box the handler call.** A hung `handler()` blocks the whole agent loop; wrap execution with a timeout appropriate to the tool's tier, tighter for anything user-facing.
- **Treat "unknown tool" as a signal, not noise.** A model repeatedly calling a tool name that doesn't exist usually means your schema or system prompt drifted from the registry — worth alerting on, not just swallowing.

## Extend it

Add the authorization check as its own registry field (`entry.authorized(ctx, args)`) instead of inlining it in every handler, so it's enforced structurally rather than by convention — see [Classifying Tools by Risk Tier](/learn/tools-function-calling/classifying-tool-risk-tiers) for tagging `tier` this way and having the dispatcher branch on it to auto-approve reads and gate writes. For tools that shell out or run arbitrary code, wrap `entry.handler` in the isolation described in [Sandboxing Principles](/learn/tools-function-calling/sandboxing-execution-principles) rather than trusting Python-level validation alone.

**Related:** [From tool_call to Function Call](/learn/tools-function-calling/execution-authority-model), [Never Trust the Model's Arguments](/learn/tools-function-calling/validating-tool-arguments), [Classifying Tools by Risk Tier](/learn/tools-function-calling/classifying-tool-risk-tiers), [Parsing and Validating API Responses](/learn/python-data-apis/parsing-and-validating-api-responses), [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-tool-errors-and-retries)
