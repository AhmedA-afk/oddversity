---
title: "Conditional expectation and conditional variance"
track: "maths-foundations"
status: live
summary: "Conditional expectation is the average of X after information about Y is known: EX|Y=y=Σx·P(X=x|Y=y). It is itself a function of Y."
duration: "5 min read"
---

## The short answer

Conditional expectation is the average of `X` after information about `Y` is known: `E[X|Y=y]=Σx·P(X=x|Y=y)`. It is itself a function of `Y`. Conditioning separates within-group uncertainty from between-group differences: `Var(X)=E[Var(X|Y)]+Var(E[X|Y])`. Use it to explain subgroup predictions, not to erase their uncertainty.

## Why this matters

An overall mean can be a poor prediction when a known context changes the
outcome. In a service system, expected latency given route is actionable; in a
classifier, expected loss given slice exposes where errors come from. The law of
total variance prevents a common mistake: treating the average within-group
variance as the whole population variance.

## How it works

For discrete `Y`,

`E[X|Y=y]=Σ_x x p(x|y)`.

The random quantity `E[X|Y]` takes the value `E[X|Y=y]` whenever `Y=y`. Applying
the law of total probability to the joint table gives

`E[X]=Σ_y E[X|Y=y]P(Y=y)`.

For variance, write `X−E[X] = [X−E(X|Y)] + [E(X|Y)−E(X)]`. Squaring and taking
expectation makes the cross term zero because
`E[X−E(X|Y)|Y]=0`, leaving

`Var(X)=E[Var(X|Y)]+Var(E[X|Y])`.

The first term is within-group noise; the second is variation in group means.

**Assumption check:** the conditional quantities must be defined on the same
joint distribution and weighted by the target population’s `P(Y=y)`. A group
with no target mass contributes no term, while a group hidden by selection needs
an explicit extrapolation assumption.

### Numerical and visual perspective

Plot a box or violin per `Y` group, mark each conditional mean, and connect the
group means to the overall mean with weights. A table can calculate both terms;
the two variance contributions should sum to the total within numerical
tolerance.

### An illustrative story

A global latency average stayed flat while one route became both slower and
more common. Conditional means and weights revealed the shift before the global
average did. This is an illustrative monitoring story; verify with grouped
traces.

## Worked examples and variations

### Example A: expected loss by subgroup

**Input:** group A is 75% of cases with mean loss 2; group B is 25% with mean
loss 8. **Mechanism:** `E[L]=0.75(2)+0.25(8)`. **Output:** overall mean loss
3.5. **Inspect:** the group-specific means are conditional expectations.
**Decision:** prioritise B if reducing its loss improves the target population
more than an equal effort in A.

### Example B: total variance of group means

**Input:** `Y` is A/B with probabilities .75/.25 and conditional means 2/8;
within-group variances are 1/4. **Mechanism:**
`E[Var(L|Y)]=.75(1)+.25(4)=1.75`; the variance of group means around 3.5 is
`.75(2−3.5)²+.25(8−3.5)²=6.75`. **Output:** total variance `8.5`.
**Inspect:** between-group variation dominates within-group noise. **Decision:**
do not call the total spread “random noise” without the decomposition.

### Boundary case: one group has zero probability

**Input:** `P(Y=B)=0`. **Mechanism:** B contributes no term to total expectation
or variance, and its conditional distribution is not identified by the mixture.
**Output:** only positive-probability groups affect the current population.
**Inspect:** a future group may still matter operationally. **Decision:** mark
the conditional as unobserved rather than assigning a convenient mean.

### Example C: information reduces expected squared error

**Input:** predict `X` with a constant versus `E[X|Y]`. **Mechanism:** within
each `Y` group, the conditional mean is the squared-error minimiser because
`E[(X-a)²|Y]=Var(X|Y)+(a-E[X|Y])²`. **Output:** conditioning cannot increase
the optimal expected squared-error risk when the information is available.
**Inspect:** the claim is about the same target and loss. **Decision:** use
context only if it is available at prediction time.

### Counterexample: conditioning on the wrong denominator

**Input:** “mean loss among group B” is calculated by dividing B’s loss sum by
all rows. **Mechanism:** this is a weighted contribution, not `E[L|B]`.
**Output:** the reported subgroup mean is too small by factor `P(B)`.
**Inspect:** conditional means must normalise within the group; the overall mean
uses group weights. **Decision:** label the two quantities separately.

## Two ways to see it

### Builder view

Keep a grouped table with count, weight, conditional mean, and conditional
variance. Recompute total expectation and variance from those columns as a
consistency check.

### Systems or reviewer view

Ask whether information `Y` is available before the decision and whether it was
created by the outcome. Conditioning can improve prediction while creating
selection or fairness concerns; availability and causal role matter.

## Hands-on

Create a two-group fixture with probabilities .75/.25, means 2/8, and variances
1/4. Compute total expectation and both total-variance terms. Plot the group
distributions or a labelled summary.

**Deliberate failure:** divide each group’s loss sum by the global count when
computing its conditional mean. **Test:** expect conditional means 2 and 8 and
total mean 3.5; the failed version reports weighted contributions instead.
**Reset:** restore within-group denominators and rerun the variance identity.
**No-code route:** make one column of tokens per group and calculate each mean
before weighting the columns.

## Checkpoint

- [ ] Calculate `E[X|Y=y]` from a conditional table.
- [ ] Derive the law of total expectation as a weighted sum of conditional means.
- [ ] Explain the two terms in the law of total variance.
- [ ] Distinguish a conditional mean from a group’s weighted contribution.

## What this does not solve

Conditional summaries do not prove the conditioning variable is safe, available,
causal, or stable after deployment. A mean remains vulnerable to tails, and a
variance decomposition does not replace a full distribution or subgroup review.
The next module chooses concrete distribution families and sampling procedures.

## Continue, go deeper, apply it

- Continue: Bernoulli, Binomial, Hypergeometric, and Negative Binomial models
- Go deeper: Probability and statistics for ML
- Apply it: Base rates, Bayes, and simulation
