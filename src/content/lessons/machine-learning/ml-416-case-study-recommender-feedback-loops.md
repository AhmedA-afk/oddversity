---
title: "Case study: manage recommender feedback loops"
track: "machine-learning"
order: 416
status: live
summary: "Recognise how recommendations shape their own training data and design exploration, measurement, and safeguards accordingly."
duration: "28 min case study"
updated: "2026-08-30"
---

## The short answer

A recommender learns from behaviour that earlier recommendations helped create. Managing this feedback loop requires impression logging, deliberate exploration, longitudinal evaluation, and constraints for user welfare, catalogue diversity, and provider exposure.

## Why this matters

Optimising immediate clicks can repeatedly amplify familiar items, erase new inventory from data, and make the model appear increasingly accurate on a narrowing world. This harms discovery and makes offline evaluation less trustworthy over time.

## How it works

Log every eligible candidate, displayed position, policy version, and interaction outcome. Separate retrieval from ranking, include calibrated exploration that is safe for the surface, and use randomized or interleaved experiments for policy comparison. Monitor concentration, new-item exposure, user fatigue, session satisfaction, complaints, and outcomes by provider and user cohort. Treat a training log as policy-dependent evidence, not ground truth preference.

## Worked examples and variations (4–6, include boundary and counterexample)

1. **Video home feed:** a small exploration budget collects evidence for new creators while limiting irrelevant exposure.
2. **Marketplace search:** provider concentration alerts when a few sellers absorb nearly all impressions.
3. **News recommendation:** session-level diversity can prevent immediate-click optimisation from repeating one topic.
4. **Boundary:** highly safety-sensitive recommendations may allow little exploration and need editorial curation.
5. **Counterexample:** rising click-through rate after removing unfamiliar items can signal a shrinking choice set, not a better system.

## Two ways to see it

The loop is a control system: actions change the next state observed by the learner. It is also a measurement problem: unshown items have unobserved outcomes.

## Hands-on

Simulate two item groups, one initially popular and one new. Train a ranker on click logs, deploy greedily for several rounds, and graph exposure concentration. Deliberately remove all exploration and note the self-reinforcing result. Reset with a documented exploration policy, log propensities, compare cohort-level satisfaction proxies, and define a rollback trigger.

## Checkpoint

- [ ] Impressions, positions, candidates, and policy versions are logged.
- [ ] Exploration is bounded, purposeful, and evaluated for harm.
- [ ] Longitudinal diversity and concentration guardrails can stop a rollout.

## What this does not solve

Exploration alone cannot resolve unsafe content, manipulation, or value conflicts. Those require product policy, moderation, and accountable human governance.

## Continue, go deeper, apply it

Continue to causal evaluation and online experimentation. Apply this case study before using engagement logs as unquestioned training labels.

