---
title: "Problem Set 6: Unsupervised Learning, PCA, and EM"
track: "machine-learning"
order: 826
status: live
summary: "Compute clustering objectives, principal directions, and expectation-maximization updates."
duration: "100–130 min"
updated: "2026-08-30"
---

## Questions

1. Points (0,2,8,10) are assigned to clusters (C_1=\{0,2\}) and (C_2=\{8,10\}). Compute both centroids and k-means within-cluster SSE.
2. Start k-means on those points with centers 0 and 10. Show one assignment/update iteration. What changes if both initial centers are 0 and 2?
3. A two-dimensional centered dataset has covariance (\begin{bmatrix}5&4\\4&5\end{bmatrix}). Find eigenvalues and unit principal directions. What fraction of variance does PC1 explain?
4. Explain why PCA should be fit on training data only in a supervised prediction workflow. Describe the leakage otherwise.
5. For a mixture with component priors (.6,.4), and likelihoods (p(x\mid z=1)=.2), (p(x\mid z=2)=.5), compute responsibilities for one observation.
6. State the E-step and M-step for a Gaussian mixture at a high level. Why does EM guarantee non-decreasing training likelihood but not a global optimum?
7. A clustering team labels clusters “low risk”, “medium risk”, “high risk” because their average outcome differs. Give three reasons this is not yet a valid risk model.
8. Debug: PCA components are fitted after one-hot encoding 50,000 sparse IDs and then used to claim semantic similarity among users. Identify two concerns and one alternative evaluation.

---

## Fully worked solutions

1. Centers are 1 and 9. SSE (=(0-1)^2+(2-1)^2+(8-9)^2+(10-9)^2=4).
2. With centers 0 and 10, assignments are {0,2} and {8,10}; update gives 1 and 9, then assignments remain stable. Starting 0 and 2 can create a poor local configuration initially; k-means++ and multiple seeds reduce—not eliminate—initialization sensitivity.
3. Eigenvalues are 9 and 1. Unit directions are (\frac1{\sqrt2}(1,1)) and (\frac1{\sqrt2}(1,-1)), respectively. PC1 explains (9/(9+1)=90\%\) of variance.
4. PCA estimates directions from feature covariance. Fitting it before splitting lets validation/test feature distribution influence training representations, which can inflate apparent downstream performance even without labels.
5. Unnormalized weights are (.6\cdot.2=.12) and (.4\cdot.5=.20); total .32; responsibilities are .375 and .625.
6. E-step computes posterior component responsibilities using current parameters. M-step updates priors, means, and covariances using responsibility-weighted sufficient statistics. Each coordinate step improves or preserves likelihood, but nonconvex likelihood can have local optima and singular covariance pathologies.
7. The groups are unsupervised partitions, not calibrated probabilities; differences may be sample noise or confounding; deployment needs a defined target, prospective validation, and a decision policy. Descriptive segments should not inherit causal or predictive claims.
8. Sparse ID columns encode memorization rather than meaningful geometry, and unscaled/high-cardinality representation can dominate variance. Evaluate stability across samples and downstream task value on an entity-disjoint holdout; alternatives include purpose-designed embeddings or aggregated behavioral features with privacy review.

## Grading rubric

30 points: k-means calculations and initialization; 25 points: PCA linear algebra and leakage; 30 points: mixture responsibilities/EM; 15 points: interpretation and debugging.

## Common misconceptions

- PCA maximizes variance, not predictive usefulness or causal relevance.
- A cluster assignment is not a probability unless a model explicitly supplies one.
- EM convergence is not proof of correct component count or global optimality.

## Extension problems

Compute the first two PCA scores for points ((1,1),(2,0),(-1,-1),(-2,0)). Compare k-means cluster stability over 30 seeds with and without feature scaling.
