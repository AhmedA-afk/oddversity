---
title: "Importance sampling and weighted estimates"
track: "maths-foundations"
status: live
summary: "Importance sampling estimates an expectation under target density p using draws from a proposal q: Epf(X)=Eqf(X)p(X)/q(X), provided q is positive."
duration: "5 min read"
---

## The short answer

Importance sampling estimates an expectation under target density `p` using draws from a proposal `q`: `E_p[f(X)]=E_q[f(X)p(X)/q(X)]`, provided `q` is positive wherever `p(x)f(x)` matters. The weight corrects the changed sampling distribution. A few enormous weights can make the estimate unstable, so inspect effective sample size and weight concentration.

## Why this matters

Direct simulation may almost never see a rare but important event. A proposal
can visit that region more often, then reweight samples back to the target. The
trade-off is variance: a proposal that misses target mass or produces wildly
unequal weights is computationally attractive but statistically fragile.

## How it works

Insert `q(x)/q(x)` into the target integral:

`∫f(x)p(x)dx = ∫f(x)[p(x)/q(x)]q(x)dx`.

For draws `Xᵢ~q`, the unnormalised estimator is
`n⁻¹Σ f(Xᵢ)wᵢ`, with `wᵢ=p(Xᵢ)/q(Xᵢ)`. If normalising weights is useful when
the target normalising constant is unknown, use the self-normalised estimator
`Σf(Xᵢ)wᵢ/Σwᵢ`; it has finite-sample bias in general, though often practical.

The effective sample size diagnostic
`ESS=(Σwᵢ)²/Σwᵢ²` is at most `n`; a low value means a small number of draws carry
most of the estimate. Support coverage is non-negotiable, and the proposal
should have tails at least as useful as the target for the chosen function.

**Assumption check:** the proposal draws must follow the stated `q`, the ratio
must be evaluable wherever target contribution exists, and target/proposal
density versions must use the same base measure. Independent draws are needed
for the simplest variance estimate.

### Numerical and visual perspective

Plot log weights and cumulative weighted estimates. A healthy run has many
contributors; a degenerate run has one spike and a flat effective sample size.
For rare-event work, plot target and proposal on the same axis so support gaps
are visible.

### An illustrative story

A rare-failure estimate changed dramatically when one proposal draw received
99% of the total weight. The formula was correctly coded; the proposal was poor.
This is illustrative, not a quantified production incident.

## Worked examples and variations

### Example A: exact discrete reweighting

**Input:** target `p=(.8,.15,.05)`, proposal `q=(.2,.3,.5)`, and
`f(x)=1{x=2}`. **Mechanism:** draw from `q`; weights are `4, .5, .1` for
states 0,1,2. Only state 2 contributes, so
`E_q[f w]=.5·1·(.05/.5)=.05`. **Output:** the target probability of state 2 is
.05. **Inspect:** only the target-to-proposal ratio produces the target mass.
**Decision:** retain the statewise audit for a small fixture.

### Example B: a rare-event proposal

**Input:** target has a rare high-loss region; proposal deliberately samples it
more often. **Mechanism:** each high-loss draw gets a smaller `p/q` weight.
**Output:** more observed rare cases without changing the target expectation.
**Inspect:** weighted and unweighted estimates differ as expected; check ESS.
**Decision:** choose a proposal that reduces variance, not merely one that
visits the event.

### Boundary case: zero proposal density

**Input:** `p(x)>0` but `q(x)=0` for some relevant `x`. **Mechanism:** `p/q`
is undefined and no proposal draw can represent that mass. **Output:** estimator
is biased or undefined. **Inspect:** support before running. **Decision:** widen
the proposal or partition the expectation.

### Example C: uniform proposal matches target

**Input:** `p=q` on a finite support. **Mechanism:** every weight is 1.
**Output:** importance sampling reduces to an ordinary Monte Carlo average and
`ESS=n`. **Inspect:** no reweighting variance is added. **Decision:** use this
as a unit test for the estimator.

### Counterexample: reverse weights

**Input:** use `q/p` instead of `p/q`. **Mechanism:** the proposal is reinforced
rather than corrected. **Output:** the estimate targets the wrong distribution;
the discrete fixture for state 2 no longer gives .05. **Inspect:** derive the
ratio from the integral, not memory. **Decision:** include a known-target test.

## Two ways to see it

### Builder view

Log proposal, target, each weight, cumulative estimate, normalised weight share,
and ESS. Treat low ESS as a diagnostic requiring a proposal change or uncertainty
qualification.

### Systems or risk view

Importance sampling reallocates computation; it does not create information in a
support gap. Rare-event estimates can look precise while being controlled by a
single simulated scenario.

## Hands-on

Implement the three-state example and verify the target expectation for indicators
of each state. Draw 1,000 samples from `q`, calculate weighted estimates and ESS,
and plot cumulative estimates and weight shares.

**Deliberate failure:** use reverse weights and set `q(2)=0` in the target’s
support. **Test:** the known-target assertions and support check must fail before
the final estimate is accepted. **Reset:** restore `p/q` and positive proposal
mass, then rerun. **No-code route:** make a table with one row per state,
`q`, `p`, weight, and `q×weight`.

## Checkpoint

- [ ] Derive importance sampling by multiplying and dividing by `q`.
- [ ] State the target-support condition on the proposal.
- [ ] Compute a weighted estimate on a finite example.
- [ ] Interpret a low ESS and a single dominant weight.

## What this does not solve

Importance sampling does not guarantee low variance, remove model misspecification,
or make a rare-event estimate safe for a high-stakes decision. Self-normalised
weights add bias, and dependent samples need further care. Quantiles and
empirical distributions offer robust descriptive summaries for observed data.

## Continue, go deeper, apply it

- Continue: Quantiles, order statistics, empirical distributions, and anomaly thresholds
- Go deeper: Bayesian and generative learning
- Apply it: Likelihood, priors, and sampling assignment
