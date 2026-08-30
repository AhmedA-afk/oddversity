---
title: "Gradient descent and convergence for linear models"
track: "machine-learning"
order: 802
status: live
summary: "Derive batch gradient descent, connect its step size to eigenvalues, and diagnose divergence numerically."
duration: "55 min read"
updated: "2026-08-30"
---

## Notation and preconditions

For $L(\beta)=\frac1{2n}\|y-X\beta\|^2$, write $H=X^TX/n$. Assume features are finite; strong convexity additionally needs $H\succ0$. The update is $\beta_{t+1}=\beta_t-\eta\nabla L(\beta_t)$.

## Step-by-step derivation

Expanding gives $\nabla L=(X^TX\beta-X^Ty)/n=H\beta-X^Ty/n$. Let $\beta_*$ solve $H\beta_*=X^Ty/n$. The error evolves as $e_{t+1}=\beta_{t+1}-\beta_*=(I-\eta H)e_t$. In an eigenvector direction with eigenvalue $\lambda$, its multiplier is $1-\eta\lambda$. Thus convergence for every positive-curvature direction requires $0<\eta<2/\lambda_{\max}(H)$; the slowest direction is controlled by the smallest nonzero eigenvalue.

## Fully worked numerical calculations

1. With one observation $x=2,y=6$, $L=\tfrac12(6-2\beta)^2$, so $\nabla L=-2(6-2\beta)=4\beta-12$. From $\beta_0=0,\eta=.1$: $\beta_1=0-.1(-12)=1.2$.
2. Next gradient is $4(1.2)-12=-7.2$, so $\beta_2=1.2+.72=1.92$. Prediction is $2(1.92)=3.84$, closer to $6$.
3. Here $H=x^2=4$, so stable $\eta<2/4=.5$. With $\eta=.6$, $\beta_1=7.2$, then gradient $=16.8$, and $\beta_2=7.2-10.08=-2.88$: the magnitude grows because $1-.6(4)=-1.4$.

## A failed derivation or numerical pitfall

Do not claim convexity means every learning rate works. Scaling a feature by $100$ scales a curvature eigenvalue roughly by $10,000$ and can turn a formerly safe step into divergence. Standardize features or tune $\eta$.

## From-scratch coding exercise

```python
import numpy as np
X=np.array([[1.,0.],[1.,2.],[1.,4.]]); y=np.array([1.,5.,9.]); b=np.zeros(2)
for _ in range(2000): b -= .05 * X.T @ (X @ b-y) / len(y)
print(b, np.mean((X@b-y)**2))
```

Compute `eigvalsh(X.T@X/len(y))`; choose a deliberately unsafe step and plot loss before resetting to a safe one.

## Answers and checkpoint

The update is a linear dynamical system around $\beta_*$. Why do flat directions converge slowly? Their multiplier $1-\eta\lambda$ is near one. Why can rank deficiency still allow fitted-value convergence? Null-space coefficient directions do not affect predictions.

## Limitations

This is full-batch, quadratic analysis. Stochastic gradients add noise; nonconvex objectives lack this global guarantee; finite precision and stopping rules matter.

## Nearby course topics

Continue with ordinary least squares, feature scaling, optimization loss and gradient descent, and regularization paths.
