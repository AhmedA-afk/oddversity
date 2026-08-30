---
title: "Lab: causal question triage"
track: "machine-learning"
order: 710
status: live
summary: "Decide when prediction is enough and when a question requires experimental or causal design."
duration: "75 min lab"
updated: "2026-08-30"
---

## The short answer

Translate a request into either “who will experience an outcome?” or “what changes if we intervene?” Use a causal diagram and an experiment feasibility check before applying a predictive model to a treatment decision.

## Why this matters

High-risk prediction can target people least likely to benefit. Confounding, selection, and existing policy mean correlations in logs are often the wrong evidence for an intervention.

## How it works

Write the intervention, outcome, population, decision time, and estimand. Draw a simple directed graph identifying plausible confounders, mediators, and post-treatment variables. Ask whether randomization is ethical and practical; if yes, design a controlled experiment with guardrails. If not, document the assumptions required for observational approaches and seek specialist review. Keep predictive risk models separate from treatment-effect claims.

## Worked examples and variations (4 examples incl. boundary/counterexample)

1. Predicting late payment supports staffing; it does not prove reminders reduce lateness.
2. Randomized reminder timing can estimate the effect of a reminder on payment.
3. A variable measured after treatment is a mediator or leakage, not a pre-treatment adjustment feature.
4. Counterexample: “customers contacted have lower churn” cannot show outreach worked because agents may select easier cases.

## Two ways to see it

Business asks which action is worth taking. Causal inference asks for a counterfactual outcome under a different action for the same eligible population.

## Hands-on

Deliver three request cards: one predictive, one causal, and one underspecified. For the causal card, submit a DAG, intervention protocol, eligibility rules, primary outcome, guardrails, and analysis plan. Intentionally fail by conditioning on a post-treatment variable or comparing self-selected groups; identify the bias, remove the invalid comparison, and reset to a randomized or explicitly assumption-bound design.

## Checkpoint

You can name the intervention and counterfactual in a causal question and identify why a predictive AUC cannot answer it.

## What this does not solve

This triage does not prove causal identification, replace ethics review, or make randomization suitable in every context.

## Continue, go deeper, apply it

Study randomized experiments, potential outcomes, confounding adjustment, sensitivity analysis, and uplift modeling with expert guidance.
