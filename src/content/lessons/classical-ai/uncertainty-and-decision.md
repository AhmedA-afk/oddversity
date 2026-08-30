---
title: "Separate uncertainty from the decision it informs"
track: "classical-ai"
status: live
summary: "A probability describes uncertainty about an event; a decision rule chooses an action using that uncertainty and the costs of being wrong."
duration: "3 min read"
---

## The short answer

A probability describes uncertainty about an event; a decision rule chooses an action using that uncertainty and the costs of being wrong. The same probability can justify different actions when consequences, budgets, or human review capacity change. Never treat a score as a decision without naming the threshold and cost.

## A small decision table

For each action, estimate its benefit, false-positive cost, false-negative cost,
and review cost. A threshold is a policy choice informed by these values, not a
universal property of the model.

## Four examples

### Example A: medical reminder

A high-risk flag may justify a reminder and review, but not a diagnosis. The
action must be narrower than the uncertain inference.

### Example B: fraud triage

A score of 0.7 may trigger a manual review when review is cheap. The same score
may be ignored for a low-value transaction where friction costs more.

### Boundary case: base-rate shift

A score calibrated on last year’s rare events may overstate risk after the event
rate changes. Monitor the base rate and revisit the decision rule.

### Counterexample: rank equals probability

Sorting cases by score can be useful even when scores are not calibrated
probabilities. Calling them probabilities without checking meaning leads to bad
cost calculations.

## An illustrative story

A team lowered a threshold because “catching more” sounded safer. Reviewers then
received too many false alarms and began approving everything. The better design
combined a cost review, a capacity limit, and an escalation band.

## Two ways to see it

### Inference view

Estimate what is likely given evidence and assumptions.

### Decision view

Choose an action that remains acceptable when the estimate is wrong.

## Hands-on

Create a two-action table for a classifier: act now or review. Vary false-positive
cost, false-negative cost, and reviewer capacity. Explain how the threshold moves
and which assumptions would need monitoring.

## Checkpoint

- [ ] Score, probability, threshold, and action are named separately.
- [ ] Costs and review capacity influence the rule.
- [ ] A shift in base rate has a monitoring response.

## What this does not solve

Decision theory cannot supply missing evidence or make a value judgment disappear.
Stakeholders still need to approve which harms count and who bears them.

## Continue, go deeper, apply it

- Continue: Classifiers, thresholds, and calibration
- Go deeper: Search and planning
- Apply it: write a decision table for one model score used by your team.
