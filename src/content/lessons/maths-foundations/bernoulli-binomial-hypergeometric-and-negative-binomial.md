---
title: "Bernoulli, Binomial, Hypergeometric, and Negative Binomial models"
track: "maths-foundations"
status: live
summary: "Use Bernoulli for one binary trial, Binomial for the number of successes in a fixed number of independent equal-probability trials, Hypergeometric."
duration: "5 min read"
---

## The short answer

Use Bernoulli for one binary trial, Binomial for the number of successes in a fixed number of independent equal-probability trials, Hypergeometric for sampling without replacement, and Negative Binomial for trials or failures counted until a fixed number of successes. The count can look similar while the assumptions—and therefore the uncertainty—differ.

## Why this matters

Conversion counts, labels, audits, and retry budgets all produce binary events.
Choosing the wrong family can make a finite inventory look replenished or make
dependent traffic look independent. Write down the sampling mechanism before
fitting `p`; the formula follows from that story.

## How it works

A Bernoulli variable `X` has `P(X=1)=p`, `P(X=0)=1-p`. For `n` independent
trials with the same `p`, the Binomial count `K` has

`P(K=k)=C(n,k)p^k(1-p)^(n-k)`.

If a finite population has `N` items, `K` are successes, and `n` items are
drawn without replacement, the Hypergeometric count is

`P(X=x)=C(K,x)C(N-K,n-x)/C(N,n)`.

For the Negative Binomial, count trials `T` until the `r`th success:

`P(T=t)=C(t-1,r-1)p^r(1-p)^(t-r)`, for `t≥r`.

The Binomial mean/variance are `np` and `np(1-p)`; without replacement,
dependence adds a finite-population correction. These models assume clearly
defined binary outcomes and, where stated, constant rates and exchangeable or
independent trials.

**Derivation:** for a Binomial count, choose which `k` of `n` positions are
successes (`C(n,k)`), then multiply the probability of each arrangement,
`p^k(1-p)^(n-k)`. Hypergeometric counting instead chooses successes and failures
from a finite stock, which is why no-replacement dependence enters.

### Numerical and visual perspective

Plot the four PMFs on a common count axis, but label the meaning of the axis:
successes, successes from a finite stock, or trials until success. A Binomial
variance shrinks relative to independent sampling when a large fraction of a
finite population is removed; that is a visible signature of depletion.

### An illustrative story

A conversion forecast used a Binomial curve for a one-time coupon pool. Once
most coupons were used, the remaining draw had less uncertainty than the model
claimed. This is an illustrative modeling failure, not a production claim.

## Worked examples and variations

### Example A: Binomial conversions

**Input:** 20 independent visits, constant conversion probability `p=0.1`.
**Mechanism:** `P(K=5)=C(20,5)(.1)^5(.9)^15`. **Output:** a probability for
exactly five conversions (about 0.0319). **Inspect:** the count is bounded by
0 and 20. **Decision:** use the model only if visits are a defensible unit and
the rate is stable enough for the forecast.

### Example B: Hypergeometric audit

**Input:** 100 records contain 10 defects; inspect 5 without replacement.
**Mechanism:** `P(X=1)=C(10,1)C(90,4)/C(100,5)`. **Output:** the chance of
exactly one defect. **Inspect:** a record cannot be inspected twice and the
remaining defect fraction changes after each draw. **Decision:** use this for a
finite audit sample, not a stream with replacement.

### Boundary case: one trial

**Input:** `n=1`. **Mechanism:** Binomial reduces to Bernoulli: `K∈{0,1}` and
`P(K=1)=p`. **Output:** the families agree at this boundary. **Inspect:** a
code path that returns a vector of length `n+1` still needs correct indexing.
**Decision:** use the simplest named model for communication.

### Example C: Negative Binomial waiting

**Input:** independent conversion probability `.2`; count trials until the third
conversion. **Mechanism:** the minimum is 3, and `P(T=8)=C(7,2)(.2)^3(.8)^5`.
**Output:** a waiting-time distribution. **Inspect:** the final trial must be a
success; earlier trials contain exactly two successes. **Decision:** use it for
trial-budget questions, not a fixed-horizon count.

### Counterexample: Binomial for depleted stock

**Input:** 2 defective items among 4, draw 2 without replacement. **Mechanism:**
the number of defects is Hypergeometric, with `P(X=2)=1/C(4,2)=1/6`.
**Output:** independent-Binomial would use `C(2,2)(.5)^2=1/4`.
**Inspect:** the second draw’s probability depends on the first. **Decision:**
model the inventory or explicitly accept a replacement approximation.

## Two ways to see it

### Builder view

Record fixed horizon versus stopping time, replacement versus no replacement,
and constant versus changing rate. Test support and the sampling mechanism before
comparing parameter estimates.

### Systems or reviewer view

Look for hidden repeated users, depleted queues, and changing exposure. A
Binomial-looking count does not establish independent trials; it only counts
successes under an assumption set.

## Hands-on

Implement PMFs for the four models and simulate small fixtures: 20 conversions,
an audit from a finite stock, and trials until three successes. Plot the PMFs and
compare empirical frequencies with the formulas.

**Deliberate failure:** simulate the finite audit by drawing with replacement.
**Test:** the empirical support and variance should be compared with the
Hypergeometric expectation; require a mechanism label before accepting the plot.
**Reset:** use a shrinking population or a library-free sample-without-
replacement loop, then rerun. **No-code route:** draw numbered tokens from a bag
and record whether each draw returns the token.

## Checkpoint

- [ ] Choose a model from replacement, horizon, and stopping-time assumptions.
- [ ] Write the Binomial and Hypergeometric PMFs and state their difference.
- [ ] Explain why the Negative Binomial support starts at `r`.
- [ ] Identify the independence assumption in a conversion-rate model.

## What this does not solve

These families do not make a rate constant, a visit independent, or a label
correct. Overdispersion, temporal dependence, and heterogeneous probabilities
can invalidate the simple formulas. Categorical and Multinomial models extend
the same logic beyond two outcomes.

## Continue, go deeper, apply it

- Continue: Categorical and Multinomial models
- Go deeper: Probability and statistics for ML
- Apply it: Likelihood, priors, and sampling assignment
