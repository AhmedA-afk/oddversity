---
title: "Use PCA to expose directions of variation"
track: "machine-learning"
status: live
summary: "Principal component analysis (PCA) rotates centered data into orthogonal directions that capture decreasing amounts of variance."
duration: "3 min read"
---

## The short answer

Principal component analysis (PCA) rotates centered data into orthogonal directions that capture decreasing amounts of variance. Keeping the first few components can compress, visualize, or denoise a dataset. Variance is not automatically importance, and a useful visualization is not proof that a downstream decision is safe.

## The mechanism

Center features, find directions of high variance, and project points onto the
chosen components. Standardization can change the result because it changes what
counts as a large variation.

## Four examples

### Example A: visualization

Project a high-dimensional dataset to two components to inspect broad structure.
Label the plot with known outcomes only after checking that the projection did not
hide important separation.

### Example B: compression

Keep enough components to preserve a chosen reconstruction quality. Measure the
loss instead of selecting a number from a plot alone.

### Boundary case: low-variance signal

A rare but important feature may contribute little global variance. PCA can remove
it while making the data look cleaner.

### Counterexample: fit PCA globally

Fitting components on the full dataset leaks validation information. Fit on the
training portion and apply the learned projection forward.

## An illustrative story

A team used a two-dimensional PCA plot to claim that two populations overlapped.
The plot was honest but incomplete: the relevant difference lived in a low-
variance direction. Visualization became exploratory evidence, not a verdict.

## Two ways to see it

### Geometry view

PCA chooses orthogonal axes that explain variance under a squared reconstruction
objective.

### Communication view

Compression is a tradeoff between what becomes visible and what is discarded.

## Hands-on

Create data with one high-variance noise feature and one low-variance signal.
Compare raw and standardized PCA, reconstruct with two component counts, and test
whether a classifier loses the signal.

## Checkpoint

- [ ] Centering and scaling choices are explicit.
- [ ] Explained variance is not confused with task importance.
- [ ] PCA fitting respects the train/evaluation boundary.

## What this does not solve

PCA does not find semantic meaning, fairness, or a universally correct dimension;
it optimizes a geometric compression objective.

## Continue, go deeper, apply it

- Continue: Anomaly detection
- Go deeper: Linear algebra for ML
- Apply it: create a projection report with discarded-signal risks.

## PCA is an optimization problem

After centering a data matrix X, the first principal direction v₁ is the unit vector that maximizes projected variance:

~~~text
maximize ||Xv||² subject to ||v|| = 1
~~~

The solution is the eigenvector of the covariance matrix with the largest eigenvalue, or equivalently the first right singular vector of X. Subsequent components are orthogonal directions with decreasing remaining variance. Projecting onto the first r components gives Z = XV_r; reconstructing gives approximately ZV_rᵀ plus the original mean.

For points that vary mostly along the diagonal line y=x, the first component is roughly proportional to [1,1]/sqrt(2). Projecting [3,1] on that direction gives (3+1)/sqrt(2). The perpendicular component describes variation away from the diagonal. PCA chooses the diagonal because it preserves the most squared variation, not because it knows the label or business objective.

## Centering, scaling, and explained variance

Without centering, the first component may point toward the mean rather than the directions around it. Standardizing makes each feature have unit variance, so a high-unit measurement cannot dominate merely by its scale. Neither choice is automatic: preserve raw scale when its variance is genuinely meaningful; standardize when units are arbitrary or mixed. State the choice and inspect how it changes components.

Explained-variance ratio is the retained eigenvalue sum divided by total eigenvalue sum. Retaining 95% variance can still discard the 5% that predicts a rare safety event. Conversely, low-variance noise can clutter a downstream model. Select component count by fitting PCA inside the training pipeline and evaluating the actual downstream metric, reconstruction requirements, and interpretability constraints.

## PCA is not a universal visualization truth

A two-component plot can hide separations in later components, create apparent overlap by projection, or magnify sampling artifacts. Use it as a diagnostic alongside labels, slices, and alternative projections—not as proof that groups are identical. PCA is linear; curved manifolds and local neighborhoods can require other techniques, whose visual appeal is even less a validity guarantee.

## Debugging clinic: leaked projection and lost signal

Fit PCA on training rows only, save the mean and components, and transform validation rows. Compare with the tempting global fit. Then train a downstream classifier using 2, 5, 10, and all components, measuring performance on a final held-out set. If a rare but critical class loses recall at 95% explained variance, do not celebrate compression. Plot errors by component count and inspect which original feature directions were discarded.

## Assessment: PCA derivation and design

Given a centered two-feature covariance matrix, identify the direction of largest variance from its eigenvectors or provided eigenpairs and calculate the variance retained by keeping one component. Explain why an uncentered PCA can mislead. Design a train-only PCA experiment for a 1,000-feature text or sensor dataset, including component-count selection, a downstream metric, and a check for a low-variance but high-impact signal.

Include a reconstruction example for one held-out row and explain what its error cannot tell you about a supervised decision label.
