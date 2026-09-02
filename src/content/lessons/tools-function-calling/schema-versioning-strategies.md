---
title: "Versioning Schemas Without Breaking Agents"
track: "tools-function-calling"
status: live
summary: "In-flight agents may hold an old schema while you deploy a new one — additive-only changes, deprecation windows, and version suffixes keep both working."
duration: "7 min read"
---

You deploy a schema change at 2pm. An agent that started its conversation at 1:55pm is still running, holding the *old* schema in its context from the turn where tools were first sent to it, and will keep calling the tool the old way until that conversation ends. Your dispatcher needs to handle both shapes at once, because it will receive both, whether you planned for it or not.

## What it is

Schema versioning is the discipline of changing a tool's contract — its parameters, types, required set, or behavior — without breaking the callers that are mid-conversation when the change ships. This is a distinct problem from versioning a REST API, because the caller isn't a client you control that you can force to upgrade; it's a model, mid-conversation, that generated a tool call based on whatever schema was in its context *at the start of that conversation turn*. You cannot push an upgrade to a model that's already reasoning with an old schema in its context window — the old shape is baked into everything downstream of that point until the conversation ends.

## The mental model

Think of every live conversation as having implicitly "checked out" the schema version that was current when tools were first sent to it. Long-running agent sessions, queued background jobs that resume a conversation, and cached prompts can all mean that "old" schema is still being used well after you've shipped a "new" one. Your dispatcher — the code that receives a tool call and executes it — is the one place that sees calls from every version at once, so it's the one place versioning has to be handled, not the schema definition itself.

This reframes the whole problem: you're not really versioning the schema so much as versioning the *contract your dispatcher honors*, and keeping the schema you advertise to new conversations as close to that contract as you can while giving old conversations a grace period.

## Why it works this way

Four practical strategies fall out of that framing, roughly in order of how disruptive they are.

**Additive-only changes** are free. Adding a new optional field, or a new enum member alongside existing ones, doesn't invalidate any call an agent holding the old schema would make — the old agent simply never populates the new field, and your dispatcher treats its absence as "not specified," which it already has to handle for any optional field. This is why /learn/tools-function-calling/parameter-design-patterns pushes you toward honest, minimal `required` sets in the first place: a schema with few required fields has more room to grow additively later without a breaking change ever becoming necessary.

**Deprecation windows** handle the case where a field or a whole tool needs to go away, but can't disappear atomically. You keep the old shape accepted — silently, or with a logged warning — for a fixed window after the new shape ships, giving every in-flight conversation and every conversation started shortly after the schema change time to complete naturally before you remove the old path. The window length should be driven by your actual conversation lifetimes: if sessions rarely run longer than an hour, a day's grace period covers essentially everyone; if agents can run for days, size the window to match.

**Version suffixes** (`send_email_v2` registered alongside `send_email`) are the most disruptive-looking but often the safest choice for a genuinely breaking change — a renamed field, a changed type, a different required set. Both tools are advertised simultaneously; new conversations are steered toward the new tool (via description wording, or by only registering `v1` for conversations already using it); old conversations keep calling `send_email` and your dispatcher keeps a code path alive for it, unmodified, for exactly as long as any live agent might still call it. This avoids ever asking your dispatcher to guess which "shape" an ambiguous-looking call is using — the name itself disambiguates.

**Routing old-shaped calls at the dispatcher** is the fallback for changes you can't cleanly express as additive or version-suffixed — say, a field that's genuinely renamed with no graceful overlap. The dispatcher inspects the incoming call, detects which shape it matches (old field present vs. new field present), and normalizes both into one internal representation before executing. This works but it's the strategy with the most ongoing code cost, because the detection logic has to live in your dispatcher indefinitely, or until you're confident every old-shaped call has aged out.

## A concrete example

A minimal deprecation-window dispatcher for a field rename, `body` to `html_body`:

```python
def handle_send_email(call_args: dict) -> dict:
    if "body" in call_args and "html_body" not in call_args:
        log_deprecated_field_use("send_email", "body")
        call_args["html_body"] = call_args.pop("body")
    return execute_send_email(call_args)
```

This is deliberately small: it detects the old shape, logs it (so you know when it's safe to remove), and normalizes to the new internal shape before doing the real work. The schema itself, meanwhile, can advertise `html_body` as the documented field going forward while quietly still accepting `body` for the length of the deprecation window — see /learn/tools-function-calling/versioning-a-schema-worked for this exact scenario traced through in full, including what happens to an agent that's mid-conversation when each version of the change ships.

## Where it shows up

Any tool that's been in production long enough to need a second look at its schema runs into this — the question isn't whether you'll need to version a schema, it's whether you decide the strategy deliberately or discover it during an incident when an old-shaped call starts failing in your dispatcher with no handling in place.

## Watch out for

- **Shipping a breaking change and assuming every conversation restarts immediately.** It doesn't. Long-running agents, resumed sessions, and cached system prompts all extend how long the old schema stays live in the wild.
- **Renaming a field instead of adding a new one and deprecating the old.** A rename is unavoidably breaking; almost every rename can instead be modeled as "add the new field, accept the old one for a window, then remove it" — which is additive at every step except the last.
- **Never removing the deprecated path.** A deprecation window that never closes isn't a strategy, it's permanent dual-maintenance. Log usage of the old shape and set an actual date to remove it once usage drops to zero.

## Where next

/learn/tools-function-calling/versioning-a-schema-worked traces one migration — `send_email` gaining `cc` and renaming `body` to `html_body` — through both the backward-compatible path and the breaking path, showing exactly what an in-flight agent experiences in each.

**Related:** /learn/tools-function-calling/tool-schema-versioning · /learn/tools-function-calling/versioning-a-schema-worked · /learn/tools-function-calling/parameter-design-patterns · /learn/tools-function-calling/schema-design-common-mistakes · /learn/tools-function-calling/enum-vs-freeform-parameters
