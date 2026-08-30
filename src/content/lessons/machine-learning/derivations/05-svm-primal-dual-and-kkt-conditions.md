---
title: "SVM: primal, dual, and KKT conditions"
track: "machine-learning"
order: 805
status: live
summary: "Derive the maximum-margin support vector machine, its kernel dual, and the KKT conditions that identify support vectors."
duration: "65 min read"
updated: "2026-08-30"
---

## Notation and preconditions

Labels are $y_i\in\{-1,+1\}$ and scores are $f(x)=w^Tx+b$. Hard-margin SVM requires separability. Soft-margin SVM introduces $\xi_i\ge0$ and penalty $C>0$; kernels require a positive-semidefinite Gram matrix.

## Step-by-step derivation

The hard-margin primal is $\min_{w,b}\frac12\|w\|^2$ subject to $y_i(w^Tx_i+b)\ge1$. Its Lagrangian is $\frac12\|w\|^2-\sum_i\alpha_i[y_i(w^Tx_i+b)-1]$. Stationarity yields $w=\sum_i\alpha_i y_ix_i$ and $\sum_i\alpha_i y_i=0$. Substitution gives the dual: maximize $\sum_i\alpha_i-\frac12\sum_{ij}\alpha_i\alpha_jy_iy_jx_i^Tx_j$ with $\alpha_i\ge0$. Complementary slackness says $\alpha_i[y_if(x_i)-1]=0$: non-support points have $\alpha_i=0$. Replace $x_i^Tx_j$ with $K(x_i,x_j)$ for the kernel dual.

## Fully worked numerical calculations

1. In one dimension, points $x=-1,y=-1$ and $x=1,y=1$ admit $w=1,b=0$: both margins are $y(wx+b)=1$. Geometric margin is $1/\|w\|=1$.
2. Dual constraints require $-\alpha_1+\alpha_2=0$, so both equal $a$. The objective is $2a-\tfrac12[ a^2(1)+a^2(1)+2a^2(-1)(-1)(-1)] =2a-2a^2$. Derivative $2-4a=0$ gives $a=.5$ and $w=.5(-1)(-1)+.5(1)(1)=1$.
3. With RBF kernel $K(x,z)=e^{-\gamma(x-z)^2}$, $\gamma=.5$, $x=-1,z=1$: $e^{-.5(4)}=e^{-2}=.1353$. This small similarity permits a nonlinear score without ever writing features.

## A failed derivation or numerical pitfall

The margin is not $1/\|w\|$ until the functional margin is normalized to one. Do not kernelize by blindly substituting an arbitrary similarity: the Gram matrix must be PSD. In soft margins, $C$ changes the feasible trade-off, not just post-hoc thresholding.

## From-scratch coding exercise

```python
import numpy as np
X=np.array([[-1.],[1.]]); y=np.array([-1.,1.])
K=X@X.T; Q=(y[:,None]*y[None,:])*K
alphas=np.array([.5,.5])  # verify dual stationarity by hand
print(alphas @ y, alphas.sum()-.5*alphas@Q@alphas)
```

Grid-search two dual variables under $\alpha\ge0$ and $\alpha^Ty=0$, recover $w$, and check complementary slackness. Then add a mislabeled point and implement a projected update with box constraints $0\le\alpha_i\le C$.

## Answers and checkpoint

Why do only support vectors affect the score? The dual expansion contains only nonzero $\alpha_i$. What does $0<\alpha_i<C$ imply in a soft-margin optimum? Its point lies exactly on the margin under regular conditions.

## Limitations

SVM scores are not probabilities without calibration, kernel matrices scale poorly with sample size, and margins do not repair label bias or distribution shift.

## Nearby course topics

Continue with kernels and nearest neighbors, logistic regression, calibration, and regularization as priors.
