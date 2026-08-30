---
title: "Observational causal estimation and its limits"
track: "machine-learning"
order: 513
status: live
summary: "Observational methods estimate causal effects only under strong, visible assumptions; use them to discipline reasoning, not to turn prediction into proof."
duration: "19 min read"
updated: "2026-08-30"
---

## The short answer

When randomization is unavailable, causal estimation relies on assumptions about treatment assignment, measured confounders, overlap, measurement, and interference. Methods such as adjustment, matching, weighting, difference-in-differences, and instrumental variables answer different questions under different conditions. State the estimand, draw the causal assumptions, test what can be tested, run sensitivity analyses, and limit conclusions to what the design supports.

## Why this matters

Organizations often need to learn from historical data, but historical actions were chosen for reasons. A flexible model can predict who received an intervention extremely well while making causal adjustment less credible if it relies on post-treatment or selection variables. The danger is not only a wrong number; it is a confident policy that systematically helps less or harms more.

## How it works

Begin with the intervention and target population. Define whether the goal is an average treatment effect, effect among treated people, or a policy value. Use a causal diagram to identify plausible pre-treatment confounders and variables that must not be conditioned on. Positivity or overlap means comparable untreated and treated cases exist across relevant covariate patterns; without it, the data cannot support a comparison there.

Outcome regression models the outcome conditional on treatment and covariates. Propensity methods model treatment assignment and reweight or match observations. Doubly robust estimators combine both, but “doubly robust” does not rescue unmeasured confounding, bad timing, or no overlap. Quasi-experimental methods add their own identifying assumptions, such as parallel trends or a valid instrument.

## Worked examples and variations

### Example 1: retention offer

High-risk customers are more likely to receive an offer. Adjust for pre-offer risk signals and inspect overlap, but do not claim the offer effect is identified if the agent used unrecorded account context.

### Example 2: matching

Match treated and untreated users with similar pre-treatment histories. Matching can improve comparability in observed data; it cannot create comparable untreated cases where none exist.

### Example 3: difference-in-differences

Compare outcome changes over time between treated and comparison regions. The key assumption is not that regions are identical, but that their counterfactual trends would have been parallel absent treatment.

### Example 4: an instrument candidate

Distance to a service might shift uptake, but it is only an instrument if it affects the outcome solely through uptake and is otherwise unrelated to outcome risk. These are substantive, contestable claims.

### Boundary case: poor overlap

If only the highest-risk users receive treatment, no method can reliably learn the untreated outcome for them from these data. Restrict the target population, collect data, or use a different design.

### Counterexample: adjustment for a post-treatment feature

Controlling for a variable influenced by the intervention can block part of the effect or create bias. Predictive availability is not a reason to adjust causally.

## Two ways to see it

Statistically, estimators trade assumptions for identification of an unobserved counterfactual. Practically, the work is an audit of how decisions were made, measured, and recorded before anyone uses the result to change policy.

## Hands-on

Simulate a treatment assigned partly by a hidden risk variable. Estimate an effect with naive regression, adjustment for observed covariates, and a restricted-overlap sample. Deliberately include a post-treatment mediator, observe the changed estimand, then reset to the pre-treatment adjustment set. Write a sensitivity statement describing the unmeasured factor most likely to overturn your conclusion.

## Checkpoint

- [ ] The estimand, population, treatment timing, and comparison are explicit.
- [ ] Overlap and covariate balance are checked and reported.
- [ ] Unmeasured-confounding and design assumptions are visible beside the estimate.

## What this does not solve

No observational estimator can prove assumptions that are not identified by the data. It cannot replace an ethical assessment, randomized test, or domain knowledge when those are needed.

## Continue, go deeper, apply it

Continue with fairness definitions and impossibility tradeoffs. Go deeper with target-trial emulation and sensitivity analysis. Apply this by attaching an assumptions table to every observational impact estimate.
