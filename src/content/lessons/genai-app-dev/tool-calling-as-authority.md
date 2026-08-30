---
title: "Tool Calls Are Requests for Authority"
track: "genai-app-dev"
status: live
summary: "A tool call is the model asking your code to do something on its behalf — and your code, not the model, decides whether that happens."
duration: "6 min read"
---

When a model "calls a tool," nothing actually executes. The model emits a structured request — a name and some arguments — and stops. Whether anything real happens next is entirely up to the code that reads that request. That gap between "asked for" and "done" is the whole subject of this lesson.

## What it is

Mechanically, a tool call is a turn in the conversation, not a side effect. You declare a set of tools (name, description, argument schema) when you call the model; if the model decides one is useful, its response contains a `tool_use` block instead of (or alongside) plain text — a proposed function name and arguments, nothing more. Your application code reads that block, decides what to do with it, and — if it decides to proceed — executes the actual function, then sends the result back as a `tool_result` for the model to continue from.

[Treat tool calls as requests for authority](/learn/genai-app-dev/tool-calling-and-authority) lays out the security framing of this in detail: the model proposes, your application validates and authorizes, and only then does the tool execute. This lesson sits one level up — treating that proposal-and-grant cycle as the mechanical spine the rest of the tool-calling lessons in this module build on, starting with the risk split that shapes everything downstream.

## The mental model

Split every tool you'd ever wire up into two categories before you write a line of execution code:

```text
READ tools                          WRITE / side-effecting tools
(get_weather, search_docs,          (send_email, update_order,
 get_order_status, list_files)       delete_record, charge_card)

low blast radius                    real-world consequence
safe to auto-execute                needs validation + policy + audit
```

A read tool, executed on bad arguments, returns wrong or empty data — annoying, recoverable, usually invisible to anyone but the user who asked. A write tool, executed on bad arguments, changes something in the world that a "sorry, my mistake" doesn't undo: an email sent to the wrong person, a refund issued twice, a record deleted that a human needed. The model has no way to know which category a tool falls into unless your code enforces the difference — the tool's *name* looking dangerous doesn't stop it from executing if nothing checks.

## Why it works this way

This design exists because the alternative — letting the model's tool call execute directly, with no application code in between — collapses two very different kinds of trust into one. You trust the model to *decide when a capability is relevant*; that's a language understanding problem it's actually good at. You do not extend it the same trust to *decide when an action should actually happen to real data*, because that decision depends on things the model has no reliable visibility into: your authorization rules, your current system state, whether the "order ID" in a user's message is one they're actually allowed to touch. Keeping execution in your code, gated separately from proposal, is what lets you apply exactly the checks you'd apply to any other untrusted input reaching a write path — because that's what a tool call argument is.

## A concrete example

```typescript
const tools = [
  { name: "get_order_status", description: "Look up an order's current status" },
  { name: "issue_refund", description: "Issue a refund for an order" },
];

async function executeTool(name: string, args: any, ctx: { userId: string }) {
  switch (name) {
    case "get_order_status": {
      // read tool: fetch, scoped to the caller, nothing else needed
      return await db.getOrder(args.orderId, ctx.userId);
    }
    case "issue_refund": {
      // write tool: same shape of call, very different handling
      const order = await db.getOrder(args.orderId, ctx.userId);
      if (!order) throw new AuthorizationError("Order not found or not owned by caller");
      if (order.refunded) throw new ValidationError("Already refunded");
      if (args.amount > order.total) throw new ValidationError("Refund exceeds order total");

      await auditLog.record({ actor: ctx.userId, action: "issue_refund", orderId: args.orderId, amount: args.amount });
      return await payments.refund(order.paymentId, args.amount);
    }
  }
}
```

Both branches handle a `tool_use` block with the same shape — a name and arguments. The read branch trusts the arguments enough to query with them. The write branch treats the same arguments as a proposal that needs ownership checks, business-rule checks, and an audit record before anything irreversible happens. The tool-calling API doesn't create this asymmetry for you; your `executeTool` function does.

## Where it shows up

- **Any assistant with database access** — the read/write split above is the first design decision, before schemas or prompts.
- **Customer-facing agents** — a support bot that can *look up* an account is low-risk; one that can *modify* an account needs the full authority checklist, usually including a confirmation step.
- **Multi-step agent loops** — as the loop in [Implementing the Tool-Call Loop](/learn/genai-app-dev/implementing-a-tool-call-loop) runs longer, a single write executed on a bad intermediate state can compound; the risk split is what tells you which steps need a checkpoint.

## Watch out for

- **Naming a tool safely and building it dangerously.** `update_preferences` sounds harmless until it also accepts an `email` field with no ownership check — the risk lives in what the function actually does, not what it's called.
- **Skipping checks because "the model wouldn't ask for that."** The model's tool-use arguments can be shaped by anything in its context — including retrieved documents or earlier tool results an attacker influenced. Treat arguments as untrusted input, the same as a form submission.
- **Auto-executing every tool call the same way.** A loop that treats `get_order_status` and `issue_refund` identically — same lack of gating, same lack of audit — has already made the write tool as risky as handing out direct database access.

## Where next

[Implementing the Tool-Call Loop](/learn/genai-app-dev/implementing-a-tool-call-loop) builds the mechanical loop this lesson described — declare, propose, execute, feed back, repeat — with the read/write split wired directly into the execution step. [Two Tools: A Read API and a Guarded DB Write](/learn/genai-app-dev/building-a-weather-and-db-tool) then works a full example of both categories side by side.

**Related:** [Treat tool calls as requests for authority](/learn/genai-app-dev/tool-calling-and-authority), [Implementing the Tool-Call Loop](/learn/genai-app-dev/implementing-a-tool-call-loop), [Guardrails and Input Validation](/learn/genai-app-dev/guardrails-and-input-validation), [Tool-Calling Authority Mistakes](/learn/genai-app-dev/tool-call-authority-mistakes)
