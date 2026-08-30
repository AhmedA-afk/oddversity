---
title: "Conjugacy and exponential-family structure"
track: "maths-foundations"
status: live
summary: "Conjugacy is algebraic convenience: a prior and likelihood produce a posterior in the same family."
duration: "3 min read"
---

## The short answer

Conjugacy is algebraic convenience: a prior and likelihood produce a posterior in the same family. Exponential-family models make the update depend on sufficient statistics such as counts or sums. Conjugacy can give exact, fast updates, but it is not a truth guarantee and often disappears with realistic links, constraints, hierarchical structure, or nonconjugate observations.

## Why this matters

Recognising conjugate structure helps build small exact baselines and understand
what information a likelihood uses. It also prevents a common overreach: choosing
a convenient family and mistaking closed-form computation for a validated model.

## How it works

An exponential-family likelihood has form

```text
p(y|η)=h(y) exp(ηᵀT(y)−A(η)),
```

where `T(y)` is a sufficient statistic. A conjugate prior has terms that combine
with `ηᵀΣT(y)` so the posterior keeps the same algebraic shape. For Bernoulli
data, Beta parameters add successes and failures. For Poisson data, a Gamma prior
updates with the count sum and exposure. The update is exact only under the
stated likelihood, prior, and parameterisation.

## Worked examples and variations

### Example A: Beta–Bernoulli

**Input:** `θ~Beta(2,2)`, 6 successes and 4 failures. **Mechanism:** add counts
to shape parameters. **Output:** `Beta(8,6)`. **Inspect:** the posterior mean is
`8/14`, not the raw success rate alone. **Decision:** retain prior strength in
small-data reports.

### Example B: Gamma–Poisson

**Input:** rate `λ~Gamma(3,2)` and observe Poisson counts with total 12 over unit
exposure. **Mechanism:** shape adds count; rate adds exposure. **Output:**
`Gamma(15,3)` under the stated rate parameterisation. **Inspect:** units and
shape/rate versus shape/scale notation. **Decision:** write parameterisation in
the fixture.

### Boundary case: zero counts

**Input:** a Poisson observation of zero with positive exposure. **Mechanism:**
the likelihood still updates the rate; “no events” is data, not missingness.
**Output:** posterior shifts lower. **Inspect:** distinguish zero from absent
measurement. **Decision:** encode exposure and censoring separately.

### Counterexample: logistic regression is not conjugate with a Gaussian weight prior

**Input:** Bernoulli labels with sigmoid-linear probabilities and Gaussian prior
on weights. **Mechanism:** the sigmoid likelihood does not combine into a Gaussian
posterior. **Output:** no simple same-family closed form. **Inspect:** do not force
a Beta update onto vector weights. **Decision:** use approximation, sampling, or
an appropriate exact special case.

## An illustrative story

An illustrative team uses a conjugate count model for a service with censored
events. The arithmetic is flawless, but the likelihood treats every observation
window as equally exposed. Adding exposure time changes the posterior more than
changing the optimizer would; structure only helps when the data contract matches.

## Two ways to see it

### Algebra view

Conjugacy is pattern matching between likelihood statistics and prior terms. The
posterior update is an addition of evidence in the right coordinates.

### Modelling view

Sufficient statistics compress data for a particular likelihood. They are not
universally sufficient for another task or a richer data-generating process.

## Hands-on

Implement Beta–Bernoulli and Gamma–Poisson updates with both hand-calculated and
simulated data. Add a logistic-regression fixture and record why the same closed
form does not apply. Include parameter units in every result.

**Failure state:** confuse Gamma rate and scale, or count censored exposure as a
zero event. **Test:** known posterior parameters must match hand values and a
rate/scale round-trip; the censored fixture must be flagged for a likelihood
decision. **Reset:** restore the parameterisation and exposure field.

## Checkpoint

- [ ] State the exponential-family form and the role of a sufficient statistic.
- [ ] Perform a Beta–Bernoulli update from counts.
- [ ] Explain one parameterisation trap in Gamma–Poisson models.
- [ ] Name a common model that is not conjugate under a usual prior.

## What this does not solve

Conjugacy cannot validate the prior, likelihood, independence assumptions, or
data collection. Exact posterior arithmetic may still describe the wrong model.

## Continue, go deeper, apply it

- Continue: Markov chain Monte Carlo
- Go deeper: Bayesian posterior inference
- Apply it: Maximum likelihood and estimation
