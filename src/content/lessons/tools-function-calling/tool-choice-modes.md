---
title: "Tool Choice: auto, required, none, and Named"
track: "tools-function-calling"
status: live
summary: "The four ways to control whether and which tool a model calls, with the request shape for each."
duration: "6 min read"
---

Every tool-calling request carries a second, quieter decision alongside the tool list itself: how much freedom does the model have to use them? That's `tool_choice`, and getting it wrong produces two very different bugs — a model that chats when it should act, or one that calls tools you never wanted touched.

## What it is

`tool_choice` (the field is named that in the OpenAI and Anthropic APIs; Gemini calls the equivalent `function_calling_config.mode`) is a request parameter that sits next to your `tools` array and constrains what the model is *allowed* to return on this turn. It doesn't change which tools exist — it changes the model's options for using them. Four modes cover essentially every real use case:

| Mode | Model must... | Typical spelling |
|---|---|---|
| auto | decide freely: text, one tool, or several | `"tool_choice": "auto"` (default if omitted) |
| required / any | call *some* tool, but picks which | `"tool_choice": "required"` (OpenAI) / `{"type": "any"}` (Anthropic) |
| none | call no tool, text only | `"tool_choice": "none"` |
| named | call exactly the tool you specify | `{"type": "function", "function": {"name": "get_weather"}}` (OpenAI) / `{"type": "tool", "name": "get_weather"}` (Anthropic) |

## The mental model

Think of `tools` as the menu and `tool_choice` as the instruction to the waiter about how the customer is allowed to order. `auto` hands the customer the menu and says "order whatever you like, including nothing." `required` says "you must order something, your pick." `none` takes the menu away for this round even though it's sitting on the table. A named choice is you ordering *for* them — the model still fills in the arguments (how well-done, what sides), but which tool runs is no longer its call.

This is a per-request setting, not a per-conversation one. You can start a loop with a named tool to force a first step, flip to `auto` once the model has data to reason over, and drop to `none` for the turn where you just want it to summarize what happened — see [Sequential Multi-Step Tool Use](/learn/tools-function-calling/sequential-multi-step-tool-use) for a loop that changes `tool_choice` between steps.

## Why it works this way

The model's output is fundamentally next-token prediction over a constrained decode — see [Tool Calling Is Still Text-In, Text-Out](/learn/tools-function-calling/tool-calling-still-text-in-text-out). `tool_choice` doesn't add new capability to the model; it changes what the sampler is permitted to emit. `none` masks out the tool-call tokens entirely. A named choice pins the function-name token(s) and only lets the argument tokens vary. `auto` leaves the full distribution open, including plain text. This is why forcing is reliable rather than "the model usually complies" — it's a decoding constraint, not a suggestion baked into the prompt.

## A concrete example (shown)

Same tool, three requests, three different allowed outputs.

```json
// auto — model may answer in text or call the tool
{
  "model": "claude-...",
  "tools": [{"name": "get_weather", "input_schema": {"type": "object", "properties": {"city": {"type": "string"}}}}],
  "tool_choice": {"type": "auto"},
  "messages": [{"role": "user", "content": "What's the weather like in general in October?"}]
}
```

Here the model will likely answer in text — "October weather varies by region..." — because no city was given and nothing forces a call.

```json
// required — model must call something, but any tool qualifies
{
  "tool_choice": {"type": "any"},
  "messages": [{"role": "user", "content": "What's the weather like in general in October?"}]
}
```

With only one tool defined, `any` collapses to forcing that tool even though the question doesn't really warrant it — a sign `any` is the wrong choice with a single-tool registry.

```json
// named — model must call get_weather, and only fills the arguments
{
  "tool_choice": {"type": "tool", "name": "get_weather"},
  "messages": [{"role": "user", "content": "What's the weather like in general in October?"}]
}
```

The response is guaranteed to be a `get_weather` call. The model will do its best to fill `city` even though none was given — it cannot decline or ask a clarifying question. That's the tradeoff explored in full in [Forcing extract_invoice Every Time](/learn/tools-function-calling/forcing-a-specific-tool-worked).

## Where it shows up

- **Structured extraction pipelines** that always need one shaped output — force the extraction tool every call.
- **Routers** at the top of a multi-tool agent — `required`/`any` when you know an action is coming but haven't decided which.
- **Guardrail turns** — `none` when you want the model to explain, summarize, or ask a clarifying question without the temptation to call anything.
- **Provider differences matter**: Anthropic exposes `disable_parallel_tool_use` alongside `tool_choice` to also stop a named or `any` choice from firing multiple tools at once; OpenAI's `parallel_tool_calls: false` does the same job. Check [Tool Calling Across Providers](/learn/tools-function-calling/tool-calling-across-providers) before assuming one provider's spelling works on another.

## Watch out for

- **Forcing with an empty or wrong tool list.** A named choice for a tool that isn't in `tools` is a request error on every major provider, not a soft failure — validate before you send.
- **`any`/`required` with one tool** is just a clunkier named choice — use the named form directly so intent is explicit in the request itself.
- **Confusing `none` with omitting `tools` entirely.** `none` still pays the schema-token cost of every defined tool even though none can be called — if you don't need the model aware of them this turn, drop `tools` instead of setting `none`.

## Where next

[When to Force and When to Let It Decide](/learn/tools-function-calling/when-to-force-vs-auto) turns these four modes into a decision framework. [Forcing extract_invoice Every Time](/learn/tools-function-calling/forcing-a-specific-tool-worked) walks a real pipeline through the auto-vs-forced tradeoff end to end.

**Related:** [Tool Choice and Forcing Tool Use](/learn/tools-function-calling/tool-choice-and-forcing-tool-use), [Sequential Multi-Step Tool Use](/learn/tools-function-calling/sequential-multi-step-tool-use), [Structured Output vs. Tool Calls](/learn/tools-function-calling/structured-output-vs-tool-calls), [Tool Calling Across Providers](/learn/tools-function-calling/tool-calling-across-providers)
