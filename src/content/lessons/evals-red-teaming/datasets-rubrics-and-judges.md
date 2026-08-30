---
title: "Build evaluation datasets and rubrics before choosing a judge"
track: "evals-red-teaming"
status: live
summary: "An evaluation dataset makes behavior concrete; a rubric makes quality discussable; a judge applies the rubric consistently enough to compare."
duration: "3 min read"
---

## The short answer

An evaluation dataset makes behavior concrete; a rubric makes quality discussable; a judge applies the rubric consistently enough to compare versions. Start with representative and risk-weighted cases, include known failures, and inspect judge disagreement. A score without examples is a dashboard, not understanding.

## Build the set

Sample ordinary traffic, add boundary and adversarial fixtures, label slices by
risk or user context, and hold out a set for release checks. Keep provenance and
version metadata so the dataset itself can be reviewed.

## Four examples

### Example A: extraction

Score exact fields, null behavior, and preservation of source values separately.
One aggregate “correct” label hides which contract failed.

### Example B: grounded answer

Use dimensions for answer correctness, evidence support, citation mapping, and
abstention when evidence is missing.

### Boundary case: judge ambiguity

Two reviewers disagree whether a summary is complete. Rewrite the rubric with
observable criteria and keep the disagreement as a training case for future judges.

### Counterexample: judge preference as truth

A judge may reward style, length, or confident tone even when the user needs a
short, cautious answer. Validate judge scores against human review.

## An illustrative story

A team improved its automated score by adding longer answers. Humans found them
harder to use. The rubric had rewarded “more detail” without a relevance or
verbosity constraint; the fix was a better criterion, not another prompt trick.

## Two ways to see it

### Measurement view

The dataset defines what gets seen; the rubric defines what gets counted.

### Governance view

Evaluation is a record of which failures the team accepts, escalates, or blocks.

## Hands-on

Create 30 synthetic cases across ordinary, ambiguous, missing-evidence,
adversarial, and high-impact slices. Write a three-dimension rubric, score with a
simple judge and a human sample, and record disagreements.

## Checkpoint

- [ ] Cases are versioned, sourced, and sliced.
- [ ] Rubric dimensions are observable.
- [ ] Judge results are compared with human review.

## What this does not solve

An evaluation set can become stale or gamed. It needs new cases from incidents,
drift, user feedback, and red-team findings.

## Continue, go deeper, apply it

- Continue: Regression gates and online signals
- Go deeper: Adversarial testing lab
- Apply it: publish a rubric with three examples of passing, borderline, and failing behavior.
