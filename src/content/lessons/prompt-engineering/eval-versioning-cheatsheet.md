---
title: "Evaluation and Versioning Cheatsheet"
track: "prompt-engineering"
status: live
summary: "One page: build a labeled set, mix exact-match and judge scoring, gate on a golden set, A/B on real traffic, version in git."
duration: "5 min read"
---

The whole module, compressed to the defaults you start with and the checklist you run before shipping.

## The pipeline, in order

| Stage | One-line takeaway |
|---|---|
| Build the set | Real inputs, not invented ones - tag ordinary / edge / failure. See [Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset). |
| Score it | Exact-match for single-answer fields, rubric + judge for open-ended text. See [Rubric Scoring With an LLM Judge](/learn/prompt-engineering/rubric-and-llm-judge). |
| Gate changes | A small golden subset must pass before any change merges. See [Regression Tests: Keeping a Golden Set Green](/learn/prompt-engineering/regression-tests-for-prompts). |
| Test on real traffic | Golden-green isn't proof of a win - only live traffic answers that. See [A/B Testing Prompts on Real Traffic](/learn/prompt-engineering/ab-testing-in-production). |
| Version it | Git-tracked file, pinned version, changelog - not a string in app code. See [Versioning Prompts Like Production Code](/learn/prompt-engineering/prompt-versioning-like-code). |
| Manage the change | Propose → eval gate → review → canary → ramp/rollback. See [A Change-Management Workflow for Prompts](/learn/prompt-engineering/change-management-workflow). |
| Re-check on model swap | Same eval set, new model, before you trust it. See [Portability: Surviving a Model Swap](/learn/prompt-engineering/prompt-portability-across-models-strategy). |

## Which scoring method, when

| Output shape | Use | Why |
|---|---|---|
| One correct string (date, category, boolean) | Exact-match | Cheap, deterministic, zero judge noise to manage. |
| Open-ended text (summary, reply, explanation) | Rubric + LLM judge | No single correct string exists - grade against anchored criteria instead. |
| Real user behavior (resolution, conversion) | Online A/B metric | Offline scoring can't see distribution shift or user adaptation - only live traffic can. |

## Defaults - start here, then measure

- **Eval set size:** start with 15-20 labeled cases across ordinary/edge/failure tags, then grow it every time production surfaces a real failure.
- **Judge temperature:** start at 0 for determinism, and require rationale before the score in the judge prompt - then measure judge-vs-human agreement on a sample before trusting it unsupervised.
- **Golden set size:** start with 5-10 cases, each one earning its place by representing a real failure or a critical path - not the whole eval set.
- **Canary slice:** start at 5% of traffic for one full usage cycle (weekday + weekend), then ramp only after the window closes clean.
- **A/B duration:** decide the primary metric and minimum runtime before the test starts - never extend or shorten it based on how the numbers look mid-flight.

## Golden-set gate rules

- [ ] Every golden case represents a real, previously-observed failure or a business-critical path - not an arbitrary sample.
- [ ] The gate runs automatically on every prompt-touching change, before merge, not after deploy.
- [ ] Rubric-scored golden cases gate on a threshold ("≥2/3 on every dimension"), not exact-match.
- [ ] A failing gate blocks the merge - a script that only reports, and doesn't block, isn't a gate.

## A/B rules of thumb

- Pre-register the metric and the duration. A result that "looks significant" before your pre-committed window closes is not a result - see [Worked Example: Reading an A/B Test Result](/learn/prompt-engineering/reading-ab-test-results) for a lead that reversed exactly this way.
- Rough gut-check: a gap under about one standard error of the pooled proportion (`sqrt(p*(1-p)*(1/n_A+1/n_B))`) is not distinguishable from noise - see [A/B Testing Prompts on Real Traffic](/learn/prompt-engineering/ab-testing-in-production) for the full arithmetic.
- Split by user, not by request, so no one straddles both variants mid-session.

## Versioning conventions

```
prompts/
  <task-name>/
    v1.txt
    v2.txt
    CHANGELOG.md
```

- Pin production to a specific version constant - never to "whatever's in main."
- Every promoted version's changelog entry carries the eval and golden-gate result that justified promoting it - a version bump with no attached score is unreviewable.
- Version the whole configuration a prompt depends on (model ID, temperature, parser), not just the prompt text.

## Portability re-check, condensed

Before trusting a prompt on a new model: rerun the same eval set (don't just eyeball a few examples), check delimiters against the new model's conventions, re-verify few-shot ordering, and re-confirm reasoning defaults and verbosity rather than assuming they carried over. Full checklist in [Portability: Surviving a Model Swap](/learn/prompt-engineering/prompt-portability-across-models-strategy).

## Ship / rollback checklist

- [ ] Golden-set gate passes at the exact pinned version being promoted.
- [ ] If rubric scoring is used, judge-vs-human agreement has been checked on a recent sample.
- [ ] The change was reviewed as a diff against the previous pinned version, with the eval report attached.
- [ ] A canary ran for at least one full usage cycle, with the rollback threshold decided before the canary started.
- [ ] A rollback target is identified and instantly retrievable - a pinned prior version, not a memory of what the wording used to be.
- [ ] The `CHANGELOG.md` entry is written before ramping past canary, not after.
- [ ] If the model changed: the full eval set was rerun on the new model before shipping - never assumed from the old model's score.

**Related:** [Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset), [Regression Tests: Keeping a Golden Set Green](/learn/prompt-engineering/regression-tests-for-prompts), [A/B Testing Prompts on Real Traffic](/learn/prompt-engineering/ab-testing-in-production), [Versioning Prompts Like Production Code](/learn/prompt-engineering/prompt-versioning-like-code), [A Change-Management Workflow for Prompts](/learn/prompt-engineering/change-management-workflow), [Quiz: Evaluating, Versioning, and Shipping](/learn/prompt-engineering/eval-shipping-quiz)
