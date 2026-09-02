---
title: "Code Execution as a Tool"
track: "tools-function-calling"
status: live
summary: "Give the model a run_python tool and let it write the logic itself instead of you pre-building an endpoint for every question."
duration: "6 min read"
---

Most tools you design answer one question. A code-execution tool answers whatever the model can write a program to answer — which is why it's the single highest-leverage tool you can hand a model, and the one that deserves the least trust by default.

## What it is

A `run_python` (or `run_code`) tool takes one argument — a string of code — runs it somewhere isolated, and returns what happened: stdout, stderr, a traceback if it crashed, maybe a reference to a file it produced. That's the whole interface. No `get_weather`, no `query_database`, no `filter_orders` — one tool, and the model supplies the logic instead of you supplying it in advance.

```json
{
  "name": "run_python",
  "description": "Execute Python in an isolated sandbox. Use for calculations, data transforms, and multi-step logic you can't do in one API call. No network access. 30s time limit.",
  "input_schema": {
    "type": "object",
    "properties": {
      "code": { "type": "string", "description": "Python source to execute." }
    },
    "required": ["code"]
  }
}
```

## The mental model

Every other tool in this track is a fixed-function API: you anticipated the shape of a task and built an endpoint for it. Code execution is the opposite bet — you stop anticipating and hand the model a general-purpose computer instead. It's the difference between a phone with forty single-purpose apps and a phone with a terminal: the terminal can do everything the apps can, plus things you never thought to build an app for, at the cost of trusting whoever's typing into it.

## Why it works this way

Two things make this work better than it sounds. First, code composes: a loop, a filter, and an aggregation are one program instead of three tool calls with a model turn wedged between each. Second, the model has seen orders of magnitude more real Python in training than it's seen your specific tool schema — writing a correct `pandas` filter is closer to its home turf than guessing which of your forty custom functions applies. You're not teaching it a new skill, you're pointing an existing one at a sandbox.

## A concrete example (shown)

A user asks: "What's the average order value for west-region customers who spent over $500?" There's no `average_order_value` tool. The model writes and runs this instead:

```python
import pandas as pd
df = pd.read_csv("orders.csv")
filtered = df[(df["region"] == "west") & (df["total"] > 500)]
print(round(filtered["total"].mean(), 2))
```

The sandbox returns `612.4` on stdout. The model reads that back and answers the question in one round trip — no bespoke aggregation endpoint was ever built.

## Where it shows up

Data-analysis assistants, "advanced analysis" chat features, coding agents, and anywhere the space of possible user requests is too large to cover with named endpoints. It's also the backbone of agents that glue several APIs together in a single step — see [One Code Tool vs. Dozens of API Tools](/learn/tools-function-calling/code-execution-vs-many-tools) for when that's actually the right call versus keeping tools discrete.

## Watch out for

- **Running it unsandboxed.** This is arbitrary code execution on whatever machine hosts it — not a hypothetical, the default outcome if you skip [sandboxing](/learn/tools-function-calling/sandboxing-tool-execution). Nothing else here matters if you get this part wrong.
- **Treating the code tool as a free pass around your other gates.** A `run_python` with network access can reach the same payment API you carefully put an [approval gate](/learn/tools-function-calling/approval-gates-for-sensitive-tools) in front of — just from inside a script instead of a named tool call.
- **Unbounded stdout.** A stray `print(df)` on a large frame can dump megabytes back into context. Cap and truncate before it ever reaches the model.

## Where next

[Building a Sandboxed Code Interpreter](/learn/tools-function-calling/building-a-code-interpreter-tool) walks through actually implementing this tool end to end. [One Code Tool vs. Dozens of API Tools](/learn/tools-function-calling/code-execution-vs-many-tools) covers when this beats — or loses to — a registry of narrow functions. Read [Sandboxing Tool Execution](/learn/tools-function-calling/sandboxing-tool-execution) before you wire any of this up for real.

**Related:** [Building a Sandboxed Code Interpreter](/learn/tools-function-calling/building-a-code-interpreter-tool), [One Code Tool vs. Dozens of API Tools](/learn/tools-function-calling/code-execution-vs-many-tools), [Sandboxing Tool Execution](/learn/tools-function-calling/sandboxing-tool-execution), [Approval Gates for Sensitive Tool Calls](/learn/tools-function-calling/approval-gates-for-sensitive-tools)
