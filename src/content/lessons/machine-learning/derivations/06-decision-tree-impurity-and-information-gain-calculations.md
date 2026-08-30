---
title: "Decision trees: impurity and information-gain calculations"
track: "machine-learning"
order: 806
status: live
summary: "Calculate entropy, Gini, regression variance, and split gain from first principles, including why greedy choices can mislead."
duration: "55 min read"
updated: "2026-08-30"
---

## Notation and preconditions

At node $t$, class proportions are $p_k$. Entropy is $H(t)=-\sum_kp_k\log_2p_k$; Gini is $G(t)=1-\sum_kp_k^2$. For regression, squared-error impurity is usually the within-node sum of squares. Candidate splits must be evaluated only on training data within the current node.

## Step-by-step derivation

For a split into children $L,R$, weighted impurity is $I_{after}=\frac{n_L}{n}I(L)+\frac{n_R}{n}I(R)$. Gain is $I(t)-I_{after}$. Entropy arises as expected code length under an optimal code; Gini is the probability of mismatch between two independent class draws from the node. In squared-error regression, the node minimizer is its mean because differentiating $\sum_i(y_i-c)^2$ yields $-2\sum_i(y_i-c)=0$.

## Fully worked numerical calculations

1. A node with 3 positive and 1 negative examples has $H=-.75\log_2.75-.25\log_2.25=.8113$ and $G=1-(.75^2+.25^2)=.375$.
2. A split makes $L=(2+,0-)$ and $R=(1+,1-)$. Entropy after is $(2/4)(0)+(2/4)(1)=.5$; information gain is $.8113-.5=.3113$ bits.
3. Regression targets $(1,3,8)$ have mean $4$, SSE $(1-4)^2+(3-4)^2+(8-4)^2=9+1+16=26$. Split $(1,3)\mid(8)$: left mean $2$, SSE $1+1=2$; right SSE $0$; reduction is $26-2=24$.

## A failed derivation or numerical pitfall

Do not compare unweighted child impurity: a tiny pure child can look miraculous while barely changing the parent. Greedy gain is not globally optimal; a feature useless at the root can become decisive after another split. High-cardinality identifiers can create spurious gain.

## From-scratch coding exercise

```python
import math
def entropy(labels):
    n=len(labels); return -sum((labels.count(c)/n)*math.log2(labels.count(c)/n)
                              for c in set(labels))
parent=[1,1,1,0]; left=[1,1]; right=[1,0]
print(entropy(parent)-(len(left)*entropy(left)+len(right)*entropy(right))/len(parent))
```

Enumerate all thresholds of one numeric feature, choose the maximum weighted gain, then enforce a minimum leaf size and compare the chosen split.

## Answers and checkpoint

Pure nodes have entropy and Gini zero. A balanced binary node has entropy one bit and Gini $.5$. Why does a leaf predict its mean for squared loss? That mean makes the derivative of its SSE zero.

## Limitations

Impurity reduction is a training criterion, not evidence of causal relevance or out-of-sample value. Trees are high variance and their local split explanations can hide interactions elsewhere.

## Nearby course topics

Continue with decision-tree splitting criteria, random forests, gradient boosting, and feature leakage.
