---
title: "HMMs: forward-backward and Viterbi"
track: "machine-learning"
order: 812
status: live
summary: "Derive dynamic programming for hidden Markov models and compute filtering, smoothing, and the most likely state path."
duration: "70 min read"
updated: "2026-08-30"
---

## Notation and preconditions

Hidden states $z_t\in\{1,\ldots,K\}$ have initial probabilities $\pi$, transitions $a_{ij}=P(z_t=j\mid z_{t-1}=i)$, and emissions $b_j(o_t)=P(o_t\mid z_t=j)$. The Markov and conditional-independence assumptions are essential.

## Step-by-step derivation

The joint factorizes $P(z_{1:T},o_{1:T})=\pi_{z_1}b_{z_1}(o_1)\prod_{t=2}^Ta_{z_{t-1}z_t}b_{z_t}(o_t)$. Forward messages $\alpha_t(j)=P(o_{1:t},z_t=j)$ obey $\alpha_1(j)=\pi_jb_j(o_1)$ and $\alpha_t(j)=b_j(o_t)\sum_i\alpha_{t-1}(i)a_{ij}$. Backward messages similarly give smoothed posterior proportional to $\alpha_t(j)\beta_t(j)$. Viterbi replaces sums with maxima and stores backpointers: $\delta_t(j)=b_j(o_t)\max_i\delta_{t-1}(i)a_{ij}$.

## Fully worked numerical calculations

1. Two states Rain/Sun: $\pi=(.6,.4)$; emissions for umbrella are $(.9,.2)$. First forward message is $\alpha_1=(.6*.9,.4*.2)=(.54,.08)$; observation likelihood so far is $.62$.
2. Transitions $A=[[.7,.3],[.4,.6]]$ and second observation no-umbrella with emissions $(.1,.8)$. For Rain: $.1[(.54)(.7)+(.08)(.4)]=.1(.378+.032)=.041$. For Sun: $.8[(.54)(.3)+(.08)(.6)]=.8(.162+.048)=.168$.
3. Viterbi at time two: Rain score $.1\max(.54*.7,.08*.4)=.0378$ from Rain; Sun score $.8\max(.54*.3,.08*.6)=.1296$ from Rain. Best path ends Sun and backpointer says Rain, yielding Rain→Sun.

## A failed derivation or numerical pitfall

Filtering $P(z_t\mid o_{1:t})$ is not smoothing $P(z_t\mid o_{1:T})$; future observations change past-state beliefs. Direct probability products underflow for long sequences: normalize each forward step or operate in log space with log-sum-exp. Viterbi is a single path, not per-time marginal argmax.

## From-scratch coding exercise

```python
import numpy as np
pi=np.array([.6,.4]); A=np.array([[.7,.3],[.4,.6]])
B=np.array([[.9,.1],[.2,.8]])  # columns: umbrella, no umbrella
alpha=pi*B[:,0]; alpha/=alpha.sum(); alpha=(alpha@A)*B[:,1]; alpha/=alpha.sum()
print(alpha)
```

Implement scaled forward likelihood, backward messages, and Viterbi backpointers. Verify on a short sequence by brute-force enumeration of all $2^T$ state paths before scaling up.

## Answers and checkpoint

The forward algorithm costs $O(TK^2)$ rather than enumerating $K^T$ paths. Why normalize? It preserves relative probabilities while avoiding underflow. Why do Viterbi and marginal decoding differ? Maximizing a joint path is not the same operation as maximizing each marginal separately.

## Limitations

HMMs impose memory-one states and conditionally independent emissions; real sequences may need richer features, nonstationary transitions, or discriminative sequence models. Hidden states are not automatically causal explanations.

## Nearby course topics

Continue with HMMs and temporal modeling, time-series validation, Gaussian mixtures/EM, and forecasting under delayed labels.
