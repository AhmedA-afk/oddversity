---
title: "Sequential, Dependent Tool Use"
track: "tools-function-calling"
status: live
summary: "Some tool calls can't be planned in advance — the model has to see one result before it knows what the next call even is."
duration: "6 min read"
---

Ask a model to cancel "my most recent order" and it can't write that tool call yet — it doesn't know the order ID until it looks up the account, and it doesn't know the account until it identifies the user. Sequential, dependent tool use is what happens when the *arguments* for step two live inside the *result* of step one.

## What it is

A dependent chain is a sequence of tool calls where each one after the first needs a value that only exists once the previous call has returned. That's a narrower claim than "these tool calls happen one after another" — order alone doesn't make something dependent. What makes it dependent is that you could not have written the second call's arguments in advance, because they're not known until the first call's result is on the table.

This is the mechanism [Sequential, Multi-Step Tool Use](/learn/tools-function-calling/sequential-multi-step-tool-use) sets up as a loop: call the model, run whatever tool it asks for, feed the result back, call the model again. That lesson covers the loop's shape. This one is about *why* the loop is the only honest way to handle this case — not a design choice you could route around with more upfront planning.

## The mental model

Think of each tool result as filling in a blank in a form the model hasn't finished writing yet. `get_user("alex")` returns `{id: "u_9138", ...}`. Only now does `u_9138` exist anywhere — it wasn't in the conversation, the system prompt, or any prior turn. The next call, `get_orders(user_id="u_9138")`, is only writable because that blank got filled. Try to skip ahead and write `get_orders` before `get_user` has returned, and there's nothing to put in `user_id` except a guess.

That's the whole model: **a dependent chain is a sequence of blanks, each filled by the call before it, where no later blank can be filled early.** The model isn't executing a plan it committed to at turn one — it's discovering the plan's specifics one result at a time.

## Why it works this way

The alternative — asking the model to predict every argument for every step before any tool has run — fails for a structural reason, not a capability one: the information genuinely doesn't exist yet. A model that "pre-fills" `get_orders(user_id="u_9138")` before calling `get_user` isn't being clever, it's hallucinating a plausible-looking ID. The tool-call loop avoids this by construction: nothing forces the model to decide argument N+1 before it has seen result N.

This is also why you can't shortcut a dependent chain into [parallel tool calls](/learn/tools-function-calling/parallel-tool-calls) no matter how much latency you'd save doing so. Parallelism requires independence — see [Parallel or Sequential?](/learn/tools-function-calling/parallel-vs-sequential-decision) for the actual test — and a dependent chain fails that test by definition. The dependency isn't a performance problem to engineer away; it's a fact about where the data comes from.

## A concrete example (shown)

```json
// Turn 1 — model has no ID yet, so it starts with what it can call
{"type": "tool_use", "id": "call_1", "name": "get_user", "input": {"username": "alex"}}

// tool_result for call_1
{"id": "u_9138", "email": "alex@example.com", "plan": "pro"}

// Turn 2 — user_id only exists now, because call_1 just returned it
{"type": "tool_use", "id": "call_2", "name": "get_orders", "input": {"user_id": "u_9138"}}

// tool_result for call_2
[{"order_id": "o_5521", "status": "shipped", "placed_at": "2026-08-28"},
 {"order_id": "o_5502", "status": "delivered", "placed_at": "2026-08-14"}]

// Turn 3 — order_id only exists now, and specifically it's the most recent one
{"type": "tool_use", "id": "call_3", "name": "cancel_order", "input": {"order_id": "o_5521"}}
```

Every `input` value on turns 2 and 3 traces back to a field the *previous* tool result introduced. There's no version of this chain where turn 3's `order_id` gets written before turn 2 has run — the model has to pick "most recent" out of the returned list, which it can only do once the list exists.

## Where it shows up

Multi-hop lookups (user → account → resource), form-filling that needs a prior answer to know what to ask next, and any debugging loop where the next file to open is named inside a stack trace the previous tool call just returned. [A Sequential Booking Flow](/learn/tools-function-calling/sequential-booking-flow-worked) walks a complete four-step version of this end to end.

## Watch out for

- **Assuming your prompt guarantees the order.** Writing "first look up the user, then the orders" in a system prompt is a strong hint, not an enforcement mechanism — the model can still call things out of the sequence you intended. If order genuinely can't vary, that's a signal to fix it in code (see [Chaining Calls Into a DAG](/learn/tools-function-calling/chaining-into-dag-workflows)), not in prose.
- **No iteration cap.** A dependent chain that never terminates — a lookup that returns a result the model keeps re-querying — burns tokens with nothing to show for it. Cap the loop length and treat exhaustion as an error, not a silent stop.
- **Swallowing a mid-chain failure.** If `get_orders` errors and your harness returns something vague, the model tends to invent a plausible order ID rather than surface the failure. See [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-tool-errors-and-retries) for making failures visible instead of guessable-around.

## Where next

[A Sequential Booking Flow](/learn/tools-function-calling/sequential-booking-flow-worked) traces a longer chain end to end with the full transcript. Once you're comparing a dependent chain against calls that *don't* need to wait on each other, [Parallel or Sequential?](/learn/tools-function-calling/parallel-vs-sequential-decision) gives the actual decision rule.

**Related:** [Sequential, Multi-Step Tool Use](/learn/tools-function-calling/sequential-multi-step-tool-use), [A Sequential Booking Flow](/learn/tools-function-calling/sequential-booking-flow-worked), [Parallel or Sequential?](/learn/tools-function-calling/parallel-vs-sequential-decision), [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-tool-errors-and-retries)
