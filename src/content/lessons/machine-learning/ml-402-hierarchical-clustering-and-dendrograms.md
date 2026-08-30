---
title: "Build and read hierarchical clusters with dendrograms"
track: "machine-learning"
order: 402
status: live
summary: "Use nested merges to inspect structure at multiple resolutions, while accounting for linkage and distance choices."
duration: "15 min read"
updated: "2026-08-30"
---

## The short answer

Agglomerative hierarchical clustering starts with one cluster per point and repeatedly merges the closest pair. Its dendrogram exposes every possible cut, but its picture is only meaningful relative to the distance and linkage rule used.

## Why this matters

Teams often choose a number of segments after seeing the chart. Hierarchies are valuable because they make that trade-off visible, but they invite over-reading branch heights and irreversible early merges.

## How it works

Compute pairwise distances, then merge clusters using single linkage (nearest pair), complete linkage (farthest pair), average linkage, or Ward linkage (increase in within-cluster variance). Cut the tree at a height or select a fixed number of leaves. Standardise numerical columns and define a defensible mixed-data distance first.

## Worked examples and variations (4–6, include boundary and counterexample)

1. **Document taxonomy:** use cosine distance and average linkage to propose nested topic folders.
2. **Gene-expression exploration:** Ward linkage can identify compact groups after batch correction.
3. **Store formats:** a tree lets an analyst view two broad formats or eight operational subformats.
4. **Boundary:** duplicated observations create zero-height merges; deduplicate before interpreting branches.
5. **Counterexample:** single linkage chains points along a bridge and turns two clouds into one cluster.

## Two ways to see it

The algorithm is a greedy compression history. The dendrogram is a menu of partitions, not evidence that one horizontal cut is objectively correct.

## Hands-on

Cluster a small labelled benchmark after hiding labels. Produce dendrograms for single, complete, average, and Ward linkage. Deliberately leave one feature unscaled and compare the tree. Reset with standardisation, cut at three levels, and inspect whether known labels and examples support any cut.

## Checkpoint

- [ ] Linkage and distance match the feature geometry.
- [ ] The chosen cut has an operational reason.
- [ ] Chaining and unstable leaves were checked.

## What this does not solve

Hierarchical clustering has costly pairwise computations and does not automatically handle streaming data, noise points, or causal hierarchy.

## Continue, go deeper, apply it

Next, compare density clustering when noise and irregular shapes matter. Apply a dendrogram as an analyst-facing exploration tool, not an automatic policy engine.

