---
title: "Deep lecture: Linear and logistic regression—from objective to deployment"
track: "machine-learning"
order: 901
status: live
summary: "Derive least squares and logistic likelihood, calculate them by hand, implement stable optimisation, and diagnose a decision model."
duration: "95 min lecture + 3 hr lab"
updated: "2026-08-30"
---

# Linear and logistic regression: two views of conditional prediction

Linear and logistic regression are not introductory relics. They are two of the clearest places to learn how a modelling assumption becomes an objective, an optimisation algorithm, a prediction, an uncertainty statement, and finally a decision. A practitioner who can derive and interrogate these models can reason about more complicated systems instead of treating them as library calls.

We observe rows `(x_i, y_i)` for `i = 1,...,n`. Put the features in a design matrix `X` with a leading column of ones when an intercept is wanted. A linear model says `y_i = x_i^T beta + epsilon_i`; logistic regression says `P(y_i=1 | x_i) = sigma(x_i^T beta)`, where `sigma(z)=1/(1+exp(-z))`. In both cases `beta` is a parameter vector, not a causal claim. A coefficient is conditional on the chosen features, their scale, their transforms, and the data-generating process.

## Least squares starts as a probability model

Assume independent Gaussian residuals: `epsilon_i ~ Normal(0, sigma^2)`. The log likelihood, dropping constants that do not contain `beta`, is

```text
ell(beta) = -(1 / (2 sigma^2)) sum_i (y_i - x_i^T beta)^2.
```

Maximising this likelihood is therefore minimising residual sum of squares, `RSS(beta)=||y-X beta||_2^2`. Differentiating gives

```text
gradient RSS = -2 X^T(y - X beta)
                = 2 X^T X beta - 2 X^T y.
```

At a stationary point, `X^T X beta = X^T y`. If `X^T X` is invertible, the normal-equation solution is `beta_hat=(X^T X)^(-1) X^T y`. This is a derivation, not a recommended production algorithm: forming an inverse is numerically weaker than QR, SVD, or iterative solvers, and exact collinearity makes the inverse unavailable.

### Calculation 1: one-variable least squares

For `x=(0,1,2)` and `y=(1,3,5)`, fit `y = b0 + b1 x`. The means are `x_bar=1`, `y_bar=3`. The slope is

```text
b1 = sum (x_i-x_bar)(y_i-y_bar) / sum (x_i-x_bar)^2
   = [(-1)(-2) + 0(0) + 1(2)] / [1+0+1] = 4/2 = 2.
b0 = y_bar - b1 x_bar = 3 - 2 = 1.
```

The prediction at `x=3` is `7`; residuals are all zero. That perfect fit says nothing about whether a straight line is sensible outside `0..2`.

### Calculation 2: normal equations with an intercept

For observations `(0,1),(1,2),(2,2)`,

```text
X = [[1,0],[1,1],[1,2]],  y=[1,2,2]^T.
X^T X = [[3,3],[3,5]],    X^T y=[5,6]^T.
```

The determinant is `15-9=6`, so `(X^T X)^(-1)=(1/6)[[5,-3],[-3,3]]`. Multiplying gives `beta_hat=(1/6)[7,3]=(7/6,1/2)`. At `x=2`, the fitted value is `13/6`; the residual is `-1/6`. Notice how least squares shares the error across all rows rather than passing exactly through two selected points.

### Calculation 3: one gradient-descent update

Use average loss `L=(1/n)sum(y_i-x_i beta)^2` with no intercept, data `x=[1,2]`, `y=[2,2]`, and starting `beta=0`. The gradient is `-(2/n)sum x_i(y_i-x_i beta) = -[1*2+2*2]=-6`. With learning rate `0.1`, `beta_new=0-0.1(-6)=0.6`. Predictions become `[0.6,1.2]`; loss falls from `(4+4)/2=4` to `[(1.4)^2+(0.8)^2]/2=1.30`. A learning rate of `1` would jump to `6`, producing loss `40`, an early warning to scale features or tune the step.

### Calculation 4: interpreting a transformed coefficient

Suppose `log(price)=10 + 0.08 * bedrooms`. Holding features fixed, one more bedroom multiplies predicted price by `exp(0.08)=1.0833`, about an 8.3% increase, not an increase of 0.08 currency units. The approximation “coefficient times 100 is percent” is only accurate for small coefficients; `exp(0.4)-1=49.2%`, not 40%.

## Logistic regression derives from Bernoulli likelihood

For binary labels, a linear prediction can be below zero or above one. Let `p_i=sigma(z_i)` and `z_i=x_i^T beta`. A Bernoulli likelihood is `p_i^{y_i}(1-p_i)^{1-y_i}`. Its negative log likelihood, or cross-entropy loss, is

```text
J(beta) = -sum_i [y_i log p_i + (1-y_i) log(1-p_i)].
```

Because `d sigma(z)/dz = sigma(z)(1-sigma(z))`, the chain rule simplifies beautifully:

```text
gradient J = X^T(p-y),
Hessian J = X^T W X,  where W_ii=p_i(1-p_i).
```

`W` is nonnegative, so the objective is convex. Newton's update is `beta_new=beta-(X^T W X)^(-1)X^T(p-y)`. In practice use a solver with damping and never compute the inverse explicitly. Complete separation—say every approved applicant has income above every rejected applicant—makes coefficients diverge, which is a modelling diagnostic, not proof that the true effect is infinite.

### Calculation 5: log odds, odds, probability

If `z=-0.7 + 1.2 x` and `x=1`, log odds are `0.5`; odds are `exp(0.5)=1.6487`; probability is `1.6487/(1+1.6487)=0.6225`. Increasing `x` by one multiplies *odds* by `exp(1.2)=3.32`. It does not add 120 percentage points. At `x=0`, probability is `0.3318`; at `x=1`, it is `0.6225`; at `x=2`, it is `0.8455`. The probability effect shrinks near the ceiling.

### Calculation 6: one logistic gradient component

For one row `x=2`, `y=1`, current `beta=0`, `p=0.5`. The gradient contribution is `x(p-y)=2(-0.5)=-1`. A gradient-descent step with rate `0.1` sets `beta=0.1`; then `z=0.2`, `p=0.5498`. The loss decreases from `-log(0.5)=0.6931` to `-log(0.5498)=0.5981`. With the wrong sign, beta would become `-0.1` and confidently move away from the label.

## Algorithmic choices and diagnostics

Use a pipeline that imputes, encodes, scales where needed, and fits on training folds only. Robust regression, splines, interactions, and offsets are all ways to change the model class while retaining interpretability. For logistic regression, distinguish discrimination (ranking positives above negatives) from calibration (probabilities matching frequencies) and decision quality (thresholding probabilities with costs).

```text
fit_logistic(X, y, lambda):
    beta <- zeros(number_of_columns(X))
    repeat until convergence:
        z <- clip(X @ beta, -30, 30)
        p <- sigmoid(z)
        g <- X.T @ (p - y) + lambda * penalty_gradient(beta)
        H <- X.T @ diag(p * (1-p)) @ X + lambda * penalty_hessian(beta)
        step <- solve(H, g)
        beta <- beta - line_search(beta, step)
    return beta
```

Clipping protects exponentials, not the statistical model. Keep the intercept out of the penalty unless there is a compelling reason. Inspect residual plots for linear regression, leverage and influence for both, calibration curves and threshold utility for logistic regression, and performance slices for any deployed model.

## Debugging lab: an implausibly perfect classifier

Download the runnable core package and run [the logistic regression checks](/classical-ml-labs/core/logistic_regression.py) plus [the full verifier](/classical-ml-labs/core/run_all.py). Then create a synthetic train/test split where a feature called `outcome_timestamp` is created *after* the label. Train a logistic model including it: expect near-perfect AUC. Remove it and rebuild all features inside each training fold: expect performance to fall. Your report must show both metrics, explain the temporal violation, and state which feature contract would have prevented it. A second failure to provoke: scale a useful feature by one million and use plain gradient descent. Record the oscillation, then standardise columns and compare iterations to convergence.

## Exercises with worked answers

1. **Show why least squares has a unique solution only when columns are independent.** Answer: `X^T X` is positive definite exactly when `Xv` is nonzero for every nonzero `v`; otherwise `v` lies in the null space and `beta` and `beta+cv` have equal predictions.
2. **For residuals `[-1,2,-1]`, compute RSS and MSE.** Answer: RSS=`1+4+1=6`; MSE=`6/3=2`.
3. **Why is the intercept gradient zero at an unregularised OLS optimum?** Answer: its column is ones, so the normal equation says `sum residuals=0`.
4. **Convert probability 0.8 to log odds.** Answer: odds=`0.8/0.2=4`; log odds=`log 4=1.3863`.
5. **A logistic coefficient is `-0.693`. What is its odds ratio?** Answer: `exp(-0.693)≈0.50`; a one-unit increase halves conditional odds.
6. **Name one sign of separation.** Answer: coefficients grow with solver iterations, standard errors explode, and predicted probabilities become exactly zero/one on training rows.
7. **Why can high AUC coexist with poor decisions?** Answer: AUC ignores probability calibration, operating threshold, class prevalence, and asymmetric harms.
8. **Choose linear or logistic regression for predicting weekly unit demand of 35.** Answer: linear-style count model may be reasonable; logistic is wrong because demand is not a binary event. A Poisson/negative-binomial GLM may be preferable if variance and support demand it.
9. **What does an interaction `beta_3 x1*x2` change?** Answer: the slope of `x1` becomes `beta_1+beta_3 x2`; one universal marginal effect no longer exists.

The key habit is to move in both directions: derive a loss from assumptions, then test whether those assumptions survive contact with data and decisions.
