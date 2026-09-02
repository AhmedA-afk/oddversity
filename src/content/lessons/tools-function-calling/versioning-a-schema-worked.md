---
title: "Evolving send_email v1 to v2"
track: "tools-function-calling"
status: live
summary: "Trace one migration — send_email gains cc, body renames to html_body — through the backward-compatible path and the breaking path."
duration: "7 min read"
---

Two ways to ship the exact same change. Same new field, same rename, same underlying implementation. What differs is what happens to the agent that's mid-conversation when you deploy — and that difference is the whole reason versioning strategy matters more than versioning cleverness.

## The setup

Starting schema, `send_email` v1, already in production:

```json
{
  "name": "send_email",
  "description": "Send an email on the user's behalf.",
  "input_schema": {
    "type": "object",
    "properties": {
      "to": { "type": "string" },
      "subject": { "type": "string" },
      "body": { "type": "string", "description": "Plain text or HTML body of the email." }
    },
    "required": ["to", "subject", "body"]
  }
}
```

The change you need to ship: add a `cc` field for carbon-copy recipients, and rename `body` to `html_body` because the team has decided email bodies are always HTML going forward, and the old name was ambiguous about that.

A conversation, call it Session A, started five minutes before you deploy. It has `send_email` v1's schema already in its context. It will, at some point in the next several turns, produce a tool call shaped like:

```json
{ "to": "jordan@example.com", "subject": "Notes", "body": "<p>See attached.</p>" }
```

That call is coming, and it's coming with the old field name, regardless of what you deploy in the meantime — the model built it from the schema it saw at the start of the conversation.

## Step by step: the breaking path

**Step 1 — deploy the new schema, remove the old field entirely:**

```json
{
  "name": "send_email",
  "description": "Send an email on the user's behalf.",
  "input_schema": {
    "type": "object",
    "properties": {
      "to": { "type": "string" },
      "cc": { "type": "array", "items": { "type": "string" } },
      "subject": { "type": "string" },
      "html_body": { "type": "string" }
    },
    "required": ["to", "subject", "html_body"]
  }
}
```

> **Why this step?** This is the naive version of the change — it's what "just rename the field" looks like if you don't think about who's mid-conversation. It's correct for every *new* conversation started after deploy.

**Step 2 — Session A's in-flight call arrives:**

```json
{ "to": "jordan@example.com", "subject": "Notes", "body": "<p>See attached.</p>" }
```

Your dispatcher, updated to match the new schema, expects `html_body` and `required` says it must be present. It isn't — `body` is present instead, and `html_body` is missing.

> **Why this step?** This is the moment the breaking path breaks. Session A generated a perfectly valid call against the schema *it* had. Your dispatcher, running the new contract, sees a call missing a required field. This isn't a model error and it isn't recoverable by asking the model to retry with better information — the model doesn't know the field got renamed underneath it mid-conversation.

**Step 3 — the failure surfaces to the user:**

```python
def handle_send_email(call_args: dict) -> dict:
    if "html_body" not in call_args:
        raise ValueError("Missing required field: html_body")
    ...
```

Session A's agent gets a tool error back, has no way to self-correct (it doesn't know the schema changed — see /learn/tools-function-calling/self-correction-on-bad-tool-calls for why self-correction assumes the model can *see* what's wrong, and here it can't), and either the user sees a broken "sorry, something went wrong" moment or the agent's retry loop burns a turn producing the exact same call again, since nothing in its context tells it what to change.

## Step by step: the backward-compatible path

**Step 1 — deploy an additive schema: add `cc` and `html_body`, keep `body` for now:**

```json
{
  "name": "send_email",
  "description": "Send an email on the user's behalf. Body content should be HTML.",
  "input_schema": {
    "type": "object",
    "properties": {
      "to": { "type": "string" },
      "cc": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Additional recipients to carbon-copy. Omit if none."
      },
      "subject": { "type": "string" },
      "html_body": {
        "type": "string",
        "description": "HTML content of the email body."
      }
    },
    "required": ["to", "subject", "html_body"]
  }
}
```

> **Why this step?** `body` is deliberately dropped from the *advertised* schema — new conversations only ever see `html_body`, so they never learn the old name. But it hasn't been removed from what the dispatcher accepts, which is the part that actually matters for Session A.

**Step 2 — the dispatcher accepts both shapes:**

```python
def handle_send_email(call_args: dict) -> dict:
    if "body" in call_args and "html_body" not in call_args:
        log_deprecated_field_use("send_email", field="body", session_age=get_session_age())
        call_args["html_body"] = call_args.pop("body")

    if "html_body" not in call_args:
        raise ValueError("Missing required field: html_body")

    cc = call_args.get("cc", [])
    return execute_send({
        "to": call_args["to"],
        "cc": cc,
        "subject": call_args["subject"],
        "html_body": call_args["html_body"],
    })
```

> **Why this step?** Session A's exact same call — `{"to": ..., "subject": ..., "body": "<p>See attached.</p>"}` — now succeeds. The dispatcher detects the old field name, normalizes it to `html_body`, logs that it happened (so you can watch usage of the deprecated field trend to zero), and proceeds. Session A never sees an error and never needs to know anything changed.

**Step 3 — a new conversation, started after deploy, calls the tool:**

```json
{ "to": "jordan@example.com", "subject": "Notes", "cc": ["sam@example.com"], "html_body": "<p>See attached.</p>" }
```

> **Why this step?** This call already uses the new shape, because the schema this conversation saw only ever advertised `html_body` and `cc`. No normalization branch fires; it flows straight through. Old and new conversations are both correctly served by the same dispatcher, at the same time, with zero coordination required between them.

**Step 4 — close the window:**

Once `log_deprecated_field_use` shows zero hits for a stretch that comfortably exceeds your longest realistic session lifetime, remove the `body`-handling branch and the field is fully retired — no agent still holds a schema old enough to send it.

## Where it breaks (+fix)

The backward-compatible path has one sharp edge: if a conversation somehow sends *both* `body` and `html_body` — plausible if a model partially "learned" the new field name from a few-shot example elsewhere in a long context while still nominally working from the old schema — the dispatcher above silently prefers `html_body` because of the `and "html_body" not in call_args` guard. That's the right default, but it's worth logging *that* case distinctly too (both fields present) rather than lumping it in with clean old-shape calls, since it can be an early signal of exactly the kind of context confusion that's worth investigating before it becomes a pattern.

## Takeaways

- The breaking path isn't wrong because the *end state* is bad — both paths converge on the same final schema. It's wrong because it has a window, however short, where valid old calls are treated as invalid.
- The backward-compatible path costs a few lines of dispatcher code and a logging call. That's cheap insurance against a user-visible failure in a conversation that was already succeeding before you shipped anything.
- Removing the deprecated path isn't optional cleanup — plan the removal date when you ship the compatibility branch, driven by real usage data, not by "we'll get to it."

**Related:** /learn/tools-function-calling/schema-versioning-strategies · /learn/tools-function-calling/tool-schema-versioning · /learn/tools-function-calling/self-correction-on-bad-tool-calls · /learn/tools-function-calling/handling-tool-errors-and-retries · /learn/tools-function-calling/parameter-design-patterns
