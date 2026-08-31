---
title: "Instrumenting Requests With Tracing"
track: "genai-app-dev"
status: live
summary: "Build an OpenTelemetry-style trace spanning prompt assembly, the provider call, the tool loop, and validation."
duration: "8 min read"
---

[Observability for GenAI Features](/learn/genai-app-dev/observability-for-genai) argued a GenAI request needs spans, not one log line. This lesson builds those spans for real, in the shape OpenTelemetry uses, and shows a slow request diagnosed from the trace instead of guessed at.

## What we're building

A minimal tracer — no vendor SDK required to follow along, though the shape maps directly onto OpenTelemetry's `Span`/`Tracer` API if you're wiring this into a real collector. One root span per request, child spans for prompt assembly, the provider call, each tool call, and output validation, each tagged with the attributes that actually matter for a GenAI request: model, prompt version, token counts, tool name. We'll trace a request that's unexpectedly slow and read the cause straight off the span tree.

## Setup

TypeScript, no external tracing library — the pattern below is what libraries like `@opentelemetry/api` give you, kept small enough to read in one pass.

```
tracing/
  tracer.ts   # span creation, nesting, attributes
  trace.ts    # the traced request handler
```

## Build it

### Step 1: a span and a tracer

```ts
interface Span {
  name: string;
  startedAt: number;
  endedAt?: number;
  attributes: Record<string, string | number | boolean>;
  children: Span[];
}

class Tracer {
  private stack: Span[] = [];
  root: Span;

  constructor(rootName: string) {
    this.root = { name: rootName, startedAt: Date.now(), attributes: {}, children: [] };
    this.stack = [this.root];
  }

  startSpan(name: string, attrs: Record<string, string | number | boolean> = {}): Span {
    const span: Span = { name, startedAt: Date.now(), attributes: attrs, children: [] };
    this.stack[this.stack.length - 1].children.push(span);
    this.stack.push(span);
    return span;
  }

  endSpan(span: Span, attrs: Record<string, string | number | boolean> = {}) {
    span.endedAt = Date.now();
    Object.assign(span.attributes, attrs);
    this.stack.pop();
  }
}
```

> **Why this step?** Nesting via a stack, rather than a flat list with parent IDs, mirrors how the request actually executes — a tool call happens *inside* the provider-call-and-response cycle, not beside it. That nesting is what lets you compute "how much of the total came from this one step" without joining rows back together later.

### Step 2: wrapping prompt assembly and the provider call

```ts
async function tracedRequest(tracer: Tracer, userId: string, history: Message[]) {
  const assembleSpan = tracer.startSpan("assemble_prompt");
  const prompt = buildPrompt(history); // from Trimming Conversation History
  tracer.endSpan(assembleSpan, { tokens_in: estimateTokens(prompt) });

  const callSpan = tracer.startSpan("provider_call", { model: "claude-sonnet-5" });
  const response = await callProvider(prompt);
  tracer.endSpan(callSpan, { tokens_out: response.usage.outputTokens });

  return response;
}
```

> **Why this step?** Tagging `provider_call` with the model id and `assemble_prompt` with the resolved token count is what makes a trace queryable across requests later — "show me every trace where `tokens_in` exceeded 4000" is a real question you'll ask after a [context-limit](/learn/genai-app-dev/context-limits-and-trimming) incident, and it only works if the attribute was captured at the time, not reconstructed after the fact.

### Step 3: tracing the tool-call loop

```ts
async function tracedToolLoop(tracer: Tracer, initialResponse: ProviderResponse) {
  let response = initialResponse;
  let iterations = 0;

  while (response.toolCalls?.length && iterations < 5) {
    for (const call of response.toolCalls) {
      const toolSpan = tracer.startSpan(`tool_call:${call.name}`, { args: JSON.stringify(call.args) });
      const result = await runTool(call);
      tracer.endSpan(toolSpan, { ok: result.ok });
    }
    const nextSpan = tracer.startSpan("provider_call", { model: "claude-sonnet-5" });
    response = await callProvider(/* prompt + tool results */ response);
    tracer.endSpan(nextSpan, { tokens_out: response.usage.outputTokens });
    iterations++;
  }
  return response;
}
```

> **Why this step?** This is the span the flat "request took 4.2s" number can never give you: how many tool iterations ran, and which one was slow. A trace with three `tool_call:*` spans immediately tells you the loop from [Multi-Step Agentic Tool Loops](/learn/genai-app-dev/multi-step-agentic-tool-loops) didn't converge in one pass — a fact you'd otherwise have to infer from an elevated average latency and guess at.

### Step 4: closing the root span and shipping the trace

```ts
function finishAndExport(tracer: Tracer, promptVersion: string, costUsd: number) {
  tracer.root.endedAt = Date.now();
  tracer.root.attributes.prompt_version = promptVersion;
  tracer.root.attributes.cost_usd = costUsd;
  tracer.root.attributes.total_ms = tracer.root.endedAt - tracer.root.startedAt;
  exportTrace(tracer.root); // ship to your collector — Jaeger, Honeycomb, an OTel-compatible backend
}
```

> **Why this step?** `prompt_version` on the root span is the join key back to the registry from [Versioning Prompts in Git and a Registry](/learn/genai-app-dev/versioning-prompts-in-git-and-registry) — it's what lets you filter "every slow trace" down to "every slow trace on v15" and see a pattern a single request can't show you.

## Run it

```ts
const tracer = new Tracer("chat_request");
const response = await tracedRequest(tracer, "u_9f21", history);
const final = await tracedToolLoop(tracer, response);
finishAndExport(tracer, "v15", 0.0091);
```

The resulting tree, printed, is the exact shape shown in [Observability for GenAI Features](/learn/genai-app-dev/observability-for-genai)'s example — `assemble_prompt` at 4ms, a `tool_call:lookup_order` at 890ms, a second `provider_call` at 1720ms. Reading the tree top to bottom, the second provider call — not the tool call, and not prompt assembly — is where more than half the request's time actually went, because it's generating the full answer while the first call only decided to use a tool.

## Harden it

- **Cap tool-loop depth and record when you hit it**, not just when it converges — a trace that ends at `iterations === 5` without a final answer is a different failure than one that converges at iteration 2, and both look identical without the count.
- **Sample, don't trace every request forever at full detail** once volume is high — keep 100% of traces for a fixed window after every prompt promotion (exactly when you need them most) and sample the rest.
- **Propagate the trace ID to error logs and to the client.** A support ticket that includes a trace ID turns "it was slow yesterday" into an actual span tree instead of a guess. See [Failure Modes of LLM Calls](/learn/genai-app-dev/failure-modes-of-llm-calls) for what else belongs alongside it.
- **Never put full prompt or completion text in span attributes.** Spans are operational metadata — tokens, timings, versions, ok/fail. The actual content pipeline, with redaction and access control, is [Logging Prompts and Completions Safely](/learn/genai-app-dev/logging-prompts-and-completions-safely), and it's deliberately a separate store.

## Extend it

Wire `exportTrace` to a real OTel collector and you get trace search, latency histograms, and service maps for free. Once traces are flowing, [Evals and Regression Testing for Prompts](/learn/genai-app-dev/evals-and-regression-testing) can pull `prompt_version` and quality signal straight from them to build a golden-dataset regression suite instead of a synthetic one.

**Related:** [Observability for GenAI Features](/learn/genai-app-dev/observability-for-genai), [Logging Prompts and Completions Safely](/learn/genai-app-dev/logging-prompts-and-completions-safely), [Versioning Prompts in Git and a Registry](/learn/genai-app-dev/versioning-prompts-in-git-and-registry), [Latency Budgets for LLM Features](/learn/genai-app-dev/latency-budgets-for-llm-features), [Multi-Step Agentic Tool Loops](/learn/genai-app-dev/multi-step-agentic-tool-loops)
