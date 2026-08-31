---
title: "When to Put a Human in the Loop"
track: "genai-app-dev"
status: live
summary: "HITL is a routing decision, not a safety net bolted on at the end - stakes and confidence decide what ships automatically."
duration: "7 min read"
---

[Human-in-the-Loop Review Queues](/learn/genai-app-dev/human-in-the-loop-review-queues) introduced the queue as a UI pattern. This lesson is the decision that comes before any of that gets built: which actions actually need a person, and which ones cost you more in friction than they save you in safety.

## What it is

Human review is not a blanket policy you apply to "AI output" as a category — it's a per-action routing decision made from two independent questions:

- **Stakes.** What happens if this output is wrong and nobody catches it? A draft email that's slightly off tone costs a re-read. A refund that's wrong costs money and possibly a chargeback dispute. An action that can't be undone — a sent message, an executed trade, a deleted record — costs more than one that can be corrected after the fact.
- **Confidence.** How sure is the system that this particular output is right? Not "how good is the model in general," but "how good is *this* output," which is exactly the signal [Output Validation and Moderation Gates](/learn/genai-app-dev/output-validation-and-moderation) produces with its confidence threshold.

Neither question alone tells you what to do. A low-stakes action with low confidence still isn't worth a human's time — let it ship and let the user correct it. A high-stakes action with high confidence still might warrant review if the cost of being wrong is severe enough that even a small error rate is unacceptable.

## The mental model

Picture a two-by-two grid, stakes on one axis, confidence on the other:

```text
                low confidence          high confidence
high stakes     always review           spot-check / sample review
low stakes      auto-ship, let user     auto-ship, no review
                fix it after
```

Most teams default to reviewing everything the model touches, which burns reviewer time on the bottom row for no safety benefit, or they default to reviewing nothing, which lets the top-left quadrant — the exact cases where being wrong is expensive *and* likely — through unchecked. The grid is the whole point: it's a routing table, not a single gate.

## Why it works this way

Review capacity is a scarce, human-paced resource, and treating it as infinite is how review queues either drown or get bypassed under pressure. If every model output requires a human glance, the queue backs up the moment volume grows past whatever a few reviewers can sustain, and the pressure to clear it starts trading care for throughput — which defeats the purpose of having a queue at all. Routing by stakes and confidence instead of by category means the queue only ever sees the output that actually benefits from a second look: the stuff that's both risky and uncertain. Everything else — high confidence, low stakes — ships on its own, and the system spends its human attention where it changes the outcome.

This is the same logic that shows up in [Tool Calling as Authority](/learn/genai-app-dev/tool-calling-and-authority): a tool call is a request for the application to act, and the application decides how much authority to grant automatically versus how much to gate behind a person. HITL is that same authority boundary, expressed as a review step instead of a permission check.

## A concrete example (shown)

A support agent handling three requests in the same session, routed three different ways:

```text
Request 1: "What's your return window?"
  -> stakes: low (informational)         confidence: 0.94
  -> auto-ship

Request 2: "Refund my $18 order, item never arrived"
  -> stakes: low-moderate (small $, policy-covered)   confidence: 0.89
  -> auto-ship, logged for spot-check sampling

Request 3: "Refund my $1,400 order, wrong item shipped, I want it expedited"
  -> stakes: high (large $, unusual case)   confidence: 0.71
  -> enqueue for human review
```

Same model, same session, three different routing outcomes — because the decision is made per-action from stakes and confidence, not once for the whole feature.

## Where it shows up

Coding agents that can run arbitrary shell commands route destructive-looking commands (`rm`, a database migration, a force-push) to confirmation even when the model is highly confident the command is correct — the stakes axis dominates regardless of confidence. Content moderation systems do the reverse: routine flags auto-resolve, and only borderline or high-severity cases reach a human, because the volume makes 100% review impossible and most of it doesn't need it. And agentic customer support tends to get this backwards early on — teams review everything at launch out of caution, discover the queue is unsustainable within weeks, and only then build the routing logic they needed from day one.

## Watch out for

- **Setting the confidence threshold once and never revisiting it.** A threshold picked before launch is a guess; [Output Validation and Moderation Gates](/learn/genai-app-dev/output-validation-and-moderation) already flags this — tune it against reviewer override rates once you have real data, not against how it feels.
- **Treating "reversible" as "low stakes."** A reversible action can still be high-stakes if reversing it is expensive or slow — refunding a wrongly-issued refund is possible but not free, and the customer experience of "we made a mistake, here's a second one" isn't neutral.
- **No sampling on the auto-ship path.** Auto-shipped output that's never checked at all means confidence miscalibration goes undetected indefinitely — the low-moderate-stakes row in the grid above still needs occasional spot-checks, not zero checks.

## Where next

[Building a Review Queue](/learn/genai-app-dev/building-a-review-queue) turns this routing decision into the actual pipeline: the queue that holds flagged output, the reviewer UI, and the callback that releases or discards the action. [An Escalation and Approval Flow](/learn/genai-app-dev/escalation-and-approval-flow) walks a full worked example — a refund agent — through exactly this grid in code.

**Related:** [Human-in-the-Loop Review Queues](/learn/genai-app-dev/human-in-the-loop-review-queues), [Output Validation and Moderation Gates](/learn/genai-app-dev/output-validation-and-moderation), [Tool Calling as Authority](/learn/genai-app-dev/tool-calling-and-authority), [Building a Review Queue](/learn/genai-app-dev/building-a-review-queue), [An Escalation and Approval Flow](/learn/genai-app-dev/escalation-and-approval-flow)
