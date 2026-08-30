---
title: "Gaussian mixtures, EM, and latent-variable inference"
track: "machine-learning"
order: 809
status: live
summary: "Derive EM for Gaussian mixtures through latent responsibilities and calculate complete E and M steps by hand."
duration: "70 min read"
updated: "2026-08-30"
---

## Notation and preconditions

A $K$-component Gaussian mixture has $p(x)=\sum_{k=1}^K\pi_k\mathcal N(x\mid\mu_k,\Sigma_k)$, with $\pi_k\ge0$ and $\sum_k\pi_k=1$. Introduce one-hot latent assignments $z_i$. Likelihood is nonconvex; covariance matrices must remain positive definite.

## Step-by-step derivation

The observed log likelihood $\sum_i\log\sum_k\pi_kN_{ik}$ has a log of sum. For any distribution $q(z)$, Jensen gives $\log p(x)\ge E_q[\log p(x,z)]-E_q[\log q(z)]$, the ELBO. E-step sets $q$ to the posterior responsibility $r_{ik}=\pi_kN_{ik}/\sum_j\pi_jN_{ij}$. M-step maximizes expected complete log likelihood: $N_k=\sum_ir_{ik}$, $\pi_k=N_k/n$, $\mu_k=\sum_ir_{ik}x_i/N_k$, and $\Sigma_k=\sum_ir_{ik}(x_i-\mu_k)(x_i-\mu_k)^T/N_k$.

## Fully worked numerical calculations

1. Let equal weights and unit-variance means $0,2$ observe $x=1$. Both densities equal $\phi(1)=.2420$, so $r_1=.5(.2420)/[.5(.2420)+.5(.2420)]=.5$.
2. For $x=0$ with means $0,2$, densities are $.3989$ and $.0540$. Thus $r_1=.3989/(.3989+.0540)=.8808$, $r_2=.1192$.
3. With two observations $x=(0,2)$ and responsibilities for component 1 $(.9,.2)$, $N_1=1.1$, $\pi_1=1.1/2=.55$, and $\mu_1=(.9(0)+.2(2))/1.1=.4/1.1=.3636$.

## A failed derivation or numerical pitfall

Do not hard-assign clusters in the E-step; that is a different algorithm. A Gaussian mixture likelihood is unbounded if a covariance collapses onto a single point. Use covariance regularization, minimum weights, and multiple initializations.

## From-scratch coding exercise

```python
import numpy as np
x=np.array([0.,2.]); mu=np.array([0.,2.]); pi=np.array([.5,.5]); var=1.
dens=np.exp(-.5*(x[:,None]-mu[None,:])**2/var)/np.sqrt(2*np.pi*var)
r=pi*dens; r/=r.sum(axis=1,keepdims=True)
Nk=r.sum(axis=0); print(r, Nk, (r*x[:,None]).sum(axis=0)/Nk)
```

Finish one-dimensional EM, plot log likelihood each iteration, then intentionally initialize one mean at an outlier and add a variance floor to prevent collapse.

## Answers and checkpoint

Responsibilities sum to one across components for each observation. Why does EM not promise a global optimum? The mixture likelihood is nonconvex. What is the E-step's distribution? The exact posterior over assignments under current parameters.

## Limitations

Elliptical Gaussian components may be a poor model, component count selection is difficult, and soft assignments are model-relative probabilities—not discovered ground truth groups.

## Nearby course topics

Continue with clustering and k-means, density estimation, Bayesian and generative learning, and anomaly detection.
