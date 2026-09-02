---
title: "Self-Correction in a Full Trace"
track: "tools-function-calling"
status: live
summary: "A complete annotated transcript of a model getting an enum wrong, reading the error, and fixing the call unaided."
duration: "5 min read"
---

Reading about self-correction is one thing; watching the exact tokens that trigger it is another. Here's a full trace, turn by turn.

## The setup

A support agent has one tool, `update_ticket`, with this schema:

```json
{
  "name": "update_ticket",
  "description": "Update the status of a support ticket.",
  "input_schema": {
    "type": "object",
    "properties": {
      "ticket_id": { "type": "integer" },
      "status": {
        "type": "string",
        "enum": ["open", "in_progress", "closed"]
      }
    },
    "required": ["ticket_id", "status"]
  }
}
```

The user says: *"Ticket 4471 is done, close it out."* A reasonable request, an unambiguous intent — and, as it turns out, a model that reaches for the wrong literal string for "done."

## Step by step

### Turn 1: the model calls the tool

```json
{
  "type": "tool_use",
  "name": "update_ticket",
  "input": { "ticket_id": 4471, "status": "done" }
}
```

> **Why this step?** `"done"` is a completely reasonable English word for what the user asked for — it's just not one of the three values the schema actually allows. This is the ordinary case [A Taxonomy of Tool-Calling Failures](/learn/tools-function-calling/taxonomy-of-tool-failures) calls "bad or missing arguments": a real tool, a plausible-looking value, wrong against the contract. Nothing here suggests the model misunderstood the user — it misunderstood the schema.

### Turn 1, continued: validation catches it before execution

```python
try:
    args = UpdateTicketArgs(**raw_input)
except ValidationError as e:
    result = format_validation_error(e)
    # {"ok": False, "error": "invalid_enum",
    #  "message": "'status' must be one of ['open','in_progress','closed'], got 'done'"}
```

> **Why this step?** Nothing touches the real ticket system. The call is rejected at the schema boundary, the same discipline covered in [Self-Correction When the Model Calls a Tool Wrong](/learn/tools-function-calling/self-correction-on-bad-tool-calls) — validate first, so a wrong guess costs a turn, not a bad write to production data.

### Turn 1: the error goes back as a tool result

```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_01A...",
  "content": "{\"ok\": false, \"error\": \"invalid_enum\", \"message\": \"'status' must be one of ['open','in_progress','closed'], got 'done'\"}"
}
```

> **Why this step?** This is the entire mechanism described in [How a Model Corrects Its Own Call](/learn/tools-function-calling/self-correction-mechanics): the error is just a tool result, occupying the exact slot a successful result would. The model reads it on the next turn like any other observation — no special handling required on either side.

### Turn 2: the model reissues the call

```json
{
  "type": "tool_use",
  "name": "update_ticket",
  "input": { "ticket_id": 4471, "status": "closed" }
}
```

> **Why this step?** `"closed"` is the member of the enum that best matches "done" — the model didn't need to be told which value to pick, only that its first guess wasn't a member of the valid set. The message named the constraint (`must be one of [...]`) and the violation (`got 'done'`); picking a valid member closest to the original intent is squarely within what the model can do with that information alone. `ticket_id` carried over unchanged, because nothing about it was ever wrong.

### Turn 2, continued: it succeeds

```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_01B...",
  "content": "{\"ok\": true, \"result\": {\"ticket_id\": 4471, \"status\": \"closed\"}}"
}
```

### Turn 3: the model reports back

*"Done — ticket 4471 is now closed."*

Two tool calls, one silent correction, a user who never saw the intermediate failure at all — the retry happened entirely between the model and the tool layer.

## Where it breaks (+ fix)

Change one thing: the error message loses its specificity.

```json
{"ok": false, "error": "Bad Request"}
```

Now turn 2 has nothing to condition on beyond "that call failed." A plausible next call:

```json
{ "ticket_id": 4471, "status": "done" }
```

The identical wrong call, resent — because from the model's side, nothing informative changed between turn 1 and turn 2. It might also guess a different wrong value (`"complete"`, `"resolved"`), switch tools entirely, or give up and tell the user it couldn't complete the request. All are reasonable completions of "a call failed and I don't know why," which is exactly the failure mode [Returning Errors the Model Can Act On](/learn/tools-function-calling/returning-actionable-errors) is built to prevent.

**The fix** is the message this trace actually used: name the field (`status`), name the constraint (`must be one of [...]`), name the offending value (`got 'done'`). That's the whole difference between a self-correcting agent and one stuck re-sending the same broken call — see [Stopping Runaway Loops](/learn/tools-function-calling/infinite-loop-and-retry-caps) for what happens when that difference doesn't get fixed and the retry keeps failing the same way indefinitely.

## Takeaways

- The correction happened with zero special-casing — no retry-with-hint logic, no second prompt telling the model to "please fix the status field." The error message alone did all the work.
- Validation ran *before* the real tool executed, so the wrong guess never touched the ticket system — the cost of the mistake was one wasted turn, not a bad write.
- The user never saw the failure. Self-correction that resolves within the model-tool loop is invisible to the person who asked for the change — which is the outcome to aim for whenever the failure is genuinely model-fixable.
- Swap the error message for a vague one and the exact same model, on the exact same call, fails to recover. The model's capability didn't change — the information available to it did.

**Related:** [How a Model Corrects Its Own Call](/learn/tools-function-calling/self-correction-mechanics), [Returning Errors the Model Can Act On](/learn/tools-function-calling/returning-actionable-errors), [Self-Correction When the Model Calls a Tool Wrong](/learn/tools-function-calling/self-correction-on-bad-tool-calls), [Stopping Runaway Loops](/learn/tools-function-calling/infinite-loop-and-retry-caps)
