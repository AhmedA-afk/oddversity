---
title: "An Escalation and Approval Flow"
track: "genai-app-dev"
status: live
summary: "One refund request, traced end to end through auto-approval, escalation, human review, and the audit trail it leaves behind."
duration: "8 min read"
---

Every idea in this module so far — confidence, stakes, review queues — is easiest to see as one thing moving through a pipeline rather than as a list of rules. Here's one refund request, followed from the moment the agent proposes it to the moment money actually moves.

## The setup

A support agent has [tool-calling authority](/learn/genai-app-dev/tool-calling-and-authority) to issue refunds up to a hard ceiling the application enforces in code, not one the model enforces on itself. Two customers message in the same hour:

```text
Customer A: "My $22 order arrived damaged, can I get a refund?"
Customer B: "My $890 order never arrived and I need this resolved today."
```

The application's policy: refunds under $50 with a matching order record auto-approve. Anything at or above $50, or anything the model itself flags as unusual, escalates to a human reviewer — the exact stakes-and-confidence grid from [When to Put a Human in the Loop](/learn/genai-app-dev/human-in-the-loop-review), applied to one specific tool.

## Step by step

### Step 1: The model proposes a tool call, not an action

```json
{
  "tool": "issue_refund",
  "arguments": { "order_id": "ORD-A102", "amount": 22.00, "reason": "item damaged in transit" },
  "model_confidence": 0.93
}
```

```json
{
  "tool": "issue_refund",
  "arguments": { "order_id": "ORD-B451", "amount": 890.00, "reason": "item never arrived" },
  "model_confidence": 0.81
}
```

> **Why this step?** The model never calls `issue_refund` directly — it proposes arguments, and the application decides whether to execute them. This is the authority boundary from [Tool Calling as Authority](/learn/genai-app-dev/tool-calling-and-authority): the model's job stops at "here's what I think should happen," and everything past that is application code the model doesn't control.

### Step 2: The application checks the proposal against real state, not just the model's claim

```python
def validate_refund_proposal(args: dict) -> bool:
    order = get_order(args["order_id"])
    if order is None:
        return False
    if order.total < args["amount"]:
        return False  # can't refund more than was paid
    if order.refund_status != "none":
        return False  # already refunded — catches a duplicate proposal before it executes
    return True
```

> **Why this step?** A model proposing a refund for an order that doesn't exist, or one already refunded, isn't a hypothetical — it's exactly the kind of confidently-wrong output [The Failure Modes of an LLM Call](/learn/genai-app-dev/failure-modes-of-llm-calls) calls semantic failure. This check runs whether the amount is $22 or $890, because validity and stakes are separate questions.

Both proposals pass validation — `ORD-A102` and `ORD-B451` are real, unrefunded, and within their order totals.

### Step 3: The routing decision

```python
def route_refund(args: dict, confidence: float) -> str:
    if args["amount"] < 50 and confidence >= 0.85:
        return "auto_approve"
    return "escalate"

route_refund({"amount": 22.00, ...}, 0.93)   # -> "auto_approve"
route_refund({"amount": 890.00, ...}, 0.81)  # -> "escalate"
```

> **Why this step?** This is [When to Put a Human in the Loop](/learn/genai-app-dev/human-in-the-loop-review)'s grid as one function: Customer A lands in low-stakes/high-confidence and ships immediately; Customer B lands in high-stakes territory on amount alone, regardless of the model's own confidence — the ceiling is enforced by application policy, not by asking the model whether it's sure.

### Step 4: The two paths diverge

Customer A's refund executes immediately, and the tool result — not a queue entry — is the record:

```json
{ "status": "executed", "order_id": "ORD-A102", "amount": 22.00, "executed_at": "2026-08-31T14:02:11Z", "auto_approved": true }
```

Customer B's proposal enters the review queue from [Building a Review Queue](/learn/genai-app-dev/building-a-review-queue), carrying the model's reasoning along with it — not just the raw arguments:

```python
enqueue_for_review(
    payload={"order_id": "ORD-B451", "amount": 890.00, "reason": "item never arrived"},
    reason=f"escalated: amount >= $50 (model_confidence={0.81}, model_reasoning='customer reports non-delivery, no tracking scan past origin facility')",
)
```

> **Why this step?** A reviewer looking at a bare `{"amount": 890.00}` has to reconstruct the model's reasoning from scratch or open a separate transcript. Attaching it directly to the queue item is the difference between a ten-second approve and a five-minute investigation for every single escalation — the reasoning is the thing that makes review fast enough to actually keep up with volume.

### Step 5: A reviewer acts, and the release fires

```python
review_decision("item_9f21", reviewer_id="rev_42", action="approve")
# release_item resolves the waiting refund flow, which now executes:
```

```json
{ "status": "executed", "order_id": "ORD-B451", "amount": 890.00, "executed_at": "2026-08-31T14:19:47Z", "auto_approved": false, "reviewer_id": "rev_42" }
```

> **Why this step?** The reviewer's approval doesn't refund the order directly — it releases the same `issue_refund` call the model originally proposed, now cleared through the human check. The execution path is identical for both customers; only whether a person sat in front of it differs.

### Step 6: The audit trail

Every refund, auto-approved or reviewed, leaves the same shape of record:

```json
{
  "order_id": "ORD-A102", "amount": 22.00, "auto_approved": true,
  "model_confidence": 0.93, "reviewer_id": null, "reviewed_at": null
}
{
  "order_id": "ORD-B451", "amount": 890.00, "auto_approved": false,
  "model_confidence": 0.81, "reviewer_id": "rev_42", "reviewed_at": "2026-08-31T14:19:47Z"
}
```

> **Why this step?** Six months from now, "why did we refund $890 on this order" needs an answer that doesn't depend on anyone's memory — who approved it, what the model's stated reasoning was, and when. This is the same discipline [Logging Prompts and Completions Safely](/learn/genai-app-dev/logging-prompts-and-completions-safely) argues for at the model-call level, applied here to the decision level.

## Where it breaks (and the fix)

The auto-approve path has no audit trail beyond the tool result itself — no one reviewed it, so there's no reviewer decision to log. If the $50 threshold turns out to be wrong (fraud starts routing $49 refunds specifically to stay under it), nothing in this flow catches that on its own; the fix is sampling a percentage of auto-approved refunds for retroactive review, the same spot-check idea flagged in [When to Put a Human in the Loop](/learn/genai-app-dev/human-in-the-loop-review), not lowering the threshold to zero and routing everything through a human.

## Takeaways

- The model proposes; the application validates, routes, and executes — authority never transfers to the model itself, at any stakes level.
- Attaching the model's stated reasoning to an escalated item is what makes a review queue fast enough to survive real volume.
- Both paths — auto-approved and reviewed — need the same audit shape, because "why did this happen" is a question you'll eventually need to answer about the auto-approved half too.

**Related:** [When to Put a Human in the Loop](/learn/genai-app-dev/human-in-the-loop-review), [Building a Review Queue](/learn/genai-app-dev/building-a-review-queue), [Tool Calling as Authority](/learn/genai-app-dev/tool-calling-and-authority), [The Failure Modes of an LLM Call](/learn/genai-app-dev/failure-modes-of-llm-calls), [Logging Prompts and Completions Safely](/learn/genai-app-dev/logging-prompts-and-completions-safely)
