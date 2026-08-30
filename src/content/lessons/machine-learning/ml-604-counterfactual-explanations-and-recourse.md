---
title: "Counterfactual explanations and recourse"
track: "machine-learning"
order: 604
status: live
summary: "Offer feasible, stable actions that can change an eligible decision—without confusing a model boundary with a promise about the world."
duration: "21 min read"
updated: "2026-08-30"
---

## The short answer

A counterfactual explanation proposes a nearby valid input whose model prediction differs. Recourse is stronger: it proposes actions an affected person can legally, practically, and safely take, with an explicit probability of success under future policy and model changes.

## Why this matters

“Increase feature X” can be impossible, discriminatory, unsafe, or based on a proxy. A mathematically minimal point across a decision boundary is not automatically useful to a person and may fail after a retrain.

## How it works

Define immutable, actionable, conditionally actionable, and protected attributes. Optimize for outcome change subject to feasibility constraints, causal dependencies, cost, sparsity, diversity, and robustness to model uncertainty. Validate candidates against data validity rules and human policy. Distinguish a descriptive counterfactual from an approved action plan; record the policy and model version that generated it.

## Worked examples and variations

1. A loan model suggests reducing revolving utilization, not changing age or postcode; provide a range and a time horizon rather than an exact score boundary.
2. A hiring model suggests “gain three years of experience.” That may be technically actionable only over years and is not suitable immediate recourse.
3. A medical triage model’s nearest counterfactual changes a lab result. A patient cannot safely manipulate it, so use it for clinician review, not patient instruction.
4. For a subscription offer, changing product usage may be feasible, but changing it can incur cost; rank alternatives by cost and expected effect.
5. Boundary case: if no feasible action crosses the boundary, disclose that instead of inventing a recommendation.

## Two ways to see it

Geometrically, counterfactuals navigate a model decision region. Operationally, recourse is a constrained planning problem under policy, time, money, and uncertainty.

## Hands-on

Take a binary classifier and define a constraint table for every feature. Generate three diverse candidates per rejected example, then have a peer mark invalid or harmful actions. Deliberate failure: allow all features to vary and choose the smallest Euclidean distance. Reset by enforcing actionability, causal direction, and a holdout robustness test across two model seeds.

## Checkpoint

Which attributes must never change? What costs and dependencies make a candidate infeasible? How will you communicate that recourse can expire?

## What this does not solve

Recourse cannot remedy an unjust target, an unlawful policy, structural inequality, or an incorrect prediction. It is not a causal guarantee that an action changes the real outcome.

## Continue, go deeper, apply it

Connect recourse to fairness audits, policy review, and model-change notices. Build a human escalation path for cases with no safe, feasible recommendation.
