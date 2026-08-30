---
title: "Case study: promotion model versus policy change"
track: "machine-learning"
order: 516
status: live
summary: "Work through a realistic promotion prediction problem to separate forecast quality from the causal effect of changing a promotion policy."
duration: "50 min case study"
updated: "2026-08-30"
---

## The short answer

A model that predicts which customers will purchase during a promotion does not tell you whether sending a promotion caused a purchase. In this case study, build separate evidence paths: one for forecasting demand and one for deciding whether a policy change is beneficial. The second needs an intervention design or explicit, contestable observational assumptions.

## Why this matters

Promotion systems are a common source of self-deception. Historical promotions are usually targeted at people thought likely to buy or likely to leave. A predictive model can be commercially useful for planning, yet using it to allocate discounts may pay customers who would have bought anyway while excluding people who would respond.

## How it works

Define the two questions. Predictive question: given information available Monday, who is likely to purchase this week? Causal question: for an eligible customer, what is the incremental outcome of offering discount A versus no offer? The target, labels, and best evaluation differ.

For prediction, use time-forward splits, features available before Monday, calibrated probabilities, and an error analysis across customer and product conditions. For policy effect, draw a diagram that includes prior buying, targeting rules, offer exposure, inventory, and outcome. The preferred design is randomized assignment among ethically eligible customers, with revenue, margin, complaints, unsubscribes, and longer-term behavior as outcomes and guardrails.

## Worked examples and variations

### Example 1: demand forecast

Use historical purchase patterns, season, and inventory known at prediction time to forecast orders. Validate on later weeks and evaluate stock-planning error. This can be valuable without making any causal claim about promotions.

### Example 2: naive campaign comparison

Customers who got a coupon spend more than those who did not. Because marketers targeted high-value customers, the raw difference could exaggerate, understate, or reverse the coupon's incremental value.

### Example 3: randomized offer test

Randomize eligible customers to no offer, small offer, or large offer. Estimate assignment effects on incremental contribution margin and include opt-out and service-contact guardrails.

### Example 4: inventory interference

An offer can cause stockouts that affect control customers. Randomization and analysis must consider shared inventory, perhaps by product-region or phased rollout rather than independent customer assignment.

### Boundary case: a customer already committed to buy

Giving a discount to a likely buyer can lower margin with no incremental demand. A high purchase probability alone is not a treatment-effect estimate.

### Counterexample: training on post-offer behavior

Including email-open or coupon-click features in a pre-offer targeting model leaks exposure information and makes an offline score irrelevant to the allocation decision.

## Two ways to see it

The predictive view estimates future outcomes under the historical process. The policy view estimates counterfactual outcomes under alternative actions. They may use similar data but answer fundamentally different questions.

## Hands-on

Create a decision brief with separate prediction and intervention columns: target, prediction time, available features, unit, metric, split or assignment design, and claimed conclusion. Deliberately train a purchase model with a post-offer click feature and use its high score to recommend discounts; then reset by removing post-offer data and designing a randomized offer experiment. Conclude with a rollout rule that stops the policy if margin or opt-out guardrails fail.

## Checkpoint

- [ ] Forecasting and policy-effect claims are written as separate questions.
- [ ] All predictive features are available before the allocation decision.
- [ ] Any causal recommendation names its design, assumptions, and guardrails.

## What this does not solve

This case does not determine a company's pricing ethics, consent obligations, or long-term brand effects. Those require policy, stakeholder, and legal decisions beyond a model evaluation.

## Continue, go deeper, apply it

Continue by revisiting model monitoring and experiment design. Go deeper with uplift modeling only after understanding its identification assumptions. Apply this by requiring separate forecast and policy evidence in commercial ML proposals.
