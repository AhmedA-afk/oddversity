---
title: "Turning On Structured Modes in Code"
track: "structured-outputs"
status: live
summary: "The exact calls that turn on structured output across three surfaces — Anthropic tool use, OpenAI response_format, and a self-hosted grammar."
duration: "8 min read"
---

Three different-looking API calls, all doing the same underlying job: compiling a schema (or grammar) into a decode-time constraint. Here's each one, with the exact shape of what comes back.

## What we're building

The same tiny extraction task — pull a name and a plan tier out of a sentence — implemented three ways: Anthropic's tool use with an `input_schema`, OpenAI's `response_format` with a JSON Schema, and a self-hosted `llama.cpp` model constrained by a grammar file. Seeing the same task three times makes the differences (and the one thing all three share) concrete instead of abstract.

## Setup

```bash
pip install anthropic openai llama-cpp-python
```

You'll need `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` set for the first two; the third needs a local GGUF model file and the grammar file from [Writing a GBNF Grammar by Hand](/learn/structured-outputs/gbnf-grammar-worked-example).

## Build it

### Anthropic: tool use with `input_schema`

Anthropic's structured output runs through the same `tools` mechanism used for function calling — you're not filling out a separate "structured mode" flag, you're defining a tool whose `input_schema` *is* your target schema, then forcing Claude to call it:

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-5",
    max_tokens=1024,
    tools=[{
        "name": "record_customer",
        "description": "Record the extracted customer info.",
        "strict": True,
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_name": {"type": "string"},
                "plan": {"type": "string", "enum": ["free", "pro", "enterprise"]},
            },
            "required": ["customer_name", "plan"],
            "additionalProperties": False,
        },
    }],
    tool_choice={"type": "tool", "name": "record_customer"},
    messages=[{"role": "user", "content": "Jordan Kim just signed up for the Pro plan."}],
)

block = next(b for b in response.content if b.type == "tool_use")
print(block.id, block.name, block.input)
# input is already a parsed dict: {"customer_name": "Jordan Kim", "plan": "pro"}
```

> **Why this shape?** `strict: true` plus `additionalProperties: false` is what tells Anthropic's decoder to compile `input_schema` into a real constraint rather than a best-effort hint (see [Compiling a Schema into a Constraint](/learn/structured-outputs/schema-constrained-decoding-explained)). `tool_choice` with a named tool forces that specific call instead of leaving Claude free to respond in plain text. The response comes back as a `tool_use` content block with `.id` (to correlate a later `tool_result`), `.name`, and `.input` — and `.input` is **already a parsed object**, not a JSON string you need to `json.loads()`.

Anthropic also exposes a schema-first mode that isn't tool use at all — `output_config: {"format": {"type": "json_schema", "schema": {...}}}` on the same `messages.create()` call, which constrains the plain-text response itself to match a schema. `client.messages.parse()` wraps this with a Pydantic model and hands back `response.parsed_output` already validated. Reach for tool use when the extraction is naturally "call this one function"; reach for `output_config` when you just want the whole reply to be a schema-shaped JSON document with no tool-call framing around it.

### OpenAI: `response_format` with a JSON Schema

```python
from openai import OpenAI
import json

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Jordan Kim just signed up for the Pro plan."}],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "customer_record",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {
                    "customer_name": {"type": "string"},
                    "plan": {"type": "string", "enum": ["free", "pro", "enterprise"]},
                },
                "required": ["customer_name", "plan"],
                "additionalProperties": False,
            },
        },
    },
)

data = json.loads(response.choices[0].message.content)
# {"customer_name": "Jordan Kim", "plan": "pro"}
```

> **Why this shape?** `response_format` constrains the assistant message's `content` field directly — there's no tool-call wrapper at all here, unlike the Anthropic example above. The tradeoff shows up in what you get back: `response.choices[0].message.content` is a **JSON string**, so you `json.loads()` it yourself, in contrast to Anthropic's tool-use `input` arriving pre-parsed. Small difference, but it's exactly the kind of thing that breaks silently if you port code between providers without checking — see [Turning On Structured Modes in Code across providers](/learn/structured-outputs/cross-provider-structured-output-differences) for the fuller list.

### Self-hosted: llama.cpp with a grammar file

```python
from llama_cpp import Llama, LlamaGrammar

llm = Llama(model_path="./model.gguf")
grammar = LlamaGrammar.from_file("contact.gbnf")  # the grammar from the GBNF worked example

output = llm(
    "Name Jordan Kim Phone 5552018834\nExtract as 'Name <name> Phone <digits>': "
    "Contact: Alex Rivera, reachable at 555-201-8834.",
    grammar=grammar,
    max_tokens=64,
)

print(output["choices"][0]["text"])
```

> **Why this shape?** There's no `response_format` or `input_schema` parameter here at all — the grammar is handed straight to the sampling loop via `grammar=`, because you're running the decoding loop yourself instead of calling a hosted endpoint that runs it for you. This is the same masking mechanism as the two calls above, just with the compile step (schema or grammar → automaton) happening inside your own process rather than the provider's.

## Run it

All three calls return the same underlying guarantee — output that matches the shape, by construction, not by the model's cooperation — through three different-shaped responses: a `tool_use` block with a pre-parsed `.input` dict, a JSON string inside `message.content`, and a raw completion string you're trusting the grammar (not a schema) to have shaped correctly. Print all three side by side once to see this for yourself before wiring either into a pipeline.

## Harden it

- Always check `response.stop_reason` (Anthropic) — a forced `tool_choice` should end in `stop_reason == "tool_use"`; anything else means something upstream (a refusal, a length cap) interrupted the constrained path.
- Wrap the OpenAI `json.loads()` call in a `try`/`except` regardless of `strict: true` — strict mode makes malformed JSON far less likely, not provably impossible across every model and edge case.
- For the self-hosted path, remember the grammar guarantees *shape*, not the *field boundaries* you intend — validate the parsed digits and name length the same way [the GBNF worked example](/learn/structured-outputs/gbnf-grammar-worked-example) flags a too-rigid grammar's failure mode.

## Extend it

Once one of these calls is wired up, the natural next moves are: force reasoning before the constrained field with [Separating Reasoning from Structuring](/learn/structured-outputs/thinking-then-structuring-pattern) on anything with real decision-making inside it, and wrap the parsed result in the [validation layer](/learn/structured-outputs/the-validation-layer) that catches everything the schema itself didn't enforce.

**Related:** [Compiling a Schema into a Constraint](/learn/structured-outputs/schema-constrained-decoding-explained), [Writing a GBNF Grammar by Hand](/learn/structured-outputs/gbnf-grammar-worked-example), [Cross-Provider Structured Output Differences](/learn/structured-outputs/cross-provider-structured-output-differences), [Tool / Function Schemas](/learn/structured-outputs/tool-function-schemas)
