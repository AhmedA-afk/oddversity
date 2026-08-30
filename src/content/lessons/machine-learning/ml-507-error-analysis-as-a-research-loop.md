---
title: "Error analysis as a research loop"
track: "machine-learning"
order: 507
status: live
summary: "Turn mistakes into structured hypotheses about data, targets, features, thresholds, and workflow rather than chasing aggregate scores."
duration: "16 min read"
updated: "2026-08-30"
---

## The short answer

Error analysis is a repeatable investigation: define the decision and error costs, sample mistakes and successes, annotate plausible causes, quantify recurring patterns, form a narrow hypothesis, and test one intervention on a protected protocol. Do not infer a cause from a memorable example or repair a metric while harming the workflow it represents.

## Why this matters

An aggregate metric hides different failure modes: bad labels, impossible cases, missing context, threshold choices, data drift, and harmful feedback loops. Reading errors connects modeling work to the actual decision a person or system must make.

## How it works

Start with a confusion table or residual plot at the operating threshold. Sample examples from important error categories and have domain reviewers label failure causes using a small, documented taxonomy. Include correct predictions so reviewers can distinguish a pervasive data issue from an error-specific one. Estimate how common each cause is, then prioritize interventions by expected impact, feasibility, and risk.

Treat the taxonomy as a tool, not revealed truth. Review disagreement, blind annotators to model identity where possible, and preserve raw examples, redactions, and decisions. Test changes through the original split protocol; do not fix the model using the final test set.

## Worked examples and variations

### Example 1: false-negative fraud alerts

Review misses by transaction type, merchant, and timestamp. You may discover delayed labels rather than weak features; the remedy could be label maturation, not a larger model.

### Example 2: regression residuals

Plot residuals against price and region. Consistent underprediction for expensive homes suggests a target-scale or feature-coverage question, not proof that a particular algorithm is biased.

### Example 3: content moderation

Separate quoted abuse, reclaimed language, dialect, and annotation disagreement. A single toxicity score is not an explanation for why a prediction should lead to an action.

### Example 4: demand spikes

Inspect high-error dates alongside stockouts and promotions. The model may be correct about latent demand while the observed target is censored by inventory.

### Boundary case: few high-impact mistakes

When a rare failure is severe, prevalence alone should not decide priority. Escalate the scenario, design safeguards, and collect targeted evidence.

### Counterexample: optimizing the reviewed examples

Manually changing features until the same small set of reviewed mistakes disappears can overfit the analysis set. Confirm on fresh samples and a protected evaluation.

## Two ways to see it

The analytical view decomposes loss into patterns that might be reduced. The human-centered view asks what a mistake means in context and whether the stated target captured the decision fairly.

## Hands-on

Create a review sheet with prediction, confidence, true outcome, available-at-decision-time fields, and an error-cause label. Review 30 errors and 15 correct cases with a second reviewer. Deliberately choose a remedy from one dramatic example, test it, then reset by prioritizing the most common validated cause. Log every intervention and its result.

## Checkpoint

- [ ] Errors are sampled systematically, not chosen for drama.
- [ ] Reviewers can see decision-time context and record uncertainty.
- [ ] Proposed fixes are tested on protected data, not just reviewed examples.

## What this does not solve

Error analysis does not make a subjective label objective, and it cannot replace stakeholder decisions about whether the task should be automated at all.

## Continue, go deeper, apply it

Continue with slice discovery and subgroup reliability. Go deeper with label-quality audits and decision analysis. Apply this by adding an error-review table to every model release.
