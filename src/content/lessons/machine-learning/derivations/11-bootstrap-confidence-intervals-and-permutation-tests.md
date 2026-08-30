---
title: "Bootstrap confidence intervals and permutation tests"
track: "machine-learning"
order: 811
status: live
summary: "Calculate resampling uncertainty and randomization-test p-values while stating the exchangeability assumptions they need."
duration: "60 min read"
updated: "2026-08-30"
---

## Notation and preconditions

Observed sample is $z_1,\ldots,z_n$ and statistic $T(z)$. Bootstrap resamples $n$ observations with replacement; permutation tests shuffle labels according to a null hypothesis of exchangeability. Groups, time, and repeated users must be resampled at their dependency unit.

## Step-by-step derivation

The nonparametric bootstrap replaces unknown population distribution $F$ with empirical $\hat F_n$, then estimates the sampling distribution of $T$ from $T^*_1,\ldots,T^*_B$. A percentile interval takes empirical quantiles. For a permutation null that labels are exchangeable, calculate observed difference $d_{obs}$, enumerate or sample shuffled-label differences, and use $p=(1+\#\{|d_b|\ge|d_{obs}|\})/(B+1)$ to avoid zero estimates.

## Fully worked numerical calculations

1. Data $(2,4,6)$ have mean $4$. Bootstrap resample $(2,2,6)$ has mean $(2+2+6)/3=10/3=3.3333$; $(4,6,6)$ has mean $16/3=5.3333$.
2. If eight bootstrap means sorted are $(3,3.3,3.7,4,4.2,4.4,4.8,5.3)$, a rough central 50% interval uses the 25th and 75th percentiles: $(3.7,4.4)$ (with a real analysis use many more than eight draws).
3. Treatment accuracies $(.9,.8)$ and control $(.6,.7)$ give $d_{obs}=.85-.65=.20$. Among 99 shuffled differences, 4 have $|d|\ge.20$; two-sided $p=(1+4)/(99+1)=.05$.

## A failed derivation or numerical pitfall

Resampling individual rows from a user-level experiment treats correlated observations as independent and makes intervals too narrow. A permutation p-value is not the probability that the null is true. Never select a model after looking at many tests and report an unadjusted one.

## From-scratch coding exercise

```python
import numpy as np
rng=np.random.default_rng(4); z=np.array([2.,4.,6.]); means=[]
for _ in range(5000): means.append(rng.choice(z,len(z),replace=True).mean())
print(np.quantile(means,[.025,.975]))
```

Write a label-permutation test for difference in mean loss, retain the random seed, then repeat by resampling users rather than rows on a grouped toy dataset.

## Answers and checkpoint

What distribution does the bootstrap use? The empirical distribution. When is label permutation defensible? Under the specific null exchangeability implied by the study design. Why add one in the p-value formula? It makes a finite randomization estimate valid and nonzero.

## Limitations

Small samples, heavy tails, dependent data, tuning-induced selection, and out-of-distribution deployment can invalidate naive resampling conclusions. Confidence intervals do not prove practical importance.

## Nearby course topics

Continue with resampling/bootstrap confidence intervals, statistical testing for ML, multiple comparisons, and experimental design.
