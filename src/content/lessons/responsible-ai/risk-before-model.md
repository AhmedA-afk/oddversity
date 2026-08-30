---
title: "Risk before model: frame the system, not just the prompt"
track: "responsible-ai"
status: live
summary: "Responsible AI starts before model selection. Define who can be affected, what the system can change, what information it sees, what failure costs."
duration: "3 min read"
---

## The short answer

Responsible AI starts before model selection. Define who can be affected, what the system can change, what information it sees, what failure costs, and who can intervene. The [NIST AI RMF](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/) organizes this work as Govern, Map, Measure, and Manage. Treat it as a lifecycle loop, not a launch-day checklist.

## Map the system boundary

Draw the path: user → prompt → model → retrieval → tools → database → human or external action. Mark trust boundaries, sensitive data, irreversible actions, and fallback owners. A model can be harmless in isolation and risky when connected to a refund API or a private drive.

## Worked example

Feature: an assistant drafts replies for a benefits team.

- Impacted people: applicants, reviewers, dependents.
- Sensitive data: health and financial information.
- Failure: a confident but incorrect eligibility explanation.
- Control: cite the policy, show uncertainty, block decisions, require reviewer approval.
- Measure: error slices by policy type and language, plus escalation quality.

## A small story

An organization spent weeks choosing a model and one afternoon discovering that the real risk lived in the retrieval connector: it returned documents from the wrong tenant. The model was not the only component that needed governance.

## More examples and variations

- **Low-risk drafting:** a person reviews every output before sending.
- **Triage:** the model ranks work but does not make the final eligibility decision.
- **Hidden externality:** a time-saving feature may increase surveillance or retention.
- **Counterexample:** a final “ethics checklist” cannot repair an unbounded tool permission.

## Two ways to see it

### Builder view

Risk is a design input that changes interfaces, permissions, tests, and fallbacks.

### Stakeholder view

Risk is distributed: the person affected may not be the person who configured the system or sees the logs.

## Hands-on

Create a one-page system map and risk register for an AI feature. For each risk, name the affected party, harm, likelihood, control, measurement, owner, and escalation path.

## Checkpoint

- [ ] The map includes data, tools, humans, and external effects.
- [ ] At least one risk is not a model-output problem.
- [ ] Every high-impact failure has a human owner and a safe fallback.

## What this does not solve

A risk register does not prove the system is safe. It records decisions and makes omissions visible.

## Continue, go deeper, apply it

- Continue: Privacy, fairness, and provenance
- Go deeper: Red-team the system
- Apply it: Adversarial testing lab
