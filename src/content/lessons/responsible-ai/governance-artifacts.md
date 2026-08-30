---
title: "Make responsible AI work visible through artifacts"
track: "responsible-ai"
status: live
summary: "Responsible AI becomes operational when decisions, assumptions, evidence, owners, and exceptions are recorded where a team can review them."
duration: "3 min read"
---

## The short answer

Responsible AI becomes operational when decisions, assumptions, evidence, owners, and exceptions are recorded where a team can review them. A risk register, system or model card, data note, evaluation report, and incident runbook are not paperwork after the build; they are the interface between a system and its accountability.

## A minimum artifact set

- **System brief:** purpose, users, non-goals, human role, and decision scope.
- **Data note:** sources, consent, provenance, retention, and known gaps.
- **Risk register:** harm, likelihood, impact, controls, owner, and review date.
- **Evaluation report:** datasets, slices, rubrics, failures, and exceptions.
- **Incident runbook:** detection, containment, communication, rollback, and learning.

## Four examples

### Example A: low-risk drafting assistant

Document that the tool drafts but never sends, stores minimal content, and routes
uncertain policy claims to a reviewer.

### Example B: classifier in triage

Record label meaning, threshold, slice results, reviewer capacity, and appeal path.

### Boundary case: scope expands

A support summarizer is asked to make eligibility decisions. Treat that as a new
system purpose and reopen the risk and evaluation review.

### Counterexample: model card alone

A polished model card cannot compensate for undocumented tools, data retention,
or a missing incident owner. Describe the whole system boundary.

## An illustrative story

A launch meeting stalled because every team had a different meaning of “safe.” A
shared risk register turned the argument into named questions: safe for whom, under
which use, measured how, and owned by whom.

## Two ways to see it

### Governance view

Artifacts create continuity when people, models, and vendors change.

### Engineering view

Artifacts are executable intentions: each material risk should map to a test,
control, owner, or explicit acceptance decision.

## Hands-on

Create a system brief and risk register for a fictional document assistant. Add
three risks, one control and one test per risk, an owner, and a review date. Write
the incident action if a control fails.

## Checkpoint

- [ ] Purpose, non-goals, users, and decision authority are explicit.
- [ ] Each risk has evidence, a control, an owner, and a review date.
- [ ] The artifact covers data, model, tools, users, and operations.

## What this does not solve

Documentation does not reduce risk unless people use it to make launch, access,
monitoring, and rollback decisions.

## Continue, go deeper, apply it

- Continue: Regression gates and online signals
- Go deeper: Privacy, fairness, and accessibility
- Apply it: attach a test and named owner to every high-impact risk.
