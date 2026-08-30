---
title: "Linear regression: normal equations and geometry"
track: "machine-learning"
order: 801
status: live
summary: "Derive least squares, read it as an orthogonal projection, and calculate it by hand before using a solver."
duration: "55 min read"
updated: "2026-08-30"
---

## Notation and preconditions

Let $X\in\mathbb R^{n\times p}$ include an intercept if one is wanted, $y\in\mathbb R^n$, and $\beta\in\mathbb R^p$. Ordinary least squares minimizes $J(\beta)=\|y-X\beta\|_2^2$. The inverse formula requires full column rank; the projection itself does not.

## Step-by-step derivation

Expand $J=y^Ty-2\beta^TX^Ty+\beta^TX^TX\beta$. Differentiating gives $\nabla J=-2X^Ty+2X^TX\beta$. A stationary point obeys $X^TX\hat\beta=X^Ty$. Since the Hessian is $2X^TX\succeq0$, every stationary point minimizes $J$. With independent columns, $\hat\beta=(X^TX)^{-1}X^Ty$; otherwise the minimum-norm answer is $X^+y$. The residual $r=y-X\hat\beta$ satisfies $X^Tr=0$: it is perpendicular to the column space of $X$.

## Fully worked numerical calculations

1. For $x=(0,1,2)$ and $y=(1,3,5)$, use $X=[[1,0],[1,1],[1,2]]$. Then $X^TX=[[3,3],[3,5]]$, $X^Ty=[9,13]^T$, and $(X^TX)^{-1}=\frac1{6}[[5,-3],[-3,3]]$. Thus $\hat\beta=\frac1{6}[45-39,-27+39]^T=[1,2]^T$.
2. Predict at $x=3$: $1+2(3)=7$. Residuals are $[1-1,3-3,5-5]=[0,0,0]$, hence $X^Tr=[0+0+0,0+0+0]^T=0$.
3. If $y=(1,2,4)$, then $X^Ty=[7,10]^T$ and $\hat\beta=\frac1{6}[35-30,-21+30]^T=[5/6,3/2]^T$. At $x=2$, prediction is $5/6+3=23/6$ and residual is $4-23/6=1/6$.

## A failed derivation or numerical pitfall

Cancelling $X$ from $X^TX\beta=X^Ty$ is illegal: $X$ is rectangular. Likewise, explicitly forming $(X^TX)^{-1}$ squares the condition number. Duplicate a column: $X^TX$ becomes singular even though fitted values remain identifiable.

## From-scratch coding exercise

```python
import numpy as np
X = np.c_[np.ones(3), [0., 1., 2.]]; y = np.array([1., 2., 4.])
beta = np.linalg.solve(X.T @ X, X.T @ y)  # replace with QR: np.linalg.lstsq(X,y,rcond=None)[0]
r = y - X @ beta
print(beta, X.T @ r)
```

Implement a QR-based solver, then add a duplicate feature and compare the normal-equation failure with `lstsq`'s minimum-norm result.

## Answers and checkpoint

The normal equations say each residual-feature dot product is zero. Why is the Hessian positive semidefinite? Because $v^TX^TXv=\|Xv\|^2\ge0$. Full rank makes it positive definite and the coefficients unique.

## Limitations

Least squares is sensitive to outliers, says nothing causal, and assumes a linear conditional mean in the supplied representation. It does not justify normal-error intervals by itself.

## Nearby course topics

Continue with gradient descent for linear models, ridge and lasso, linear-model diagnostics, and PCA/SVD.
