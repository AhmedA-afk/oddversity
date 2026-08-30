---
title: "Use similarity carefully with nearest neighbors and kernels"
track: "machine-learning"
status: live
summary: "Nearest-neighbor methods predict from nearby examples under a chosen distance; kernel methods turn similarity into a weighted influence."
duration: "3 min read"
---

## The short answer

Nearest-neighbor methods predict from nearby examples under a chosen distance; kernel methods turn similarity into a weighted influence. They are intuitive and useful when local structure matters, but they depend heavily on scaling, representation, neighborhood size, and the availability of comparable examples at inference time.

## The mechanism

Choose a distance, find the `k` closest training points, and aggregate their
labels or values. A kernel replaces a hard neighborhood with weights that decay
with distance. Small `k` is flexible and noisy; large `k` is smoother and biased.

## Four examples

### Example A: visual similarity

Images with useful embeddings can retrieve similar items. The result depends on
the embedding geometry, not just the neighbor algorithm.

### Example B: local price estimate

Nearby homes may predict a price in a dense neighborhood. Sparse rural cases need
an uncertainty or out-of-range flag.

### Boundary case: scale changes neighbors

A raw income field can dominate all other distances. Normalize using training
statistics and test whether the neighborhood makes domain sense.

### Counterexample: memorization as generalization

If a near-duplicate of each test row is present in training, kNN can look perfect
while failing on genuinely new entities. Use group-aware splits.

## An illustrative story

A recommender returned “similar” products that shared a SKU prefix. The model was
correct under the encoded distance; the representation captured catalog IDs, not
customer intent.

## Two ways to see it

### Geometry view

Prediction is a local vote or weighted interpolation in feature space.

### Data view

Similarity is a claim about which differences should matter and requires a stable
representation.

## Hands-on

Create a two-dimensional classification fixture with three classes. Sweep `k`,
scale one feature, and add duplicate entities. Compare random and group splits;
explain every performance change.

## Checkpoint

- [ ] Distance and representation are described together.
- [ ] `k` expresses a bias/variance choice.
- [ ] Duplicate and group leakage are tested.

## What this does not solve

Similarity does not mean fairness, relevance, or causal closeness. A neighbor can
be close for the wrong reason.

## Continue, go deeper, apply it

- Continue: Ensemble methods
- Go deeper: Clustering and k-means
- Apply it: create a nearest-neighbor error gallery with the distance features shown.

## A neighbor rule is a local estimator

For regression, kNN predicts the mean target among the k nearest training examples. For classification, it commonly votes among labels or averages their class probabilities. With k=1, the decision boundary follows every training fluctuation; with large k, local detail is averaged away. Distance, feature scaling, and k are inseparable hyperparameters.

Consider neighbors with distances [0.2, 0.5, 1.0] and binary labels [1, 0, 1]. A uniform 3-NN probability is 2/3. A Gaussian kernel weighting with bandwidth h=0.5 uses weights proportional to exp(-distance²/(2h²)), giving nearby examples more influence. This can be smoother than a hard cutoff, but bandwidth h is another bias-variance control and must be selected on validation data.

## Curse of dimensionality

In a unit hypercube, the side length needed to capture a fixed fraction of volume approaches one as dimensions increase. Intuitively, neighborhoods become empty unless they grow so large that they are no longer local. Distances also concentrate: the nearest and farthest points can become similarly far. A kNN method is therefore only as good as the low-dimensional, meaningful representation it receives. Learned embeddings, feature selection, and careful normalization can help; adding raw irrelevant columns often hurts.

## Kernels as similarity features

A positive semidefinite kernel K(x,z) behaves like a dot product in some feature space. The radial basis function kernel is:

~~~text
K(x, z) = exp(-gamma × ||x-z||²)
~~~

Small gamma makes broad similarity; large gamma makes each example influential only in a tiny neighborhood. Kernel methods can express nonlinear boundaries, but their memory and compute often grow poorly with training set size. They are not magic alternatives to representation work.

## Debugging clinic: inspect actual neighbors

For 25 validation cases, display the query, the k training neighbors, distance components by feature, their labels, and the predicted vote. Look for duplicates, shared account IDs, raw-scale domination, and neighbors that are semantically nonsensical. Then rerun with standardized features and a group-aware split. If the attractive result disappears, the earlier result measured dataset duplication rather than generalization.

## Assessment: choose a locality policy

For a house-price estimator, choose features, distance scaling, k values, and an out-of-distribution rule for rural properties. Compute the unweighted 3-NN prediction and a distance-weighted alternative for a supplied four-neighbor example. Explain why a kernel bandwidth and a k value cannot be selected by looking at training error alone.

## Retrieval can be an explanation only if the representation is explained

Showing neighbors is useful because a reviewer can challenge the comparison set, but it is not automatically a faithful explanation. Include the feature values and distance contributions, hide protected or prohibited attributes as required, and disclose when an embedding rather than raw domain features determines closeness. A nearest example can be a training duplicate, a stale case, or a correlation artifact. Treat the gallery as a review interface with documented provenance, not as proof the model reasoned correctly.

Log the neighbor index version as well: a changed training corpus changes every comparison.
