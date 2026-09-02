---
title: "The Agent Loop"
track: "tools-function-calling"
status: live
summary: "The while-loop underneath every tool-using agent: send, check for tool calls, execute, append, repeat until plain text."
duration: "6 min read"
---

Strip away every framework and every provider's SDK sugar, and a tool-using agent is one small loop. Once you can write it from memory, you understand the mechanism that every agent framework is quietly running underneath you.

## What it is

The loop's job is simple: keep sending messages to the model and executing whatever tools it asks for, until it stops asking and gives you a plain-text answer instead. Here's the whole thing, provider-agnostic, in pseudocode:

```
messages = [user_message]

while True:
    response = call_model(messages, tools=available_tools)
    messages.append(response.assistant_message)

    if response.stop_reason != "tool_use":
        break                      # model answered in plain text — done

    results = []
    for call in response.tool_calls:
        output = execute(call.name, call.arguments)   # your code, not the model
        results.append(tool_result(call.id, output))

    messages.append(tool_results_message(results))

final_answer = extract_text(response)
```

Fifteen-ish lines. That's the entire mechanism — [Anatomy of a Tool Call](/learn/tools-function-calling/anatomy-of-a-tool-call) already showed you what a single request/result pair looks like on the wire; this is just that pair, wrapped in a loop that keeps going until the model no longer needs one.

## The mental model

Each iteration is one "turn" of asking and answering. The loop condition is doing exactly one job: *is the model still asking for something, or is it done?* Providers signal this differently in the wire format (Anthropic sets `stop_reason: "tool_use"`; OpenAI's `finish_reason` becomes `"tool_calls"`) but the concept is identical — a flag on the response tells you whether to keep looping or to stop and read the text.

Note what does *not* change across iterations: the message history only grows. You never remove earlier turns from `messages` — the model needs the full trail of what it asked and what it learned to reason about what to do next. This is also why long-running loops get expensive in tokens; each new call resends the whole accumulated history.

## Why it works this way

The loop has to be driven by your code, not the model, because the model has no way to invoke itself again — it can only produce one response per request. Nothing "runs" in the background after the model finishes generating. If your code doesn't call the API a second time, the conversation is simply over, mid-investigation, with the model's request for a tool sitting unanswered forever. This is the same fact as [Tools Are the Model's Only Hands](/learn/tools-function-calling/tools-as-the-models-hands): the model can only ask; something outside it — your loop — has to be the one that keeps the conversation moving.

## A concrete example (shown)

Two iterations, condensed: the user asks a question that needs one lookup.

- **Iteration 1:** `messages = [user: "What's the weather in Tokyo?"]` → model responds with a `tool_use` for `get_weather`. Loop appends the assistant turn, executes the tool, appends the result.
- **Iteration 2:** `messages` now has four entries (user, assistant tool-call, tool result, and the loop calls the model again) → model responds with plain text: "It's 18°C and cloudy in Tokyo." `stop_reason` is no longer `tool_use`. Loop breaks.

A task needing three lookups just means three iterations before the break condition fires — nothing about the loop's shape changes.

## Where it shows up

Every SDK "tool runner" or "agent executor" helper you'll encounter — Anthropic's tool runner, OpenAI's assistants/agents helpers, LangChain's `AgentExecutor` — is this loop with error handling, logging, and convenience wrapped around it. Knowing the bare loop means you can debug what those helpers are doing when something goes wrong, and write your own when you need behavior they don't expose.

## Watch out for

- **No exit condition beyond "model stopped asking."** A model can, in principle, keep requesting tools indefinitely — a malformed tool result that looks like it needs a retry, or a task the model can't actually complete, can spin forever. Real code needs a hard ceiling on iterations; that safety net is developed fully in [Infinite Loops and Retry Caps](/learn/tools-function-calling/infinite-loop-and-retry-caps) — for now, just know the cap belongs right at the top of the `while True:`, as a counter that raises or breaks once exceeded.
- **Appending only the text, not the full assistant message.** The assistant turn you append to `messages` must include the tool-call blocks themselves, not just any prose that came with them — trim it down to text and the next request loses track of what was asked.
- **Forgetting results can arrive for several calls at once.** If the model requested two tools in one turn, both results go back in a single message before the next call — see [Parallel Tool Calls](/learn/tools-function-calling/parallel-tool-calls).

## Where next

[Your First Tool Call, End to End](/learn/tools-function-calling/first-tool-call-walkthrough) turns this pseudocode into real, runnable Python against both Anthropic and OpenAI. Once you're comfortable with a single loop, [Sequential Multi-Step Tool Use](/learn/tools-function-calling/sequential-multi-step-tool-use) and [Chaining Tools into Workflows](/learn/tools-function-calling/chaining-tools-into-workflows) cover what happens when the steps inside the loop have dependencies on each other.

**Related:** [Anatomy of a Tool Call](/learn/tools-function-calling/anatomy-of-a-tool-call), [Your First Tool Call, End to End](/learn/tools-function-calling/first-tool-call-walkthrough), [Infinite Loops and Retry Caps](/learn/tools-function-calling/infinite-loop-and-retry-caps), [Parallel Tool Calls](/learn/tools-function-calling/parallel-tool-calls), [Sequential Multi-Step Tool Use](/learn/tools-function-calling/sequential-multi-step-tool-use)
