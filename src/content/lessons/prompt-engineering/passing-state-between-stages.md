---
title: "Passing State Cleanly Between Pipeline Stages"
track: "prompt-engineering"
status: live
summary: "Forward the structured fields the next stage's rubric depends on, and design the handoff backward from that rubric."
duration: "8 min read"
---

*Optional depth. If you've split a task into stages and are wiring the output of one into the prompt of the next, this is the mechanics of getting that handoff right — what to forward, what to cut, and why "just pass everything, it can't hurt" is false.*

## Passing by value, not by reference

Treat a pipeline stage like a function. A well-written function takes exactly the parameters its body references — not a pointer to the entire program state, on the theory that it might need something in there. A prompt stage should be built the same way: its input should be the structured fields its own rubric actually depends on, not the accumulated raw material of every stage that ran before it.

The difference matters because a prompt has no scoping rules to enforce this for you. A Python function that never touches a variable simply doesn't use it; a prompt that receives an extra 2,000 words of irrelevant transcript doesn't ignore them — every token is live, and the model has to actively decline to act on material that's sitting right there in its context. "Forwarding it can't hurt, the model will just ignore what's irrelevant" is the wrong default: irrelevant content isn't inert, it's a standing invitation to drift off the stage's actual job.

## Why forwarded prose competes with instructions

A stage's prompt is a fixed budget of attention, not an unlimited container. Instructions positioned away from the start or end of a long prompt already get less compliance weight (the same effect covered in [When to Split One Prompt Into a Pipeline](/learn/prompt-engineering/when-to-split-a-prompt)), and every irrelevant paragraph you forward pushes the instructions that actually matter further from the positions that get the most attention. Passing raw prose forward isn't neutral background — it's diluting the exact signal the next stage needs to follow.

There's a second, sharper failure than dilution: a model given the *raw* material a previous stage already processed can re-derive its own judgment from it instead of trusting the previous stage's structured conclusion. If stage two decided `"resolve"` and stage three is handed both that decision and the entire raw ticket thread it was decided from, stage three can quietly re-read the thread, disagree, and act on its own re-derived judgment — silently overriding a decision that was supposed to be already made. The fix isn't a stronger instruction to "trust the decision field." It's not forwarding the raw thread at all.

## The over-stuffed stage, precisely

A three-stage support pipeline: parse the ticket, score/decide an action, write the reply. The reply stage is handed everything available, on the reasoning that more context means a better-informed reply:

```text
[Full 12-message ticket thread, including an unrelated aside in message 4
asking about a student discount]

Parsed data: {"category": "billing", "order_id": "4471", "issue": "duplicate charge"}
Decision data: {"decision": "resolve", "matched": ["duplicate charge policy"]}
Company policy document: <2,000 words covering refunds, discounts, escalation>

Given all of the above, write a reply to the customer.
```

Run this and the reply stage answers the unrelated student-discount aside from message 4 — technically responsive to something in its context, completely out of scope for this ticket's resolution — and in a few runs, re-reads the raw thread and second-guesses the `"resolve"` decision the previous stage already made, drifting toward "escalate" because tone in the thread reads frustrated, even though the actual policy match already resolved that question.

The trim: forward only the fields the reply stage's job actually depends on.

```json
{
  "customer_first_name": "Priya",
  "issue_summary": "duplicate charge on order #4471",
  "decision": "resolve",
  "matched_policy": "duplicate charge policy"
}
```

```text
Using only the fields below, write a two-sentence reply to {customer_first_name}
that reflects the decision: {decision}. Issue: {issue_summary}. Policy applied:
{matched_policy}.
```

There's no student-discount aside for the model to notice, because it was never forwarded, and no raw thread to re-derive a competing judgment from — the decision field is the only source of truth about what action to take, because it's the only thing in the prompt that speaks to it.

## Designing backward from the rubric

The reliable way to decide what a stage should receive is to write the *next* stage's prompt first, then work backward: for every field a stage's prompt template references, that field has to come from somewhere upstream, and nothing else needs to be forwarded. If the reply stage's template references `{decision}`, `{issue_summary}`, and `{customer_first_name}`, those three fields — and nothing else — are the entire contract the previous stage owes it. This inverts the instinct to build a pipeline forward from stage one's raw output and hope stage three finds what it needs somewhere in the pile.

This is also the moment to check the [output contract](/learn/prompt-engineering/structured-output-contracts) of the upstream stage against the downstream template's actual field references — a field the template needs but the schema doesn't guarantee is a bug waiting for the day the field comes back `null`.

## The tradeoff, precisely

Trimming isn't a free "always cut more" rule — it has a real failure direction of its own. Cut a field the next stage's rubric actually depends on, and that stage either invents a plausible-sounding substitute or produces a vaguer answer than it could have. If the reply stage needed the exact refund amount to reference in the reply and `issue_summary` doesn't carry it, you haven't improved anything by trimming — you've just moved the failure from "distracted by too much" to "missing something it needed."

The precise rule is not "minimize what you forward." It's "forward exactly what the next stage's prompt template references, verified by reading that template, not guessed at from the first stage's side." Getting this right is a design step, not a cost-cutting reflex — and it's the same discipline that keeps a pipeline from sliding into [over-decomposition](/learn/prompt-engineering/over-decomposition), where extra stages and bloated handoffs get added together because nobody worked out what minimal interface actually connected them.

**Related:** [When to Split One Prompt Into a Pipeline](/learn/prompt-engineering/when-to-split-a-prompt), [Structured Output: Making the Model Speak a Contract](/learn/prompt-engineering/structured-output-contracts), [Over-Decomposition: Too Many Stages](/learn/prompt-engineering/over-decomposition), [Worked Example: A Classify-Then-Extract Pipeline](/learn/prompt-engineering/classify-then-extract-pipeline)
