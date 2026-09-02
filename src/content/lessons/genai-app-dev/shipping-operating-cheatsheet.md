---
title: "Shipping and Operating Cheatsheet"
track: "genai-app-dev"
status: live
summary: "One page: version-and-rollback, the rollout ramp with auto-halt, the observability signal list, safe-logging rules, and the incident playbook."
duration: "5 min read"
---

The operator's quick reference for any AI feature already live in production. Each section links back to the lesson with the full mechanism.

## Versioning and rollback — start here, then measure

- **Default:** every prompt resolves through a registry (file + manifest, or a config service) with a per-environment active pointer. Never edit a live prompt string in place. → [Versioning Prompts in Git and a Registry](/learn/genai-app-dev/versioning-prompts-in-git-and-registry)
- **Rollback = promote an older version.** Not a special code path — the same function run backward. Keep more than one step of history per environment.
- **Rule:** if it changed model behavior, it needs a version id, and that id gets logged on every request that used it.

## Rollout ramp — start here, then measure

```
internal  ->  canary (1%)  ->  ramp (10% -> 50%)  ->  full (100%)  ->  cleanup
```

- **Default stage sizes:** canary on a known, opt-in cohort; then double the percentage only after a fixed clean window, not on a fixed clock.
- **Bucket by a stable user ID**, salted with the flag name — never a random assignment per request. → [Canary and Percentage-Based Rollout](/learn/genai-app-dev/canary-and-percentage-rollout)
- **Auto-halt trigger, not manual-only:** error rate and cost-per-hour, checked on every request once minimum sample size is hit (~20-50 events). Fail closed to the last known-good variant if the flag config is unreachable.
- **Don't delete the flag at 100%.** Keep it until the feature has run clean for a fixed window post-launch.

## Observability signal list — what to capture on every request

| Signal | Where it lives | Why |
|---|---|---|
| Trace spans (assemble → provider call → tool loop → validate) | Operational trace store | Localizes slowness/failure to one step |
| Model id + prompt version | Root span attribute | Join key for every regression investigation |
| Token counts (in/out) | Span attribute | Feeds cost and context-limit checks |
| Latency per step + p95/p99 | Span timing | Tail latency is what users feel, not the mean |
| Tool-call sequence + iteration count | Child spans | Catches non-converging loops |
| Quality signal (thumbs-up/down, escalation, validation failure) | Metrics store | The only thing a 200 response doesn't tell you |

→ [Observability for GenAI Features](/learn/genai-app-dev/observability-for-genai) · [Instrumenting Requests With Tracing](/learn/genai-app-dev/instrumenting-with-tracing)

## Safe-logging rules

- **Redact before write, never in a batch job after.** Regex or a PII model on emails, phone numbers, SSNs, card numbers, before anything touches disk.
- **Separate the content store from the trace store.** Traces (metadata) can live long and be broadly readable; completion text needs a short retention window and gated read access.
- **Tag a retention expiry at write time.** Enforce it with a scheduled deletion job — don't rely on someone remembering to clean up.
- **Confidential material never reaches a logging vendor**, even redacted, if your organization's own rules mark it sensitive. When in doubt, keep it first-party only.

→ [Logging Prompts and Completions Safely](/learn/genai-app-dev/logging-prompts-and-completions-safely)

## Incident playbook — pick the narrowest lever that fully addresses it

| Incident | Detect via | Lever | Verify |
|---|---|---|---|
| Cost blowout | Cost-per-hour threshold | Flag off / pct to 0 | Cost returns to baseline |
| Provider outage | `provider_call` error rate | Failover to secondary provider | Error rate recovers on fallback |
| Prompt regression | Quality signal drops, no provider errors | Roll back prompt version | Quality signal recovers |
| Harmful-output report | Human report | Flag off, route to review queue | Fixed, re-launched via gated ramp |

→ [Incident Response for AI Features](/learn/genai-app-dev/incident-response-for-ai-features)

## Pre-launch, one more time

Before any AI feature reaches external traffic: flag wired and fails closed · cost threshold triggers an automatic halt · prompt resolves through a versioned registry · traces are exporting · rollout starts at internal or canary, never 100%. → [Shipping a GenAI Feature End to End](/learn/genai-app-dev/shipping-end-to-end) · [Launch-Day Antipatterns](/learn/genai-app-dev/launch-day-antipatterns)

**Related:** [Prompt Versioning and Safe Rollbacks](/learn/genai-app-dev/prompt-versioning-and-rollback), [Feature Flags and Gradual Rollout](/learn/genai-app-dev/feature-flags-and-gradual-rollout), [Evals and Regression Testing for Prompts](/learn/genai-app-dev/evals-and-regression-testing), [A/B Testing Two Prompt Versions](/learn/genai-app-dev/a-b-testing-two-prompts)
