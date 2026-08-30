---
title: "Markov chain Monte Carlo"
track: "maths-foundations"
status: live
summary: "Markov chain Monte Carlo (MCMC) estimates posterior expectations by constructing a chain whose long-run distribution is the target posterior."
duration: "3 min read"
---

## The short answer

Markov chain Monte Carlo (MCMC) estimates posterior expectations by constructing a chain whose long-run distribution is the target posterior. In Metropolis–Hastings, propose `θ'` from `q(θ'|θ)` and accept with a ratio that corrects proposal and target density. Check mixing, effective sample size, autocorrelation, and multiple chains; a long correlated chain is not automatically reliable.

## Why this matters

Many useful posteriors have no closed-form normalizing constant. MCMC can still
sample them, but computation becomes an inference experiment with diagnostics.
Poor proposal scale can make the chain sticky or wasteful, and a plausible trace
from one chain can hide a missed mode.

## How it works

Given target density `p(θ)` known up to a constant and proposal `q`, propose
`θ'~q(·|θ)` and accept with

```text
α = min(1, [p(θ') q(θ|θ')] / [p(θ) q(θ'|θ)]).
```

For a symmetric random-walk proposal, the `q` terms cancel. Accepted and rejected
states form a Markov chain; under regularity and ergodicity conditions, averages
converge to posterior expectations. Burn-in is not a substitute for convergence
diagnostics, and samples are usually autocorrelated.

## Worked examples and variations

### Example A: standard normal target

**Input:** target `p(θ)∝exp(−θ²/2)`, proposal `θ'=θ+Normal(0,1)`. **Mechanism:**
accept density-increasing moves always and some decreasing moves. **Output:**
chain with mean near 0 and variance near 1 after adequate sampling. **Inspect:**
trace and autocorrelation. **Decision:** compare estimates with known truth.

### Example B: asymmetric proposal

**Input:** proposal moves right more often than left. **Mechanism:** include the
reverse/forward `q` ratio. **Output:** correct target only with Hastings correction.
**Inspect:** omit the ratio in a fixture and observe shifted mean. **Decision:**
never assume symmetry from a proposal name.

### Boundary case: tiny step size

**Input:** random-walk standard deviation `1e−4`. **Mechanism:** acceptance is
high but consecutive draws are nearly identical. **Output:** slow exploration and
low effective sample size. **Inspect:** acceptance alone is insufficient. **Decision:**
tune for movement and monitor autocorrelation.

### Counterexample: high acceptance means convergence

**Input:** target is bimodal; proposal steps are too small to cross modes.
**Mechanism:** chain accepts local moves frequently but remains in one mode.
**Output:** biased posterior summaries from one chain. **Inspect:** multiple
initializations and mode occupancy. **Decision:** change proposal or use a method
that can explore separated regions.

## An illustrative story

An illustrative posterior trace looks calm and converged because the chain never
left its initial mode. Running four dispersed chains exposes incompatible means.
The diagnostic failure is evidence about computation, not proof that the model has
four real answers.

## Two ways to see it

### Markov-chain view

Each draw depends on the previous one, while the stationary distribution is the
desired posterior. Dependence determines effective information.

### Numerical view

MCMC trades exact integration for correlated samples. Estimate error depends on
autocorrelation, chain length, mixing, and the function being averaged.

## Hands-on

Implement Metropolis–Hastings for a standard normal and a two-mode mixture. Run
several proposal scales and initial states. Report acceptance rate, trace,
autocorrelation, chain means, and a rough effective sample size.

**Failure state:** omit the Hastings proposal ratio or report only acceptance
rate. **Test:** the asymmetric proposal must recover the known target moments;
the bimodal fixture must warn when chains disagree or mode occupancy is absent.
**Reset:** restore the ratio and use dispersed starts/proposal scale, then rerun.

## Checkpoint

- [ ] Write the Metropolis–Hastings acceptance ratio.
- [ ] Explain why asymmetric proposals need a correction.
- [ ] Distinguish acceptance rate from effective sample size and mixing.
- [ ] Name one diagnostic for a multimodal target.

## What this does not solve

MCMC does not make a misspecified posterior useful or guarantee exploration of a
hard high-dimensional target. Diagnostics can fail, and computational cost may
be prohibitive for production latency.

## Continue, go deeper, apply it

- Continue: Variational inference and the ELBO
- Go deeper: Bayesian posterior inference
- Apply it: Posterior predictive checks
