---
title: "Causal diagrams for ML practitioners"
track: "machine-learning"
order: 511
status: live
summary: "Draw a causal diagram before interpreting a predictive relationship as an intervention effect or deciding which variables are safe to adjust for."
duration: "18 min read"
updated: "2026-08-30"
---

## The short answer

A causal diagram records assumptions about what causes what. It helps distinguish prediction from intervention, reveal confounding and selection bias, and identify variables that should not be adjusted for. A diagram is not proof: the conclusions are only as credible as its assumptions and the evidence used to challenge them.

## Why this matters

Prediction asks what outcome is likely given available information. A causal question asks what would happen if we changed something. Using the first answer as the second can harm people and misallocate resources: people who receive an intervention may look worse precisely because they were selected when at higher risk.

## How it works

Represent variables as nodes and proposed causal relationships as arrows. A common cause of treatment and outcome is a confounder. A mediator lies on part of treatment's pathway to outcome. A collider is caused by two variables; conditioning on it can create a spurious association. Ask what information exists before the decision and what selection process created the dataset.

State the estimand in words: for example, the average outcome difference if eligible users were offered a reminder versus not offered one. Then use the diagram to assess whether measured pre-treatment confounders might make an observational comparison plausible. If key causes are unobserved, do not claim they were controlled merely because a predictive model used many features.

## Worked examples and variations

### Example 1: tutoring and grades

Motivation may affect both tutoring uptake and grades. Comparing tutored and untutored students without accounting for pre-treatment motivation can mistake selection for tutoring effect.

### Example 2: treatment severity

Sicker patients receive more intensive care and have worse outcomes. The raw association between treatment and mortality need not imply treatment harms patients.

### Example 3: hiring-screen model

Observed job performance exists only for people hired. Conditioning on hiring can create selection bias when both application signals and unmeasured factors affect hiring.

### Example 4: mediation choice

If a discount affects purchase partly through perceived value, adjusting for perceived value estimates a different question than the total effect of the discount.

### Boundary case: uncertain arrow direction

When domain experts disagree whether stress causes absence or absence causes stress, draw alternatives and identify how the planned conclusion changes. Uncertainty should narrow the claim, not disappear from the report.

### Counterexample: controlling for every available feature

Including a post-treatment variable or collider can increase bias even when it improves predictive fit. More adjustment is not automatically safer.

## Two ways to see it

Graphically, arrows expose paths through which associations arise. Practically, the diagram is a shared contract with domain experts about timing, mechanisms, and what the data cannot show.

## Hands-on

Draw a diagram for an intervention you care about, with treatment, outcome, two plausible confounders, one mediator, and one selection variable. Deliberately add a collider to a regression and inspect the changed association in a simulation, then reset to the pre-treatment adjustment set. Write which causal claim remains unsupported and what data or experiment would strengthen it.

## Checkpoint

- [ ] The target claim says what intervention and population it concerns.
- [ ] Variables are labeled by timing and causal role, not just availability.
- [ ] Diagram conclusions are presented as assumption-dependent.

## What this does not solve

A diagram cannot identify unknown confounders or validate arrows from imagination. It organizes assumptions so they can be challenged, measured, or tested.

## Continue, go deeper, apply it

Continue with randomized experiments and online A/B tests. Go deeper with potential outcomes and identification. Apply this by requiring a causal diagram before approving an observational impact claim.
