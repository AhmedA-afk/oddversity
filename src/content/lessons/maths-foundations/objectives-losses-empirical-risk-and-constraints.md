---
title: "Objectives, losses, empirical risk, and constraints"
track: "maths-foundations"
status: live
summary: "An objective is the quantity an optimiser changes parameters to improve."
duration: "5 min read"
---

## The short answer

An objective is the quantity an optimiser changes parameters to improve. A loss scores one example; empirical risk aggregates losses over observed data; a metric describes performance; business cost describes consequences. Constraints restrict allowed solutions. Write all four separately: optimising a convenient proxy is safe only when its relationship to the real decision is explicit and tested.

## Why this matters

“Minimise loss” is not a complete product requirement. A classifier can lower average error by ignoring a rare but costly class, and a model can improve accuracy while exceeding latency or privacy limits. The objective determines what the training loop is allowed to trade away.

**Small incident (illustrative):** a ranking model improved click-through while increasing complaint rate. Clicks were the optimised metric, not the full product objective; the missing constraint was visible only after deployment.

## How it works

For parameters θ and examples (xᵢ,yᵢ), empirical risk is `R̂(θ) = (1/n) sumᵢ ℓ(fθ(xᵢ), yᵢ)`. An optimisation problem can be written as minimise `R̂(θ)` subject to `gⱼ(θ)≤0` and `hₖ(θ)=0`. A constrained problem can also use a penalty or Lagrangian, but that changes how violations are traded against fit.

### Assumptions and derivation

The empirical average estimates expected deployment loss only under a defensible sampling relationship and a relevant loss. A metric such as accuracy may be non-differentiable while a surrogate loss is differentiable; the surrogate needs validation against the metric and cost. Constraints must be feasible, measurable, and enforced at the stage where violations can still be prevented.

## AI use

Before training, write a decision table: target, loss, metric, cost, hard constraints, soft preferences, and evaluation slices. For generative systems include quality, latency, cost, refusal/safety, and escalation outcomes. An optimiser cannot recover a business value that was not represented or measured.

## Worked examples and variations

### Example A — smallest happy path

**Input:** fit a line with squared-error loss on three points. **Mechanism:** average squared residuals and choose parameters that minimise the average. **Output:** a differentiable objective. **Inspect:** plot residuals and compare the metric in original units. **Next decision:** accept the fit only if squared error matches the decision’s error cost.

### Example B — meaningful variation

**Input:** fraud classification where false negatives cost 20 times false positives. **Mechanism:** weighted loss or a threshold/cost layer changes the trade-off. **Output:** possibly lower accuracy but lower expected cost. **Inspect:** confusion matrix by class and cost-weighted total. **Next decision:** select threshold and objective from the cost model, not the accuracy leaderboard.

### Example C — boundary case

**Input:** require latency ≤ 100 ms and accuracy ≥ 95%, but every feasible model is slower or less accurate. **Mechanism:** constraint set is empty. **Output:** no valid optimiser solution. **Inspect:** show the Pareto frontier and feasibility test. **Next decision:** relax a requirement or change the system budget; do not hide infeasibility in a penalty.

### Example D — tempting counterexample

**Input:** optimise average loss over 99 common cases and one safety-critical case. **Mechanism:** the common cases dominate the mean. **Output:** lower risk estimate while the critical case worsens. **Inspect:** slice metrics and maximum/weighted loss. **Next decision:** add a constraint, slice gate, or appropriate risk measure.

### Example E — production objective drift

**Input:** train with offline log loss, deploy under a latency budget and changed traffic. **Mechanism:** the deployed decision has additional cost and a different data distribution. **Output:** offline objective no longer predicts total value. **Inspect:** compare offline, online, and guardrail metrics. **Next decision:** revise the objective or restrict the route.

## Computation and interpretation

```python
import numpy as np

y = np.array([0., 1., 2.])
pred = np.array([0.2, 1.4, 1.7])
loss = np.mean((pred - y) ** 2)
cost = 20 * np.sum((y == 1) & (pred < 0.5))
print(loss, cost)
```

These are different quantities. A scalar loss is not a business cost unless the mapping and units were designed that way. Report denominators and threshold rules with each metric.

## Two ways to see it

### Builder view

An objective is executable policy. Keep the formula, data weights, constraints, and reduction in version control, and test them with hand-labelled cases.

### Systems view

Optimisation spends a finite error budget. If one class, user group, or operational constraint is missing from the objective, the optimiser will spend that budget there.

## Hands-on

Write an objective card for a binary triage model with one primary loss, two reported metrics, a false-negative cost, and a latency constraint. **Failure fixture:** optimise unweighted accuracy on a 99:1 dataset and omit the minority slice. **Test:** the card must expose the denominator, cost, and constraint; the validation should fail when the latency or minority recall gate is absent. **Reset:** restore the full objective card and rerun the review.

## Checkpoint

- [ ] Distinguish loss, metric, empirical risk, and business cost.
- [ ] Write one constrained optimisation problem for an AI decision.
- [ ] Explain why a differentiable surrogate needs metric validation.
- [ ] Give one failure caused by optimising an average only.

## What this does not solve

An explicit objective does not make the data representative, the metric valid, or the constraints enforceable. Proxy alignment is empirical and can drift. Multi-objective trade-offs still require an owner and a decision rule.

## Continue, go deeper, apply it

- Continue: Convex sets, convex functions, and guarantees
- Go deeper: Effect sizes, power, and sample-size planning
- Apply it: Problem framing and baselines
