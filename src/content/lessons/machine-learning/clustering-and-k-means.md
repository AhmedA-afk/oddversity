---
title: "Use k-means as an investigation tool, not an automatic truth"
track: "machine-learning"
status: live
summary: "k-means partitions points into a chosen number of groups by alternating between assigning points to nearby centroids and moving centroids to group."
duration: "3 min read"
---

## The short answer

k-means partitions points into a chosen number of groups by alternating between assigning points to nearby centroids and moving centroids to group means. It is useful for exploratory structure and initialization, but clusters are artifacts of representation, distance, scale, and `k`; they are not discovered identities or causal categories.

## The mechanism

Choose `k`, initialize centroids, assign each point to its nearest centroid,
recompute means, and repeat until stable or a budget is reached. Different seeds
can produce different local solutions, so inspect stability and alternatives.

## Four examples

### Example A: catalog exploration

Cluster product embeddings to suggest themes for a human catalog review. Name the
features and inspect representative items per cluster.

### Example B: two-dimensional toy data

Plot points with obvious round groups to understand centroid movement. Then test a
non-round shape where the method’s assumptions break.

### Boundary case: unequal density

A small dense group can be absorbed by a large diffuse group. Compare another
method or treat the output as a prompt for investigation.

### Counterexample: cluster equals segment

Assigning marketing labels directly from clusters can encode arbitrary boundaries
and create unwanted treatment differences.

## An illustrative story

A team named three clusters “high value,” “at risk,” and “casual.” Review found
the split was mostly order frequency, which the names hid. The clusters became
descriptive views, not automatic customer policy.

## Two ways to see it

### Geometry view

The algorithm minimizes within-cluster squared distance to centroids.

### Discovery view

The result is a hypothesis about structure that needs domain validation and
stability checks.

## Hands-on

Run k-means on synthetic round, elongated, and unequal-density data. Sweep `k`,
seeds, and feature scaling. Show the centroids and write whether each partition
should be used, investigated, or rejected.

## Checkpoint

- [ ] Distance, scale, `k`, and initialization are documented.
- [ ] Stability and representative examples are inspected.
- [ ] Clusters are not treated as labels without validation.

## What this does not solve

Clustering does not discover the “natural” number of groups or prove that a group
is meaningful to people or policy.

## Continue, go deeper, apply it

- Continue: PCA and dimensionality reduction
- Go deeper: Nearest neighbors and kernels
- Apply it: publish a cluster investigation with rejected interpretations.

## The objective explains the behavior

K-means minimizes within-cluster sum of squared distances:

~~~text
inertia = Σᵢ ||xᵢ - μassigned(i)||²
~~~

With assignments fixed, the mean minimizes squared distance within each cluster. With centroids fixed, assigning each point to its nearest centroid minimizes its own contribution. Alternating those two steps decreases or leaves inertia unchanged, but it can stop at a local minimum. Multiple seeds and k-means++ initialization improve reliability; they do not turn a geometric objective into discovered ground truth.

For points [1, 2, 8, 9] on a line and k=2, centroids initialized near 1 and 9 lead to assignments [1,2] and [8,9], with means 1.5 and 8.5. Inertia is 0.5 + 0.5 + 0.5 + 0.5 = 2. An initialization near 2 and 8 also succeeds here. On overlapping or irregular data, another start can give a different partition, which is why stability is evidence worth reporting.

## Choosing k is an investigation, not a secret answer

The inertia curve always decreases as k grows, so an elbow is subjective. Silhouette score compares within-cluster distance with nearest-other-cluster distance, but it also favors certain shapes and may reward a representation artifact. Compare several k values using stability across resamples, representative examples, domain review, and a downstream task only if that task is legitimate.

K-means assumes roughly spherical, similarly scaled clusters under Euclidean geometry. It struggles with rings, crescents, highly unequal density, and categories encoded as arbitrary integer distances. Use a different representation or compare alternatives such as Gaussian mixtures, density methods, or hierarchical clustering when assumptions visibly fail.

## Debugging clinic: expose scale and seed dependence

Run k-means 30 times with different seeds and compute agreement between assignments after matching cluster labels. Then standardize features and repeat. If clusters change dramatically, do not call one run “the segments”; report that scale determines the view. Inspect the 10 closest and 10 farthest points to each centroid. A centroid may not correspond to a real example, and a sparse cluster can look coherent only because an outlier pulls its mean.

## Assessment: cluster investigation

For a small two-dimensional dataset, perform one assignment/update iteration by hand for two given centroids and calculate inertia. Propose a protocol for selecting among k=2, 3, and 4 that includes stability and human review. Describe a case where cluster labels should never be used to assign a customer treatment without further causal and fairness evaluation.

## From pattern to action requires a second experiment

If a cluster suggests a customer-support intervention, do not measure success by whether the cluster is visually neat. Define the action, eligible population, counterfactual or randomized comparison, and harm guardrails. The cluster may be a useful hypothesis generator, but it cannot establish that treating its members differently improves outcomes. Store the feature version, seed, scaling choice, and exemplar set so a future analyst can reproduce—and challenge—the interpretation.

Re-run this review whenever the data source or feature definition changes.
