---
title: "Expectation and linearity"
track: "maths-foundations"
status: live
summary: "Expectation is a probability-weighted average: EX=Σx·P(X=x) for a discrete variable and EX=∫x f(x)dx for a continuous one."
duration: "4 min read"
---

## The short answer

Expectation is a probability-weighted average: `E[X]=Σx·P(X=x)` for a discrete variable and `E[X]=∫x f(x)dx` for a continuous one. It is the long-run average under a model, not a promise about one trial. Linearity, `E[aX+bY]=aE[X]+bE[Y]`, holds even when `X` and `Y` are dependent.

## Why this matters

Expected loss, reward, latency, and compute turn uncertain outcomes into a
quantity a system can optimise or budget. The average can hide tails, but it is
often the first accounting identity that makes a model legible. A common error
is to use linearity for products: generally `E[XY]` is not `E[X]E[Y]` without an
independence or zero-covariance condition.

## How it works

For a discrete variable, multiply each value by its mass and add. For a
continuous variable, replace the sum by an integral. If `Z=aX+bY`, then

`E[Z]=Σ (ax+by)P(x,y)=aΣxP(x,y)+bΣyP(x,y)=aE[X]+bE[Y]`.

The joint distribution cancels to the marginals in each sum, so no independence
step was used. For a random variable with an infinite support, the expectation
must be well-defined; positive and negative parts cannot both be infinite.

### Numerical and visual perspective

Plot values on the horizontal axis and probability mass on the vertical axis;
the expectation is the balance point of the weighted bars. For a sample,
`mean(x)` estimates the expectation, while repeated samples show its sampling
variation. Always report units: expected latency is measured in time, expected
loss in loss units.

### An illustrative story

A service budget used the average request cost but ignored a small class of
expensive retries. The expected value was useful for accounting, yet insufficient
for capacity planning. This is an illustrative story, not a measured incident.

## Worked examples and variations

### Example A: fair die

**Input:** `X∈{1,…,6}` uniformly. **Mechanism:**
`E[X]=(1+2+3+4+5+6)/6`. **Output:** `3.5`, which need not be an attainable
roll. **Inspect:** expectation is a centre of mass, not a likely exact outcome.
**Decision:** use it to budget repeated rolls, not to predict the next roll.

### Example B: expected model cost

**Input:** 80% of requests cost 1 unit and 20% cost 6 units. **Mechanism:**
`E[C]=0.8(1)+0.2(6)`. **Output:** `2` units per request. **Inspect:** multiplying
the average cost by request volume gives expected total cost under a stable mix.
**Decision:** add a tail or capacity constraint if overload matters.

### Example C: linearity under dependence

**Input:** `Y=2X` and `E[X]=3`. **Mechanism:**
`E[X+Y]=E[3X]=3E[X]=9`, even though `X,Y` are maximally dependent.
**Output:** linearity still holds. **Inspect:** no product factorisation was used.
**Decision:** use linearity for sums of correlated losses or rewards.

### Boundary case: an expectation outside support

**Input:** a fair die. **Mechanism:** `E[X]=3.5`. **Output:** 3.5 is outside
the discrete support `{1,…,6}` but inside its convex range. **Inspect:** an
average can be unattainable. **Decision:** explain the quantity before treating
it as an output class.

### Counterexample: product of expectations

**Input:** `X` is a fair bit and `Y=X`. **Mechanism:** `E[X]=E[Y]=1/2`, but
`E[XY]=E[X²]=1/2`, whereas `E[X]E[Y]=1/4`. **Output:** the shortcut fails
under dependence. **Inspect:** compare the joint product with the product of
means. **Decision:** state independence before factorising an expectation.

## Two ways to see it

### Builder view

Treat expectation as a weighted aggregation with an explicit population and
unit. Calculate it from a table first, then use a library mean as a check.

### Systems or decision view

Expected value supports planning but does not encode risk aversion. Two systems
can have the same mean loss and very different worst-case or percentile loss;
the action policy must decide which summary matters.

## Hands-on

Create a PMF table for the 80/20 request cost and compute the weighted sum.
Extend it to paired variables `X` and `Y=X`, then compare `E[XY]` with
`E[X]E[Y]`. Plot the mass bars and mark each expectation.

**Deliberate failure:** replace `E[XY]` with the product of the two means.
**Test:** the dependent-bit fixture must expect `0.5` versus `0.25`. **Reset:**
restore the joint calculation and rerun the linearity check. **No-code route:**
use labelled tokens and multiply each value by its frequency.

## Checkpoint

- [ ] Compute a discrete expectation and explain its units.
- [ ] Derive linearity for a sum without assuming independence.
- [ ] Give a reason an expected value may not be an attainable outcome.
- [ ] State the missing assumption in `E[XY]=E[X]E[Y]`.

## What this does not solve

Expectation does not describe spread, tail risk, calibration, or causality. It
can be undefined for heavy-tailed variables and can hide important subgroups.
Variance adds a spread summary; conditional expectation adds information-aware
averages.

## Continue, go deeper, apply it

- Continue: Variance, standard deviation, and bias–variance language
- Go deeper: Probability and statistics for ML
- Apply it: Mathematics Foundations assignments
