---
title: "Model interpretability: questions and audiences"
track: "machine-learning"
order: 601
status: live
summary: "Choose explanations by the decision, audience, and risk they must support—not by a visualization’s appeal."
duration: "18 min read"
updated: "2026-08-30"
---

## The short answer

Interpretability is not a property that a model simply has. It is evidence that a particular person can use to answer a particular question safely. Start with the decision, the audience, and the harm of being wrong; then choose a global, local, causal, procedural, or recourse-oriented explanation that can actually answer that question.

## Why this matters

An explanation can be numerically faithful and still be useless. A regulator may need a stable reason for an adverse action, an on-call engineer may need a signal that a pipeline changed, a clinician may need uncertainty and contraindications, and a model developer may need to find an interaction. Giving all four a feature-importance bar chart creates false confidence and misses the operational question.

## How it works

Write an explanation brief before selecting a technique: name the decision owner, action enabled, prediction scope, acceptable approximation error, protected groups, and confidentiality constraints. Classify the question as global behavior, an individual prediction, a data-quality diagnosis, a counterfactual action, or a causal claim. Validate the explanation itself: test fidelity to the model, stability under harmless perturbations, agreement with domain constraints, and whether users make better decisions with it.

## Worked examples and variations

1. A credit-risk analyst needs a notice for one declined applicant. Use a plain-language local reason and actionable eligibility policy; global importances cannot justify that individual outcome.
2. A fraud team asks why alerts doubled overnight. Compare score and feature distributions by model version and ingestion batch; a per-case explanation is the wrong granularity.
3. An oncology research group asks whether a biomarker causes response. SHAP values describe model association, not intervention effects; require a causal study design.
4. A demand-planning lead asks whether the model relies too much on promotion. Use partial-dependence or conditional effect plots plus subgroup slices, then check correlated-price and promotion features.
5. Boundary case: a simple monotone scorecard may be interpretable to reviewers, but a dense policy with hundreds of thresholds is not automatically understandable merely because it is not a neural network.

## Two ways to see it

Treat interpretability as an interface: the model exposes enough of its behavior for a human to take a defensible action. Treat it also as measurement: every explanation is an estimator with error, sampling variation, and assumptions that must be reported.

## Hands-on

Choose a deployed or public classifier. Create four stakeholder cards: operator, affected person, domain reviewer, and ML engineer. For each, state the decision, explanation type, one prohibited inference, and a success metric. Deliberate failure: give every stakeholder the same global feature-importance plot and ask them to act; record the unanswered questions. Reset by producing one audience-specific artifact per card and testing it on two held-out cases.

## Checkpoint

Can you distinguish “what influenced this prediction,” “what would change this prediction,” “what usually matters,” and “what causes the outcome”? Can you state whose action an explanation changes?

## What this does not solve

Interpretability does not prove fairness, privacy, calibration, causality, or correctness. A transparent model can still encode a harmful target or be applied outside its valid population.

## Continue, go deeper, apply it

Next, study permutation importance, conditional feature effects, SHAP assumptions, and counterfactual recourse. In production, add explanation requirements to the model card and release review rather than attaching them after an incident.
