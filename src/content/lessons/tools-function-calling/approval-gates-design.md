---
title: "Human-in-the-Loop Approval Gates"
track: "tools-function-calling"
status: live
summary: "Pause the agent loop before a consequential call so a human confirms exactly what's about to happen."
duration: "6 min read"
---

Sandboxing bounds what a bad call can damage. It doesn't stop a call that's *correct* but consequential — a well-formed, fully authorized `delete_records` call that's simply the wrong decision. For that, you need a human in the loop before execution, not just isolation around it.

## What it is

An approval gate is a checkpoint the dispatcher inserts before running a tool: instead of executing immediately, it surfaces the call to a human and waits for an explicit decision. This isn't the same control as [risk-tier classification](/learn/tools-function-calling/classifying-tool-risk-tiers) — tiering decides *which* calls need a gate; the gate is the mechanism that actually pauses execution and collects a human decision once tiering has flagged one.

A gate sits structurally in the same place as validation and authorization in [From tool_call to Function Call](/learn/tools-function-calling/execution-authority-model) — after the model proposes a call, before the handler runs — but it adds a step those don't have: the call can be valid, authorized, and still not proceed, because "should this happen" is a judgment call being deferred to a person rather than a check being run in code.

## The mental model

Think of the gate as inserting a human as one more link in the dispatch chain, with the same three possible outcomes any check has — pass, fail, or (new here) *pending*. A gated call doesn't error out and it doesn't execute; it parks, waiting on a decision that arrives asynchronously, often much later than the rest of the turn. That "pending" state is what makes gates structurally different from every other check in this module — [Implementing an Approval Gate](/learn/tools-function-calling/implementing-an-approval-gate) works through the state machine this requires.

## Why it works this way

Some decisions genuinely aren't ones your code should make alone, no matter how well-validated the arguments are. "Refund $9,000 to this customer" might pass every type check, every authorization check, and every sandbox constraint, and still be a decision worth a human's judgment — not because the system doesn't trust the call, but because the *stakes* warrant a second opinion regardless of correctness. Gates exist for exactly that category: not "is this call safe to run" (validation and sandboxing answer that) but "is this the right call to make" (a question only a human, or at least a human-defined policy, can really answer for genuinely judgment-laden actions).

## A concrete example (shown)

What a good gate surfaces to the human isn't the raw tool call — it's a rendered preview of the effect:

```
Tool call: delete_records(table="support_tickets", record_ids=["tk_881","tk_882","tk_883"])

Preview:
  3 tickets will be permanently deleted:
  - tk_881  "Refund not received"      opened 2026-06-02  status: closed
  - tk_882  "Login issue"              opened 2026-06-04  status: closed
  - tk_883  "Duplicate charge"         opened 2026-06-05  status: open   <- not yet resolved

  [Approve]   [Deny]   [Edit record_ids]
```

Three things make this gate useful rather than performative: the call is shown exactly, not summarized into vagueness; the *effect* is previewed in domain terms (ticket subjects and statuses), not just the raw argument list, which is what actually lets a human catch that `tk_883` is still open and probably shouldn't be in this batch; and the choice includes editing, not just a binary yes/no — the human can narrow `record_ids` to the two closed tickets and approve that instead of rejecting the whole call and making the model start over.

## Where it shows up

Financial actions (refunds, transfers, purchases), destructive data operations (deletes, bulk updates), anything that sends something externally visible (emails, public posts, merged pull requests), and any action a compliance or legal requirement says needs a human sign-off regardless of how trustworthy the system is. It shows up least on read-only tools, which is exactly the read/write/irreversible split [Classifying Tools by Risk Tier](/learn/tools-function-calling/classifying-tool-risk-tiers) formalizes.

## Watch out for

- **Gating everything.** A gate that fires on every third call trains people to click approve without reading — the security property of a gate depends entirely on humans actually looking, and that stops being true past a certain interruption frequency. Gate narrowly and specifically; see risk tiering for how to keep the gated set small on purpose.
- **Showing the raw call instead of its effect.** `delete_records(table="support_tickets", record_ids=[...])` is technically complete and practically unreviewable — a human can't tell from ids alone whether the batch is safe. A preview in domain terms is what makes the approval meaningful, not just present.
- **No path forward on denial.** If a human clicks deny and the model has no way to understand why or try something else, the loop either retries the same blocked call or gives up uninformatively. The model needs the denial as a proper [tool result](/learn/tools-function-calling/returning-results-to-the-model) it can reason about.

## Where next

[Implementing an Approval Gate](/learn/tools-function-calling/implementing-an-approval-gate) builds the pause/resume state machine this requires, including the tricky part: resuming an agent loop correctly after a UI round trip that might take minutes or hours. [Classifying Tools by Risk Tier](/learn/tools-function-calling/classifying-tool-risk-tiers) covers deciding which calls reach a gate at all.

**Related:** [Implementing an Approval Gate](/learn/tools-function-calling/implementing-an-approval-gate), [Classifying Tools by Risk Tier](/learn/tools-function-calling/classifying-tool-risk-tiers), [Approval Gates for Sensitive Tool Calls](/learn/tools-function-calling/approval-gates-for-sensitive-tools), [The Confused-Deputy Problem](/learn/tools-function-calling/the-authority-problem), [Executing Tool Calls Safely](/learn/tools-function-calling/executing-tool-calls-safely)
