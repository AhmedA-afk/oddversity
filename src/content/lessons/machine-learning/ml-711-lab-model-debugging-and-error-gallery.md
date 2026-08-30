---
title: "Lab: model debugging and error gallery"
track: "machine-learning"
order: 711
status: live
summary: "Turn aggregate metrics into a disciplined investigation of data, labels, and model behavior."
duration: "90 min lab"
updated: "2026-08-30"
---

## The short answer

Build an error gallery that samples false positives, false negatives, largest residuals, uncertain cases, and slice failures. Trace each example back to raw data and decide whether the next action is data repair, relabeling, feature change, policy change, or acceptance of a limitation.

## Why this matters

An aggregate score cannot reveal duplicate records, wrong units, missingness conventions, boundary populations, or a metric that rewards the wrong behavior. Debugging is the bridge from evaluation to dependable iteration.

## How it works

Freeze a test set and predictions. Create strata by outcome, score band, time, entity group, and important domain conditions. Sample cases reproducibly, inspect source records with privacy controls, and log a hypothesis plus evidence. Separate data defects from valid hard examples. Change one thing at a time and rerun the full pipeline; never tune repeatedly on a sealed final test.

## Worked examples and variations (4 examples incl. boundary/counterexample)

1. Largest price residuals reveal area stored in mixed square-foot and square-meter units.
2. False churn positives reveal customers already in a non-cancelable contract state.
3. Low-confidence cases near a decision threshold identify candidates for human review.
4. Counterexample: deleting every difficult case raises metrics but hides the population the product must serve.

## Two ways to see it

Engineering sees a reproducible incident investigation. Statistical learning sees conditional error analysis across regions of the input distribution.

## Hands-on

Deliver an error-gallery CSV with stable row identifiers, predicted value, true label, slice tags, reviewer notes, and action category. Produce five inspected examples from each of four strata. Intentionally fail by changing preprocessing without versioning or by repeatedly choosing fixes on the final test; record why this invalidates comparison, then reset to train/validation iteration with a frozen test. File at least one data-quality issue even if it is ultimately rejected.

## Checkpoint

You can trace a metric change to a concrete population and distinguish a label problem from a model limitation.

## What this does not solve

An error gallery does not make rare harms disappear, prove generalization to unseen populations, or replace formal privacy review.

## Continue, go deeper, apply it

Add data-validation tests, slice dashboards, counterfactual probes, and a recurring error-review meeting with domain stakeholders.
