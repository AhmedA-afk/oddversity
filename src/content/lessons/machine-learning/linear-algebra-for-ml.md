---
title: "Use vectors and matrices as the language of ML"
track: "machine-learning"
status: live
summary: "Most ML inputs are vectors, models transform vectors, and datasets can be arranged as matrices."
duration: "3 min read"
---

## The short answer

Most ML inputs are vectors, models transform vectors, and datasets can be arranged as matrices. Dot products measure alignment, matrix multiplication applies many linear combinations at once, and norms express size or distance. You do not need to memorize every theorem first; you need to know which shape, geometry, and assumption a calculation encodes.

## The mechanism

For a feature vector `x` and weight vector `w`, `w · x + b` is a weighted sum.
Changing a feature changes the score in proportion to its weight. A data matrix
stacks many examples so the same operation can run as a batch.

## Four examples

### Example A: linear score

For `[hours, pages]` and weights `[2, 0.5]`, the score increases more per hour
than per page. A weight is not automatically causal importance; scale and
correlation matter.

### Example B: distance

Two customers may be close in normalized feature space but far apart if one raw
currency feature dominates. Scaling changes the geometry and therefore kNN.

### Boundary case: missing dimension

A vector with a missing feature is not silently equivalent to a zero. Encode the
missingness meaning or reject the row according to the data contract.

### Counterexample: correlation as direction

Two features can point in nearly the same direction. Large individual weights may
then be unstable even when predictions remain similar.

## An illustrative story

A nearest-neighbor model looked irrational until the team plotted feature scales.
One count measured in thousands overwhelmed a normalized ratio. The “model bug”
was a geometry choice hidden in preprocessing.

## Two ways to see it

### Geometry view

Features define axes, scaling defines distances, and projections define which
variation a model can see.

### Engineering view

Shapes, dtypes, normalization, and sparse/dense choices are part of the model
contract and must be tested.

## Hands-on

Create five two-dimensional points. Compute dot products, Euclidean distances,
and normalized distances by hand and in code. Change one feature scale and record
which nearest neighbor changes and why.

## Checkpoint

- [ ] You can explain a dot product and a matrix batch operation.
- [ ] You can show how scaling changes distance or score.
- [ ] Missingness is not confused with a numeric zero.

## What this does not solve

Linear algebra describes representation and computation; it does not tell you
which features are valid, fair, or available at decision time.

## Continue, go deeper, apply it

- Continue: Probability and statistics for ML
- Go deeper: Neural networks and representations
- Apply it: publish a feature-scaling note for a small model.

## Shapes are a first-class correctness condition

Let a dataset have n examples and d features. Arrange it as X with shape n × d, a weight vector w with shape d × 1, and a bias b with shape 1. The batch of linear predictions is:

~~~text
ŷ = Xw + b
~~~

The multiplication is legal because the inner dimensions d match. Each prediction is a dot product between one row of X and w. If an implementation accepts a transposed array by broadcasting, it may calculate a plausible but wrong result; print shapes before trusting a loss curve.

Consider

~~~text
X = [[1, 2],
     [3, 4]]
w = [[2],
     [-1]]
b = 0.5
~~~

The first score is 1×2 + 2×(-1) + 0.5 = 0.5; the second is 3×2 + 4×(-1) + 0.5 = 2.5. Matrix notation performs both calculations together. It is not new mathematics; it is a compact way to state repeated dot products.

## Geometry behind common ML operations

The dot product x·w = ||x|| ||w|| cos(theta). It is large when vectors align, negative when they point in opposite directions, and zero when orthogonal. Cosine similarity divides by norms, so it measures direction rather than scale. This helps with word-count vectors where document length should not dominate, but it is inappropriate if magnitude itself is meaningful.

The L2 norm of [3, 4] is sqrt(3² + 4²) = 5. An L1 norm is |3| + |4| = 7. L2 penalties shrink weights smoothly; L1 penalties can drive some coefficients to exactly zero. In kNN, squared Euclidean distance from [1, 2] to [4, 6] is (1-4)² + (2-6)² = 25. A feature scaled 100 times larger contributes 10,000 times more squared distance, which explains why preprocessing can change a nearest-neighbor model completely.

## Projections, rank, and redundancy

Project a vector x onto a unit direction u by (x·u)u. In regression, the fitted values are a projection of y onto the column space of X under squared loss. If two columns are identical, X has redundant directions; many different weight vectors yield the same predictions. This is why correlated features can make individual coefficients unstable even when held-out error is stable.

Singular value decomposition writes X = UΣVᵀ. The singular values in Σ quantify variation along orthogonal directions. PCA keeps directions associated with large singular values after centering; it is a geometric compression, not a label-aware feature selector.

## Debugging clinic: catch an accidental broadcast

Implement a tiny matrix multiply both by loops and by your numerical library. Use X shape (2, 2) and w shape (2, 1), then intentionally try w shape (1, 2). Your test should reject the second shape rather than relying on implicit broadcasting. Next duplicate one feature column and inspect the condition number or coefficient instability under ordinary least squares. The prediction can remain stable while the interpretation becomes fragile.

## Assessment: calculate, then explain

Given x = [2, -1, 3] and w = [0.5, 4, -2], compute the score and identify which feature change would increase it by 1. Compute the Euclidean distance between x and [3, -1, 1]. Finally, explain why standardizing features changes kNN but does not necessarily change the predictions of an unregularized linear model when the coefficients are refit.
