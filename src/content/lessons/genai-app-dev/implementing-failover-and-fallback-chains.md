---
title: "Implementing Failover and Fallback Chains"
track: "genai-app-dev"
status: live
summary: "Build a router that retries transient errors in place and fails over to the next provider in an ordered chain on sustained outages."
duration: "9 min read"
---

A provider outage that takes your feature down with it is usually not a capacity problem — it's a missing fallback chain. This lesson builds one: a router that wraps the `LLMProvider` interface, retries the blips, and fails over the outages, using the routing policy from [Routing: Picking a Model Per Request](/learn/genai-app-dev/model-routing-strategies) to decide where to start.

## What we're building

A `FailoverRouter` class that itself implements `LLMProvider` — so nothing calling it needs to know failover is happening — wrapping an ordered chain of real providers, each with its own circuit-breaker state. On a transient error it retries the same provider a bounded number of times; on a sustained one it opens that provider's circuit and moves to the next link in the chain.

## Setup

Builds directly on the interface from [Designing a Common Provider Interface](/learn/genai-app-dev/building-a-provider-interface-ts). No new dependencies — this is application logic sitting in front of adapters you already have.

### Step 1 — Draw the retry-vs-failover boundary before writing code

This is the decision that has to be right before any of the implementation matters:

| Signal | Action | Why |
|---|---|---|
| Network timeout, single request | Retry same provider, with backoff | Likely a transient blip — the provider is fine |
| HTTP 429 with a short `retry-after` | Retry same provider after the indicated wait | The provider told you exactly how long to wait — respect it |
| HTTP 5xx, repeated within a short window | Trip the circuit, fail over | A pattern, not a blip — the provider itself is degraded |
| HTTP 401/403 | Neither — surface immediately | Retrying or failing over won't fix a bad key |
| Sustained 429 (rate limit, not backing off) | Trip the circuit, fail over | You're structurally over that provider's limit right now; another provider isn't |

The rule of thumb: **retry when the same provider trying again is likely to succeed; fail over when it isn't.** A single dropped connection is worth a retry. Three 500s in ten seconds means the provider is having a bad day and a fourth attempt against it is just added latency before you reach a provider that works.

### Step 2 — Per-provider circuit state

```ts
// src/llm/circuit.ts
type CircuitState = "closed" | "open" | "half-open";

class Circuit {
  private state: CircuitState = "closed";
  private failures = 0;
  private openedAt = 0;

  constructor(
    private readonly failureThreshold = 3,
    private readonly cooldownMs = 30_000,
  ) {}

  canAttempt(): boolean {
    if (this.state === "closed") return true;
    if (this.state === "open" && Date.now() - this.openedAt > this.cooldownMs) {
      this.state = "half-open"; // let one request through as a probe
      return true;
    }
    return this.state === "half-open";
  }

  recordSuccess() {
    this.state = "closed";
    this.failures = 0;
  }

  recordFailure() {
    this.failures += 1;
    if (this.failures >= this.failureThreshold) {
      this.state = "open";
      this.openedAt = Date.now();
    }
  }
}
```

> **Why this step?** The half-open state matters as much as open/closed — without it, a recovered provider stays permanently skipped until a deploy, because nothing ever tries it again. This is the same pattern covered generally in [Timeouts and Circuit Breakers](/learn/genai-app-dev/timeouts-and-circuit-breakers); here it's scoped per-provider so one vendor's outage doesn't trip the breaker for providers that are fine.

### Step 3 — Classify errors into retry vs. failover

```ts
// src/llm/error-classification.ts
export type ErrorAction = "retry" | "failover" | "fatal";

export function classify(error: { status?: number; code?: string }): ErrorAction {
  if (error.status === 401 || error.status === 403) return "fatal";
  if (error.status === 429) return "retry"; // first attempt: honor retry-after, see step 4
  if (error.status && error.status >= 500) return "failover";
  if (error.code === "ETIMEDOUT" || error.code === "ECONNRESET") return "retry";
  return "failover"; // unknown errors default to failover, not silent retry
}
```

> **Why this step?** Defaulting unknown errors to `"failover"` rather than `"retry"` is deliberate — retrying blind against an error you don't recognize risks hammering a provider that's actually down. Fail over first; you can always tighten the classification once you've seen the error in production. This ties into the error taxonomy built out fully in [Normalizing Responses: Usage, Finish Reasons, and Errors](/learn/genai-app-dev/normalizing-responses-across-providers).

### Step 4 — The router itself

```ts
// src/llm/failover-router.ts
import type { LLMProvider } from "./provider";
import type { Message, CallOptions, CompletionResult, StreamEvent } from "./types";
import { Circuit } from "./circuit";
import { classify } from "./error-classification";

interface ChainLink {
  provider: LLMProvider;
  circuit: Circuit;
}

export class FailoverRouter implements LLMProvider {
  readonly name = "failover-router";
  private chain: ChainLink[];

  constructor(providers: LLMProvider[]) {
    this.chain = providers.map(provider => ({ provider, circuit: new Circuit() }));
  }

  async complete(messages: Message[], options: CallOptions): Promise<CompletionResult> {
    let lastError: unknown;

    for (const link of this.chain) {
      if (!link.circuit.canAttempt()) continue; // skip providers with an open circuit

      const maxAttempts = 2; // one retry, same provider, for transient errors only
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const result = await link.provider.complete(messages, options);
          link.circuit.recordSuccess();
          return result;
        } catch (err: any) {
          lastError = err;
          const action = classify(err);

          if (action === "fatal") throw err; // never retry or fail over a bad key
          if (action === "retry" && attempt < maxAttempts) {
            await sleep(backoffMs(attempt, err.retryAfterMs));
            continue; // same provider, one more try
          }
          link.circuit.recordFailure();
          break; // move to the next provider in the chain
        }
      }
    }

    throw new Error(`All providers in the failover chain failed: ${lastError}`);
  }

  async *stream(messages: Message[], options: CallOptions): AsyncIterable<StreamEvent> {
    // Streaming failover is stricter: once tokens have reached the client,
    // you can't silently restart on a different provider mid-response.
    // Fail over only before the first chunk arrives — see "Harden it" below.
    for (const link of this.chain) {
      if (!link.circuit.canAttempt()) continue;
      try {
        let firstChunk = true;
        for await (const event of link.provider.stream(messages, options)) {
          firstChunk = false;
          yield event;
        }
        link.circuit.recordSuccess();
        return;
      } catch (err) {
        link.circuit.recordFailure();
        // only safe to try the next link if nothing was yielded yet
        continue;
      }
    }
    throw new Error("All providers in the failover chain failed to stream");
  }

  async countTokens(messages: Message[], model: string): Promise<number> {
    return this.chain[0].provider.countTokens(messages, model);
  }
}

function backoffMs(attempt: number, retryAfterMs?: number): number {
  if (retryAfterMs) return retryAfterMs;
  return Math.min(1000 * 2 ** attempt, 8000) + Math.random() * 250; // capped exponential + jitter
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

> **Why this step?** The chain is ordered — index 0 is the primary from your routing policy, the rest are fallbacks from a different provider entirely, not just a different model from the same one (a provider-wide outage takes every model behind it down together). `countTokens` deliberately doesn't fail over: it's a local estimate in most adapters, not worth the complexity, and callers needing precision should call a specific adapter directly.

## Run it

```ts
import { FailoverRouter } from "./llm/failover-router";
import { AnthropicProvider } from "./llm/anthropic-provider";
import { OpenAIProvider } from "./llm/openai-provider";

const router = new FailoverRouter([new AnthropicProvider(), new OpenAIProvider()]);

const result = await router.complete(
  [{ role: "user", content: "Summarize this in one sentence: ..." }],
  { model: "claude-sonnet", maxTokens: 200 },
);
```

Feature code calls `router` exactly like it would call any single `LLMProvider` — that's the payoff of building failover behind the same interface instead of as a special case.

### A test that simulates an outage

```ts
import { describe, it, expect, vi } from "vitest";
import { FailoverRouter } from "./failover-router";
import type { LLMProvider } from "./provider";

function providerThatFails(times: number, name: string): LLMProvider {
  let calls = 0;
  return {
    name,
    async complete() {
      calls++;
      if (calls <= times) {
        const err: any = new Error("Service Unavailable");
        err.status = 503;
        throw err;
      }
      return { content: `ok from ${name}`, toolCalls: [], finishReason: "stop", usage: { inputTokens: 1, outputTokens: 1 }, raw: null };
    },
    async *stream() { /* not exercised in this test */ },
    async countTokens() { return 1; },
  };
}

describe("FailoverRouter", () => {
  it("fails over to the next provider after the primary's circuit trips", async () => {
    const primary = providerThatFails(Infinity, "primary"); // simulates a sustained outage
    const backup = providerThatFails(0, "backup");
    const router = new FailoverRouter([primary, backup]);

    const result = await router.complete([{ role: "user", content: "hi" }], { model: "m", maxTokens: 10 });

    expect(result.content).toBe("ok from backup");
  });
});
```

This test is the one worth keeping in your suite permanently — it's the only thing that proves the fallback path actually works, rather than just compiling.

## Harden it

- **Streaming failover has a hard boundary.** Once the first byte has reached the client, you cannot silently swap providers — the user would see a response restart mid-sentence. Fail over before the first chunk; after that, surface the error and let the UI offer a regenerate, as covered in [Stop, Regenerate, and Partial Render](/learn/genai-app-dev/stop-regenerate-and-partial-render).
- **Log every failover event**, not just errors — knowing that 8% of traffic silently landed on your backup provider today is the kind of signal that should page someone before it becomes 100%.
- **Test your fallback path with real prompts, not just the health check.** A system prompt tuned for one model's instruction-following can degrade on a fallback model — evaluate the fallback as a first-class target, not an emergency afterthought.

## Extend it

The chain here is static — built once from a fixed provider list. In practice it should come from the same routing policy object introduced in [Routing: Picking a Model Per Request](/learn/genai-app-dev/model-routing-strategies), so the primary and its fallbacks vary by task and tenant just like the initial pick does. And once failover is reliable, the next question is whether you're routing to the *cheapest capable* option at every step — worked through with real numbers next.

**Related:** [Routing: Picking a Model Per Request](/learn/genai-app-dev/model-routing-strategies), [Timeouts and Circuit Breakers](/learn/genai-app-dev/timeouts-and-circuit-breakers), [Rate Limits and Retry Strategies](/learn/genai-app-dev/rate-limits-and-retry-strategies), [Normalizing Responses: Usage, Finish Reasons, and Errors](/learn/genai-app-dev/normalizing-responses-across-providers), [Cost- and Capability-Aware Routing in Action](/learn/genai-app-dev/cost-and-capability-based-routing)
