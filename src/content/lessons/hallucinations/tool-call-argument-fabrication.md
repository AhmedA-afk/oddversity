---
title: "Worked Example: Fabricated Tool Names and Arguments"
track: "hallucinations"
status: live
summary: "One agent invents a tool that was never registered; another calls a real tool with an argument it made up — and only one gets caught by schema validation."
duration: "6 min read"
---

An agent can hallucinate a tool call in two structurally different places: the *shape* of the call, or the *content* inside a call whose shape is perfectly correct. Only one of those is stopped by the guardrail most teams already have.

## The setup

Registered tools, exactly as they'd appear in the system prompt's tool schema:

```json
[
  {"name": "lookup_customer", "params": {"customer_id": "string"}},
  {"name": "apply_refund", "params": {"customer_id": "string", "amount": "number"}},
  {"name": "send_email", "params": {"to": "string", "subject": "string", "body": "string"}}
]
```

No `send_sms` tool exists. No customer ID has been provided in the conversation yet.

## Step by step

**Step 1 — schema-level hallucination.**

User: *"Text the customer to confirm their refund went through."* The agent emits:

```json
{"tool": "send_sms", "args": {"phone": "+1-555-0134", "message": "Your refund has been processed."}}
```

> **Why this step?** There is no SMS tool, and no phone number was ever given. The model pattern-matched "notify the customer" against the shape of a plausible tool call it's seen in other contexts (support agents commonly *do* have an SMS tool) and produced one wholesale — name, parameters, and a fabricated phone number, all at once.

A tool-call validator that checks the emitted call against the registered schema catches this immediately: `send_sms` isn't in the tool list. Reject, don't dispatch. This is exactly the containment strategy in [tool-call hallucination](/learn/hallucinations/tool-call-hallucination) — structural validation closes off invented tools almost entirely, because there's no way to fake the schema itself.

**Step 2 — value-level hallucination.**

User: *"Refund the customer who emailed us about the delayed order."* No customer ID was ever supplied — not by the user, not by a prior `lookup_customer` call. The agent emits:

```json
{"tool": "apply_refund", "args": {"customer_id": "CUST-10432", "amount": 49.99}}
```

> **Why this step?** `apply_refund` is real. `customer_id` is a real, correctly-typed parameter. `"CUST-10432"` is a plausible-looking string in exactly the format real customer IDs take in this system — and it is completely made up. The model needed *some* value to fill a required slot and generated one instead of first calling `lookup_customer` or asking the user for it.

A schema validator passes this without complaint: correct tool name, correct parameter names, correct types. Nothing about the JSON is malformed. The refund fires against a customer who was never identified.

## Where it breaks — and the fix

Schema validation answers one question: *is this a call the system knows how to make?* It cannot answer a second, different question: *did this specific value come from anywhere real?* Those are different checks against different things — the first checks the call against the tool registry (the same "is this in the input's allowed set" logic from [intrinsic vs. extrinsic hallucination](/learn/hallucinations/intrinsic-vs-extrinsic-hallucination), applied to tool names instead of prose); the second has to check the value against the conversation's actual data, which the schema was never built to track.

**The fix that closes the gap:** value-grounding, not stricter typing. Tag every value that flows into a required identifier argument with where it came from — a prior tool result, a literal string the user typed, a value the model generated on its own — and refuse to dispatch any call whose identifier arguments aren't traceable to one of the first two sources. Concretely: `apply_refund`'s `customer_id` should only ever be allowed to come from a `lookup_customer` result already in the transcript, never from the model filling in a slot from scratch. This is the same "ground the value, don't just validate the shape" discipline behind [grounding with source documents](/learn/hallucinations/grounding-with-source-documents), applied to arguments instead of prose claims.

## Takeaways

- **Schema-level and value-level tool hallucination are different bugs.** One is caught by validating structure against a fixed registry. The other requires validating content against conversation history, which is a data-provenance problem, not a JSON-schema problem.
- **"The call validated" is not the same claim as "the call is safe."** A perfectly well-formed call to a real, write-path tool with a fabricated identifier is often more dangerous than an invented tool name, precisely because nothing rejects it automatically.
- **Any required argument that identifies a specific real-world entity — an ID, an account number, a case number — deserves a provenance check**, not just a type check. If the model can't point to where it got the value, it shouldn't be allowed to send it.

**Related:** [Tool-Call Hallucination: Inventing Calls, Arguments, or Results](/learn/hallucinations/tool-call-hallucination), [Grounding: Constraining Answers to Supplied Sources](/learn/hallucinations/grounding-with-source-documents), [Guardrails for High-Stakes Output](/learn/hallucinations/guardrails-for-high-stakes-output), [Intrinsic vs. Extrinsic Hallucination](/learn/hallucinations/intrinsic-vs-extrinsic-hallucination)
