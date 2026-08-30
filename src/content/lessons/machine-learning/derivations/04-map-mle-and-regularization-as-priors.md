---
title: "MAP, MLE, and regularization as priors"
track: "machine-learning"
order: 804
status: live
summary: "Derive maximum likelihood and maximum a posteriori estimation, including the exact prior-to-penalty correspondence."
duration: "55 min read"
updated: "2026-08-30"
---

## Notation and preconditions

Let $D$ be observed data, $\theta$ parameters, likelihood $p(D\mid\theta)$, and prior $p(\theta)$. MLE maximizes likelihood; MAP maximizes posterior $p(\theta\mid D)\propto p(D\mid\theta)p(\theta)$.

## Step-by-step derivation

Taking negative logs, MAP minimizes $-\log p(D\mid\theta)-\log p(\theta)$; the evidence $p(D)$ is constant in $\theta$. For Gaussian noise $y\mid X,\beta\sim N(X\beta,\sigma^2I)$, negative log likelihood is $\|y-X\beta\|^2/(2\sigma^2)+C$. An independent Gaussian prior $\beta_j\sim N(0,\tau^2)$ adds $\|\beta\|^2/(2\tau^2)$, yielding ridge with $\lambda=\sigma^2/\tau^2$. A Laplace prior $p(\beta_j)\propto e^{-|\beta_j|/b}$ yields an $\ell_1$ penalty $\lambda=\sigma^2/b$ after common scaling.

## Fully worked numerical calculations

1. Coin data: 7 heads in 10 flips. $\ell(p)=7\log p+3\log(1-p)$; setting $7/p-3/(1-p)=0$ gives $7(1-p)=3p$, hence $\hat p_{MLE}=.7$.
2. With $\operatorname{Beta}(2,2)$ prior, posterior is $\operatorname{Beta}(9,5)$. Its interior MAP is $(9-1)/(9+5-2)=8/12=.6667$: shrinkage toward $.5$.
3. If $\sigma^2=4$ and $\tau^2=1$, ridge $\lambda=4/1=4$. A coefficient $\beta=3$ contributes $\beta^2/(2\tau^2)=9/2=4.5$ to the negative log prior.

## A failed derivation or numerical pitfall

Ridge is not “the same as Bayes” without a stated likelihood, prior, and scale convention. Changing loss from sum to mean rescales $\lambda$. An improper flat prior recovers MLE formally but may produce an improper posterior.

## From-scratch coding exercise

```python
import numpy as np
X=np.c_[np.ones(3),[0.,1.,2.]]; y=np.array([1.,3.,8.]); lam=4.
P=np.diag([0.,1.])  # do not shrink intercept here
beta=np.linalg.solve(X.T@X+lam*P, X.T@y)
print(beta)
```

Vary $\lambda$, plot coefficient paths, and explain the implied prior standard deviation $\tau=\sigma/\sqrt\lambda$.

## Answers and checkpoint

MAP equals MLE when the prior is constant over the relevant region. Why does a Gaussian prior produce squared penalty? Its log density is a negative quadratic. Which estimate should be reported as uncertainty? Neither point estimate alone; use the posterior or an appropriate sampling procedure.

## Limitations

Priors encode choices and can dominate small datasets. MAP discards posterior spread, and lasso's Laplace interpretation does not make selected variables objectively true.

## Nearby course topics

Continue with ridge, lasso and elastic net, Bayesian and generative learning, logistic regression, and uncertainty intervals.
