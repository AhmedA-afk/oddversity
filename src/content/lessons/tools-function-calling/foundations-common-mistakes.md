---
title: "Beginner Tool-Calling Mistakes"
track: "tools-function-calling"
status: live
summary: "Five mistakes almost everyone makes once when they first wire up tool calling, with the broken code and the fix."
duration: "7 min read"
---

Every one of these mistakes produces a program that runs without an error — that's exactly what makes them sticky. You get a wrong answer, or no answer, with nothing in the stack trace pointing at the real cause.

### The mistake: treating a returned tool call as if it already executed

**Why it's wrong.** A `tool_use` / `tool_calls` block is a *request*. Nothing has happened in the world yet — your code hasn't run, the API hasn't been hit, the database hasn't been touched. Reading the model's response and moving on as if the action occurred confuses "the model asked" with "the thing happened," which is exactly the trap [Tools Are the Model's Only Hands](/learn/tools-function-calling/tools-as-the-models-hands) is written to prevent.

**Symptom.** Code that reads `response.content` for a `tool_use` block, logs "cancelled the order," and shows the user a success message — while the order is still active, because nothing ever called the cancellation API.

```python
# Broken: treats the request as the action
if response.stop_reason == "tool_use":
    print("Order cancelled.")   # nothing has run yet!
```

**Fix.** Execute the tool yourself, using the parsed arguments, and only report success once your own code's real call returns success:

```python
tool_use = next(b for b in response.content if b.type == "tool_use")
result = cancel_order(tool_use.input["order_id"])  # actually runs it
print("Order cancelled." if result.ok else "Cancellation failed.")
```

### The mistake: never sending the tool result back

**Why it's wrong.** The model that emitted the tool call is stuck mid-thought until it sees what the tool returned — [The Agent Loop](/learn/tools-function-calling/the-tool-call-loop) only advances when a `tool_result`/`tool` message goes back in with the matching id. Skip it, and the model either has nothing to work with on the next turn or, if you call it again without the result, may repeat the same request.

**Symptom.** A single API call, followed by code that tries to print a final answer that doesn't exist yet — or a second call that returns another tool request instead of an answer, in a loop that never terminates.

```python
# Broken: never appends the tool result
response = client.messages.create(model=MODEL, tools=tools, messages=messages)
tool_use = next(b for b in response.content if b.type == "tool_use")
result = execute(tool_use.name, tool_use.input)
# ...then calls the model again without ever sending `result` back
followup = client.messages.create(model=MODEL, tools=tools, messages=messages)
```

**Fix.** Append both the assistant's tool-call message *and* your tool-result message before calling again — see [Returning Tool Results to the Model](/learn/tools-function-calling/returning-tool-results-to-the-model) for the full pattern and every shape of "almost right" that still breaks it.

### The mistake: echoing the model's proposed arguments as the answer

**Why it's wrong.** The arguments in a tool call are *inputs to a function you haven't run yet* — `{"city": "Tokyo"}` is not a weather report, it's a request for one. Showing the user the raw arguments (or a sentence built only from them) skips the part where anything true actually got looked up.

**Symptom.** A user asks for Tokyo's weather and the app displays something like "Looking up weather for Tokyo" and stops — or worse, a paraphrase of the arguments dressed up to sound like a real answer, with no real data behind it.

```python
# Broken: builds the "answer" from the call's own arguments
tool_use = next(b for b in response.content if b.type == "tool_use")
print(f"Weather info for {tool_use.input['city']} coming right up!")  # not an answer
```

**Fix.** The real answer only exists after you've executed the tool *and* sent the model a second turn with the result — the model's final text response, not its tool call, is what you show the user.

### The mistake: calling a tool when a plain answer would do

**Why it's wrong.** Every tool call is a round trip — latency, tokens, and a new opportunity for the call to fail or the arguments to be malformed. If a task doesn't touch any of the four gaps in [Why a Model Needs Tools at All](/learn/tools-function-calling/why-models-need-tools) — nothing stale, nothing private, no side effect, no fragile arithmetic — a tool adds cost and risk for nothing.

**Symptom.** A model with a `search_web` tool available reaches for it to answer "what's the capital of France," burning a round trip on a fact it already knew cold, or — worse in production — a model configured to always call a `log_interaction` tool before answering even trivial small talk, doubling every request's latency.

**Fix.** Scope tool availability and descriptions to genuinely require the gap they close, and, where you control it, let the model answer directly when the task doesn't need a lookup — forcing a tool call on every turn (see [Tool Choice and Forcing Tool Use](/learn/tools-function-calling/tool-choice-and-forcing-tool-use)) should be a deliberate choice for a narrow endpoint, not a default.

### The mistake: assuming exactly one tool call per turn

**Why it's wrong.** A single assistant response can contain zero, one, or several tool-call blocks. Code that grabs "the" call — `response.content[0]`, or `tool_calls[0]` — silently drops every call after the first, and the model never finds out its second request went unanswered.

**Symptom.** A model asks for both `get_weather` and `get_timezone` in the same turn to answer "what's the weather like there right now, given the time difference" — and the app only ever executes the weather lookup, then stalls or hallucinates the timezone.

**Fix.** Iterate the full block list, execute every `tool_use`/`tool_calls` entry you find, and return all of the corresponding results in a single message — see [Parallel Tool Calls](/learn/tools-function-calling/parallel-tool-calls).

## Pre-flight checklist

Before you call this integration done, check that your loop:

- [ ] Never reports success from reading a tool call alone — only from the result of actually running it
- [ ] Appends both the assistant's tool-call message and your tool-result message before the next request
- [ ] Never shows a user the model's proposed arguments as if they were an answer
- [ ] Only exposes tools that close a real gap the model can't otherwise fill
- [ ] Iterates *every* tool-call block in a response, not just the first

**Related:** [The Agent Loop](/learn/tools-function-calling/the-tool-call-loop), [Tools Are the Model's Only Hands](/learn/tools-function-calling/tools-as-the-models-hands), [Returning Tool Results to the Model](/learn/tools-function-calling/returning-tool-results-to-the-model), [Why a Model Needs Tools at All](/learn/tools-function-calling/why-models-need-tools), [Parallel Tool Calls](/learn/tools-function-calling/parallel-tool-calls)
