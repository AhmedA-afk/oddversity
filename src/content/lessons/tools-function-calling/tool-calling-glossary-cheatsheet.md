---
title: "Tool-Calling Vocabulary Cheatsheet"
track: "tools-function-calling"
status: live
summary: "One page of every term this track uses, each with a one-line definition and where to go deeper."
duration: "6 min read"
---

Keep this open in a tab through the rest of the track. Every term below is used elsewhere without re-explanation — this is where it gets defined once.

## Glossary

| Term | One-line definition | Go deeper |
|---|---|---|
| **Tool** vs **function** | Same concept in practice — "tool" is the API-level object (name, description, schema) you register; "function" is the actual code your dispatcher runs when a matching call comes in. The two are connected, not identical: one tool can map to any function you write. | [What Is Tool Calling](/learn/tools-function-calling/what-is-tool-calling) |
| **Schema** | The JSON Schema describing a tool's expected arguments — types, required fields, enums — that the model reads to decide how to fill in a call. | [Designing a Tool Schema](/learn/tools-function-calling/designing-a-tool-schema) |
| **`tool_use` / `tool_calls`** | The provider-specific name for the block(s) in an assistant response that request a tool — Anthropic's `tool_use`, OpenAI's `tool_calls`. Carries an id, a name, and arguments. | [Anatomy of a Tool Call](/learn/tools-function-calling/anatomy-of-a-tool-call) |
| **`tool_result`** | The message you send back after executing a tool, keyed by the same id as the request it answers, so the model can match the two up. | [Returning Tool Results to the Model](/learn/tools-function-calling/returning-tool-results-to-the-model) |
| **Arguments** | The actual input values the model filled into a tool's schema for one specific call — e.g. `{"city": "Tokyo"}`. Parsed as a JSON string on OpenAI, delivered pre-parsed on Anthropic. | [Tool Calling Across Providers](/learn/tools-function-calling/tool-calling-across-providers) |
| **`tool_choice`** | The request parameter that controls whether the model may call a tool freely, must call one, must call a specific one, or is barred from calling any. | [Tool Choice and Forcing Tool Use](/learn/tools-function-calling/tool-choice-and-forcing-tool-use) |
| **Forcing** | Setting `tool_choice` to require a call (any tool, or one named tool) instead of leaving the decision to the model. | [When to Force vs. Auto](/learn/tools-function-calling/when-to-force-vs-auto) |
| **Parallel** tool calls | Multiple `tool_use`/`tool_calls` blocks in one assistant turn, meant to be executed concurrently and answered together in a single result message. | [Parallel Tool Calls](/learn/tools-function-calling/parallel-tool-calls) |
| **Sequential** tool calls | Tool calls spread across separate turns, where a later call depends on an earlier result — the model has to see one answer before it can ask the next question. | [Sequential Multi-Step Tool Use](/learn/tools-function-calling/sequential-multi-step-tool-use) |
| **Dispatcher** | The piece of your code that reads a tool call's name, routes it to the matching function, executes it (often with validation and authority checks in between), and packages the result. | [Building a Tool Dispatcher](/learn/tools-function-calling/building-a-tool-dispatcher) |
| **Agent loop** | The `while` loop that keeps sending messages and executing tool calls until the model responds with plain text instead of a request. | [The Agent Loop](/learn/tools-function-calling/the-tool-call-loop) |

## Defaults to start with — then measure

- **`tool_choice`: leave it on `auto`** unless you have a narrow, single-purpose endpoint where the model must always call exactly one tool — only then reach for forcing. [When to Force vs. Auto](/learn/tools-function-calling/when-to-force-vs-auto)
- **Execution: default to sequential** unless you've confirmed the calls are truly independent (no call depends on another's result) — parallel execution of dependent calls produces stale or wrong inputs. [Parallel vs. Sequential](/learn/tools-function-calling/parallel-vs-sequential-decision)
- **Errors: return `is_error: true` with a message, never drop the result.** A missing result for a call the model made stalls the loop; a returned error lets the model self-correct. [Self-Correction Mechanics](/learn/tools-function-calling/self-correction-mechanics)
- **Loop iterations: cap it.** Every agent loop needs a hard ceiling before it ships — an unbounded `while True` is a debugging session waiting to happen. [Infinite Loops and Retry Caps](/learn/tools-function-calling/infinite-loop-and-retry-caps)

## The shape to remember

```
tool_use / tool_calls  →  your dispatcher runs the function  →  tool_result  →  model answers
      (request)                    (your code, not the model)      (evidence)      (text)
```

Every term above is a label for one piece of that line. If you can point to where a term sits on it, you know what it means.

**Related:** [What Is Tool Calling](/learn/tools-function-calling/what-is-tool-calling), [Anatomy of a Tool Call](/learn/tools-function-calling/anatomy-of-a-tool-call), [The Agent Loop](/learn/tools-function-calling/the-tool-call-loop), [Tool Choice and Forcing Tool Use](/learn/tools-function-calling/tool-choice-and-forcing-tool-use), [Building a Tool Dispatcher](/learn/tools-function-calling/building-a-tool-dispatcher)
