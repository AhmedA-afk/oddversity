---
title: "What prompt engineering is"
track: "prompt-engineering"
status: live
summary: "Prompt engineering is the disciplined design and testing of prompts for a repeatable task."
duration: "3 min read"
---

## The short answer

Prompt engineering is the disciplined design and testing of prompts for a repeatable task. The engineering part begins when you define success, construct representative cases, compare alternatives, and retain a version that performs acceptably under known failure modes. A clever one-off answer is a demonstration; a prompt with tests, ownership, and a rollback path is a system component.

## The loop

```text
intent → specification → prompt → output → evaluation → revision
```

The loop exposes a common mistake: revising prose before deciding what “better” means. For a summarizer, “better” might mean coverage and citation placement. For a classifier, it might mean fewer false negatives in a high-risk slice.

## Worked example

Goal: turn a bug report into a triage record.

Bad specification: “Summarize this bug clearly.”

Useful specification: extract `symptom`, `reproduction`, `severity`, `missing_information`, and `next_action`; use `unknown` when absent; never invent a version; return JSON.

Failure mode: the model infers severity from an emotional phrase. Add a severity rubric and a test case where urgency and impact disagree.

## A small story

An engineer improved a prompt from 200 words to 1,000 words and saw a better demo. A week later, a new model version followed the same prompt less reliably. The durable improvement came from the test set they wrote afterward: it revealed which behavior was actually required and which improvement was just a lucky sample.

## More examples and variations

- **Summarization:** test short notes, long reports, and a document with a missing section.
- **Classification:** compare clear labels, overlapping labels, and an explicit “unknown” class.
- **Policy assistant:** require evidence and escalation when two rules conflict.
- **Counterexample:** adding ten adjectives to a prompt is not engineering if behavior is unmeasured.

## Two ways to see it

### Craft view

Words change emphasis, ambiguity, and the examples the model imitates.

### Engineering view

The prompt is one variable in a system that includes model, data, tools, settings, parser, evaluator, and users.

## Hands-on

Create a ten-example prompt test set. Define one must-pass criterion, one must-not criterion, and one “acceptable variation.” Compare a baseline prompt with your engineered version.

## Checkpoint

- [ ] A stranger can run your task from the written specification.
- [ ] Every example has an expected property, not necessarily one exact sentence.
- [ ] You can name a regression that would make you roll back.

## What this does not solve

Prompt engineering cannot compensate indefinitely for the wrong model, missing retrieval, weak data, or an unsafe authority boundary.

## Continue, go deeper, apply it

- Continue: Task framing
- Go deeper: Prompt patterns
- Apply it: Prompt evaluation
