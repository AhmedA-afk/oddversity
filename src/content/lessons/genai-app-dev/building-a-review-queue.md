---
title: "Building a Review Queue"
track: "genai-app-dev"
status: live
summary: "Build the pipeline that holds flagged model output, lets a reviewer approve, edit, or reject it, and safely releases the result."
duration: "8 min read"
---

[When to Put a Human in the Loop](/learn/genai-app-dev/human-in-the-loop-review) decided which output gets flagged. This lesson builds where flagged output actually goes: a queue, a reviewer UI, and the callback that turns a reviewer's decision back into an action the rest of the app can trust.

## What we're building

A `review_items` store, an enqueue function that [Output Validation and Moderation Gates](/learn/genai-app-dev/output-validation-and-moderation) calls when it routes to `needs_review`, a minimal reviewer interface with approve/edit/reject, and a release callback that resumes whatever was waiting on the outcome — a user-facing response, a tool execution, a queued send.

## Setup

Assume the routing decision from the last two lessons already exists — something upstream is calling this queue with a payload, not deciding on its own whether to. The queue's only job is to hold state, expose it to a reviewer, and notify whoever is waiting when a decision is made.

## Build it

### Step 1: The queue item shape

```python
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

class ReviewStatus(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    EDITED = "edited"
    REJECTED = "rejected"

@dataclass
class ReviewItem:
    id: str
    payload: dict            # the model's proposed output
    reason: str               # why it was flagged: low confidence, high stakes, policy hit
    status: ReviewStatus = ReviewStatus.PENDING
    created_at: datetime = field(default_factory=datetime.utcnow)
    reviewed_at: datetime | None = None
    reviewer_id: str | None = None
    final_payload: dict | None = None   # set on approve (= payload) or edit (reviewer's version)
```

`reason` isn't decorative — a reviewer working through a queue of twenty items needs to know at a glance whether this one is here for low confidence or a policy hit, because those call for different scrutiny. Storing `final_payload` separately from `payload` keeps the model's original proposal intact even after an edit, which matters for the audit trail this connects to in [An Escalation and Approval Flow](/learn/genai-app-dev/escalation-and-approval-flow).

### Step 2: Enqueue, called from the output-validation pipeline

```python
import uuid

def enqueue_for_review(payload: dict, reason: str) -> ReviewItem:
    item = ReviewItem(id=str(uuid.uuid4()), payload=payload, reason=reason)
    review_store.insert(item)
    notify_reviewers(item)  # e.g. a queue-depth alert, not necessarily per-item paging
    return item
```

This is the exact function `validate_and_route`'s `needs_review` branch in [Output Validation and Moderation Gates](/learn/genai-app-dev/output-validation-and-moderation) calls instead of delivering output directly.

### Step 3: The reviewer decision

```python
def review_decision(item_id: str, reviewer_id: str, action: str, edited_payload: dict | None = None):
    item = review_store.get(item_id)
    if item.status != ReviewStatus.PENDING:
        raise ValueError("item already reviewed")  # prevent a double-submit from two open tabs

    item.reviewer_id = reviewer_id
    item.reviewed_at = datetime.utcnow()

    if action == "approve":
        item.status = ReviewStatus.APPROVED
        item.final_payload = item.payload
    elif action == "edit":
        item.status = ReviewStatus.EDITED
        item.final_payload = edited_payload
    elif action == "reject":
        item.status = ReviewStatus.REJECTED
        item.final_payload = None
    else:
        raise ValueError(f"unknown action: {action}")

    review_store.update(item)
    release_item(item)  # step 4
    return item
```

The `PENDING`-only guard matters more than it looks: without it, two reviewers opening the same stale queue view can both submit a decision, and the second write silently overwrites the first with no record that a race happened.

### Step 4: The release callback

```python
def release_item(item: ReviewItem):
    waiter = pending_waiters.get(item.id)
    if waiter is None:
        return  # nothing currently waiting synchronously; a webhook or poll will pick it up

    if item.status in (ReviewStatus.APPROVED, ReviewStatus.EDITED):
        waiter.resolve(item.final_payload)
    else:
        waiter.reject("output rejected by reviewer")
```

`release_item` is the seam that makes the queue actually useful rather than just a database table — it's what turns a reviewer clicking "approve" into the paused action resuming on the other end.

### Step 5: The pending state the requester sees

```python
async def get_response_with_review(user_question: str) -> dict:
    result = validate_and_route(await call_model(user_question))
    if result["status"] != "needs_review":
        return result

    item = enqueue_for_review(result["payload"], reason="low_confidence")
    return {
        "status": "pending",
        "review_id": item.id,
        "message": "This response needs a quick check before it's sent — usually a few minutes.",
    }
```

Never leave the caller with silence while a review sits in the queue — an honest "pending" status with a rough expectation is a real answer, and the pattern for what the UI does with it while waiting is covered in [Streaming Failure Modes](/learn/genai-app-dev/streaming-failure-modes) and [Backpressure and Cancellation](/learn/genai-app-dev/backpressure-and-cancellation), which handle the equivalent problem for a slow stream.

## Run it

```python
item = enqueue_for_review({"reply_text": "...", "amount": 1400}, reason="high_stakes_amount")
# a reviewer opens the queue, edits the amount, and submits:
review_decision(item.id, reviewer_id="rev_42", action="edit", edited_payload={"reply_text": "...", "amount": 1200})
# release_item fires, the waiting request resolves with the edited payload
```

## Harden it

Add a queue-age alert, not just a queue-depth one — a single item sitting unreviewed for hours is a worse signal than a queue that's merely large, because it usually means a specific case nobody knows how to handle rather than ordinary volume. Store `reason` and `final_payload` together permanently even after the item leaves the active queue; that history is what [An Escalation and Approval Flow](/learn/genai-app-dev/escalation-and-approval-flow) builds its audit trail from, and what tells you months later whether your confidence threshold from [Output Validation and Moderation Gates](/learn/genai-app-dev/output-validation-and-moderation) is actually calibrated. And decide up front what happens to a `PENDING` item that ages out — auto-escalate, auto-reject, or page someone — because "the reviewer never got to it" is itself an outcome, not an absence of one.

## Extend it

This queue is generic on purpose — the `payload` is opaque to the queue itself, so the same machinery handles a flagged support reply, a flagged refund, or a flagged code change with no changes beyond what `reason` strings you use and what the reviewer UI renders for each payload shape. [An Escalation and Approval Flow](/learn/genai-app-dev/escalation-and-approval-flow) extends this exact queue with tiered approval — auto-approve below a threshold, this queue above it.

**Related:** [When to Put a Human in the Loop](/learn/genai-app-dev/human-in-the-loop-review), [Human-in-the-Loop Review Queues](/learn/genai-app-dev/human-in-the-loop-review-queues), [Output Validation and Moderation Gates](/learn/genai-app-dev/output-validation-and-moderation), [An Escalation and Approval Flow](/learn/genai-app-dev/escalation-and-approval-flow), [Backpressure and Cancellation](/learn/genai-app-dev/backpressure-and-cancellation)
