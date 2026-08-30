---
title: "Mutual information and representation relevance"
track: "maths-foundations"
status: live
summary: "Mutual information measures how much knowing one random variable reduces uncertainty about another: I(X;Y)=sum p(x,y) logp(x,y)/(p(x)p(y))."
duration: "4 min read"
---

## The short answer

Mutual information measures how much knowing one random variable reduces uncertainty about another: `I(X;Y)=sum p(x,y) log[p(x,y)/(p(x)p(y))]`, equivalently `H(Y)−H(Y|X)`. It is zero for independence and positive for dependence. High mutual information can flag useful representation content, but it is association—not causal value—and finite-sample estimates can overfit.

## Why this matters

Representation learning tries to preserve information useful for a task while discarding irrelevant variation. Mutual information gives a language for dependence, but a feature can be associated with a label because it is a proxy, a leakage path, or a consequence of the label.

**Small incident (illustrative):** a feature-ID had high mutual information with a training label because the ID encoded a data split. It looked relevant until the split changed; the information was leakage, not a robust signal.

## How it works

The joint distribution P(X,Y) is compared with the product of marginals P(X)P(Y). If they match, knowing X does not change the distribution of Y and the KL divergence is zero. If X determines Y, `H(Y|X)=0` and `I(X;Y)=H(Y)`.

### Assumptions and derivation

The identity `I(X;Y)=H(Y)−H(Y|X)` follows by expanding the log ratio and using `p(x,y)=p(x)p(y|x)`. Estimation needs a joint table, density model, or estimator; high-cardinality continuous variables can produce upward-biased plug-in estimates. Binning is a modelling choice, not a neutral truth.

## AI use

Use MI for exploratory feature screening, dependence diagnostics, representation comparisons, and leakage audits. Validate any selected feature on held-out time or entity splits, and ask whether it is available before the decision. For causal decisions, draw the data-generating story rather than treating MI as an intervention score.

## Worked examples and variations

### Example A — smallest happy path

**Input:** X and Y are the same fair binary variable. **Mechanism:** Y is known once X is observed; H(Y)=1 bit and H(Y|X)=0. **Output:** I(X;Y)=1 bit. **Inspect:** the joint table has mass only on matching pairs. **Next decision:** call the variables dependent, not causally related.

### Example B — meaningful variation

**Input:** X and Y are independent fair bits. **Mechanism:** p(x,y)=p(x)p(y), so every log ratio is zero. **Output:** I=0. **Inspect:** check the joint table, not only a correlation coefficient. **Next decision:** X provides no information about Y under this distribution.

### Example C — boundary case

**Input:** a feature is a unique user ID and the dataset has one row per user. **Mechanism:** finite-sample counts can make ID almost perfectly identify a label. **Output:** high empirical MI. **Inspect:** split by future users or entities; the feature may be unavailable or meaningless at inference. **Next decision:** remove the ID or prove a valid deployment role.

### Example D — tempting counterexample

**Input:** symptom X is associated with disease Y. **Mechanism:** a common cause or selection rule can induce dependence. **Output:** positive MI. **Inspect:** ask what would happen under an intervention on X and whether X is a proxy or consequence. **Next decision:** do not infer that changing X changes Y.

## Computation and interpretation

```python
import numpy as np

joint = np.array([[40, 10], [10, 40]], dtype=float)
joint /= joint.sum()
px, py = joint.sum(axis=1), joint.sum(axis=0)
mi = sum(joint[i, j] * np.log2(joint[i, j] / (px[i] * py[j]))
         for i in range(2) for j in range(2) if joint[i, j] > 0)
print(mi)
```

The result is in bits because the computation uses log₂. Inspect the table and sample size; a plug-in MI from a small table can be unstable.

## Two ways to see it

### Builder view

MI is a relevance diagnostic between two distributions. Pair the scalar with a held-out test, availability check, and leakage review before putting a feature into a model.

### Systems view

Information can be encoded by identity, policy, or feedback loops. Preserving information is not automatically desirable; privacy, fairness, and task validity constrain what a representation should retain.

## Hands-on

Compute MI for an associated 2×2 table, an independent table, and a shuffled-label version. **Failure fixture:** compute MI after fitting the shuffle on the same labels used to select a feature. **Test:** selection must happen inside the training split and the held-out MI must be reported separately. **Reset:** restore a fixed train/test split and rerun selection without using held-out labels.

## Checkpoint

- [ ] Derive the KL form of mutual information.
- [ ] Explain why independence gives MI=0.
- [ ] Name one high-cardinality or leakage failure.
- [ ] Distinguish association from causal value in one sentence.

## What this does not solve

MI does not prove causality, fairness, robustness, or generalisation. Estimation depends on sample size, binning, and support. A feature with high MI can be illegal, unavailable, unstable, or a proxy for an unwanted attribute.

## Continue, go deeper, apply it

- Continue: Likelihood, cross-entropy, and classification objectives
- Go deeper: Latent variables and ELBO intuition
- Apply it: PCA and dimensionality reduction
