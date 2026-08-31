---
title: "Canary and Percentage-Based Rollout"
track: "genai-app-dev"
status: live
summary: "Build the bucketing, canary cohort, and auto-halt trigger that turn a feature flag into a self-limiting rollout."
duration: "8 min read"
---

[Feature Flags and Gradual Rollout](/learn/genai-app-dev/feature-flags-and-gradual-rollout) argued that an AI feature needs a flag wired to an automatic trigger, not a human watching a dashboard. This lesson builds that trigger — stable bucketing, a canary cohort, and a monitor that halts a ramp on its own.

## What we're building

A `RolloutController` that assigns each request to a variant based on a stable hash of the user ID, ramps a percentage through fixed stages, and — the part a plain feature flag library usually doesn't give you — watches a rolling error-rate and cost signal and halts the ramp automatically when either crosses a threshold. We'll run a ramp from 1% to 10% and watch it auto-halt mid-stage when a bad prompt spikes errors.

## Setup

TypeScript, no dependencies beyond Node's `crypto`. This sits directly on top of the registry from [Versioning Prompts in Git and a Registry](/learn/genai-app-dev/versioning-prompts-in-git-and-registry) — the rollout decides *whether* a request gets the new prompt version; the registry still decides *which version* "new" resolves to.

```
rollout/
  config.ts     # stages, limits
  bucket.ts     # stable hashing
  monitor.ts    # rolling metrics + auto-halt
```

## Build it

### Step 1: stable bucketing

```ts
import { createHash } from "crypto";

function bucketFor(userId: string, flagName: string): number {
  // salt with the flag name so the same user lands in different
  // buckets for different, unrelated rollouts
  const digest = createHash("sha256").update(`${flagName}:${userId}`).digest("hex");
  return parseInt(digest.slice(0, 8), 16) % 100; // 0-99
}
```

> **Why this step?** The same user must land in the same bucket on every request for the life of the rollout, or you can't tell whether a complaint is about the new variant or the old one, and any comparison in [A/B Testing Two Prompt Versions](/learn/genai-app-dev/a-b-testing-two-prompts) is noise. Hashing a stable ID gives you that without storing a per-user assignment anywhere — the bucket is a pure function of `(userId, flagName)`.

### Step 2: stages and the canary cohort

```ts
interface RolloutConfig {
  flag: string;
  stage: "canary" | "ramp" | "full" | "halted";
  pct: number;                  // used only in "ramp"
  canaryUserIds: Set<string>;   // internal / design-partner allowlist
  limits: { maxErrorRatePct: number; maxCostPerHourUsd: number };
}

function isEnabled(cfg: RolloutConfig, userId: string): boolean {
  if (cfg.stage === "halted") return false;
  if (cfg.stage === "full") return true;
  if (cfg.stage === "canary") return cfg.canaryUserIds.has(userId);
  return bucketFor(userId, cfg.flag) < cfg.pct; // "ramp"
}
```

> **Why this step?** Canary and percentage rollout are different mechanisms doing different jobs. The canary cohort is a small, known, opt-in group — your team, design partners — who can tolerate a rough edge and will actually report one. Percentage rollout is the opposite: an unbiased random slice of real traffic, chosen specifically *because* it looks like everyone else. Skipping straight to a 1% random rollout means your first real signal comes from strangers instead of people who'll forgive a rough first day.

### Step 3: the rolling monitor

```ts
interface RollingMetrics { requests: number; errors: number; costUsd: number; windowStart: number }

function recordResult(m: RollingMetrics, ok: boolean, costUsd: number): RollingMetrics {
  return { ...m, requests: m.requests + 1, errors: m.errors + (ok ? 0 : 1), costUsd: m.costUsd + costUsd };
}

function checkAndHalt(cfg: RolloutConfig, m: RollingMetrics): RolloutConfig {
  if (m.requests < 20) return cfg; // don't judge on a handful of samples
  const errorRatePct = (m.errors / m.requests) * 100;
  const hoursElapsed = Math.max((Date.now() - m.windowStart) / 3_600_000, 1 / 60);
  const costPerHour = m.costUsd / hoursElapsed;

  if (errorRatePct > cfg.limits.maxErrorRatePct || costPerHour > cfg.limits.maxCostPerHourUsd) {
    return { ...cfg, stage: "halted", pct: 0 };
  }
  return cfg;
}
```

> **Why this step?** This function is the entire point of the lesson — everything before it is bookkeeping. `checkAndHalt` runs on the same request path as `isEnabled`, so the ramp reacts within the next handful of requests, not the next time someone opens a dashboard. The minimum-sample guard matters just as much as the threshold: five requests with one error is a 20% error rate and a false alarm, not a real signal.

### Step 4: wiring it into the request path

```ts
function resolveForRequest(cfg: RolloutConfig, m: RollingMetrics, userId: string) {
  const enabled = isEnabled(cfg, userId);
  return { variant: enabled ? "new" : "control", stage: cfg.stage };
}
```

> **Why this step?** Everything upstream — the bucketing, the stage, the halt check — collapses to one boolean per request by the time application code sees it. That's deliberate: the request handler shouldn't know or care *why* a user got the control variant, only that it did, which keeps this logic swappable later for a real flag service without touching call sites.

## Run it

```ts
let cfg: RolloutConfig = {
  flag: "support-triage-v15", stage: "ramp", pct: 1,
  canaryUserIds: new Set(["internal_amina"]),
  limits: { maxErrorRatePct: 8, maxCostPerHourUsd: 25 },
};
let metrics: RollingMetrics = { requests: 0, errors: 0, costUsd: 0, windowStart: Date.now() };

// ramp promoted 1% -> 10% after a clean canary period
cfg = { ...cfg, pct: 10 };

// v15 has a subtle bug that throws on a common input shape
for (let i = 0; i < 30; i++) {
  metrics = recordResult(metrics, i % 3 !== 0, 0.004); // ~33% error rate
  cfg = checkAndHalt(cfg, metrics);
}
console.log(cfg.stage); // "halted" — long before 10% of all traffic saw it
```

The ramp never reaches the operator's next check-in. It halts itself somewhere around request 20, because that's where the sample size stopped being noise.

## Harden it

- **Fail closed on config-fetch failure.** If the rollout config can't be loaded for a request, resolve to `control` — the same "fail to last known good" rule from [Feature Flags and Gradual Rollout](/learn/genai-app-dev/feature-flags-and-gradual-rollout).
- **Reset the metrics window on every promotion.** A window that spans a stage change mixes old-stage and new-stage traffic into one error rate, and can halt a healthy 10% stage on errors that actually happened during a rocky 1% stage.
- **Log the resolved variant and stage on every request**, not just at halt time — this is exactly the join key [Instrumenting Requests With Tracing](/learn/genai-app-dev/instrumenting-with-tracing) needs to reconstruct "what did this specific user see, and when."
- **Alert on a halt, don't just silently protect.** An auto-halt that fires with nobody told is a rollout that quietly reverts and nobody investigates why — pair it with the paging step in [Incident Response for AI Features](/learn/genai-app-dev/incident-response-for-ai-features).

## Extend it

Feed real cost and quality data from [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking) and [Observability for GenAI Features](/learn/genai-app-dev/observability-for-genai) into `checkAndHalt` instead of a synthetic error flag, and this same skeleton runs the head-to-head comparison in [A/B Testing Two Prompt Versions](/learn/genai-app-dev/a-b-testing-two-prompts) — two variants held at a fixed split instead of one variant ramping toward 100%.

**Related:** [Feature Flags and Gradual Rollout](/learn/genai-app-dev/feature-flags-and-gradual-rollout), [Versioning Prompts in Git and a Registry](/learn/genai-app-dev/versioning-prompts-in-git-and-registry), [Observability for GenAI Features](/learn/genai-app-dev/observability-for-genai), [A/B Testing Two Prompt Versions](/learn/genai-app-dev/a-b-testing-two-prompts), [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking)
