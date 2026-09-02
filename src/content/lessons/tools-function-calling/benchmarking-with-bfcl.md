---
title: "Benchmarking Tool Use With BFCL"
track: "tools-function-calling"
status: live
summary: "What the Berkeley Function-Calling Leaderboard actually measures, and why it's a starting point, not a substitute for your own eval."
duration: "6 min read"
---

Every model provider claims strong "function calling." The Berkeley Function-Calling Leaderboard exists because that claim needs a shared, checkable definition before it means anything.

## What it is

BFCL, from UC Berkeley's Gorilla project, is a standardized benchmark for one narrow question: given a query and a set of available tools, does a model produce the right tool call? It's not a general capability benchmark — it doesn't ask whether the model reasons well or writes good code, only whether it converts intent into a correctly-shaped function call, evaluated against a labeled reference or, in later versions, against actually executing the call.

## The mental model

Think of BFCL as a spelling test for tool calls, not a reading-comprehension test for the model. It isolates the mechanical skill — pick the right tool, fill the right arguments, in the right structure — from everything else an agent does. A model can be excellent at BFCL and mediocre at planning a multi-step task, because those are genuinely different skills being measured by different things.

## Why it works this way

Free-text evals — BLEU-style overlap, or an LLM judge reading a paragraph — assume the output is prose. A tool call is structured: a function name plus a JSON object of arguments. Grading it means checking things that can each fail independently: did the model call a tool at all when one was needed, did it pick the *correct* tool among the options offered, and did it fill every required argument with a value of the right type and meaning. BFCL breaks this into categories instead of one aggregate score, because "can call a tool" hides very different failure modes:

- **Simple** — one tool offered, one call expected, straightforward arguments.
- **Multiple** — several tools are offered; the model must pick the right one and ignore the rest.
- **Parallel** — one query requires several tool calls issued together (see [Parallel Tool Calls](/learn/tools-function-calling/parallel-tool-calls)).
- **Parallel multiple** — parallel calls drawn from a larger tool set, combining both harder cases.
- **Relevance / irrelevance detection** — no available tool actually answers the query, and the right move is to say so instead of forcing a call.
- **Multi-turn** — state carries across turns, so an earlier tool result has to inform a later call correctly.

Later versions added an "executable" track that actually runs the generated call against a real API or sandbox rather than diffing it against a reference string — catching calls that look syntactically fine but fail at execution, and giving credit to calls that don't match the reference string but are functionally equivalent.

## A concrete example (shown)

A relevance-category item might offer only `get_weather` and `convert_currency` as tools and ask "What's the capital of France?" The correct behavior is neither tool call — it's recognizing no available tool answers the question and responding directly, or asking for clarification. A model that forces a call anyway (say, `get_weather(location="France")`) fails this item even though the call is syntactically valid, because relevance detection is exactly what's being tested.

## Where it shows up

Model selection when you're choosing a base model for a tool-heavy agent, and as a sanity check that a new model release hasn't regressed on basic call-shape correctness before you invest in switching to it.

## Watch out for

- **Treating category scores as interchangeable.** A model strong on "simple" and weak on "relevance" will confidently call tools it shouldn't — a materially different risk than one that's merely slow to pick the right tool among several.
- **Assuming a BFCL score transfers to your tools.** BFCL's tool set, naming conventions, and argument shapes aren't yours — see [Reading BFCL Scores Critically](/learn/tools-function-calling/reading-bfcl-leaderboard) for exactly why that gap matters.
- **Stopping at BFCL instead of building your own eval.** A public benchmark measures general competence; it says nothing about your specific schemas, descriptions, or domain — see [Building Your Own Eval Harness](/learn/tools-function-calling/building-a-tool-use-eval-harness) for closing that gap.

## Where next

[Reading BFCL Scores Critically](/learn/tools-function-calling/reading-bfcl-leaderboard) goes deeper on what a high score does and doesn't predict. [Building Your Own Eval Harness](/learn/tools-function-calling/building-a-tool-use-eval-harness) walks through building the eval that actually covers your agent.

**Related:** [Reading BFCL Scores Critically](/learn/tools-function-calling/reading-bfcl-leaderboard), [Building Your Own Eval Harness](/learn/tools-function-calling/building-a-tool-use-eval-harness), [Benchmarking Tool Use](/learn/tools-function-calling/benchmarking-tool-use), [Parallel Tool Calls](/learn/tools-function-calling/parallel-tool-calls)
