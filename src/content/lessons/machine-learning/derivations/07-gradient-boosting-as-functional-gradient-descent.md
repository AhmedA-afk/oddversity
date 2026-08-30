---
title: "Gradient boosting as functional gradient descent"
track: "machine-learning"
order: 807
status: live
summary: "Derive boosting as descent in prediction-function space and calculate residual and log-loss pseudo-responses."
duration: "65 min read"
updated: "2026-08-30"
---

## Notation and preconditions

An additive predictor is $F_M(x)=F_0(x)+\sum_{m=1}^M\nu\rho_mh_m(x)$, where weak learners $h_m$ are often shallow trees, $\nu$ is learning rate, and loss is differentiable in the score $F(x_i)$.

## Step-by-step derivation

Minimize empirical risk $R(F)=\sum_i\ell(y_i,F(x_i))$. Its negative functional gradient at data points is $r_{im}=-\partial\ell(y_i,F(x_i))/\partial F(x_i)$. Fit $h_m$ to approximate these pseudo-responses, then choose line-search multiplier $\rho_m=\arg\min_\rho\sum_i\ell(y_i,F_{m-1}(x_i)+\rho h_m(x_i))$. For squared error $\ell=\tfrac12(y-F)^2$, $r=y-F$, exactly the residual. For logistic log loss with $p=\sigma(F)$, $r=y-p$.

## Fully worked numerical calculations

1. Squared error: $y=(3,5)$, current $F=(2,6)$ gives residuals $(1,-1)$. A stump predicting $h=(1,-1)$ with $\rho=1$ makes $F=(3,5)$ and loss falls from $\tfrac12(1+1)=1$ to $0$.
2. If the stump predicts $h=(.5,-.5)$, line search minimizes $\tfrac12[(1-.5\rho)^2+(-1+.5\rho)^2]=(1-.5\rho)^2$. Thus $\rho=2$.
3. For binary labels $(1,0)$ and scores $(0,0)$, $p=(.5,.5)$ and pseudo-responses are $(.5,-.5)$. Updating by $\nu=.1$ times this learner gives scores $(.05,-.05)$ and probabilities $(.5125,.4875)$.

## A failed derivation or numerical pitfall

“Fit residuals” is only literally correct for squared loss. For classification, residual-like targets are gradients, and class encoding matters. A tree that perfectly fits gradients can still overfit; early stopping is regularization, not merely speed.

## From-scratch coding exercise

```python
import numpy as np
y=np.array([3.,5.]); F=np.zeros(2); h=np.array([1.,1.])
for _ in range(3):
    r=y-F; rho=(r@h)/(h@h)  # squared-loss line search
    F += .3*rho*h
    print(F, np.mean((y-F)**2))
```

Replace `h` with the best constant-by-region stump found by scanning a single feature. Record training and validation loss as the number of rounds rises.

## Answers and checkpoint

Why can tiny $\nu$ need more trees? Each update moves less far along the fitted descent direction. What quantity replaces residuals under log loss? $y-p$. Why is a line search optional in many libraries? Trees and shrinkage provide an approximate fixed step.

## Limitations

Functional descent optimizes the chosen empirical loss, not calibration, fairness, or operational utility automatically. Deep trees, leakage, and noisy labels can make boosting brittle.

## Nearby course topics

Continue with gradient boosting from residuals, boosting hyperparameters and early stopping, calibration, and ensemble methods.
