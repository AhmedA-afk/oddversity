---
title: "Evals and Regression Testing for Prompts"
track: "genai-app-dev"
status: live
summary: "A prompt change is a code change. Give it the same CI gate a code change gets, or find out about the regression from users."
duration: "7 min read"
---

Someone tightens a system prompt to fix one bad response, glances at three test chats, and ships it. Two days later, support tickets tick up on a completely unrelated task the old prompt handled fine. Eyeballing outputs doesn't scale past the handful of cases you happened to try — an eval harness is what catches the ones you didn't.

## What it is

An eval is a repeatable, scored test of prompt quality: a golden dataset of representative inputs, an expected property for each (an exact answer, a required field, a rubric a grader model applies), and a metric that turns "how did the new prompt do" into a number you can compare against the old one. Regression testing means running that eval automatically whenever a prompt changes — in CI, the same way a unit-test suite runs on a pull request — and failing the change if the score drops below a threshold.

## The mental model

Treat a prompt exactly like a function with a test suite, not like copy someone proofreads. A function change that breaks a test fails the build before it reaches anyone; a prompt change that breaks a golden case should do the same. The golden dataset is the test suite — a fixed set of inputs chosen because they're representative or because they're known hard cases (a past incident, an edge case a user hit, a case competitors get wrong) — and the eval score is the assertion. The difference from ordinary unit tests is that the assertion is rarely exact-match; it's closer to a graded rubric, which is why building an eval harness feels unfamiliar even to engineers comfortable with CI.

## Why it works this way

Model outputs are non-deterministic and graded on a spectrum, not pass/fail — "is this summary good" doesn't reduce to `assert.equal`. That's exactly why eyeballing a handful of outputs feels sufficient and isn't: a human skimming three responses catches obviously broken cases, not a two-point regression in helpfulness across a category of question they didn't happen to try. A golden dataset with dozens or hundreds of cases, each scored the same way every run, is what surfaces that — the same reason [A/B Testing Two Prompt Versions](/learn/genai-app-dev/a-b-testing-two-prompts) needs a real sample, not a vibe check, before declaring a winner in production. The eval is the offline version of that same discipline, run before anything reaches a real user.

## A concrete example (shown)

A golden case and a scored run against two prompt versions:

```json
{
  "id": "refund-policy-edge-case",
  "input": "Customer wants a refund on a digital purchase after 45 days.",
  "expected": { "must_mention": ["45-day policy", "no refund"], "must_not": ["apologize excessively"] }
}
```

```json
{
  "prompt_version": "v14", "score": 0.91, "failures": []
},
{
  "prompt_version": "v15", "score": 0.68,
  "failures": ["refund-policy-edge-case: missing '45-day policy', mentions refund as possible"]
}
```

`v15` regresses specifically on the policy-edge-case category — a real signal a few manual test chats would very likely have missed, since v15 probably still sounds fine on the common cases someone would think to try by hand. A CI gate set at "score must not drop more than 3 points" fails this build automatically, before `v15` is ever a candidate to [promote](/learn/genai-app-dev/versioning-prompts-in-git-and-registry) to production.

## Where it shows up

Anywhere a prompt, a system message, or a tool description changes — which, per [Prompt Versioning and Safe Rollbacks](/learn/genai-app-dev/prompt-versioning-and-rollback), should be every change, since untracked edits are unreviewable in the first place. It also matters when nothing about your prompt changed at all: a provider's model update can shift behavior on your existing prompt, and the same golden dataset run nightly against production catches that kind of drift before a user does.

## Watch out for

- **A golden dataset with no hard cases.** A dataset of only easy, common inputs will pass almost any reasonable prompt and catch nothing — the value is concentrated in the edge cases and past incidents, so seed it from real regressions, not synthetic happy paths.
- **A single aggregate score with no per-case breakdown.** An average that holds steady can hide one category getting much worse and another getting slightly better — always keep and inspect the per-case results, not just the mean, the way the example above isolates exactly which case failed.
- **Treating the eval as a one-time gate instead of a standing suite.** Cases that caused a real incident belong in the golden dataset permanently, so the same regression can never ship silently twice — an eval suite that doesn't grow after an incident isn't doing its job.

## Where next

[A/B Testing Two Prompt Versions](/learn/genai-app-dev/a-b-testing-two-prompts) is the online counterpart to this offline gate — a prompt that passes evals still gets a supervised rollout against real traffic before it's fully trusted. [Instrumenting Requests With Tracing](/learn/genai-app-dev/instrumenting-with-tracing) is often where new golden cases come from: a slow or wrong production trace is a candidate for the dataset.

**Related:** [Versioning Prompts in Git and a Registry](/learn/genai-app-dev/versioning-prompts-in-git-and-registry), [A/B Testing Two Prompt Versions](/learn/genai-app-dev/a-b-testing-two-prompts), [Prompt Versioning and Safe Rollbacks](/learn/genai-app-dev/prompt-versioning-and-rollback), [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair), [Guardrails for High-Stakes Output](/learn/hallucinations/guardrails-for-high-stakes-output)
