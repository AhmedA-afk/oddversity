---
title: "Capstone: Ship a Production GenAI Assistant"
track: "genai-app-dev"
status: live
summary: "Build and ship a streaming, tool-using assistant with full versioning, flags, and observability against a stated latency and cost budget."
duration: "9 min read"
---

Every lesson in this track built one piece: a provider layer, a stream, a trimmed conversation, a validated tool call, a budget, a flag, a trace. This capstone is where those pieces have to work together, under one feature, shipped the way [Shipping a GenAI Feature End to End](/learn/genai-app-dev/shipping-end-to-end) describes — not as a demo, as something you could hand an on-call engineer.

## The brief

Build an assistant feature — the domain is yours to choose (a support triage bot, a coding helper, a research assistant, an ops copilot) as long as it genuinely needs tools, not just a single prompt-and-response. It must stream its output, use at least one tool that requires real authority (it changes data or takes an action, not just retrieves it), hold a multi-turn conversation, and run in production behind the full versioning-and-rollout apparatus this module built. Treat it exactly as if it's going to real users next week, because the deliverables below assume it is.

## Acceptance criteria

**Core feature**
- [ ] Responses stream token-by-token to the UI, using SSE or WebSockets per [SSE vs WebSockets](/learn/genai-app-dev/sse-vs-websockets) and [Streaming Responses to the UI](/learn/genai-app-dev/streaming-responses-to-the-ui)
- [ ] At least one tool call that takes a real action (not read-only), implemented per [Implementing a Tool-Call Loop](/learn/genai-app-dev/implementing-a-tool-call-loop) and gated by explicit authority checks per [Tool-Calling and Authority](/learn/genai-app-dev/tool-calling-and-authority)
- [ ] A provider abstraction with at least one configured fallback, per [Provider Abstraction Layers](/learn/genai-app-dev/provider-abstraction-layers) and [Implementing Failover and Fallback Chains](/learn/genai-app-dev/implementing-failover-and-fallback-chains)
- [ ] Session state persists across turns with conversation-history trimming that keeps requests inside a token budget, per [Trimming Conversation History](/learn/genai-app-dev/trimming-conversation-history)
- [ ] Output that needs a specific shape is schema-validated with a defined repair or reject path, per [Structured Output in Apps](/learn/genai-app-dev/structured-output-in-apps) and [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair)

**Reliability and safety**
- [ ] Input validation and injection defense on anything a user or a tool result feeds back into the prompt, per [Guardrails and Input Validation](/learn/genai-app-dev/guardrails-and-input-validation)
- [ ] High-stakes tool actions (the ones with real authority above) route through a human-review queue before executing, per [Human-in-the-Loop Review Queues](/learn/genai-app-dev/human-in-the-loop-review-queues)
- [ ] Retries with backoff and a circuit breaker on provider calls, per [Rate Limits and Retry Strategies](/learn/genai-app-dev/rate-limits-and-retry-strategies) and [Error Handling for LLM Calls](/learn/genai-app-dev/error-handling-for-llm-calls)

**Performance and cost**
- [ ] A stated latency budget (state your own p95 target) and a stated cost-per-request budget, both measured against real traffic, per [Latency Budgets for LLM Features](/learn/genai-app-dev/latency-budgets-for-llm-features) and [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking)
- [ ] Prompt caching applied somewhere it measurably helps, per [Prompt Caching for Speed and Cost](/learn/genai-app-dev/prompt-caching-for-speed-and-cost)
- [ ] At least one genuinely long-running step (batch analysis, a multi-step research task) offloaded to a background job, per [Background Jobs for Long-Running AI Tasks](/learn/genai-app-dev/background-jobs-for-long-running-ai-tasks)

**Shipping and operating (this module)**
- [ ] Every prompt resolves through a versioned registry with a working rollback, per [Versioning Prompts in Git and a Registry](/learn/genai-app-dev/versioning-prompts-in-git-and-registry)
- [ ] The feature is gated by a flag with a working kill switch and an automatic halt trigger, per [Canary and Percentage-Based Rollout](/learn/genai-app-dev/canary-and-percentage-rollout)
- [ ] Requests are traced end to end (prompt assembly, provider call, tool loop, validation), per [Instrumenting Requests With Tracing](/learn/genai-app-dev/instrumenting-with-tracing)
- [ ] Completion logs are redacted and retention-limited, per [Logging Prompts and Completions Safely](/learn/genai-app-dev/logging-prompts-and-completions-safely)
- [ ] A rollback and a kill switch are both demonstrated working — actually trigger them and show the feature recover, not just describe the mechanism

**Deliverables**
- [ ] A runnable repo with setup instructions
- [ ] A one-page feature spec (what it does, who it's for, why it needs an LLM at all — per [From Product Ask to Feature Spec](/learn/genai-app-dev/from-product-ask-to-feature-spec))
- [ ] A rollout plan (the gated sequence from [Shipping a GenAI Feature End to End](/learn/genai-app-dev/shipping-end-to-end), with your actual stage thresholds)
- [ ] An incident-response runbook covering at least the four categories in [Incident Response for AI Features](/learn/genai-app-dev/incident-response-for-ai-features), written for someone who isn't you

## Suggested stack

Any provider (or two, for the failover requirement) works — the architecture matters more than the vendor. A common, well-trodden combination: TypeScript with a Next.js API route or a Python FastAPI service for the boundary, SSE for streaming, a Postgres or SQLite table (not a flat JSON file) for the prompt registry and trace store once you're past the earlier lessons' toy versions, and a simple in-process or Redis-backed flag store for rollout state. Keep the background-job queue as simple as your task allows — a basic worker polling a table is enough to satisfy the requirement; you don't need a distributed queue for a capstone.

## Milestones

Work in capability order, not file order — each milestone should be a genuinely working slice, not a stub:

1. **A single streamed response with a real provider abstraction.** No tools yet, no rollout apparatus — just [your first LLM call](/learn/genai-app-dev/your-first-llm-api-call) streaming to a UI, with failover to a second provider proven by killing the first mid-request.
2. **Multi-turn state with a real tool that takes action.** Conversation history trims correctly under a long session; the tool call is authority-gated and, if high-stakes, lands in a review queue instead of executing directly.
3. **Budgets and caching, measured, not assumed.** Instrument latency and cost per request before claiming a budget is met — the number has to come from real traffic, even self-generated traffic, not an estimate.
4. **The shipping apparatus, wired to the feature that already works.** Prompt registry, flag, tracing, and safe logging retrofitted onto milestone 2 and 3's feature — this is usually where a capstone reveals gaps the earlier milestones didn't need.
5. **A live incident, staged and resolved.** Deliberately trigger one incident type from [Incident Response for AI Features](/learn/genai-app-dev/incident-response-for-ai-features) — force a provider failure, or promote a deliberately bad prompt — and use your own tooling to detect and recover from it. This is the milestone that proves the apparatus actually works, not just exists.

## What good looks like

The feature runs, streams, and holds a conversation without you thinking about it — that part should feel unremarkable by the time you're done. What distinguishes a finished capstone is milestone 5: you can point at a real moment where something broke on purpose, and the runbook you wrote describes exactly what happened, matching what actually happened when you ran it. A rollback that's described in a doc but never actually triggered isn't done; a kill switch you've never flipped isn't proven. The stated latency and cost budgets should be numbers you measured against your own traffic, with the arithmetic shown, not numbers that sound plausible.

## Extensions

- Run the A/B test from [A/B Testing Two Prompt Versions](/learn/genai-app-dev/a-b-testing-two-prompts) for real, between two versions of your assistant's system prompt, and let the guardrail metric make the call.
- Build the golden-dataset eval suite from [Evals and Regression Testing for Prompts](/learn/genai-app-dev/evals-and-regression-testing) and wire it into CI so a prompt change that regresses a past incident case fails the build automatically.
- Add a second modality — image or file input, per [Handling Multimodal Input](/learn/genai-app-dev/handling-multimodal-input) — and confirm the whole apparatus (tracing, cost tracking, guardrails) still covers it.
- Push the rollout further: a real percentage ramp against synthetic multi-user traffic, with the auto-halt from [Canary and Percentage-Based Rollout](/learn/genai-app-dev/canary-and-percentage-rollout) genuinely firing on an injected regression.

**Related:** [Shipping a GenAI Feature End to End](/learn/genai-app-dev/shipping-end-to-end), [Incident Response for AI Features](/learn/genai-app-dev/incident-response-for-ai-features), [Canary and Percentage-Based Rollout](/learn/genai-app-dev/canary-and-percentage-rollout), [Observability for GenAI Features](/learn/genai-app-dev/observability-for-genai), [Shipping and Operating Cheatsheet](/learn/genai-app-dev/shipping-operating-cheatsheet), [The Whole Game: GenAI Feature Tour](/learn/genai-app-dev/the-whole-game-genai-feature-tour)
