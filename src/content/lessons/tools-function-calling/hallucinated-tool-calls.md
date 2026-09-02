---
title: "When the Model Invents a Tool"
track: "tools-function-calling"
status: live
summary: "A rigorous look at calls naming a tool or parameter that doesn't exist — detection, correction, and why it happens at all."
duration: "8 min read"
---

*This is the deep-dive on one specific failure: the model names a tool, or a parameter, that isn't in your registry at all. For the wider family of tool-call hallucination — including invented arguments and fabricated results — see [Tool-Call Hallucination](/learn/hallucinations/tool-call-hallucination). This lesson goes narrower and deeper on just the naming problem. Optional depth: skip on a first pass and come back once you've seen it in production.*

## What it is

A hallucinated tool call names something that was never offered. Two shapes:

- **Fabricated tool name.** The model emits `tool_use` with `name: "lookup_customer_record"`, and no such tool is registered — the closest real one is `get_customer`.
- **Fabricated parameter.** The tool is real, but the call includes an argument the schema never defined — `update_ticket(id=4471, status="closed", notify_customer=true)` when `notify_customer` isn't a field on `update_ticket` at all.

Both are distinct from a *bad* argument (a real field, wrong value — covered in [Returning Errors the Model Can Act On](/learn/tools-function-calling/returning-actionable-errors)). Here the field or tool itself doesn't exist. That distinction matters because the fix is different: a bad value is a validation problem; a nonexistent name is a registry problem, and often a prompting or schema-design problem upstream of that.

## Why it happens

The mechanism is pattern completion, not confusion in any human sense. A model producing a `tool_use` block is generating a name and a set of key-value pairs that *look like* a well-formed call — and "well-formed" is judged against everything it has seen, not just the specific tool list in front of it right now. A few conditions make the gap wider:

**Tool-name collision across contexts.** If the model's training or recent conversation includes many APIs with a `get_customer_record`-shaped tool, and your registry actually has `get_customer`, the more common name across that distribution can leak through — especially under time pressure to "just produce a call" rather than double-check the exact registered name.

**A long or crowded tool list.** With dozens of tools in context, exact names blur together, and the model can fuse two real tool names into one plausible-sounding but nonexistent one — see [Tool Selection at Scale](/learn/tools-function-calling/tool-selection-at-scale) for why large tool lists degrade selection accuracy generally, of which this is one symptom.

**A gap in what's offered.** If the user's request implies an action with no matching tool — "also notify the customer" when no notification tool exists — the model can either say so, or generate a plausible-looking call to a tool (or parameter) that would do the job if it existed. Under pressure to be helpful and complete, the second option is a common failure.

**Ambiguous or missing negative signal in the description.** Nothing in most tool descriptions says "and nothing else exists for this purpose." Absence of a tool isn't information the model can read directly — it has to infer it, and inference is where hallucination lives.

## Detection: the check that actually catches it

The good news: this class of failure has a mechanical, zero-ambiguity detector — a fabricated name is one that isn't a key in your registry. No model call, no heuristic, no judgment required.

```python
REGISTRY = {
    "get_customer": get_customer_handler,
    "update_ticket": update_ticket_handler,
    "search_kb": search_kb_handler,
}

def dispatch(tool_name: str, args: dict) -> dict:
    if tool_name not in REGISTRY:
        return tool_error_unknown_tool(tool_name)

    handler, schema = REGISTRY[tool_name]
    known_fields = set(schema["properties"])
    unknown_args = set(args) - known_fields
    if unknown_args:
        return tool_error_unknown_params(tool_name, unknown_args, known_fields)

    return {"ok": True, "result": handler(**args)}
```

Run this check *before* validation and *before* execution — a name that isn't registered has nothing to validate against, and an unregistered parameter should never silently pass through to a real function call (`**args` with an extra key will crash a strict handler, or worse, get silently ignored by a permissive one — either way, don't find out from the traceback).

## Correction: the response that actually helps

Naming the mismatch beats naming the absence. Compare:

```json
// Unhelpful — states the failure, gives no path forward
{"ok": false, "error": "unknown_tool", "message": "Tool not found."}
```

```json
// Actionable — gives the model something to complete against
{"ok": false, "error": "unknown_tool",
 "message": "'lookup_customer_record' is not a registered tool. Did you mean 'get_customer'? Full list: ['get_customer', 'update_ticket', 'search_kb']."}
```

The "did you mean" suggestion isn't cosmetic — it's the single highest-leverage line in the message. A cheap way to generate it without another model call: string similarity against the registry.

```python
from difflib import get_close_matches

def suggest_tool(bad_name: str, registry: dict) -> str | None:
    matches = get_close_matches(bad_name, registry.keys(), n=1, cutoff=0.5)
    return matches[0] if matches else None
```

For an unregistered parameter, the same shape applies: name the field that doesn't exist, and list what does.

```json
{"ok": false, "error": "unknown_parameter",
 "message": "'notify_customer' is not a field on 'update_ticket'. Valid fields: ['ticket_id', 'status']. If you need to notify the customer, no tool for that exists yet — tell the user directly instead of assuming one does."}
```

That last sentence matters more than it looks: it explicitly gives the model permission to say "I can't do that part" rather than continuing to guess at a call shape that will keep failing. This is the same principle [Tool-Call Hallucination](/learn/hallucinations/tool-call-hallucination) closes on — a model allowed to say "no such capability exists" hallucinates less than one implicitly pushed to always produce something.

## Reducing the rate, not just catching it

Detection catches every instance after the fact. Reducing how often it happens is a schema and prompt problem, tackled upstream:

- **Shrink and disambiguate the tool list.** Fewer tools, with names that don't share a stem, cut down on fusion errors. `get_customer` and `get_customer_orders` invite confusion; `get_customer` and `list_orders_for_customer` don't. See [Writing Tool Descriptions Models Actually Follow](/learn/tools-function-calling/writing-tool-descriptions-models-follow) for naming discipline.
- **State the boundary explicitly in the system prompt.** "Only call tools from the list below. If no tool matches what's needed, say so — do not invent one" is cheap and measurably reduces fabricated names, because it converts an implicit constraint into an explicit instruction the model can follow directly rather than infer.
- **Use structural tool calling, not text-parsed calls.** APIs that emit tool calls as a distinct, schema-constrained message type close off a related but different problem — the model narrating something that *looks like* a call in prose without it being a real, dispatchable call at all. That's covered fully in [Executing Tool Calls Safely](/learn/tools-function-calling/executing-tool-calls-safely).
- **At scale, retrieve instead of listing everything.** If the registry is genuinely large, tool-selection-by-retrieval (surfacing only the relevant subset per turn) reduces the pool the model can hallucinate against — see [Tool Selection at Scale](/learn/tools-function-calling/tool-selection-at-scale).

None of these get the rate to zero. That's why detection stays mandatory even after every mitigation — a schema or prompt change is a rate reduction, not a guarantee, and the registry check costs nothing to run on every call regardless.

## Where it shows up

The detection check belongs in the same dispatcher layer as [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-errors-and-retries) — a hallucinated name should be caught and routed back to the model in the same place bad arguments are, just with its own error code. If a model keeps inventing the same nonexistent tool across attempts, that's a job for [Stopping Runaway Loops](/learn/tools-function-calling/infinite-loop-and-retry-caps) — a "did you mean" suggestion that never lands after two attempts is a sign to stop and escalate, not to keep suggesting.

**Related:** [Tool-Call Hallucination](/learn/hallucinations/tool-call-hallucination), [A Taxonomy of Tool-Calling Failures](/learn/tools-function-calling/taxonomy-of-tool-failures), [Writing Tool Descriptions Models Actually Follow](/learn/tools-function-calling/writing-tool-descriptions-models-follow), [Tool Selection at Scale](/learn/tools-function-calling/tool-selection-at-scale), [Executing Tool Calls Safely](/learn/tools-function-calling/executing-tool-calls-safely)
