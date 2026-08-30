---
title: "Build a tool-calling agent from scratch, no framework"
description: "The agent loop is about forty lines. Write it once yourself and every framework afterwards stops being magic — including the parts of it you should not use."
question: "How does an AI agent actually work under the hood?"
level: "intermediate"
duration: "30 min"
published: "2026-08-30"
tags: ["Agents", "Python", "Tools"]
featured: true
steps:
  - "Write the tools as ordinary functions with schemas"
  - "Write the loop: call, inspect, execute, append, repeat"
  - "Add the three stopping conditions every loop needs"
  - "Make tool errors legible to the model"
  - "Decide what the model is allowed to do without asking"
related:
  - "/learn/agentic-ai/what-is-an-agent"
  - "/learn/agentic-ai/the-agent-loop"
  - "/learn/tools-function-calling/designing-a-tool-schema"
  - "/learn/harness-design/state-and-checkpointing"
---

An agent is a loop. The model gets a goal and a list of tools; it picks one; your code runs
it; the result goes back in the conversation; repeat until the model stops asking for
tools. That is the whole idea. Frameworks add retries, tracing, memory and orchestration on
top, but if the loop is a black box to you, so is every bug in it.

Write it once. It takes forty lines.

## Step 1 — Tools are just functions plus a schema

```python
import json, subprocess
from pathlib import Path

def read_file(path: str) -> str:
    """Read a UTF-8 text file from the working directory."""
    target = (Path.cwd() / path).resolve()
    if not target.is_relative_to(Path.cwd()):        # no escaping the sandbox
        raise ValueError("path escapes the working directory")
    return target.read_text(encoding="utf-8")[:20000]

def list_files(pattern: str = "*") -> list[str]:
    """List files in the working directory matching a glob pattern."""
    return sorted(str(p) for p in Path.cwd().glob(pattern) if p.is_file())[:200]

def run_tests(path: str = "tests") -> str:
    """Run pytest against a path and return the tail of the output."""
    proc = subprocess.run(["pytest", path, "-q"], capture_output=True, text=True, timeout=120)
    return (proc.stdout + proc.stderr)[-4000:]

TOOLS = {"read_file": read_file, "list_files": list_files, "run_tests": run_tests}

SCHEMAS = [
    {
        "name": "read_file",
        "description": "Read a UTF-8 text file from the working directory. Use this before editing anything.",
        "input_schema": {
            "type": "object",
            "properties": {"path": {"type": "string", "description": "Path relative to the working directory"}},
            "required": ["path"],
        },
    },
    {
        "name": "list_files",
        "description": "List files matching a glob. Use this first when you do not know the layout.",
        "input_schema": {
            "type": "object",
            "properties": {"pattern": {"type": "string", "description": "Glob, e.g. src/**/*.py"}},
            "required": [],
        },
    },
    {
        "name": "run_tests",
        "description": "Run the test suite and return the output. Use this to check whether a change worked.",
        "input_schema": {
            "type": "object",
            "properties": {"path": {"type": "string"}},
            "required": [],
        },
    },
]
```

Two things are load-bearing here and neither is the code. The **descriptions** are the only
thing the model uses to choose, so they should say *when* to reach for the tool, not just
what it does. And the **path check** in `read_file` is not optional: the argument came from
a model that may have been reading a file that told it to read `../../.ssh/id_rsa`.

## Step 2 — The loop

```python
import anthropic

client = anthropic.Anthropic()

def run_agent(goal: str, max_turns: int = 12) -> str:
    messages = [{"role": "user", "content": goal}]

    for turn in range(max_turns):
        response = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=4096,
            system="You are a careful engineer. Inspect before you conclude. "
                   "If a tool fails, read the error and adapt rather than repeating the call.",
            tools=SCHEMAS,
            messages=messages,
        )
        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason != "tool_use":
            return "".join(b.text for b in response.content if b.type == "text")

        results = []
        for block in response.content:
            if block.type != "tool_use":
                continue
            try:
                output = TOOLS[block.name](**block.input)
                payload, is_error = json.dumps(output) if not isinstance(output, str) else output, False
            except Exception as exc:
                payload, is_error = f"{type(exc).__name__}: {exc}", True
            results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": payload,
                "is_error": is_error,
            })
        messages.append({"role": "user", "content": results})

    return "Stopped: hit the turn limit without finishing."
```

That is a complete agent. Read it twice — every framework you will use is this, with
instrumentation.

## Step 3 — Three stopping conditions, not one

`max_turns` is the obvious one and the least important. Add:

**A budget.** Track tokens across the loop and stop at a ceiling. An agent that loops on a
failing test can spend a surprising amount before the turn limit catches it.

**A no-progress detector.** If the same tool is called with the same arguments twice in a
row, the model is stuck. Break, and say so.

```python
seen = set()
signature = (block.name, json.dumps(block.input, sort_keys=True))
if signature in seen:
    payload = "You already called this with these exact arguments. Try something different."
    is_error = True
seen.add(signature)
```

**A wall clock.** Anything invoked by a user needs a deadline that is shorter than their
patience.

## Step 4 — Make errors useful

The instinct is to catch exceptions and return "error". Do the opposite: return the actual
message. `FileNotFoundError: src/mian.py` lets the model notice the typo and fix it. A
generic failure string tells it nothing, so it retries the same call, and now you are
paying for a loop.

Setting `is_error: true` matters as well — it tells the model this was a failure rather
than a result that happens to describe one.

## Step 5 — Decide what runs without asking

This is the real design work, and it is a permissions question, not a prompting one.

Sort every tool into three buckets. **Reversible and cheap** — reads, lists, searches — run
automatically. **Expensive or slow** — a full test run, a large query — run automatically
but budgeted. **Irreversible or outward-facing** — writes, deletes, sends, payments, posts —
require a human, every time, no exceptions for "trusted" inputs.

The reason is specific: an agent reading untrusted content — a web page, a document, an
issue comment — can have its instructions changed by that content. Prompt injection is not
a hypothetical, and a system prompt saying "never delete files" is a wish, not a control.
The control is that the delete tool is not reachable without a confirmation your code
enforces.

## What you now understand about frameworks

You can read LangGraph, the Agents SDK or anything else and see exactly which part of this
loop it is replacing. Use one when you want durable state, parallel tool execution,
tracing, or a team convention — all real reasons. Do not use one because the loop looked
hard, because it isn't, and the debugging is much easier when you wrote it.
