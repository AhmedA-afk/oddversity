---
title: "Variational inference and the ELBO"
track: "maths-foundations"
status: live
summary: "Variational inference (VI) approximates a posterior p(z|x) with a tractable distribution q(z) by minimising KL(q||p)."
duration: "4 min read"
---

## The short answer

Variational inference (VI) approximates a posterior `p(z|x)` with a tractable distribution `q(z)` by minimising `KL(q||p)`. The evidence lower bound (ELBO) rewrites that objective as `E_q[log p(x,z)−log q(z)]`, so it can be optimised without knowing the posterior normalizer. VI is often fast and scalable, but the chosen family can be biased and overconfident.

## Why this matters

VI turns inference into optimisation, making it attractive for large models and
repeated updates. The approximation is a modelling choice: mean-field factors,
Gaussian tails, and reparameterisation can exclude posterior structure. Comparing
speed alone with MCMC misses the uncertainty error that affects decisions.

## How it works

Start with `p(z|x)=p(x,z)/p(x)` and nonnegative KL:

```text
KL(q||p) = E_q[log q(z)−log p(z|x)] ≥ 0
log p(x) = ELBO(q) + KL(q||p),
ELBO(q) = E_q[log p(x,z)−log q(z)].
```

Maximising ELBO minimises the forward expression’s KL gap. Monte Carlo samples,
analytic expectations, or reparameterized gradients estimate the objective. The
direction `KL(q||p)` often penalises placing mass where the target is small and
can under-cover separated modes.

## Worked examples and variations

### Example A: a Gaussian posterior in a Gaussian family

**Input:** target `Normal(3, 0.25²)` and `q=Normal(μ,σ²)`. **Mechanism:** optimise
`μ,σ` to match the target. **Output:** exact family can recover both moments.
**Inspect:** compare q density and known posterior. **Decision:** use as a unit
test for the optimiser and ELBO sign.

### Example B: mean-field correlated target

**Input:** a two-dimensional tilted Gaussian with strong correlation; `q(z)=q_1q_2`.
**Mechanism:** factorisation forbids covariance. **Output:** approximate ellipse
collapses to an axis-aligned product. **Inspect:** compare covariance and marginal
coverage. **Decision:** use a richer variational family if dependence matters.

### Boundary case: posterior collapse

**Input:** latent-variable model where decoder can explain data without `z`.
**Mechanism:** KL term encourages q to match the prior, carrying little information.
**Output:** latent posterior close to prior. **Inspect:** KL per latent and
reconstruction/usefulness, not ELBO alone. **Decision:** revisit model/objective.

### Counterexample: higher ELBO is automatically more truthful

**Input:** two variational families or a flexible likelihood with different ELBOs.
**Mechanism:** training objective improves on the selected model and family, not
necessarily predictive calibration. **Output:** higher ELBO but poor tails or
coverage. **Inspect:** posterior predictive checks and held-out scoring.
**Decision:** treat ELBO as an optimisation/evidence bound, not a complete audit.

## An illustrative story

An illustrative anomaly model trains faster with mean-field VI and reports narrow
credible intervals. On a correlated drift event, the intervals miss the true
joint region. MCMC on a small validation subset reveals the approximation gap;
the fast method can remain useful only with that limitation documented.

## Two ways to see it

### Optimisation view

Choose a family, parameterize it, estimate ELBO gradients, and optimise. This
inherits all the usual learning-rate and local-optimum diagnostics.

### Uncertainty view

VI replaces an intractable posterior with a shaped approximation. Speed and
tractability are purchased with family and objective bias.

## Hands-on

Implement VI for a two-dimensional Gaussian target using a diagonal Gaussian q.
Optimise its mean and log standard deviations; compare with a full-covariance q
and an MCMC reference. Plot contours and report marginal/joint coverage.

**Failure state:** optimise `E_q[log p(x,z)+log q(z)]` with the wrong entropy sign,
or interpret a diagonal q as able to represent correlation. **Test:** the known
Gaussian fixture must recover its covariance when the full family is allowed; the
ELBO must not improve by moving away from the target in the unit case. **Reset:**
restore `−log q`, parameter constraints, and the family comparison.

## Checkpoint

- [ ] Derive `log p(x)=ELBO+KL(q||p)` at a high level.
- [ ] Explain what the variational family can and cannot represent.
- [ ] State why mean-field VI can understate dependence or uncertainty.
- [ ] Name one check besides ELBO for an approximate posterior.

## What this does not solve

VI does not remove posterior misspecification, optimisation error, or approximation
bias. A converged ELBO can belong to a poor family, and predictive checks can
miss features that were never measured.

## Continue, go deeper, apply it

- Continue: Gaussian processes and kernel uncertainty
- Go deeper: Markov chain Monte Carlo
- Apply it: Loss, gradients, and optimisation
