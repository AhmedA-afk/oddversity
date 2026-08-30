---
title: "PCA, SVD, and best low-rank approximation"
track: "machine-learning"
order: 808
status: live
summary: "Derive principal components from variance maximization and the SVD, including the Eckart–Young reconstruction result."
duration: "65 min read"
updated: "2026-08-30"
---

## Notation and preconditions

Let centered data $X\in\mathbb R^{n\times p}$ have covariance $S=X^TX/n$. PCA is sensitive to centering and units. The SVD is $X=U\Sigma V^T$, with singular values $\sigma_1\ge\cdots\ge0$.

## Step-by-step derivation

The first unit direction maximizes projected variance $\max_{\|v\|=1}v^TSv$. Lagrangian $v^TSv-\lambda(v^Tv-1)$ yields $Sv=\lambda v$, so choose the largest-eigenvalue eigenvector. Subsequent components add orthogonality constraints. Since $X^TX=V\Sigma^2V^T$, right singular vectors are principal axes and variance along $v_j$ is $\sigma_j^2/n$. Truncating $X_k=U_k\Sigma_kV_k^T$ minimizes $\|X-A\|_F$ over matrices rank at most $k$.

## Fully worked numerical calculations

1. Centered points $(1,1),(-1,-1)$ give $X^TX=[[2,2],[2,2]]$. Eigenvalues are $4,0$ with unit first axis $v_1=(1,1)/\sqrt2$. Its sample-second-moment variance is $4/2=2$.
2. Project $(1,1)$: score $t=(1,1)\cdot(1,1)/\sqrt2=\sqrt2$. Reconstruct $tv=(\sqrt2)(1,1)/\sqrt2=(1,1)$, error $0$.
3. For singular values $(5,2,1)$, total squared reconstruction energy is $25+4+1=30$. Rank-one retained fraction is $25/30=.8333$; rank-two Frobenius residual squared is $1^2=1$.

## A failed derivation or numerical pitfall

PCA does not maximize class separation; it maximizes variance. Forgetting to center makes the first component point toward the mean. Standardization changes the question from covariance to correlation PCA and can radically change components.

## From-scratch coding exercise

```python
import numpy as np
X=np.array([[1.,1.],[-1.,-1.],[2.,2.],[-2.,-2.]])
S=X.T@X/len(X); vals, vecs=np.linalg.eigh(S); v=vecs[:,-1]
scores=X@v; X1=np.outer(scores,v)
print(vals, v, np.sum((X-X1)**2))
```

Implement power iteration for the top eigenvector, compare it with `eigh`, then add one high-variance nuisance unit and compare centered versus standardized results.

## Answers and checkpoint

Why are singular values squared in covariance eigenvalues? $X^TX=V\Sigma^2V^T$. What reconstruction error does rank $k$ SVD leave? $\sum_{j>k}\sigma_j^2$ in squared Frobenius norm.

## Limitations

PCA is linear, outlier-sensitive, and unsupervised. Explained variance is not predictive usefulness, and low-dimensional plots can manufacture apparent clusters.

## Nearby course topics

Continue with PCA and dimensionality reduction, UMAP/t-SNE visualization traps, clustering, and numerical linear algebra.
