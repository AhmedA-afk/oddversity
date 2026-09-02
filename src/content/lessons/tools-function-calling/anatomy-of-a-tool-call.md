---
title: "Anatomy of a Tool Call"
track: "tools-function-calling"
status: live
summary: "The exact JSON shape of a tool call and its result, in both Anthropic and OpenAI's dialects."
duration: "6 min read"
---

Every tool call, no matter the provider, is two messages: one where the model asks for something, and one where you tell it what happened. Once you can point at both halves in raw JSON, the rest of this track is detail on top of a shape you already recognize.

## What it is

A tool call is a specially-typed piece of an assistant message — not free text, not a separate API endpoint. It carries three things: a **name** (which tool), an **id** (so the result can be matched back to this specific call), and **arguments** (the input, shaped by the schema you supplied). The follow-up **tool result** is a message you construct, carrying the same id and whatever your code produced when it actually ran the tool.

That's the whole vocabulary. Everything provider-specific below is just where these three-plus-one fields get placed in the JSON.

## The mental model

Think of the id as a claim check. The model hands you a ticket ("claim #abc123, item: `get_weather`, details: Tokyo"). You go get the item. You hand the item back with the same ticket number. The model never sees the ticket-fetching process — only the ticket it wrote and the item you return against it. If you return an item with the wrong ticket number, or no ticket at all, the model has no way to connect its request to your answer.

## Why it works this way

The id exists because a single assistant turn can contain *multiple* tool calls at once (see [Parallel Tool Calls](/learn/tools-function-calling/parallel-tool-calls)) — without an id, you'd have no way to say which result belongs to which request when three calls go out in the same breath. The arguments are a separate structured field (not embedded in prose) because your code needs to parse them mechanically, every time, without guessing at phrasing — that's the same motivation behind [structured output](/learn/structured-outputs/why-structured-output) in general, applied specifically to actions.

## A concrete example (shown)

Here's the same moment — the model asking for Tokyo's weather — in both dialects.

**Anthropic (`tool_use` block, inside `response.content`):**

```json
{
  "type": "tool_use",
  "id": "toolu_01A2b3C4d5E6f7G8h9",
  "name": "get_weather",
  "input": { "city": "Tokyo" }
}
```

The reply you send back is a `user`-role message containing a `tool_result` block keyed by that same id:

```json
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_01A2b3C4d5E6f7G8h9",
      "content": "18°C, cloudy"
    }
  ]
}
```

**OpenAI (`tool_calls` array, inside the assistant message):**

```json
{
  "role": "assistant",
  "content": null,
  "tool_calls": [
    {
      "id": "call_9xK2mQ",
      "type": "function",
      "function": {
        "name": "get_weather",
        "arguments": "{\"city\": \"Tokyo\"}"
      }
    }
  ]
}
```

The reply is its own `tool`-role message, keyed by `tool_call_id`:

```json
{
  "role": "tool",
  "tool_call_id": "call_9xK2mQ",
  "content": "18°C, cloudy"
}
```

Two details worth staring at: Anthropic's `input` is already a JSON object, while OpenAI's `arguments` is a **string** you must `json.loads()` yourself — parse it, don't regex it, because escaping inside that string can be non-obvious. And the result goes back on a *different* role in each case: `user` for Anthropic, a dedicated `tool` role for OpenAI. Mixing these up — sending an Anthropic-shaped result to an OpenAI conversation — is a top source of "the model just ignored my tool result" bug reports. [Tool Calling Across Providers](/learn/tools-function-calling/tool-calling-across-providers) has the full comparison table, including Gemini and open-weight models.

## Where it shows up

You'll touch this shape at three points in any integration: reading `tool_use`/`tool_calls` off the response, constructing the matching result message (see [Returning Tool Results to the Model](/learn/tools-function-calling/returning-tool-results-to-the-model)), and — if a call fails — marking that result as an error rather than silently returning nothing (see [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-tool-errors-and-retries)).

## Watch out for

- **Forgetting to parse OpenAI's `arguments` string.** It looks like JSON in the debugger and feels like you could string-match it. You can't reliably — always `json.loads()` it.
- **Losing the id.** If you extract `name` and `input`/`arguments` into your own data structure and drop the id along the way, you can't build a valid result message afterward.
- **Assuming one call per turn.** A response can contain zero, one, or several tool-call blocks in the same message — code that grabs "the" tool call with `response.content[0]` breaks the moment the model calls two tools at once.

## Where next

Now that you can read the wire format, [The Agent Loop](/learn/tools-function-calling/the-tool-call-loop) shows how these two messages fit into the repeating cycle that drives a real conversation, and [Your First Tool Call, End to End](/learn/tools-function-calling/first-tool-call-walkthrough) has you build one from scratch in both SDKs.

**Related:** [Tools Are the Model's Only Hands](/learn/tools-function-calling/tools-as-the-models-hands), [The Agent Loop](/learn/tools-function-calling/the-tool-call-loop), [Tool Calling Across Providers](/learn/tools-function-calling/tool-calling-across-providers), [Returning Tool Results to the Model](/learn/tools-function-calling/returning-tool-results-to-the-model), [Parallel Tool Calls](/learn/tools-function-calling/parallel-tool-calls)
