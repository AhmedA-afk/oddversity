---
title: "A/B Testing Two Prompt Versions"
track: "genai-app-dev"
status: live
summary: "A worked run of v14 against v15 behind a flag, with a guardrail metric that halts the worse variant before it does real damage."
duration: "8 min read"
---

`v15` of a support-triage prompt passed its evals — [Evals and Regression Testing for Prompts](/learn/genai-app-dev/evals-and-regression-testing) gave it a clean score against the golden dataset. Passing offline doesn't mean it's better on real traffic, with real distribution of questions. This lesson runs that comparison for real, using the rollout mechanics from [Canary and Percentage-Based Rollout](/learn/genai-app-dev/canary-and-percentage-rollout).

## The setup

Two prompt versions live in the registry from [Versioning Prompts in Git and a Registry](/learn/genai-app-dev/versioning-prompts-in-git-and-registry): `v14`, currently serving 100% of production traffic, and `v15`, which shortened the system prompt to reduce token cost. The hypothesis: `v15` is cheaper and just as good. The test: split traffic 50/50 between them for a fixed window, using the stable per-user bucketing from [Canary and Percentage-Based Rollout](/learn/genai-app-dev/canary-and-percentage-rollout), and compare on three metrics — a quality proxy (thumbs-up rate), cost per request, and p95 latency — with a guardrail that halts the test early if `v15`'s escalation rate (a proxy for "the bot failed and a human had to step in") gets meaningfully worse.

```json
{
  "test_id": "triage-v14-vs-v15",
  "variants": { "control": "v14", "treatment": "v15" },
  "split": 50,
  "guardrail": { "metric": "escalation_rate_pct", "maxDeltaPct": 3 },
  "minSampleSize": 500
}
```

## Step by step

### Step 1: split traffic with a stable bucket, not a coin flip per request

```ts
function variantFor(userId: string, testId: string): "control" | "treatment" {
  const bucket = bucketFor(userId, testId); // from Canary and Percentage-Based Rollout
  return bucket < 50 ? "treatment" : "control";
}
```

> **Why this step?** If a user could get `v14` on one request and `v15` on the next, neither the thumbs-up rate nor the escalation rate would mean anything — you'd be measuring inconsistency, not quality. The same stable-hash bucketing from [Canary and Percentage-Based Rollout](/learn/genai-app-dev/canary-and-percentage-rollout) does double duty here: it's what makes a percentage rollout safe *and* what makes an A/B comparison valid.

### Step 2: tag every request and log the outcome

```ts
async function handleTriageRequest(userId: string, message: string) {
  const variant = variantFor(userId, "triage-v14-vs-v15");
  const promptVersion = variant === "treatment" ? "v15" : "v14";
  const { text } = resolvePrompt(manifest, "prompts/support-triage", promptVersion); // registry lookup

  const response = await callProvider(text, message);
  logOutcome({ userId, variant, promptVersion, tokensOut: response.usage.outputTokens, escalated: false });
  return response;
}
```

> **Why this step?** `variant` and `promptVersion` are logged together, not inferred later — the whole test depends on being able to group every downstream signal (cost, thumbs-up, escalation) by which prompt actually served that request. This is the same join key [Instrumenting Requests With Tracing](/learn/genai-app-dev/instrumenting-with-tracing) tags every trace with, reused here for the comparison instead of a single-request debug.

### Step 3: check the guardrail continuously, not just at the end

```ts
function checkGuardrail(control: Metrics, treatment: Metrics): "continue" | "halt" {
  if (control.n < 50 || treatment.n < 50) return "continue"; // too early to judge
  const delta = treatment.escalationRatePct - control.escalationRatePct;
  return delta > 3 ? "halt" : "continue";
}
```

> **Why this step?** A guardrail metric exists specifically so a worse variant doesn't have to run to full sample size before someone notices. Escalation rate is chosen deliberately here over thumbs-up rate: thumbs-up is the metric you're optimizing for, but escalation is the one where a regression is expensive in a way you can't undo — a customer who had to be escalated had a worse experience regardless of what happens after. Checking it on every batch of results, the same way [Canary and Percentage-Based Rollout](/learn/genai-app-dev/canary-and-percentage-rollout)'s `checkAndHalt` runs per request, is what makes it a real guardrail instead of a postmortem finding.

### Step 4: read the result once minimum sample size is hit

```json
{
  "control":   { "n": 512, "thumbsUpPct": 78, "escalationRatePct": 6.1, "avgCostUsd": 0.0091, "p95Ms": 2600 },
  "treatment": { "n": 498, "thumbsUpPct": 76, "escalationRatePct": 6.4, "avgCostUsd": 0.0058, "p95Ms": 2100 }
}
```

> **Why this step?** `v15` wins on cost (36% cheaper) and latency, loses very slightly on thumbs-up, and stays within the escalation guardrail — the delta is 0.3 points, not the 3-point threshold that would have halted it. This is the actual decision point: not "did it pass," but "is the tradeoff acceptable," and that's a product call the numbers inform rather than make automatically.

## Where it breaks (+ fix)

The test above assumes stable, comparable traffic across the whole window. Two ways that assumption breaks in practice:

- **A traffic-mix shift mid-test.** If a marketing push sends a wave of new users through the flow on day two, and new users escalate more regardless of prompt version, the treatment group's escalation rate can move for reasons that have nothing to do with `v15`. **Fix:** stratify the comparison by user cohort (new vs. returning) instead of trusting the aggregate, or extend the test window past the anomaly.
- **A guardrail metric with too few events to be meaningful.** Escalation might be a 6% event — at `n=50` that's roughly 3 escalations, and one extra escalation swings the rate by 2 points on noise alone. **Fix:** set `minSampleSize` from the actual base rate of the guardrail event, not a round number picked in advance — a rare event needs a much bigger sample before its rate means anything.

## Takeaways

- Stable bucketing is what makes both a canary rollout and an A/B test valid — the same mechanism, pointed at two different questions.
- Pick a guardrail metric that captures cost you can't undo (an escalation, a bad output that reached a user), separate from the metric you're trying to optimize — they can diverge, and the guardrail should win when they do.
- A prompt that wins on cost and loses fractionally on your primary metric is a real tradeoff to make explicitly, not an automatic pass or fail — the eval gate from [Evals and Regression Testing for Prompts](/learn/genai-app-dev/evals-and-regression-testing) catches regressions before this stage; this stage is for judgment calls the offline eval can't make.

**Related:** [Canary and Percentage-Based Rollout](/learn/genai-app-dev/canary-and-percentage-rollout), [Evals and Regression Testing for Prompts](/learn/genai-app-dev/evals-and-regression-testing), [Versioning Prompts in Git and a Registry](/learn/genai-app-dev/versioning-prompts-in-git-and-registry), [Observability for GenAI Features](/learn/genai-app-dev/observability-for-genai), [Feature Flags and Gradual Rollout](/learn/genai-app-dev/feature-flags-and-gradual-rollout)
