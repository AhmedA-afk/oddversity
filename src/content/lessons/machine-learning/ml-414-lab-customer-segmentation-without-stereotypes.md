---
title: "Lab: segment customers without turning clusters into stereotypes"
track: "machine-learning"
order: 414
status: live
summary: "Run an end-to-end segmentation investigation that safeguards representation, uncertainty, and downstream treatment."
duration: "35 min lab"
updated: "2026-08-30"
---

## The short answer

This lab builds descriptive behavioural segments for service design, then tests whether they are stable and safe to use. The deliverable is an investigation memo, not a list of identities or automated eligibility rules.

## Why this matters

Customer clusters can quietly encode geography, income, language, or historical access. Names such as “low value” turn a model artifact into a treatment rationale and make harmful shortcuts easier.

## How it works

Use consented, action-relevant behaviour features: recency, contact preference, resolution channel, and product use. Exclude direct identifiers and protected traits from fitting; retain them only when lawful and appropriate for a separate coverage audit. Compare standardised k-means, hierarchical clustering, and HDBSCAN. Review examples, stability, cluster sizes, and proposed action benefits before exposing segments.

## Worked examples and variations (4–6, include boundary and counterexample)

1. **Support design:** identify self-service versus assisted-service preferences and offer both routes.
2. **Onboarding:** distinguish newly active users from experienced users by tenure-aware behaviour.
3. **Retention research:** invite representative members to qualitative interviews, not automatic discounts.
4. **Boundary:** a cluster of twelve records is an investigation lead, not a campaign audience.
5. **Counterexample:** calling a cluster “unprofitable” because of historic service denial bakes a prior policy into a label.

## Two ways to see it

Technically, segmentation partitions a feature geometry. Socially, it changes how people are described and potentially treated, so the action layer deserves more scrutiny than the algorithm.

## Hands-on

1. Write a one-sentence permitted use and a prohibited use.
2. Fit three methods across seeds and create a table of stability, size, and exemplars.
3. Deliberately include a postcode proxy; record the apparently clean split, then remove it and reset the analysis.
4. Audit coverage and error by relevant groups, obtain domain review, and publish a memo with an expiry date.

## Checkpoint

- [ ] Names describe observed behaviour, not worth or identity.
- [ ] No segment determines price, access, or enforcement automatically.
- [ ] A revalidation and deletion schedule exists.

## What this does not solve

Even carefully handled clusters do not explain why behaviour differs or grant permission for differential treatment.

## Continue, go deeper, apply it

Apply the same governance to personalization and recommender experiments. Keep the memo alongside code and decision owners.

