---
title: "Categorical and Multinomial models"
track: "maths-foundations"
status: live
summary: "A Categorical variable selects one of K outcomes with probabilities p₁,…,pₖ; a Multinomial variable counts how many of n independent categorical."
duration: "4 min read"
---

## The short answer

A Categorical variable selects one of `K` outcomes with probabilities `p₁,…,pₖ`; a Multinomial variable counts how many of `n` independent categorical trials land in each outcome. The probability vector must be non-negative and sum to one, and the count vector must sum to `n`. These are the basic models for multiclass labels and class counts.

## Why this matters

One-hot labels, routing outcomes, token categories, and survey counts all need a
clear distinction between one draw and a batch of draws. A class vector that
does not sum to one is not merely poorly calibrated—it is not a categorical
distribution. A count vector with the wrong total cannot describe the stated
sample.

## How it works

For one draw `X∈{1,…,K}`,
`P(X=i)=pᵢ`, where `pᵢ≥0` and `Σᵢpᵢ=1`. For counts
`N=(N₁,…,Nₖ)` over `n` independent draws,

`P(N=n)=n!/(n₁!…nₖ!) · ∏ᵢ pᵢ^{nᵢ}`, with `Σᵢnᵢ=n`.

Each marginal count is Binomial, but the counts are dependent because they must
sum to `n`. For a model output, softmax is one way to parameterise positive
probabilities summing to one; it does not by itself prove the probabilities are
calibrated or labels are correct.

**Derivation:** a count vector can occur in `n!/(n₁!…nₖ!)` ordered sequences;
each sequence has probability `∏ᵢpᵢ^{nᵢ}`. Multiplying these gives the
Multinomial PMF and makes the fixed-total constraint explicit.

### Numerical and visual perspective

Plot a categorical vector as a bar chart whose heights sum to one. For a
Multinomial, show a simplex for three classes or a stacked bar whose segment
counts sum to `n`. A heatmap of repeated count vectors can reveal a class that
is systematically missing.

### An illustrative story

A multi-class dashboard added a new “unknown” class but left the old four class
weights unchanged. The displayed probabilities summed to 1.08, so comparisons
were meaningless until the vector was renormalised or the model retrained.
This is an illustrative schema failure.

## Worked examples and variations

### Example A: one classification label

**Input:** classes `cat,dog,bird` with probabilities `.5,.3,.2`.
**Mechanism:** one Categorical draw selects exactly one class. **Output:**
`P(dog)=.3`. **Inspect:** the vector sums to 1 and no outcome is selected
twice. **Decision:** use one categorical target for one labeled example.

### Example B: class counts

**Input:** 5 independent labels with the same class vector; count `(3,1,1)`.
**Mechanism:** Multinomial probability is
`5!/(3!1!1!) · .5³·.3·.2`. **Output:** the coefficient counts the distinct
ordered label sequences. **Inspect:** counts sum to 5. **Decision:** use the
model for a fixed batch, subject to exchangeability assumptions.

### Boundary case: one class

**Input:** `K=1`, `p₁=1`, and `n=7`. **Mechanism:** every categorical draw is
class one, so the only count vector is `(7)`. **Output:** probability 1.
**Inspect:** a general implementation should handle a one-dimensional simplex.
**Decision:** do not fabricate uncertainty where the support has one value.

### Example C: class imbalance

**Input:** `p=(.98,.015,.005)` for 1,000 labels. **Mechanism:** expected counts
are `(980,15,5)` by linearity. **Output:** a rare-class count has high relative
uncertainty even if its expected count is five. **Inspect:** report counts and
rates together. **Decision:** use stratified evaluation or uncertainty-aware
metrics when rare classes drive the decision.

### Counterexample: invalid probability vector

**Input:** `p=(.6,.5,-.1)`. **Mechanism:** the total is 1, but non-negativity
fails; alternatively `(0.4,0.4,0.4)` is non-negative but totals 1.2.
**Output:** neither is a valid categorical PMF. **Inspect:** check both
conditions before sampling. **Decision:** fail fast rather than silently clip
and renormalise without logging the change.

## Two ways to see it

### Builder view

Treat a class vector as a contract: ordered class names, non-negative finite
numbers, sum-to-one tolerance, and an unknown-class policy. Treat counts as a
second contract with a batch total and integer support.

### Systems or reviewer view

Inspect the class vocabulary and denominator. A high probability for the largest
class can be numerically valid while hiding missing labels, class drift, or a
batch whose counts were truncated.

## Hands-on

Create a three-class vector and sample 1,000 labels with a fixed seed. Compare
the count vector with its expected count and plot the class bars. Implement a
Multinomial PMF for `(3,1,1)`.

**Deliberate failure:** change the vector to `(0.6,0.5,-0.1)` and let the
sampler normalise it. **Test:** validation must report negative entries or a bad
sum before sampling. **Reset:** restore `.5,.3,.2`, rerun, and record the class
order beside the counts. **No-code route:** use a bag of three coloured token
types and tally five draws.

## Checkpoint

- [ ] Validate a categorical probability vector.
- [ ] Explain the Multinomial coefficient as a count of orderings.
- [ ] State why Multinomial counts are dependent when their total is fixed.
- [ ] Diagnose an invalid class vector and a count vector with the wrong total.

## What this does not solve

The models do not validate labels, correct class imbalance, or establish that
trials are independent and identically distributed. A valid probability vector
can still be badly calibrated. Waiting-time distributions model a different
question: how long until an event occurs?

## Continue, go deeper, apply it

- Continue: Uniform, geometric, and exponential models
- Go deeper: Logistic regression
- Apply it: Likelihood, priors, and sampling assignment
