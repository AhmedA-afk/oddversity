---
title: "Capstone Project: Build a Versioned, Evaluated Prompt Library"
track: "prompt-engineering"
status: live
summary: "Ship a versioned, git-tracked prompt library of three real prompts with an adversarial eval suite and one measured improvement."
duration: "6 min read"
---

This is the module where everything else in the track gets used at once — not practiced in isolation, but shipped as one small, real piece of infrastructure.

## The brief

Build a small, git-tracked prompt library for three related real-world tasks: a classifier, an extractor, and a summarizer, operating on the same general domain — pick one you have realistic sample data for, such as support tickets, product reviews, or incoming emails. This extends [Capstone: Build a Prompt Library That Can Survive a Change](/learn/prompt-engineering/prompt-library-capstone) with the specific robustness layer this module covers: every prompt has to survive untrusted input, not just clean input, and every change has to be justified by a measured eval result, not a feeling. The deliverable isn't the prompt text — it's the library: versions, tests, a rubric, and one documented, measured decision.

## Acceptance criteria

- [ ] The library contains three prompt templates — one classifier, one extractor, one summarizer — each externalizing its variable inputs rather than hardcoding example text into the instruction (see [Prompt Templates and Variables](/learn/prompt-engineering/prompt-templates-and-variables))
- [ ] Every template that reads untrusted input delimits it and restates the true task after it (see [Defense in Depth: Delimiters, Roles, and Trust Boundaries](/learn/prompt-engineering/defending-with-delimiters-and-roles))
- [ ] Each prompt carries a version number and a changelog recording what changed between versions and why
- [ ] A JSONL eval set exists per prompt with at least three slices: ordinary cases, edge cases (empty, ambiguous, or malformed input), and adversarial cases — an injected instruction hidden in the input the prompt is supposed to process, modeled on [Worked Example: An Injection Attack and Its Mitigations](/learn/prompt-engineering/injection-attack-and-defense-worked)
- [ ] At least one prompt (the summarizer is the natural fit) is scored with an LLM-judge rubric naming specific criteria rather than a single quality score (see [Rubric and LLM Judge](/learn/prompt-engineering/rubric-and-llm-judge))
- [ ] A regression runner script runs the full eval set against two versions of at least one prompt and reports which cases changed outcome, not just an aggregate pass rate (see [Regression Tests for Prompts](/learn/prompt-engineering/regression-tests-for-prompts))
- [ ] Every adversarial eval case is checked specifically for whether the injected instruction changed the model's declared task, not just whether the output looks reasonable
- [ ] All three prompts pass their own eval suite at a threshold you define, write down, and can justify — 100% is not required; an honest, stated threshold is
- [ ] The repository's git history shows each prompt changing across at least two real versions, not just a final state
- [ ] A changelog entry documents one specific, measured improvement: what changed, the eval result before and after, and why you believe the change caused it

## Suggested stack

Nothing here requires a framework. Plain files work: a folder of prompt template files with `{{variable}}` placeholders, a `.jsonl` file per prompt for eval cases, and a small script that renders a template against a case, calls the model, and checks the result against the case's expected shape or a rubric. For the LLM-judge step, write a second, narrower prompt whose only job is scoring — treat it as its own template with its own version, since a judge prompt is still a prompt and can drift the same way. A spreadsheet or a markdown table is a perfectly good place to track eval results if you don't want to build a dashboard; the discipline matters more than the tooling.

## Milestones (capabilities)

Work toward being able to:

- Render any of the three templates against a new case and get a complete prompt, with no leftover `{{placeholder}}` text and no untrusted variable inserted without a delimiter around it
- Write an adversarial eval case that a naive version of the prompt actually fails — if every case in that slice already passes on v1, the slice isn't testing anything
- Score a summarizer's output against your rubric via an LLM judge and get a result stable enough to trust across a few reruns
- Diff two versions of the same prompt against the identical eval set and read the result as "N cases flipped from fail to pass, M flipped from pass to fail," not a single aggregate number
- Write a changelog entry that cites a specific eval case and a specific score change, not a general impression that the new version is "better"

## What good looks like

A strong submission has an adversarial eval case that visibly fails on an early version of a prompt and visibly passes after the delimit-and-restate fix is applied — the eval set is doing real work, not decoration. The changelog entry references that exact case and score, not a vague "improved reliability." A teammate could clone the repo, run the eval suite, and trust the result without reading every prompt's internals first. Failing cases stay in the repository even after they're fixed, so a future regression has something to be caught against.

A weak submission has an eval set that passes 100% on every version because every case was chosen to be easy, a changelog that says "made it better" without a number attached, or an adversarial slice written after the fix rather than before it — which tells you nothing about whether the fix did anything.

## Extensions

- Add a multilingual eval slice to one prompt and check whether your stated threshold still holds — see [Adapting Prompts Across Languages](/learn/prompt-engineering/adapting-prompts-across-languages) for what to test for.
- Add the image-plus-text receipt extractor from [Worked Example: A Multimodal Image-Plus-Text Prompt](/learn/prompt-engineering/multimodal-prompt-worked) as a fourth prompt, with its own eval set of clean and low-quality images.
- Wire the regression runner into a pre-commit hook or a simple CI script so a prompt change can't merge without the eval suite running.
- Port one prompt to a second model and see which eval cases hold and which don't — a live test of what [Prompt Portability Across Models](/learn/prompt-engineering/prompt-portability-across-models) covers, with your own numbers instead of someone else's.

**Related:** [Capstone: Build a Prompt Library That Can Survive a Change](/learn/prompt-engineering/prompt-library-capstone) · [Prompt Templates and Variables](/learn/prompt-engineering/prompt-templates-and-variables) · [Defense in Depth: Delimiters, Roles, and Trust Boundaries](/learn/prompt-engineering/defending-with-delimiters-and-roles) · [Rubric and LLM Judge](/learn/prompt-engineering/rubric-and-llm-judge) · [Regression Tests for Prompts](/learn/prompt-engineering/regression-tests-for-prompts) · [Worked Example: An Injection Attack and Its Mitigations](/learn/prompt-engineering/injection-attack-and-defense-worked) · [Adapting Prompts Across Languages](/learn/prompt-engineering/adapting-prompts-across-languages) · [Prompt Portability Across Models](/learn/prompt-engineering/prompt-portability-across-models)
