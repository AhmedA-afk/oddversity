---
title: "The Whole Game: A Tool Call From Question to Answer"
track: "tools-function-calling"
status: live
summary: "One weather question traced through every hop of a tool call, with a map of which module owns each part."
duration: "7 min read"
---

Before you learn any single piece of tool calling in depth, watch the whole thing happen once. Everything else in this track is a close-up of one frame in the sequence below.

## The big picture

A user types: **"What's the weather in Tokyo?"** Here is everything that happens between that keystroke and the answer on screen.

**Hop 1 — You send the request.** Your code sends the model the conversation so far, plus a list of tools it's allowed to use — in this case, one named `get_weather` with a schema saying it takes a `city` string. The model has never seen this tool before this exact request; there's no persistent registration step. Getting that schema right — types, required fields, descriptions the model actually reads — is its own discipline, covered starting in [Designing a Tool Schema](/learn/tools-function-calling/designing-a-tool-schema).

**Hop 2 — The model decides it needs the tool.** Tokyo's current weather isn't in the model's training data — it can't be, weather changes by the hour. Instead of guessing, the model emits a structured request: "call `get_weather` with `{\"city\": \"Tokyo\"}`." It does this by predicting tokens that happen to form that structure, the same way it predicts any other tokens — there's no separate decision-making module. [How Models Learn to Emit Tool Calls](/learn/tools-function-calling/how-models-learn-to-call-tools) covers why this is reliable rather than lucky.

**Hop 3 — Your code executes it.** The model's output is a *request*, not an action. Nothing has happened in the world yet. Your application code reads the tool name and arguments, decides whether to trust them, and only then calls the real weather API. This is the hop where authority, sandboxing, and approval gates live — see [Executing Tool Calls Safely](/learn/tools-function-calling/executing-tool-calls-safely).

**Hop 4 — The result goes back in.** You take whatever the weather API returned — say, `{"temp_c": 18, "condition": "cloudy"}` — and send it back to the model as a new message tagged with the same call ID. Skip this hop and the model has no idea the tool ever ran; [Returning Tool Results to the Model](/learn/tools-function-calling/returning-tool-results-to-the-model) is entirely about doing it correctly, and what to do when the tool fails instead of succeeds is [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-tool-errors-and-retries).

**Hop 5 — The model writes the final answer.** With the real data in hand, the model generates the sentence the user actually reads: "It's 18°C and cloudy in Tokyo right now." This is a normal text response — no tool involved in this turn.

Five hops, one tool. Most real tasks need more than one call before they're done — maybe the model looks up a city's timezone before it can decide whether "right now" means today or tomorrow. That repeating version of hops 2 through 4 is [The Agent Loop](/learn/tools-function-calling/the-tool-call-loop), and once you have several tools and several steps, *how* they're sequenced — one after another, in parallel, or as a dependency graph — is its own module starting at [Sequential Multi-Step Tool Use](/learn/tools-function-calling/sequential-multi-step-tool-use). Once your tool count grows into the dozens, which tools even get shown to the model on a given turn becomes a decision covered in [Tool Selection at Scale](/learn/tools-function-calling/tool-selection-at-scale). And before any of this ships, you'll want to know it actually works — [Testing and Debugging Tool Calls](/learn/tools-function-calling/testing-and-debugging-tool-calls) and [Benchmarking Tool Use](/learn/tools-function-calling/benchmarking-tool-use) cover that.

## What trips people up

| Idea | Confusion | Where to learn it |
|---|---|---|
| A tool call is only a request | Assuming the API call already happened when the model emits it | [Anatomy of a Tool Call](/learn/tools-function-calling/anatomy-of-a-tool-call) |
| The model can't act on its own | Thinking the model "reaches out" to a server itself | [Tools Are the Model's Only Hands](/learn/tools-function-calling/tools-as-the-models-hands) |
| The loop has to terminate on plain text | Not knowing where to check for "the model is done" | [The Agent Loop](/learn/tools-function-calling/the-tool-call-loop) |
| Tool call syntax is trained, not hardcoded | Assuming any model can call any tool shape flawlessly | [How Models Learn to Emit Tool Calls](/learn/tools-function-calling/how-models-learn-to-call-tools) |
| Providers format calls differently | Copy-pasting OpenAI-shaped code into an Anthropic integration | [Tool Calling Across Providers](/learn/tools-function-calling/tool-calling-across-providers) |
| Tool calls and structured output overlap but aren't the same | Reaching for a tool when a plain schema-constrained answer would do | [Structured Output vs. Tool Calls: Which and When](/learn/tools-function-calling/structured-output-vs-tool-calls-when) |

## A reading path

If you're new to this track, the module is built to be read in order:

1. [Tools Are the Model's Only Hands](/learn/tools-function-calling/tools-as-the-models-hands) — build the intuition first.
2. [Anatomy of a Tool Call](/learn/tools-function-calling/anatomy-of-a-tool-call) — see the exact JSON.
3. [The Agent Loop](/learn/tools-function-calling/the-tool-call-loop) — see the mechanism repeat.
4. [Your First Tool Call, End to End](/learn/tools-function-calling/first-tool-call-walkthrough) — build it yourself.
5. [Why a Model Needs Tools at All](/learn/tools-function-calling/why-models-need-tools) and [Beginner Tool-Calling Mistakes](/learn/tools-function-calling/foundations-common-mistakes) — sharpen your judgment.
6. [Foundations Quiz](/learn/tools-function-calling/foundations-quiz) — check it stuck.

Come back to this page after each later module — it's the map, not the territory.

**Related:** [Designing a Tool Schema](/learn/tools-function-calling/designing-a-tool-schema), [Executing Tool Calls Safely](/learn/tools-function-calling/executing-tool-calls-safely), [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-tool-errors-and-retries), [Sequential Multi-Step Tool Use](/learn/tools-function-calling/sequential-multi-step-tool-use), [Testing and Debugging Tool Calls](/learn/tools-function-calling/testing-and-debugging-tool-calls)
