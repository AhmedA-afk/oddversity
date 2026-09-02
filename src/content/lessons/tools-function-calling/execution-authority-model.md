---
title: "From tool_call to Function Call"
track: "tools-function-calling"
status: live
summary: "The model only ever proposes a call; a dispatcher you own decides whether it actually runs."
duration: "6 min read"
---

The model's turn ends with something that looks like a function call — a name and a JSON blob of arguments. It is not one. Nothing has executed yet. Between that proposal and a real effect on a real system sits code you write, and this module is about everything that code needs to do before it lets the call through.

## What it is

A `tool_use` block (Anthropic's term; OpenAI calls it a `tool_call`, others vary) is text the model generated, shaped to match a schema you gave it. It carries a tool name, an id, and arguments — nothing more. The dispatcher is the piece of your code that takes that block and turns it into an actual side effect. Its job, in order:

1. **Look up** the named tool in a registry of tools you actually implemented and are willing to run.
2. **Validate** the arguments against that tool's expected shape and business rules.
3. **Execute** the real function, with real credentials, against real systems.
4. **Package** whatever comes back into a result the model can read on its next turn.

Every one of those four steps is a place a naive implementation goes wrong, and this module has a lesson for each: registries and validation in [Building a Registry and Dispatcher](/learn/tools-function-calling/building-a-tool-dispatcher) and [Never Trust the Model's Arguments](/learn/tools-function-calling/validating-tool-arguments), execution safety across [sandboxing](/learn/tools-function-calling/sandboxing-execution-principles) and [approval gates](/learn/tools-function-calling/approval-gates-design), and result packaging in [Returning Results the Model Can Use](/learn/tools-function-calling/returning-results-to-the-model).

## The mental model

Treat the model as a **requester**, never an **operator**. It can ask for `delete_records(table="users", where="inactive=true")` with complete confidence and correct JSON, and that request carries zero authority on its own. Authority lives in your dispatcher: which tools exist, what credentials each one runs with, and whether this particular call is allowed right now. The model's fluency is not evidence of correctness — a well-formed request and a *safe* request are different properties, checked by different code.

This is the same boundary that [Tool Calling and Authority](/learn/genai-app-dev/tool-calling-and-authority) frames at the application level: the agent's authority and the end user's authority are not the same thing, and the dispatcher is the exact point where you decide which one governs a given call. We come back to that gap directly in [The Confused-Deputy Problem](/learn/tools-function-calling/the-authority-problem).

## Why it works this way

Language models are next-token predictors — see [Next-Token Prediction](/learn/llm-foundations/next-token-prediction) if that mechanism is unfamiliar. A model producing `{"tool": "wire_transfer", "amount": 50000}` did so because that continuation scored highest given the context, not because a ledger was checked, a balance was confirmed, or a human signed off. Sampling can also just be wrong: a slightly-off id, a hallucinated field, a call to a tool name that sounds right but doesn't exist. None of that is a defect in the model — it's a property of what generation is. The dispatcher exists because *something* in the system has to be deterministic, auditable, and accountable, and a probability distribution can't be any of those things.

## A concrete example (shown)

The model emits this tool-use block:

```json
{
  "type": "tool_use",
  "id": "toolu_01A2b3",
  "name": "get_invoice",
  "input": { "invoice_id": "inv_9981" }
}
```

A dispatcher that does its job looks roughly like this:

```python
def dispatch(tool_call: ToolCall, ctx: RequestContext) -> ToolResult:
    handler = REGISTRY.get(tool_call.name)
    if handler is None:
        return ToolResult.error(tool_call.id, f"unknown tool: {tool_call.name}")

    try:
        args = handler.args_model.model_validate(tool_call.input)
    except ValidationError as e:
        return ToolResult.error(tool_call.id, f"invalid arguments: {e}")

    if not handler.authorized(ctx, args):
        return ToolResult.error(tool_call.id, "not authorized")

    output = handler.run(ctx, args)
    return ToolResult.ok(tool_call.id, output)
```

Notice what's absent: no `eval(tool_call.name + "(" + ...)`, no string-building a shell command, no trusting `ctx` fields the model could have echoed back to you inside `tool_call.input`. `ctx` — who's actually asking, with what permissions — comes from your session, never from the model's text. [Building a Registry and Dispatcher](/learn/tools-function-calling/building-a-tool-dispatcher) builds this out into something runnable.

## Where it shows up

Every framework that supports tool calling — Anthropic's SDK, OpenAI's function calling, LangChain/LangGraph tools, custom agent loops — draws this exact line, whether the docs call it out or not. The model-facing half (the schema, the JSON) is standardized and portable across providers, see [Tool Calling Across Providers](/learn/tools-function-calling/tool-calling-across-providers). The dispatcher half is yours to write, and it's where most real-world tool-calling bugs live, because it's the part with no framework holding your hand.

## Watch out for

- **`eval`-adjacent dispatch.** Building a function call from string concatenation of the model's output (`eval(f"{tool_call.name}(**{tool_call.input})")`) collapses the whole boundary this lesson describes into one line, and one line an attacker only needs to reach once.
- **Assuming the name is safe because the schema is.** A tool schema constrains what the model is *encouraged* to send; it does not stop a model from emitting a name you never defined, or gracefully handle it if it does. The registry lookup with an explicit "unknown tool" branch is not optional.
- **Trusting fields the model can influence for authorization.** If `tool_call.input` contains `user_id` or `role`, and your dispatcher reads those to decide what's allowed, you've let the model set its own permissions. Authorization inputs come from `ctx`, never from `input`.

## Where next

Start with [Building a Registry and Dispatcher](/learn/tools-function-calling/building-a-tool-dispatcher) to see this pattern implemented end to end, then [Never Trust the Model's Arguments](/learn/tools-function-calling/validating-tool-arguments) for the validation step in depth, and [The Confused-Deputy Problem](/learn/tools-function-calling/the-authority-problem) for what goes wrong when authority and authorization get conflated.

**Related:** [Building a Registry and Dispatcher](/learn/tools-function-calling/building-a-tool-dispatcher), [Never Trust the Model's Arguments](/learn/tools-function-calling/validating-tool-arguments), [The Confused-Deputy Problem](/learn/tools-function-calling/the-authority-problem), [Tool Calling and Authority](/learn/genai-app-dev/tool-calling-and-authority), [Executing Tool Calls Safely](/learn/tools-function-calling/executing-tool-calls-safely)
