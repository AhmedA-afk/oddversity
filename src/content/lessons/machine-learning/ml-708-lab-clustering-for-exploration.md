---
title: "Lab: clustering for exploration"
track: "machine-learning"
order: 708
status: live
summary: "Use clustering to generate hypotheses, not to declare discovered customer truths."
duration: "75 min lab"
updated: "2026-08-30"
---

## The short answer

Cluster a carefully scaled exploratory dataset, compare stability across methods and seeds, inspect representative records with domain experts, and label clusters as hypotheses rather than identities.

## Why this matters

Clustering always returns groups, even when the data contains no meaningful natural partition. Names like “high-value loyalists” can turn a tentative visualization into a misleading business fact.

## How it works

Choose a purpose such as discovering service patterns. Remove identifiers and post-outcome fields, scale continuous measures, encode categorical variables consciously, and create a baseline summary before fitting. Compare k-means with a density or hierarchical approach where appropriate. Vary the seed, sample, and number of clusters; summarize size, feature distributions, and example records. Seek external validation through an action or outcome measured later.

## Worked examples and variations (4 examples incl. boundary/counterexample)

1. Standardizing spend and visits prevents currency scale from dominating distance.
2. A small density cluster can flag an unusual workflow worth investigation.
3. Stable clusters across monthly samples are more credible than one-run segments.
4. Counterexample: clustering account IDs produces numerical groups with no behavioral meaning.

## Two ways to see it

Exploration sees a map for asking better questions. Geometry sees a chosen similarity measure and optimization objective—not discovered ground truth.

## Hands-on

Deliver a feature rationale, preprocessing pipeline, baseline distribution report, k sweep or density settings, seed-stability table, and one-page cluster review sheet. Intentionally fail by omitting scaling or including an identifier; save the distorted output, then reset with defensible features and scaling. Ask a domain reviewer to mark each cluster claim as supported, uncertain, or contradicted.

## Checkpoint

You can explain how distance, feature scaling, and chosen k create the result, and can name a test that might invalidate a proposed segment.

## What this does not solve

Clusters do not predict individual behavior, prove causes, or justify differential treatment of people.

## Continue, go deeper, apply it

Explore mixed-type distances, representation learning, cluster stability selection, and experiments that test whether a segment-specific action helps.
