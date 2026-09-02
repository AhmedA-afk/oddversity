---
title: "Capstone: Build a Complete Tool-Using Agent"
track: "tools-function-calling"
status: live
summary: "Assemble the whole track into one research-and-booking agent, gated, tested, and scored against your own eval suite."
duration: "9 min read"
---

Every lesson in this track built one piece of a tool-using agent in isolation. This is where they stop being separate pieces.

## The brief

Build a research-and-booking assistant: given a natural-language request ("find me a well-reviewed Italian place near downtown for four people Friday at 7, and book it if it's available"), it searches, compares options, checks availability, and books — asking for approval before anything irreversible. It needs a registry of 30 or more tools (search, details, availability, booking, cancellation, calendar, notifications, and a general-purpose code tool for any ad hoc data wrangling among results), served through retrieval rather than dumped whole into every prompt, behind a validating dispatcher with sandboxing on the code tool and an approval gate on every write. It must return actionable errors, self-correct on bad calls up to a hard iteration cap, run independent lookups in parallel and dependent steps in sequence, stream its progress to a UI, and be gated for deploy by an eval harness — not a demo run you happened to watch go well.

## Acceptance criteria

- [ ] Tool registry has 30+ tools, organized with clear [namespacing](/learn/tools-function-calling/tool-namespacing-and-grouping), and no single prompt sends the full registry — tools are retrieved per-request via [tool selection at scale](/learn/tools-function-calling/tool-selection-at-scale-strategies) / [RAG over tools](/learn/tools-function-calling/rag-over-tools-retrieval).
- [ ] Every tool call passes through a [validating dispatcher](/learn/tools-function-calling/building-a-tool-dispatcher) before execution — no handler runs on unvalidated arguments.
- [ ] The code-execution tool runs inside an isolated sandbox with no default network access and enforced resource/time limits, per [Building a Sandboxed Code Interpreter](/learn/tools-function-calling/building-a-code-interpreter-tool).
- [ ] Every write action (booking, cancellation, sending a notification) sits behind an [approval gate](/learn/tools-function-calling/approval-gates-design) with an explicit risk tier per [Classifying Tool Risk Tiers](/learn/tools-function-calling/classifying-tool-risk-tiers); read-only lookups do not.
- [ ] Tool errors return [actionable messages](/learn/tools-function-calling/returning-actionable-errors) the model can act on, and the loop demonstrates real [self-correction](/learn/tools-function-calling/self-correction-mechanics) from at least one bad call in the recorded run.
- [ ] The loop has a hard [iteration cap](/learn/tools-function-calling/infinite-loop-and-retry-caps) and exits cleanly instead of looping forever on a stuck tool.
- [ ] Independent lookups (searching multiple restaurants, checking multiple calendars) run in [parallel](/learn/tools-function-calling/executing-parallel-calls-async); dependent steps (search → detail → book) run [sequentially](/learn/tools-function-calling/sequential-multi-step-basics), and the two are not conflated.
- [ ] Progress streams to a UI turn by turn — the user sees which tool is running, not just a final answer, per [Streaming UI for Tool Calls](/learn/tools-function-calling/streaming-ui-for-tool-calls).
- [ ] A labeled eval set (minimum ~25 realistic queries, including some with no correct tool at all) grades selection accuracy and argument correctness, and a deploy is blocked below a threshold you set — per [Building Your Own Eval Harness](/learn/tools-function-calling/building-a-tool-use-eval-harness).
- [ ] Every tool call in a full run is logged as structured trace data, replayable without calling the model — per [Debugging With Trace Logging](/learn/tools-function-calling/debugging-with-trace-logging).

## Suggested stack

Any model with native tool-calling support; a lightweight web framework or CLI for the harness loop; a container runtime (Docker is enough) for the code-execution sandbox; a vector store or simple keyword index for tool retrieval if you're not hand-coding namespaces; a queue or async runtime for parallel tool execution; server-sent events or WebSockets for streaming to a UI. None of this needs to be exotic — the point of the capstone is the wiring between pieces, not any single piece being sophisticated.

## Milestones (capabilities)

Work toward these as capabilities the agent has, not as a linear script to follow in order:

- **Finds the right tools among 30+.** Given an ambiguous request, it retrieves a relevant slice of the registry rather than being handed all of it, and still picks correctly — see [Tool Selection at Scale](/learn/tools-function-calling/tool-selection-at-scale).
- **Executes safely under load.** A malformed argument, an out-of-range value, or a call to a nonexistent tool never reaches a real handler unvalidated — see [Validating Tool Arguments](/learn/tools-function-calling/validating-tool-arguments) and [Executing Tool Calls Safely](/learn/tools-function-calling/executing-tool-calls-safely).
- **Recovers instead of collapsing.** A tool timeout, a not-found error, or a bad argument produces a message the model can act on and does — see [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-tool-errors-and-retries).
- **Orchestrates correctly, not just eventually.** Parallel work stays parallel, sequential dependencies stay ordered, and neither degrades into a flat sequential loop out of caution — see [Chaining Tools into Workflows](/learn/tools-function-calling/chaining-tools-into-workflows).
- **Never runs an unreviewed write.** A booking or cancellation always stops for approval; a search or lookup never does — the risk tiering is visible in the code, not implied.
- **Ships against a score, not a vibe.** The eval harness runs before any change to tools, prompts, or model is considered done.

## What good looks like

A run against the provided task suite that completes each task within the iteration cap, streams visible progress the whole way, stops for approval exactly at write actions and nowhere else, and produces a trace log you could hand to a teammate to debug without re-running the agent. The eval report should show selection accuracy and argument correctness broken out per tool category, not one aggregate number — and if a category is weak, the report should say which one, referencing [Reading BFCL Scores Critically](/learn/tools-function-calling/reading-bfcl-leaderboard)'s point that an aggregate score hides exactly the failures that matter. Cite, in your writeup, which module of this track each capability came from — the schema design from module 2, the safety gating from module 4, the orchestration from module 6, the sandboxing and eval from this module — so it's clear the agent is an assembly of the track, not a from-scratch rebuild that happens to resemble it.

## Extensions

- Add a second, weaker model behind a fallback path and measure whether your eval harness catches the quality drop before a user would notice it.
- Introduce a deliberately adversarial task (a tool result containing an embedded instruction) and confirm the agent doesn't treat it as a command — see [Tool Results as an Injection Vector](/learn/tools-function-calling/tool-results-as-injection-vector).
- Add [tool-result caching](/learn/tools-function-calling/caching-tool-results) for the read-only lookups and measure the latency and cost difference on a repeated query.
- Version one tool's schema, ship the change, and confirm old logged traces still replay correctly against the new dispatcher — see [Tool Schema Versioning](/learn/tools-function-calling/tool-schema-versioning).

**Related:** [Tool Selection at Scale](/learn/tools-function-calling/tool-selection-at-scale), [Executing Tool Calls Safely](/learn/tools-function-calling/executing-tool-calls-safely), [Chaining Tools into Workflows](/learn/tools-function-calling/chaining-tools-into-workflows), [Building Your Own Eval Harness](/learn/tools-function-calling/building-a-tool-use-eval-harness), [Advanced-Tools Mistakes](/learn/tools-function-calling/advanced-tools-common-mistakes)
