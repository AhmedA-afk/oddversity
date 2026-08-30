---
title: "Independence and conditional independence"
track: "maths-foundations"
status: live
summary: "Events A and B are independent when knowing one does not change the probability of the other: P(A∩B)=P(A)P(B)."
duration: "5 min read"
---

## The short answer

Events `A` and `B` are independent when knowing one does not change the probability of the other: `P(A∩B)=P(A)P(B)`. They are conditionally independent given `C` when the same factorisation holds after `C` is known. A pair can be independent marginally but dependent after conditioning, especially when conditioning on a shared effect.

## Why this matters

Independence is an assumption that simplifies a model, not a default fact about
features. Naive Bayes uses conditional independence to factor a likelihood;
data splits and repeated measurements often violate it. Conditioning can also
create dependence: selecting on a common outcome makes two otherwise unrelated
causes informative about each other.

## How it works

For events with positive probabilities, independence is equivalent to either
`P(A|B)=P(A)` or `P(B|A)=P(B)`. For a conditioning event `C`, conditional
independence means

`P(A∩B|C)=P(A|C)P(B|C)`.

The equation must hold for the conditioning states being claimed, not just on
average. A useful algebraic warning is that marginal independence does not imply
conditional independence, and conditional independence does not imply marginal
independence. In a collider pattern `A → C ← B`, learning `C` can make `A` and
`B` dependent because each explains part of the observed effect.

**Derivation:** substitute `C=X OR Y=1` into the finite four-state table. The
conditioning event removes only `(0,0)`, leaving three equal-mass states; the
conditional joint and marginal products then differ directly. This is the
smallest concrete demonstration that conditioning can create dependence.

### Numerical and visual perspective

Enumerate a small finite table and compare the joint cell with the product of
marginals. For the collider, let `X` and `Y` be independent fair bits and
`C = X OR Y`. Before conditioning, `P(X=1,Y=1)=1/4`. Given `C=1`,
`P(X=1)=P(Y=1)=2/3`, but `P(X=1,Y=1|C=1)=1/3`, not `4/9`. A 2×2 heatmap
changes from a product table to a visibly uneven conditional table.

### An illustrative story

Two independent hiring signals became correlated among applicants who had been
selected for an interview because both signals could trigger selection. The
selection rule was the shared effect. This is an illustrative pattern, not a
claim about a particular hiring system.

## Worked examples and variations

### Example A: two coin tosses

**Input:** `A` is “first fair toss is heads,” `B` is “second fair toss is
heads.” **Mechanism:** `P(A)=P(B)=1/2`, and the joint event has probability
`1/4`, equal to the product. **Output:** independent events. **Inspect:** the
two tosses are generated separately by the model. **Decision:** multiplication
is justified for this experiment.

### Example B: repeated model measurements

**Input:** two scores from the same user session share a browser, user, and
network. **Mechanism:** common latent conditions can make the joint error rate
larger or smaller than the product of marginal error rates. **Output:** no
automatic independence. **Inspect:** group by session and compare within-group
and across-group frequencies. **Decision:** use grouped splits or a dependence
model if the claim matters.

### Boundary case: zero-probability conditioning

**Input:** `P(B)=0`. **Mechanism:** checking `P(A|B)=P(A)` is not a valid test
because the conditional ratio is undefined. **Output:** “independent” cannot be
concluded from an untestable denominator. **Inspect:** confirm the conditioning
event occurs in the model or dataset. **Decision:** revise the event or use a
formal conditional-distribution construction.

### Example C: marginal independence, conditional dependence

**Input:** independent fair bits `X,Y`; select cases with `C=X OR Y=1`.
**Mechanism:** before selection `P(X=1,Y=1)=1/4`; after selection the three
allowed states are equally likely, so the joint is `1/3` and each marginal is
`2/3`. **Output:** `1/3 ≠ 4/9`; the bits are dependent given `C=1`.
**Inspect:** selection on a common effect changed the table. **Decision:** do
not condition on a collider merely because it is available.

### Counterexample: uncorrelated means independent

**Input:** let `X` be uniform on `{-1,0,1}` and `Y=X²`. Symmetry gives
`E[X]=0` and `Cov(X,Y)=0`, but `Y` is completely determined by `X`.
**Mechanism:** zero covariance measures one linear relationship, not all
dependence. **Output:** uncorrelated but dependent variables. **Decision:** use
independence tests or a domain model; do not infer factorisation from one
correlation number.

## Two ways to see it

### Builder view

Treat independence as a testable modeling shortcut. Check joint-versus-product
tables by relevant slice, time, and entity—not just over pooled rows.

### Systems or adversary view

Ask which variable was selected, filtered, or logged because of another. A
pipeline can manufacture dependence through routing, missingness, or evaluation
selection even when the upstream variables looked independent.

## Hands-on

Enumerate all four pairs of fair bits and compute marginals, joint mass, and the
factorisation error. Then condition on `X OR Y=1` and recompute. Add the
`X∈{-1,0,1}, Y=X²` fixture to show zero covariance with dependence.

**Deliberate failure:** assert independence after conditioning on the OR event.
**Test:** the conditional factorisation error should be `1/9` for the `(1,1)`
cell (`1/3-4/9`). **Reset:** remove the incorrect assertion and label the
conditional table as dependent. **No-code route:** draw the four-bit grid and
cross out the `(0,0)` state before comparing frequencies.

## Checkpoint

- [ ] Test independence from a joint table and the two marginal tables.
- [ ] State the extra conditioning event in a conditional-independence claim.
- [ ] Explain the collider example in terms of a shared effect.
- [ ] Give a dependent pair with zero covariance.

## What this does not solve

Finite data rarely proves independence; it only gives evidence for or against a
model assumption. Independence also does not imply identical distributions,
causality, or fairness. The law of total probability lets you combine dependent
subgroups without pretending they are one homogeneous population.

## Continue, go deeper, apply it

- Continue: Law of total probability
- Go deeper: Classifiers, thresholds, and calibration
- Apply it: Base rates, Bayes, and simulation
