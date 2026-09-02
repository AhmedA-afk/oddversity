---
title: "Incident Response for AI Features"
track: "genai-app-dev"
status: live
summary: "The four AI-specific incident types, the exact lever that fixes each, and why flags, versioning, and traces turn them into minutes, not hours."
duration: "9 min read"
---

*This is optional depth: the earlier lessons in this module give you the mechanisms — flags, a prompt registry, traces, rollout guardrails. This one is about the discipline of reaching for the right one under pressure, and precisely why each lever works for the incident it's paired with.*

An AI-feature incident is rarely a crash. It's a cost curve bending the wrong way, a provider returning errors, a prompt quietly answering worse, or a report that the system said something it shouldn't have. Each of these has a different root cause and a different correct first move — and confusing them costs the minutes that matter most.

## The shared structure: detect, diagnose, act, verify

Every incident type below follows the same four-step shape, and the shape is worth stating precisely because skipping a step is where most incident response actually goes wrong. **Detect** — a threshold or alert fires, ideally before a human notices manually. **Diagnose** — the trace, log, or metric that tells you *which* of the four categories this is, because the wrong lever pulled confidently is worse than no lever pulled at all (rolling back a prompt does nothing for a provider outage). **Act** — the specific, narrow lever for that category, applied without waiting for full root-cause understanding. **Verify** — confirm the metric that triggered detection has actually recovered, not just that you took an action.

The reason this module builds flags, a registry, and traces *before* this lesson is that diagnosis and action both depend on them existing already. An incident is the wrong time to discover you have no way to tell which prompt version was live an hour ago.

## Incident 1: a cost blowout

**Mechanism.** Cost scales with input tokens, output tokens, and — for tool-using features — the number of loop iterations. A blowout is almost always one of: unbounded conversation history growing every turn, a tool loop that isn't converging and keeps calling an expensive tool, or a model/prompt change that silently produces longer completions.

**Detect.** A cost-per-hour threshold from [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking), checked continuously — the same threshold [Canary and Percentage-Based Rollout](/learn/genai-app-dev/canary-and-percentage-rollout)'s auto-halt watches during a ramp. This should fire before a human notices, because a cost blowout produces no errors to trip a normal alert.

**Diagnose.** A trace (from [Instrumenting Requests With Tracing](/learn/genai-app-dev/instrumenting-with-tracing)) on a sample of expensive requests shows exactly where the cost concentrates: an abnormal `tokens_in` points at a history-trimming bug ([Context Limits and Trimming](/learn/genai-app-dev/context-limits-and-trimming)); a high tool-call span count points at a non-converging loop.

**Act.** Flip the feature's flag off, or roll the flag's `pct` to zero — the lever from [Feature Flags and Gradual Rollout](/learn/genai-app-dev/feature-flags-and-gradual-rollout). This is correct even before the root cause is known, precisely because it's cheap to reverse and stops the bleeding immediately; fixing the underlying trimming or loop bug can happen at normal speed once spend has stopped accelerating.

**Verify.** Cost-per-hour returns to baseline within one billing cycle of the flag flip, confirmed against the same metric that triggered detection — not just "the flag is off."

**Why this lever and not another.** A prompt rollback wouldn't help if the cause is a code bug in history trimming, not the prompt content. The flag is correct here because it's the one lever that stops *all* traffic to the feature regardless of which internal cause is responsible — you don't need the diagnosis finished to apply it.

## Incident 2: a provider outage

**Mechanism.** The model provider itself is degraded or unavailable — elevated error rates, timeouts, or a full outage on their side, unrelated to anything in your prompt or code.

**Detect.** Error rate on provider calls specifically (not the whole feature) spikes, distinguishable in the trace by span name (`provider_call`) and error type — a `5xx` or timeout from the provider, not a validation failure downstream. This distinction matters: a spike in `validate_output` failures is Incident 3, not this one.

**Act.** Failover to a secondary provider or model, per [Implementing Failover and Fallback Chains](/learn/genai-app-dev/implementing-failover-and-fallback-chains) and [Model Routing and Failover](/learn/genai-app-dev/model-routing-and-failover) — the mechanism exists precisely for this moment, and should already be wired, not built during the incident.

**Verify.** Error rate on `provider_call` spans returns to baseline on the fallback path; latency may be worse on the secondary provider, which is an acceptable, known tradeoff during an outage, not a new incident.

**Why this lever and not another.** A flag flip here turns the feature off entirely, which is a strictly worse outcome than failing over — the feature can keep working, just on a different provider. Reach for failover first; only flag the feature off if no viable fallback exists or the fallback is also degraded.

## Incident 3: a prompt regression

**Mechanism.** A newly promoted prompt version degrades output quality — often for a slice of inputs an eval or a canary cohort didn't happen to cover, per the exact gap [Evals and Regression Testing for Prompts](/learn/genai-app-dev/evals-and-regression-testing) exists to close.

**Detect.** A quality signal degrades without a corresponding rise in provider errors — thumbs-down rate, output-validation failure rate, or an escalation rate, the same guardrail metric from [A/B Testing Two Prompt Versions](/learn/genai-app-dev/a-b-testing-two-prompts). The absence of provider-side errors is what distinguishes this from Incident 2.

**Act.** Roll back the prompt version via the registry from [Versioning Prompts in Git and a Registry](/learn/genai-app-dev/versioning-prompts-in-git-and-registry) — a pointer flip to the last known-good version, not a redeploy.

**Verify.** The quality signal recovers to its pre-promotion baseline, checked against the same metric — and the failing case is added to the golden dataset from [Evals and Regression Testing for Prompts](/learn/genai-app-dev/evals-and-regression-testing) before the version is ever re-promoted.

**Why this lever and not another.** Failover doesn't help — every provider would run the same bad prompt. A flag flip works but is blunter than necessary: it turns the whole feature off, when rolling back specifically the prompt keeps the feature running on the version that was working an hour ago. Prefer the narrower lever when it's available.

## Incident 4: a harmful-output report

**Mechanism.** A user or reviewer reports the system produced output that shouldn't have shipped — unsafe advice, a policy violation, a leaked instruction — regardless of whether it came from the prompt, the model, or an adversarial input that got past [Guardrails and Input Validation](/learn/genai-app-dev/guardrails-and-input-validation).

**Detect.** Usually a human report, not an automated threshold — this is the one incident type in this list where the "detect" step is rarely a metric crossing a line, which is exactly why a working report channel and a human-in-the-loop path matter as much as any dashboard.

**Act.** Flag the feature off immediately, per [Feature Flags and Gradual Rollout](/learn/genai-app-dev/feature-flags-and-gradual-rollout) — a harmful-output report is treated with the least patience for "let's investigate first" of any incident type here, because the cost of one more affected user is categorically higher than the cost of a false-positive shutdown. Route the specific case to a human review queue per [Human-in-the-Loop Review Queues](/learn/genai-app-dev/human-in-the-loop-review-queues) to assess scope and whether other users were affected.

**Verify.** The feature stays off until the specific failure mode is understood and either the guardrail ([Guardrails and Input Validation](/learn/genai-app-dev/guardrails-and-input-validation)) or the prompt has a fix, re-enabled only through the same gated sequence from [Shipping a GenAI Feature End to End](/learn/genai-app-dev/shipping-end-to-end) — internal, then canary, not straight back to full traffic.

**Why this lever and not another.** This is the one incident where a narrower lever than the full kill switch is usually the wrong instinct — you don't yet know if it's a prompt problem, a guardrail gap, or a model behavior, and the report itself establishes that the tolerance for continued exposure while you find out is close to zero.

## The precise tradeoff across all four

The pattern across all four incidents: the correct lever is the *narrowest one that fully addresses the failure*, and picking a broader one than necessary (flagging off for a provider outage) costs availability you didn't need to lose, while picking a narrower one than necessary (rolling back a prompt for a harmful-output report of unknown scope) risks leaving the exposure open. Getting this right under pressure is what the rest of this module's tooling — flags, registry, traces, failover — is built to make possible in minutes rather than an afternoon of manual investigation.

**Related:** [Feature Flags and Gradual Rollout](/learn/genai-app-dev/feature-flags-and-gradual-rollout), [Versioning Prompts in Git and a Registry](/learn/genai-app-dev/versioning-prompts-in-git-and-registry), [Implementing Failover and Fallback Chains](/learn/genai-app-dev/implementing-failover-and-fallback-chains), [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking), [Human-in-the-Loop Review Queues](/learn/genai-app-dev/human-in-the-loop-review-queues), [Observability for GenAI Features](/learn/genai-app-dev/observability-for-genai)
