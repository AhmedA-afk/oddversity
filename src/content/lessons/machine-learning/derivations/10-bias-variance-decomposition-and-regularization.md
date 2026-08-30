---
title: "Bias-variance decomposition and regularization"
track: "machine-learning"
order: 810
status: live
summary: "Derive squared-error bias-variance decomposition and calculate how regularization trades systematic error for estimator stability."
duration: "60 min read"
updated: "2026-08-30"
---

## Notation and preconditions

Let $Y=f(x)+\epsilon$, with $E[\epsilon\mid x]=0$ and variance $\sigma^2$. A fitted predictor $\hat f_D(x)$ varies with training set $D$. This exact decomposition is for squared prediction error, not generic classification accuracy.

## Step-by-step derivation

At fixed $x$, add and subtract $E_D\hat f_D(x)$: $E_{D,Y}[(Y-\hat f_D)^2]=\sigma^2+[f-E_D\hat f_D]^2+E_D[(\hat f_D-E_D\hat f_D)^2]$. Cross terms vanish because noise has mean zero and deviations around an expectation average to zero. Ridge alters estimator $\hat\beta_\lambda=(X^TX+\lambda I)^{-1}X^Ty$, shrinking noisy directions and generally raising bias while lowering variance.

## Fully worked numerical calculations

1. Suppose true $f=10$, irreducible variance $1$, and model outputs $8,10,12$ across datasets. Mean prediction is $10$, bias squared $0$, variance $[(−2)^2+0^2+2^2]/3=8/3$, expected error $1+8/3=3.6667$.
2. If outputs are $7,7,7$, mean is $7$, bias squared $(10-7)^2=9$, variance $0$, total error $1+9=10$.
3. One-dimensional ridge with $X^TX=4,X^Ty=12$: OLS is $12/4=3$; with $\lambda=4$, ridge is $12/(4+4)=1.5$. The shrinkage factor is $4/(4+4)=.5$.

## A failed derivation or numerical pitfall

Bias and variance are properties of a training procedure under a data-generating distribution, not a single fitted model. Training error is not the decomposition target. Reducing variance can worsen total error if the induced bias is too large.

## From-scratch coding exercise

```python
import numpy as np
rng=np.random.default_rng(0); preds=[]
for _ in range(500):
 x=rng.normal(size=8); y=2*x+rng.normal(size=8)
 preds.append((x@x+2)**-1 * (x@y))  # ridge slope at lambda=2
preds=np.array(preds); print(preds.mean(), preds.var())
```

Repeat for several penalties, estimate prediction MSE on a fixed test distribution, and plot bias squared, variance, and total error separately.

## Answers and checkpoint

The decomposition is noise + squared bias + variance. Why did the first example have no bias despite varying predictions? Their mean equals the truth. Why does ridge help collinear data? It damps directions where $X^TX$ has small eigenvalues.

## Limitations

The decomposition changes with loss and target distribution. It neither chooses a penalty without validation nor establishes that a feature is stable after distribution shift.

## Nearby course topics

Continue with regularization and bias-variance, cross-validation, ridge/lasso/elastic net, and learning theory intuition.
