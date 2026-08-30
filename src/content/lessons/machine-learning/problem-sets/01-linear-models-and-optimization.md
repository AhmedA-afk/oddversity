---
title: "Problem Set 1: Linear Models and Optimization"
track: "machine-learning"
order: 821
status: live
summary: "Derive, compute, debug, and interpret least-squares and logistic-model optimization."
duration: "90–120 min"
updated: "2026-08-30"
---

## Instructions

Show algebra, state assumptions, and distinguish a numerical answer from an interpretation. Unless a question says otherwise, include an intercept and do not regularize it.

## Questions

1. For (X=[[1,0],[1,1],[1,2]]) and (y=[1,2,2]^T), compute the ordinary least-squares estimate (hat\beta=(X^TX)^{-1}X^Ty).
2. Starting from (J(\beta)=\frac{1}{2n}\lVert X\beta-y\rVert_2^2), derive (\nabla_\beta J\). Give one batch-gradient step with learning rate (\eta).
3. Use your answer to question 1 to predict at (x=3). Compute the residuals and mean squared error on the training data.
4. A colleague fits the same data with `fit_intercept=False` after passing only the raw feature (x=[0,1,2]). Explain, quantitatively, why this is a different model. Compute its slope.
5. Let (X^TX=\begin{bmatrix}3&3\\3&5\end{bmatrix}). Find its eigenvalues and use them to give the condition number (largest divided by smallest eigenvalue). What does it suggest about gradient descent?
6. For logistic regression with (p_i=\sigma(x_i^T\beta)), derive the gradient of average negative log likelihood. Why is using squared error with a sigmoid usually a poorer optimization choice?
7. With (\beta=(-1,1)) for intercept and one feature, calculate (p(y=1\mid x)) for (x=0,1,3). Under a 0.5 threshold, classify each.
8. Debug this update: `beta = beta - eta * X.T @ (y - p) / n`. State the sign error and write the correct update for minimizing logistic negative log likelihood.

---

## Fully worked solutions

1. (X^TX=\begin{bmatrix}3&3\\3&5\end{bmatrix}), (X^Ty=[5,6]^T), and the inverse is (\frac16\begin{bmatrix}5&-3\\-3&3\end{bmatrix}). Thus (hat\beta=[7/6,\;1/2]^T).
2. Expanding and differentiating gives (\nabla J=\frac1nX^T(X\beta-y)). The step is (\beta_{t+1}=\beta_t-\eta\frac1nX^T(X\beta_t-y)).
3. (hat y(3)=7/6+3/2=8/3). Fitted values are (7/6,5/3,13/6); residuals (1/6,1/3,-1/6). SSE is (1/6), so MSE is (1/18).
4. The through-origin slope is (\sum x_iy_i/\sum x_i^2=6/5=1.2), not (0.5). It forces the prediction at zero to be zero rather than the estimated baseline (7/6); omitting an intercept is a modelling assumption, not a harmless implementation detail.
5. The characteristic polynomial is (\lambda^2-8\lambda+6), so eigenvalues are (4\pm\sqrt{10}). The condition number is about (7.16/0.84=8.55). Curvature differs by a factor of 8.55: stable learning rates are dictated by the steep direction and progress is slower in the flat one.
6. (\nabla\ell=\frac1nX^T(p-y)). Logistic loss is the Bernoulli negative log likelihood and has convex, well-scaled curvature for this model; squared error changes the objective and can flatten gradients when sigmoid outputs saturate.
7. Scores are (-1,0,2); probabilities are approximately (0.269,0.5,0.881). With the convention (p\ge .5), labels are (0,1,1). The equality convention must be documented.
8. Since (\nabla\ell=X^T(p-y)/n), the correct minimization step is `beta = beta - eta * X.T @ (p - y) / n`, equivalently `beta = beta + eta * X.T @ (y - p) / n`. The displayed expression subtracts (y-p), so it ascends the loss.

## Grading rubric

40 points: questions 1–3 (correct arithmetic and residual reasoning); 25 points: questions 4–5 (modelling and conditioning); 25 points: questions 6–8 (derivation, probability, debugging); 10 points: clear assumptions and units. Minor arithmetic errors lose at most half of the relevant point value when the method is correct.

## Common misconceptions

- (X^TX) being invertible does not make a fit causally meaningful.
- A low training MSE does not validate a learning rate or future performance.
- A threshold is a decision policy, not part of the probability model.

## Extension problems

Prove that the least-squares Hessian is (X^TX/n), then compare feature standardization and a diagonal preconditioner on question 5. Implement both batch gradient descent and a closed-form fit, and explain any disagreement using stopping tolerance and numerical precision.
