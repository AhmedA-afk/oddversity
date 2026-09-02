---
title: "Provider SDKs: Anthropic and OpenAI side by side"
phase: ai
module: prompts-and-structure
kind: reference
summary: "The two SDKs you will use in the field solve the same four problems — chat, structured output, tool calling, streaming — with different shapes. This page is the lookup table so you stop re-deriving the mapping every engagement."
duration: 10 min
updated: "2026-09-02"
outcomes:
  - Write an equivalent basic chat call in both SDKs from memory.
  - Translate a tool definition and a tool-call response between the two providers' shapes.
  - Stream a response and handle structured output in both SDKs.
artifact: A small wrapper module in your own toolkit that exposes one interface over both providers, kept for reuse in every lab in this path.
---

Customers pick a provider for reasons that have nothing to do with you — an existing procurement relationship, a compliance review already completed for one vendor, a data-residency commitment. You will end up building against whichever one the customer already trusts, sometimes both in the same engagement during a migration. The shapes below are close enough that switching is mostly mechanical once you know the mapping. This page intentionally omits model names and pricing — both change faster than this page will be updated, and neither belongs in code you are about to hand over. Use whatever model identifier your contract or the customer's approved model list specifies, referenced from configuration, never hard-coded.

## Basic chat

```python
# Anthropic
import anthropic
client = anthropic.Anthropic()

response = client.messages.create(
    model=MODEL_ID,
    max_tokens=1024,
    system="You are a claims-triage assistant.",
    messages=[{"role": "user", "content": "Summarise this claim."}],
)
text = response.content[0].text
```

```python
# OpenAI
import openai
client = openai.OpenAI()

response = client.chat.completions.create(
    model=MODEL_ID,
    messages=[
        {"role": "system", "content": "You are a claims-triage assistant."},
        {"role": "user", "content": "Summarise this claim."},
    ],
)
text = response.choices[0].message.content
```

The structural difference to remember: Anthropic takes `system` as a separate top-level parameter; OpenAI puts the system instruction inside the `messages` list as a `system`-role entry. Both accumulate conversation history the same way — append each turn to the list you pass on the next call.

## Structured output

```python
# Anthropic — constrained via tool use with a single forced tool
response = client.messages.create(
    model=MODEL_ID,
    max_tokens=1024,
    tools=[{
        "name": "record_triage",
        "description": "Record the triage decision.",
        "input_schema": CLAIM_TRIAGE_SCHEMA,
    }],
    tool_choice={"type": "tool", "name": "record_triage"},
    messages=[{"role": "user", "content": claim_text}],
)
result = response.content[0].input  # already a dict matching the schema
```

```python
# OpenAI — constrained via response_format with a JSON schema
response = client.chat.completions.create(
    model=MODEL_ID,
    messages=[{"role": "user", "content": claim_text}],
    response_format={
        "type": "json_schema",
        "json_schema": {"name": "claim_triage", "schema": CLAIM_TRIAGE_SCHEMA, "strict": True},
    },
)
result = json.loads(response.choices[0].message.content)
```

Anthropic's idiom for guaranteed-shape output is forcing a single tool call and reading its `input`. OpenAI's idiom is a dedicated structured-output mode via `response_format`. Both end at the same place: a dict you validate against the schema class from the structured-outputs lesson before trusting it, because "the provider promises schema conformance" and "you should still validate" are not in tension — providers can and do change constrained-output behaviour, and your validation layer is what notices.

## Tool calling

```python
# Anthropic
response = client.messages.create(
    model=MODEL_ID,
    max_tokens=1024,
    tools=[LEAD_TIME_TOOL_ANTHROPIC_SHAPE],
    messages=conversation,
)
if response.stop_reason == "tool_use":
    call = next(b for b in response.content if b.type == "tool_use")
    tool_name, tool_input, call_id = call.name, call.input, call.id
    result = execute_tool(tool_name, tool_input)
    conversation.append({"role": "assistant", "content": response.content})
    conversation.append({
        "role": "user",
        "content": [{"type": "tool_result", "tool_use_id": call_id, "content": str(result)}],
    })
```

```python
# OpenAI
response = client.chat.completions.create(
    model=MODEL_ID,
    messages=conversation,
    tools=[LEAD_TIME_TOOL_OPENAI_SHAPE],
)
message = response.choices[0].message
if message.tool_calls:
    call = message.tool_calls[0]
    tool_name = call.function.name
    tool_input = json.loads(call.function.arguments)
    result = execute_tool(tool_name, tool_input)
    conversation.append(message)
    conversation.append({
        "role": "tool",
        "tool_call_id": call.id,
        "content": str(result),
    })
```

Both follow the same loop from the agents lesson: the model returns a call, you execute it, you append both the call and its result back into the conversation, you call again. The shape difference is in how the result gets tagged back — `tool_result` blocks keyed by `tool_use_id` for Anthropic, a `role: "tool"` message keyed by `tool_call_id` for OpenAI. Get this tagging wrong and the model will not reliably associate the result with the call it made, which shows up as the model re-asking a question it just got an answer to.

## Streaming

```python
# Anthropic
with client.messages.stream(
    model=MODEL_ID,
    max_tokens=1024,
    messages=conversation,
) as stream:
    for text in stream.text_stream:
        send_to_client(text)
    final_message = stream.get_final_message()
```

```python
# OpenAI
stream = client.chat.completions.create(
    model=MODEL_ID,
    messages=conversation,
    stream=True,
)
collected = []
for chunk in stream:
    delta = chunk.choices[0].delta.content
    if delta:
        collected.append(delta)
        send_to_client(delta)
full_text = "".join(collected)
```

Both providers stream incremental text deltas you forward to a client as they arrive, which matters for perceived latency in anything customer-facing — covered in the cost-and-latency lesson later in this module. The practical difference is bookkeeping: Anthropic's stream object hands you the fully assembled final message when you ask for it; with OpenAI's chunk stream you accumulate the deltas yourself if you need the complete text afterward.

## What to actually keep

Do not memorise the exact parameter names above — they are a reference, and both providers evolve their SDKs. What is worth keeping permanently is the mapping of concepts: where the system instruction goes, how a forced-shape response is requested, how a tool call and its result get threaded back into the conversation, and how a stream is consumed. Once you have that map, reading either SDK's current documentation for the exact call signature takes minutes, and switching a build from one provider to the other — a migration you will be asked to do at least once in the field, usually for a data-residency or procurement reason that has nothing to do with model quality — becomes a mechanical exercise instead of a rewrite.

Build the wrapper now: one small module in your own toolkit with functions like `chat()`, `structured_call()`, and `call_with_tools()` that take a provider argument and dispatch to the right shape underneath. Every lab for the rest of this path can import it instead of re-deriving these calls each time.
