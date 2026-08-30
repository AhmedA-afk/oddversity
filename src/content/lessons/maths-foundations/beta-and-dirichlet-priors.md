---
title: "Beta and Dirichlet priors"
track: "maths-foundations"
status: live
summary: "The Beta distribution models an unknown binary probability p; the Dirichlet distribution models an unknown categorical probability vector."
duration: "4 min read"
---

## The short answer

The Beta distribution models an unknown binary probability `p`; the Dirichlet distribution models an unknown categorical probability vector. With positive parameters, observing successes and failures adds counts to those parameters: `Beta(α,β)→Beta(α+s,β+f)`. This is conjugacy, a convenient algebraic update—not proof that the prior or likelihood matches the real process.

## Why this matters

Small data can produce extreme rates: zero observed conversions does not prove
the true rate is zero. A prior supplies explicit regularisation and uncertainty;
the parameters also encode concentration, not just a point guess. Dirichlet
smoothing prevents zero class probabilities in simple generative models while
making the prior choice inspectable.

## How it works

For `p∈(0,1)`,

`Beta(p;α,β) ∝ p^(α−1)(1−p)^(β−1)`, with `α,β>0`.

Its mean is `α/(α+β)`, and `α+β` controls concentration around that mean. A
Binomial likelihood contributes `p^s(1-p)^f`, so multiplying by the prior gives
the same form with parameters `(α+s,β+f)`.

For a `K`-class probability vector `p`,
`Dirichlet(α₁,…,αₖ) ∝ ∏ᵢpᵢ^(αᵢ−1)`, on the simplex. Multinomial counts add to
the vector: `αᵢ' = αᵢ+nᵢ`. The posterior mean is
`(αᵢ+nᵢ)/(Σⱼαⱼ+n)`. The pseudo-count interpretation is useful, but prior
parameters are modeling choices, not necessarily literal historical records.

### Numerical and visual perspective

Plot Beta densities for the same mean with concentrations 2, 20, and 200; the
mean can stay fixed while uncertainty shrinks. Plot Dirichlet samples on a
three-class simplex. Prior plus data should move toward the empirical rate while
remaining less extreme with limited data.

### An illustrative story

A new class had no observations in a small batch, so a raw frequency estimator
assigned it probability zero and a downstream log score became infinite. A
small, documented Dirichlet prior avoided the zero while keeping the uncertainty
visible. This is illustrative, not a claim about a specific model.

## Worked examples and variations

### Example A: uniform prior update

**Input:** `p~Beta(1,1)` and observe 3 successes, 2 failures. **Mechanism:**
posterior is `Beta(4,3)`, with mean `4/7≈.571`. **Output:** a smoothed estimate
and a distribution over plausible rates. **Inspect:** the raw rate is .6; the
posterior mean is not forced to equal it. **Decision:** report prior and data
counts together.

### Example B: stronger prior, same evidence

**Input:** prior `Beta(20,20)`, same 3/2 data. **Mechanism:** posterior
`Beta(23,22)`, mean `23/45≈.511`. **Output:** the estimate moves less than under
the weak prior because concentration is higher. **Inspect:** mean and spread,
not mean alone. **Decision:** justify concentration from domain knowledge or a
transparent sensitivity analysis.

### Example C: Dirichlet smoothing

**Input:** prior `(1,1,1)` and class counts `(8,1,0)`. **Mechanism:** posterior
mean `(9,2,1)/12=(.75,.167,.083)`. **Output:** the unseen class is not assigned
zero posterior mean. **Inspect:** the pseudo-count affects rare classes most.
**Decision:** use smoothing when zero probabilities would make the loss or
decision brittle, while preserving the raw counts for audit.

### Boundary case: no observations

**Input:** `s=f=0`. **Mechanism:** posterior equals the prior. **Output:** data
have supplied no update. **Inspect:** a prior-only estimate must be labeled as
such. **Decision:** do not present it as observed performance.

### Counterexample: zero or negative hyperparameters

**Input:** `Beta(0,1)` or Dirichlet parameter `−2`. **Mechanism:** the proper
distribution requires positive parameters; the density can become improper or
undefined at a boundary. **Output:** invalid prior for the stated conjugate
model. **Inspect:** validate hyperparameters before fitting. **Decision:** use a
proper prior or explicitly work with a limiting/improper construction and its
consequences.

## Two ways to see it

### Builder view

Keep prior parameters, observed counts, posterior parameters, and posterior
summary separate. Run sensitivity checks over plausible concentrations.

### Systems or reviewer view

Smoothing changes low-data decisions. It can reduce zero-probability failures
but can also encode a value judgment about rare classes; make that choice
reviewable rather than hiding it in a default.

## Hands-on

Implement the Beta and Dirichlet count updates and plot prior/posterior samples
for the examples. Compare raw frequencies with posterior means and record
concentration sensitivity.

**Deliberate failure:** set an unseen class posterior probability to zero and
take its log. **Test:** the expected fixture must flag `log(0)` and the smoothed
posterior must remain strictly positive for positive hyperparameters. **Reset:**
restore the prior, rerun, and report both raw and smoothed values. **No-code
route:** add coloured prior tokens to observed outcome tokens and divide by the
new total.

## Checkpoint

- [ ] Derive the Beta–Binomial parameter update.
- [ ] Explain mean versus concentration in a Beta prior.
- [ ] Update a Dirichlet prior with a Multinomial count vector.
- [ ] Identify a prior choice that requires sensitivity or governance review.

## What this does not solve

Conjugacy does not validate the Binomial/Multinomial likelihood, select a
neutral prior, or make posterior predictions calibrated. A prior can dominate
small data and can encode unwanted assumptions. Transformations explain how a
distribution changes when a variable is reparameterised.

## Continue, go deeper, apply it

- Continue: Transformations of random variables and LOTUS
- Go deeper: Bayesian and generative learning
- Apply it: Likelihood, priors, and sampling assignment
