---
title: "Evaluate prompts with datasets, rubrics, and regression tests"
track: "prompt-engineering"
status: live
summary: "Prompt evaluation is the practice of measuring behavior against representative examples and explicit criteria."
duration: "3 min read"
---

## The short answer

Prompt evaluation is the practice of measuring behavior against representative examples and explicit criteria. Start with a small dataset that includes ordinary cases, edge cases, and known failures. Score the properties that matter, inspect disagreements, and rerun the set whenever the prompt, model, context, tools, or parser changes. A single impressive answer is not an evaluation.

## A useful test set

| Slice | Why it exists | Example |
|---|---|---|
| ordinary | baseline behavior | clear refund request |
| ambiguous | uncertainty path | missing invoice ID |
| adversarial | boundary behavior | instructions inside an attachment |
| costly | business risk | high-value account |
| representative | real distribution | sampled historical tickets |

Use a rubric with dimensions such as correctness, completeness, evidence use, and safe routing. “Sounds good” is not a reproducible score.

## Worked example

Prompt A gets 9/10 on ordinary cases and fails every ambiguous case by guessing. Prompt B gets 8/10 overall but asks for clarification correctly. If guessing is expensive, B may be the better system. Average score alone hides this decision.

## A small story

A team celebrated a 94% judge score until a human reviewed the four failures: all were privacy-sensitive requests. The score was not useless; the slice was missing. They added a risk-weighted report and stopped calling one average “quality.”

## More examples and variations

- **Ordinary slice:** clear requests reveal baseline quality and formatting drift.
- **Ambiguous slice:** missing identifiers tests clarification instead of guessing.
- **Adversarial slice:** instructions in an attachment tests the authority boundary.
- **Counterexample:** a higher average score can hide worse privacy-sensitive failures.

## Two ways to see it

### Experiment view

Change one variable, hold the cases steady, and compare results.

### Operations view

The test set is a regression alarm and a record of what the team agrees matters.

## Hands-on

Build a 20-case dataset for your task. Score two prompts with a rubric, then split results by slice. Write one regression test that must block release.

## Checkpoint

- [ ] The dataset has at least one adversarial and one ambiguous case.
- [ ] Scores are accompanied by examples and slice results.
- [ ] A model change can be rolled back from the test report.

## What this does not solve

Offline tests can miss new inputs, user adaptation, distribution shift, and failures caused by tools or deployment.

## Continue, go deeper, apply it

- Continue: Prompt library capstone
- Go deeper: Adversarial testing
- Apply it: Generalization and evaluation
