---
title: "Feature Flags and Gradual Rollout"
track: "genai-app-dev"
status: live
summary: "AI changes need a kill switch more than typical code does, because they fail quietly and can fail expensively."
duration: "6 min read"
---

A tool-using agent gets a new system prompt that encourages it to "keep investigating until you're confident." Overnight it loops on an edge case it never resolves, calling a paid search API every few seconds. Nobody sees an error — the loop isn't crashing, it's just working, expensively, at 3 a.m. A flag would have ended that in the time it takes to click a toggle.

## What it is

A feature flag is a runtime-checked switch that decides whether — and how — a code path executes, without a deploy. For an AI feature, the flag needs to carry more than a boolean: the model id, prompt version, temperature, and tool set that make up a given "variant" travel together as one unit, resolved once per request. [Feature-Flagging and Gradual Rollouts for AI Features](/learn/genai-app-dev/feature-flagging-ai-features) covers the ramp mechanics — internal, percentage, cohort, full — in detail; this lesson is about the specific reason AI features need that discipline more urgently than most code does.

## The mental model

A flag on typical code is a light switch: on, off, done. A flag on an AI feature is closer to an emergency shutoff valve on a compressor — the point isn't the two states, it's that when pressure spikes, one action returns the whole system to a known-safe condition, faster than diagnosing the actual cause. You don't need to know *why* the compressor is over-pressured to pull the valve; you need the valve to exist and to work instantly.

That framing matters because it tells you what the flag has to be checked against: not just "is this feature on," but "is this feature currently within the bounds I said were safe" — a cost ceiling, an error rate, a quality threshold — checked continuously, not just at rollout time.

## Why it works this way

Two properties of AI features specifically break the assumptions a normal flag was built for.

**Failure is probabilistic, not binary.** A typical bad deploy throws exceptions or 500s — loud, unambiguous, usually caught by uptime monitoring alone. A worse prompt or a degraded model doesn't error. It just answers slightly worse, for some inputs, some of the time. You won't catch that from an error-rate dashboard; you catch it from a flag that lets you isolate a slice of traffic and measure quality specifically, which is what [Feature-Flagging and Gradual Rollouts for AI Features](/learn/genai-app-dev/feature-flagging-ai-features) builds the percentage-rollout mechanism for.

**Failure can be expensive at a rate normal code failure isn't.** A retry loop with no backoff, or a tool-calling agent that doesn't converge, doesn't fail — it just keeps *running*, and every iteration costs real money. See [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking) for the budget side of this; the flag is the lever that stops the spend the instant the budget signal fires, rather than waiting for a human to notice a bill.

Both properties point at the same design requirement: the flag can't be something a human remembers to check on a dashboard. It has to be wired to an automatic trigger that flips it for you.

## A concrete example (shown)

A flag payload for an AI feature carries the whole recipe, plus the bounds that define "safe":

```json
{
  "flag": "order-status-assistant",
  "stage": "ramp",
  "pct": 10,
  "variant": {
    "model": "claude-sonnet",
    "promptVersion": "v15",
    "temperature": 0.3,
    "maxToolIterations": 4
  },
  "limits": {
    "maxCostPerHourUsd": 40,
    "maxErrorRatePct": 5
  }
}
```

If the tool-calling loop starts exceeding `maxToolIterations`, or hourly spend crosses `maxCostPerHourUsd`, the same trigger that would fire for a human clicking "disable" fires automatically: `stage` flips to `"halted"`, `pct` drops to `0`, and every subsequent request falls back to whatever ran before this feature existed — instantly, without anyone needing to notice first.

## Where it shows up

Rolling out a new model version, a rewritten system prompt, a newly granted tool, or a switch from a fixed system prompt to a retrieval-augmented one — anywhere behavior or cost per request can shift in ways a demo won't surface. It's also the mechanism that makes [A/B Testing Two Prompt Versions](/learn/genai-app-dev/a-b-testing-two-prompts) possible at all: without a flag splitting traffic between two named variants, there's nothing to compare.

## Watch out for

- **Resolving the flag once per session and caching it.** If a client caches "flag is on" for the life of a session, flipping the flag off doesn't reach users already mid-session — the kill switch stops being instant for exactly the traffic that's already running.
- **Failing open when the flag service is unreachable.** If the check can't reach its source of truth, it should fail to the last known-good variant, not to "on" by default — an unreachable flag service is exactly the kind of incident this mechanism exists to survive, not amplify.
- **No automatic trigger, only a manual one.** A flag a human has to remember to flip is a flag that gets flipped after the damage, not during it. Pair it with an automatic halt — built next in [Canary and Percentage-Based Rollout](/learn/genai-app-dev/canary-and-percentage-rollout).

## Where next

[Canary and Percentage-Based Rollout](/learn/genai-app-dev/canary-and-percentage-rollout) wires the stable bucketing and the automatic threshold check this lesson describes but doesn't build. From there, [Observability for GenAI Features](/learn/genai-app-dev/observability-for-genai) covers what has to be measured for a threshold to mean anything.

**Related:** [Feature-Flagging and Gradual Rollouts for AI Features](/learn/genai-app-dev/feature-flagging-ai-features), [Canary and Percentage-Based Rollout](/learn/genai-app-dev/canary-and-percentage-rollout), [Prompt Versioning and Safe Rollbacks](/learn/genai-app-dev/prompt-versioning-and-rollback), [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking)
