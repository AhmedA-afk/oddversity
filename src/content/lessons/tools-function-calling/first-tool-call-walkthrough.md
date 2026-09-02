---
title: "Your First Tool Call, End to End"
track: "tools-function-calling"
status: live
summary: "Build one working get_weather round trip against both the Anthropic and OpenAI SDKs, and run it."
duration: "9 min read"
---

Reading about tool calls only gets you so far. This lesson has you write and run one — the same `get_weather` example from [The Whole Game](/learn/tools-function-calling/tool-calling-whole-game), in both major SDKs, so you can see the shape from [Anatomy of a Tool Call](/learn/tools-function-calling/anatomy-of-a-tool-call) turn into working code.

## What we're building

A script that asks "What's the weather in Tokyo?", lets the model request a `get_weather` tool call, runs a stub function locally, feeds the result back, and prints the model's final answer. No real weather API — the stub returns a fixed value so you can focus entirely on the plumbing.

## Setup

```bash
pip install anthropic openai
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
```

Both examples share the same stub:

```python
def get_weather(city: str) -> str:
    """Pretend weather lookup — swap for a real API call later."""
    fake_data = {"Tokyo": "18°C, cloudy", "Lisbon": "24°C, sunny"}
    return fake_data.get(city, "unknown city")
```

## Build it

### Step 1 — Declare the tool schema (Anthropic)

```python
import anthropic

client = anthropic.Anthropic()

tools = [{
    "name": "get_weather",
    "description": "Get the current weather for a city",
    "input_schema": {
        "type": "object",
        "properties": {
            "city": {"type": "string", "description": "City name, e.g. Tokyo"}
        },
        "required": ["city"]
    }
}]
```

> **Why this step?** The model never sees your Python function — it only sees this schema. If `description` is vague or `city` isn't marked `required`, the model may call the tool with missing or malformed arguments. [Designing a Tool Schema](/learn/tools-function-calling/designing-a-tool-schema) goes deep on getting this right.

### Step 2 — Send the first request

```python
messages = [{"role": "user", "content": "What's the weather in Tokyo?"}]

response = client.messages.create(
    model="claude-opus-5",
    max_tokens=1024,
    tools=tools,
    messages=messages,
)

print(response.stop_reason)  # "tool_use" — the model wants to call get_weather
```

> **Why this step?** `stop_reason` is how you know the model is *asking* for a tool rather than answering directly — the check that drives [The Agent Loop](/learn/tools-function-calling/the-tool-call-loop). If you skip checking it and just print `response.content`, you'll get a `tool_use` block instead of prose and wonder why there's no answer.

### Step 3 — Parse the call and run the real function

```python
tool_use_block = next(b for b in response.content if b.type == "tool_use")
city = tool_use_block.input["city"]         # already a dict — no parsing needed
result = get_weather(city)
```

> **Why this step?** `tool_use_block.input` arrives pre-parsed as a Python dict on Anthropic. (On OpenAI, below, you'll see the equivalent field is a *string* you must `json.loads()` yourself — one of the sharpest edges between the two dialects, covered in [Tool Calling Across Providers](/learn/tools-function-calling/tool-calling-across-providers).)

### Step 4 — The line beginners forget: append the result before calling again

```python
messages.append({"role": "assistant", "content": response.content})
messages.append({
    "role": "user",
    "content": [{
        "type": "tool_result",
        "tool_use_id": tool_use_block.id,
        "content": result,
    }]
})

followup = client.messages.create(
    model="claude-opus-5",
    max_tokens=1024,
    tools=tools,
    messages=messages,
)

final_text = next(b.text for b in followup.content if b.type == "text")
print(final_text)   # "It's 18°C and cloudy in Tokyo right now."
```

> **Why this step?** This is the step people skip when they're new: calling the model a second time *without* having appended both the original assistant turn and the tool result. Do that and the model has no memory that it ever asked for weather data — it either repeats the same tool call or answers from nothing. Both messages have to go in, in order, before the second `create()` call. [Returning Tool Results to the Model](/learn/tools-function-calling/returning-tool-results-to-the-model) covers this failure mode and its variants in depth.

### Step 5 — The same round trip on OpenAI

```python
from openai import OpenAI
import json

client = OpenAI()

tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Get the current weather for a city",
        "parameters": {
            "type": "object",
            "properties": {"city": {"type": "string"}},
            "required": ["city"],
        },
    },
}]

messages = [{"role": "user", "content": "What's the weather in Tokyo?"}]

response = client.chat.completions.create(
    model="gpt-4o", tools=tools, messages=messages
)
msg = response.choices[0].message
call = msg.tool_calls[0]
args = json.loads(call.function.arguments)   # a string here — must parse
result = get_weather(args["city"])

messages.append(msg)                          # the assistant turn, tool_calls and all
messages.append({
    "role": "tool",
    "tool_call_id": call.id,
    "content": result,
})

followup = client.chat.completions.create(
    model="gpt-4o", tools=tools, messages=messages
)
print(followup.choices[0].message.content)
```

> **Why this step?** Same forgotten-append trap, different shapes: OpenAI wants the assistant message with its `tool_calls` array appended, then a *separate* `role: "tool"` message — not a `user`-role message like Anthropic's. Mix the two dialects and the API will reject the request or the model will silently fail to see the result.

## Run it

Run either script and you should see two model calls happen: the first returns a tool request, the second returns the final sentence. If you only see one call, or an exception about a missing `tool_result`/`tool` message, you skipped Step 4.

## Harden it

This script has no error handling and no bound on the loop — it works because you know in advance exactly one tool call happens. Real code needs:

- A check for `is_error` / a failed API call inside `get_weather`, returned to the model instead of crashing your process — [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-tool-errors-and-retries).
- A loop instead of two hardcoded calls, so a task needing several lookups doesn't need new code each time — [The Agent Loop](/learn/tools-function-calling/the-tool-call-loop).
- Validation of `city` before you trust it, especially once a tool can write instead of just read — [Executing Tool Calls Safely](/learn/tools-function-calling/executing-tool-calls-safely).

## Extend it

Swap the stub for a real weather API, add a second tool (say, `get_timezone`) and watch the model decide on its own whether it needs one tool, both, or neither — that's the seed of [Sequential Multi-Step Tool Use](/learn/tools-function-calling/sequential-multi-step-tool-use). If you want to see the request/response bytes as they happen rather than stepping through code, [Testing and Debugging Tool Calls](/learn/tools-function-calling/testing-and-debugging-tool-calls) covers trace logging for exactly this kind of script.

**Related:** [The Agent Loop](/learn/tools-function-calling/the-tool-call-loop), [Anatomy of a Tool Call](/learn/tools-function-calling/anatomy-of-a-tool-call), [Returning Tool Results to the Model](/learn/tools-function-calling/returning-tool-results-to-the-model), [Tool Calling Across Providers](/learn/tools-function-calling/tool-calling-across-providers), [Designing a Tool Schema](/learn/tools-function-calling/designing-a-tool-schema)
