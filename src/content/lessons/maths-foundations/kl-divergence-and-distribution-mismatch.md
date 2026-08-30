---
title: "KL divergence and distribution mismatch"
track: "maths-foundations"
status: live
summary: "KL divergence measures the extra expected log loss incurred when distribution Q is used to represent data from P: DKL(P||Q)=sum P(x) log(P(x)/Q(x))."
duration: "4 min read"
---

## The short answer

KL divergence measures the extra expected log loss incurred when distribution Q is used to represent data from P: `D_KL(P||Q)=sum P(x) log(P(x)/Q(x))`. It is nonnegative and zero only when P=Q almost everywhere, but it is asymmetric and can be infinite when Q assigns zero where P has mass. Treat it as directed mismatch, not a symmetric distance.

## Why this matters

KL appears in model comparison, variational inference, distillation, regularisation, and shift monitoring. The direction matters: “using Q for P” is a different question from “using P for Q.”

**Small incident (illustrative):** a monitoring job reported a small shift score after reversing the reference and live distributions. The number was valid for the reverse question but not for the alert policy that cared about live mass missing from the reference model.

## How it works

Using cross-entropy and entropy, `D_KL(P||Q)=H(P,Q)−H(P)`. For a finite support, compute a weighted sum of log ratios. Gibbs’ inequality gives nonnegativity; equality holds when the distributions match. KL is not a metric because it is asymmetric and does not satisfy the triangle inequality.

### Assumptions and derivation

The divergence is finite only when every outcome with P(x)>0 also has Q(x)>0. If Q(x)=0 and P(x)>0, the log ratio is infinite. If both are zero, the term contributes zero by convention. Estimating KL from sparse histograms requires smoothing or a model-based density estimate, and the estimator’s bias and variance matter.

## AI use

Use directed KL for comparing a live distribution with a reference, teacher and student probabilities, or a variational approximation with a target. Name the direction, support, binning/tokenisation, and smoothing. A shift score is a trigger for investigation, not evidence that the model is failing on the task.

## Worked examples and variations

### Example A — smallest happy path

**Input:** P=[.5,.5], Q=[.75,.25]. **Mechanism:** `D_KL(P||Q)=.5 log(.5/.75)+.5 log(.5/.25)≈.144` nats. **Output:** Q loses information relative to P in this direction. **Inspect:** each term shows which outcome is under- or over-represented. **Next decision:** inspect the rare-class allocation before changing the model.

### Example B — meaningful variation

**Input:** reverse the same pair. **Mechanism:** `D_KL(Q||P)=.75 log(.75/.5)+.25 log(.25/.5)≈.131` nats. **Output:** the value differs. **Inspect:** a reverse divergence answers a different coding question. **Next decision:** choose the direction from the monitoring or modelling use case.

### Example C — boundary case

**Input:** P=[.2,.8], Q=[1,0]. **Mechanism:** P assigns mass where Q assigns zero. **Output:** D_KL(P||Q)=infinity. **Inspect:** this is support mismatch, not merely a large finite drift. **Next decision:** add support/smoothing or treat the model as unable to represent the event.

### Example D — tempting counterexample

**Input:** use KL as though it were a distance and average `D_KL(P||Q)` with `D_KL(Q||P)`. **Mechanism:** symmetrising creates a new statistic with new interpretation. **Output:** the average may be useful, but it is not ordinary KL. **Inspect:** retain the two directed values. **Next decision:** document any symmetrisation instead of renaming it.

## Computation and interpretation

```python
import numpy as np

def kl(p, q):
    p, q = np.asarray(p, float), np.asarray(q, float)
    if np.any(p < 0) or np.any(q < 0) or not np.isclose(p.sum(), 1) or not np.isclose(q.sum(), 1):
        raise ValueError("valid probability vectors required")
    if np.any((p > 0) & (q == 0)):
        return np.inf
    mask = p > 0
    return np.sum(p[mask] * np.log(p[mask] / q[mask]))

print(kl([.5, .5], [.75, .25]))
```

A finite scalar does not say whether the mismatch matters operationally. Plot per-bin contributions and join them with outcome metrics.

## Two ways to see it

### Builder view

KL is a decomposition of excess log loss. Keep reference and candidate distributions, direction, support, and smoothing visible in the artifact.

### Systems view

Distribution mismatch can come from a product change, a logging bug, a new user group, or an adversarial input. The divergence cannot identify the cause by itself.

## Hands-on

Implement directed KL on the three fixtures above and plot per-outcome contributions. **Failure fixture:** pass a candidate with zero mass on an observed reference class and replace infinity with zero. **Test:** the code must fail or return `inf`, never zero; it must also reject vectors that do not sum to one. **Reset:** restore positive support and recompute both directions.

## Checkpoint

- [ ] Calculate KL for P=[.5,.5], Q=[.75,.25] to three decimals.
- [ ] Explain the direction in `D_KL(P||Q)`.
- [ ] State the support condition for finite KL.
- [ ] Give one reason a drift score needs task metrics beside it.

## What this does not solve

KL does not identify causal shift, guarantee model harm, or function as a symmetric distance. Histogram and density estimates can be unstable. Smoothing changes the distributions and the value being measured.

## Continue, go deeper, apply it

- Continue: Mutual information and representation relevance
- Go deeper: Latent variables and ELBO intuition
- Apply it: Grounding, citations, and context budgets
