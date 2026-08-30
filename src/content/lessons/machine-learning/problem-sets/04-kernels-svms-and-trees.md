---
title: "Problem Set 4: Kernels, SVMs, and Trees"
track: "machine-learning"
order: 824
status: live
summary: "Work through similarity geometry, maximum-margin classification, impurity, and split failure modes."
duration: "90–120 min"
updated: "2026-08-30"
---

## Questions

1. Compute the linear-kernel Gram matrix for points ((1,0),(0,2),(-1,1)).
2. For (k(x,z)=(1+x^Tz)^2), compute (k((1,0),(0,2))). Explain why this corresponds to a quadratic feature space without explicitly forming it.
3. A hard-margin separator has (w=(2,-1)), (b=-1). Find the signed scores, predicted classes, and geometric margins for points ((1,1)) and ((2,0)).
4. State the primal hard-margin SVM optimization problem and explain the role of support vectors.
5. A node has 10 positive and 10 negative observations. A candidate split creates children (8+,2-) and (2+,8-). Compute parent Gini, weighted child Gini, and gain.
6. Why can a categorical feature with a unique ID per row produce an apparently excellent decision-tree split? Give two mitigations.
7. Debug an RBF SVM whose accuracy collapses after a feature is measured in milliseconds rather than seconds. Identify the sensitive quantity and repair.
8. A tree gets 100% training accuracy at depth 18 but 61% validation accuracy; a depth-3 tree gets 82% validation accuracy. Recommend a next experiment and explain why pruning is not merely cosmetic.

---

## Fully worked solutions

1. Dot products give (K=\begin{bmatrix}1&0&-1\\0&4&2\\-1&2&2\end{bmatrix}).
2. (x^Tz=0), so the value is 1. Polynomial kernels compute inner products of an implicit expanded feature representation, enabling nonlinear boundaries through linear optimization in that representation.
3. Scores: for ((1,1)), (2-1-1=0), hence boundary/ambiguous; for ((2,0)), (4-1=3), class +1. (\lVert w\rVert=\sqrt5); signed geometric margins are (0) and (3/\sqrt5).
4. Minimize (\frac12\lVert w\rVert^2) subject to (y_i(w^Tx_i+b)\ge1). Constraints active at equality identify support vectors; they determine the boundary, while points far beyond the margin do not affect the optimum in the ideal hard-margin case.
5. Parent Gini (=1-.5^2-.5^2=.5). Each child Gini (=1-.8^2-.2^2=.32); weighted child Gini is .32; gain is .18.
6. An ID permits near-perfect memorization of training rows. Drop identifiers/perform entity-aware feature review; restrict depth/minimum leaf size and validate with a split that prevents entity leakage.
7. RBF uses (\exp(-\gamma\lVert x-z\rVert^2)). Unit scaling changes squared distances by (10^6), making similarities vanish. Standardize within the training pipeline and retune (\gamma) on valid folds.
8. Tune complexity with nested or held-out validation, including min samples per leaf and cost-complexity pruning. Pruning constrains variance by replacing brittle local decisions with broader leaves; it changes generalization, not presentation.

## Grading rubric

30 points: kernels/SVM calculations; 25 points: SVM formulation and margin interpretation; 30 points: tree impurity and leakage; 15 points: scaling and model-choice reasoning.

## Common misconceptions

- A kernel is not automatically a valid similarity for every arbitrary formula.
- Margin is measured perpendicular to the boundary, not just by raw score.
- High-cardinality categories are a validation problem as much as a tree problem.

## Extension problems

Prove that the Gram matrix in question 1 is positive semidefinite. Fit a shallow and a deep tree on a grouped split, then report how its feature importances change under permutation importance.
