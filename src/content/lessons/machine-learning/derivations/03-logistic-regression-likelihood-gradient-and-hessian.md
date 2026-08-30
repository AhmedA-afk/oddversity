---
title: "Logistic regression: likelihood, gradient, and Hessian"
track: "machine-learning"
order: 803
status: live
summary: "Derive Bernoulli logistic regression through Newton's method and calculate likelihood curvature by hand."
duration: "60 min read"
updated: "2026-08-30"
---

## Notation and preconditions

For $y_i\in\{0,1\}$, let $p_i=\sigma(x_i^T\beta)=1/(1+e^{-x_i^T\beta})$. Rows must describe observations whose conditional Bernoulli outcomes are meaningful; separation requires special care.

## Step-by-step derivation

The log-likelihood is $\ell=\sum_i[y_i\log p_i+(1-y_i)\log(1-p_i)]$. Because $dp_i/d\eta_i=p_i(1-p_i)$, differentiation simplifies to $\nabla\ell=X^T(y-p)$. A second derivative gives $\nabla^2\ell=-X^TWX$, where $W=\operatorname{diag}(p_i(1-p_i))$. Thus $\ell$ is concave. Newton ascent is $\beta_{new}=\beta+(X^TWX)^{-1}X^T(y-p)$, normally solved rather than inverted.

## Fully worked numerical calculations

1. At $\eta=0$, $p=1/2$. For $y=1$, log-likelihood is $\log(.5)=-0.6931$; for $y=0$ it is also $\log(1-.5)=-0.6931$.
2. One feature $x=2$, $y=1$, $\beta=0$: gradient $=2(1-.5)=1$; Hessian $=-2^2(.5)(.5)=-1$. Newton update is $0+(-1)^{-1}(1)=-1$ if written naively with Hessian; correctly solve $H\Delta=-g$, so $\Delta=1$ and $\beta_{new}=1$.
3. At $\beta=1$, $p=\sigma(2)=.8808$. The negative log-loss for $y=1$ is $-\log(.8808)=.1269$; gradient of log likelihood is $2(.1192)=.2384$ and curvature is $-4(.8808)(.1192)=-.4200$.

## A failed derivation or numerical pitfall

The sign error above is common: Newton solves $H\Delta=-g$. Also never calculate `log(sigmoid(z))` from rounded probabilities for large $|z|$; use stable log-sigmoid routines. Perfect separation drives unregularized coefficients toward infinity.

## From-scratch coding exercise

```python
import numpy as np
X=np.c_[np.ones(4),[-2.,-1.,1.,2.]]; y=np.array([0.,0.,1.,1.]); b=np.zeros(2)
for _ in range(8):
 p=1/(1+np.exp(-X@b)); W=p*(1-p)
 b += np.linalg.solve(X.T@(W[:,None]*X), X.T@(y-p))
print(b)
```

Add $\lambda I$ to the Hessian (not its intercept entry) and observe how it handles near separation.

## Answers and checkpoint

Why is logistic regression concave in log-likelihood form? $X^TWX\succeq0$, so $-X^TWX\preceq0$. What is $p(1-p)$ at $p=.5$? $.25$, its largest value.

## Limitations

Correct likelihood does not guarantee calibrated probabilities under misspecification, independent labels, or an unbiased sample. Newton steps can be expensive for wide data.

## Nearby course topics

Continue with generalized linear models, calibration, MAP/MLE regularization, thresholds and abstention.
