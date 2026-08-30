---
title: "Output Validation and Moderation Gates"
track: "genai-app-dev"
status: live
summary: "Chain schema validation, a policy check, and a confidence threshold so risky output routes to review instead of straight to users."
duration: "8 min read"
---

Input guards, from the last lesson, protect the model from the world. Output guards protect the world from the model — and they're the layer that catches the [semantic failures](/learn/genai-app-dev/failure-modes-of-llm-calls) that nothing on the input side or the error-handling side ever sees, because the call succeeds and the output is well-formed.

## What we're building

Three checks chained in a fixed order — schema validation, a policy/moderation check, a confidence threshold — plus a routing decision for output that fails any of them: block-and-fallback for a clear policy violation, or a route into the review queue this module builds next for output that's merely uncertain.

## Setup

This runs after a successful model call, before the output reaches a user, a database write, or a tool argument. It composes with the error boundary from [Typed Errors and a Clean Error Boundary](/learn/genai-app-dev/try-catch-and-typed-errors) — that boundary handles the call failing outright; this handles the call succeeding with output you still can't trust yet.

## Build it

### Step 1: Schema validation, first and non-negotiable

If you asked for structured output, validate it before anything else touches it — this is the same discipline as [JSON Schema and Validation](/learn/genai-app-dev/json-schema-and-validation), applied here as the entry gate to a larger pipeline rather than a standalone check:

```python
from pydantic import BaseModel, ValidationError

class SupportReply(BaseModel):
    reply_text: str
    category: str  # "billing" | "technical" | "account"
    confidence: float  # 0.0-1.0, model's self-reported confidence

def validate_schema(raw_json: str) -> SupportReply | None:
    try:
        return SupportReply.model_validate_json(raw_json)
    except ValidationError:
        return None  # malformed output — see structured-output-failures for the repair-or-retry path
```

A schema failure here routes back through [Structured Output Failures](/learn/genai-app-dev/structured-output-failures) for a targeted repair, not through this pipeline — there's no policy or confidence question to ask about output that isn't even shaped correctly yet.

### Step 2: A policy or moderation check

```python
def moderation_check(text: str) -> dict:
    # stand-in for a real moderation API or classifier call
    flagged_categories = classify_policy_violations(text)
    return {"flagged": len(flagged_categories) > 0, "categories": flagged_categories}

def check_output_policy(reply: SupportReply) -> bool:
    result = moderation_check(reply.reply_text)
    if result["flagged"]:
        log_policy_violation(reply, result["categories"])
        return False
    return True
```

This is a distinct check from the schema step on purpose — output can be perfectly valid JSON with a `reply_text` field that contains something that shouldn't reach a user (leaked internal notes, a promise the business can't keep, language that violates your own content policy). [Guardrails for High-Stakes Output](/learn/hallucinations/guardrails-for-high-stakes-output) covers the deeper version of this check for medical, legal, and financial domains specifically.

### Step 3: A confidence threshold that decides automation vs. review

```python
CONFIDENCE_THRESHOLD = 0.75  # start here, then measure against your own false-approval rate

def route_output(reply: SupportReply, policy_ok: bool) -> str:
    if not policy_ok:
        return "blocked"
    if reply.confidence < CONFIDENCE_THRESHOLD:
        return "needs_review"
    return "auto_deliver"
```

Treat a model's self-reported confidence field as a rough, uncalibrated signal, not a probability you can trust at face value — a model saying `0.9` isn't the same claim as a well-calibrated classifier saying `0.9`. It's still a useful ordering signal even when it isn't a trustworthy absolute number: output the model reports low confidence in is worth a second look far more often than output it reports high confidence in, even if neither number is exactly right. Tune the threshold against outcomes you can actually observe — reviewer overrides, downstream complaints — rather than picking a number that feels reasonable and leaving it there.

### Step 4: The full pipeline and its three exits

```python
def validate_and_route(raw_json: str) -> dict:
    reply = validate_schema(raw_json)
    if reply is None:
        return {"status": "malformed", "action": "repair_or_retry"}

    policy_ok = check_output_policy(reply)
    decision = route_output(reply, policy_ok)

    if decision == "blocked":
        return {"status": "blocked", "fallback": "I can't help with that request. Let me connect you with a person."}
    if decision == "needs_review":
        return {"status": "needs_review", "payload": reply, "action": "enqueue"}
    return {"status": "ok", "payload": reply, "action": "deliver"}
```

Three exits, three different downstream paths: a clean deliver, an honest fallback message for a blocked output, and an enqueue into the review pipeline for output that's neither clearly fine nor clearly wrong.

## Where it breaks (and the fix)

The gap in the pipeline above: schema validity and policy cleanliness both say nothing about whether the *content* is factually correct. A reply can pass every check here — valid JSON, `category: "billing"`, no policy violations, confidence `0.91` — and still state a return-window policy that's simply wrong, invented rather than retrieved. Nothing in this chain catches that, because nothing in it checks facts. The honest fix isn't a fourth automated gate; it's accepting that fact-correctness for high-stakes claims needs either grounding (retrieve the real policy and require the model to cite it) or human review, which is exactly why [When to Put a Human in the Loop](/learn/genai-app-dev/human-in-the-loop-review) exists as a separate lesson rather than a fifth `if` statement bolted onto this function.

## Takeaways

- Schema, policy, and confidence are three genuinely different questions — is it well-formed, is it allowed, is it trustworthy — and conflating them into one pass-or-fail check loses the information about *which* one failed, which is exactly the information the routing decision needs.
- A blocked output needs an honest fallback message, not a silent empty response — see [Reliability Antipatterns](/learn/genai-app-dev/reliability-antipatterns) for what happens when that fallback gets skipped.
- Confidence thresholds are a starting point to measure against, not a value to set once and forget — this connects directly to [Building a Review Queue](/learn/genai-app-dev/building-a-review-queue), where the threshold determines how much volume the queue actually sees.

**Related:** [The Failure Modes of an LLM Call](/learn/genai-app-dev/failure-modes-of-llm-calls), [JSON Schema and Validation](/learn/genai-app-dev/json-schema-and-validation), [Structured Output Failures](/learn/genai-app-dev/structured-output-failures), [Guardrails for High-Stakes Output](/learn/hallucinations/guardrails-for-high-stakes-output), [When to Put a Human in the Loop](/learn/genai-app-dev/human-in-the-loop-review), [Building a Review Queue](/learn/genai-app-dev/building-a-review-queue)
