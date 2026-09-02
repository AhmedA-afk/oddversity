---
title: "Quiz: Shipping and Operating"
track: "genai-app-dev"
status: live
summary: "Six questions on prompt versioning, gradual rollout, observability signals, eval gates, and picking the right incident-response lever."
duration: "6 min read"
---

Six questions, including a scenario that asks you to pick the right lever for a live incident. Work through them before the capstone — every wrong answer points back to the lesson that covers it.

## Question 1

A support-bot prompt is edited directly in an admin dashboard and saved. Two hours later, quality has visibly dropped. What's missing?

A. A faster model
B. A version identity for the prompt, with history to roll back to
C. More few-shot examples in the prompt
D. A longer system prompt

<details><summary>Answer</summary>

**Correct: B.** Without a version id, a hash, and a history of past versions, there's no way to say what the prompt said before the edit or to revert to it — the exact gap [Prompt Versioning and Safe Rollbacks](/learn/genai-app-dev/prompt-versioning-and-rollback) opens with.

- A: A faster model doesn't address an unreviewable, unversioned edit — the problem is process, not model speed.
- B: Correct — an untracked prompt edit is an unreviewable production change with no undo.
- C: More examples might improve quality, but doesn't create a way to diff or revert this specific regression.
- D: A longer prompt doesn't create version history; it's an unrelated content change.

</details>

## Question 2

Why does a percentage rollout bucket users by a stable hash of their user ID instead of assigning a random variant on every request?

A. It's computationally cheaper
B. So the same user gets a consistent experience, and comparisons between variants are valid
C. It's required by most cloud providers
D. It reduces the number of database writes

<details><summary>Answer</summary>

**Correct: B.** Stable bucketing is what makes both an auto-halt reading a meaningful error rate and an A/B comparison possible — see [Canary and Percentage-Based Rollout](/learn/genai-app-dev/canary-and-percentage-rollout) and [A/B Testing Two Prompt Versions](/learn/genai-app-dev/a-b-testing-two-prompts).

- A: Both approaches are cheap; cost isn't the reason for stable bucketing.
- B: Correct — random-per-request assignment makes both consistency and comparison impossible.
- C: No cloud provider requirement is involved; this is an application-level design choice.
- D: Bucketing is a pure hash function — it doesn't touch the database at all.

</details>

## Question 3

Which of these is a genuinely new observability signal a GenAI feature needs, beyond standard APM (latency, error rate, uptime)?

A. HTTP status code distribution
B. CPU utilization
C. Token counts and prompt version per request
D. Request count per minute

<details><summary>Answer</summary>

**Correct: C.** Standard APM has no concept of tokens or prompt versions — these are GenAI-specific and are what turn "quality regressed" into "which version, how much, since when." See [Observability for GenAI Features](/learn/genai-app-dev/observability-for-genai).

- A: HTTP status codes are standard APM and don't reveal a quiet quality regression (a 200 that answered worse).
- B: CPU utilization is infrastructure-level and unrelated to model behavior.
- C: Correct — tokens and prompt version are specific to GenAI requests and not captured by default APM.
- D: Request count is standard traffic monitoring, present in any web service.

</details>

## Question 4

A prompt change passes manual review — three test chats all look fine — and ships straight to production. What does an eval harness add that manual review doesn't?

A. Faster deploys
B. A repeatable, scored check against a broader set of cases, including past edge cases
C. Automatic prompt writing
D. Lower token costs

<details><summary>Answer</summary>

**Correct: B.** Three manually-checked chats catch obviously broken cases, not a regression in a category nobody happened to try. A golden dataset with edge cases run every time is what catches that. See [Evals and Regression Testing for Prompts](/learn/genai-app-dev/evals-and-regression-testing).

- A: An eval harness adds a CI step, which if anything slows a merge down slightly — it's not about deploy speed.
- B: Correct — repeatability and coverage across known-hard cases is exactly what ad hoc review lacks.
- C: Evals score existing prompts; they don't write prompts for you.
- D: An eval doesn't inherently reduce token cost — that's a separate optimization.

</details>

## Question 5

An A/B test between two prompt versions is running. The guardrail metric is escalation rate, not the primary metric (thumbs-up rate). Why use a different metric for the guardrail?

A. Escalation rate is easier to measure
B. The guardrail should catch cost you can't undo, even if it's not the metric you're trying to optimize
C. Thumbs-up rate can't be logged per request
D. Guardrails are always the inverse of the primary metric

<details><summary>Answer</summary>

**Correct: B.** The primary metric is what you're optimizing for; the guardrail protects against damage that can't be undone even while the primary metric looks fine — see [A/B Testing Two Prompt Versions](/learn/genai-app-dev/a-b-testing-two-prompts).

- A: Ease of measurement isn't the reason — both are loggable per request.
- B: Correct — a guardrail is chosen for irreversible downside, independent of what you're trying to maximize.
- C: Thumbs-up rate is logged per request just like escalation rate; that's not the distinction.
- D: There's no rule that a guardrail must be the inverse of the primary metric — they're just chosen for different purposes.

</details>

## Question 6 (scenario)

Production traces show a spike in `provider_call` spans returning 503 errors, with no change in prompt version and no rise in output-validation failures. What's the correct first lever?

A. Roll back the prompt to the previous version
B. Fail over to a secondary provider or model
C. Flag the feature off entirely
D. Add more few-shot examples to reduce errors

<details><summary>Answer</summary>

**Correct: B.** No prompt version changed and the errors are on the provider-call span specifically — this is a provider outage, and failover keeps the feature working instead of turning it off. See [Incident Response for AI Features](/learn/genai-app-dev/incident-response-for-ai-features).

- A: Rolling back the prompt does nothing for provider-side errors — the prompt didn't change.
- B: Correct — a provider-specific error spike with no prompt change points at an outage, and failover is the narrowest lever that fully addresses it.
- C: Flagging off works but is blunter than necessary — it loses availability the feature doesn't need to lose if a fallback provider is healthy.
- D: More examples can't fix a provider returning 503s; the failure isn't in the prompt content.

</details>

**Related:** [Incident Response for AI Features](/learn/genai-app-dev/incident-response-for-ai-features), [Evals and Regression Testing for Prompts](/learn/genai-app-dev/evals-and-regression-testing), [Canary and Percentage-Based Rollout](/learn/genai-app-dev/canary-and-percentage-rollout), [Shipping and Operating Cheatsheet](/learn/genai-app-dev/shipping-operating-cheatsheet), [Capstone: Ship a Production GenAI Assistant](/learn/genai-app-dev/capstone-ship-a-genai-assistant)
