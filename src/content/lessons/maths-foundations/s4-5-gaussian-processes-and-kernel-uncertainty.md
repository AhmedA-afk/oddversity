---
title: "Gaussian processes and kernel uncertainty"
track: "maths-foundations"
status: live
summary: "A Gaussian process (GP) is a distribution over functions whose values at any finite set of inputs have a joint Gaussian distribution."
duration: "4 min read"
---

## The short answer

A Gaussian process (GP) is a distribution over functions whose values at any finite set of inputs have a joint Gaussian distribution. A kernel encodes how inputs covary. Conditioning on observations gives a posterior mean and variance, making interpolation and uncertainty explicit. Kernel choice, noise, scaling, and extrapolation determine whether that uncertainty is useful.

## Why this matters

GPs are an interpretable probabilistic baseline for small and medium datasets,
active learning, emulation, and Bayesian optimisation. They force a builder to
state smoothness and similarity assumptions. Outside observed support, a model
can become confidently wrong when the kernel or noise model is inappropriate.

## How it works

For training inputs `X`, targets `y`, kernel matrix `K`, and noise variance
`σ_n²`, the posterior at `X_*` has mean

```text
μ_* = K_*ᵀ (K + σ_n²I)⁻¹ y
Σ_* = K_{**} − K_*ᵀ(K + σ_n²I)⁻¹K_*.
```

The kernel must be positive semidefinite so it defines valid joint covariance.
The squared-exponential kernel encodes very smooth functions; Matérn kernels
allow rougher paths. In practice solve linear systems rather than explicitly
forming an inverse, and add jitter for numerical stability.

## Worked examples and variations

### Example A: interpolation near observations

**Input:** noisy points around a smooth curve and an RBF kernel. **Mechanism:**
nearby inputs have high covariance. **Output:** posterior mean follows data with
variance reduced near observations. **Inspect:** plot mean plus uncertainty band.
**Decision:** compare residuals with noise variance rather than demanding zero error.

### Example B: noisy observations

**Input:** same inputs with `σ_n²>0`. **Mechanism:** conditioning balances signal
covariance and observation noise. **Output:** mean does not pass every point and
variance includes latent and observation components depending on prediction type.
**Inspect:** label which band is shown. **Decision:** report latent-function or
future-observation uncertainty explicitly.

### Boundary case: duplicate or near-duplicate inputs

**Input:** two almost identical points with inconsistent labels. **Mechanism:** K
becomes ill-conditioned and noise/jitter determines the compromise. **Output:**
unstable solve or a widened posterior. **Inspect:** condition number and Cholesky
failure. **Decision:** scale inputs and state the noise policy.

### Counterexample: extrapolation confidence

**Input:** predictions far outside the training range with a poorly chosen kernel
or normalised output. **Mechanism:** covariance behavior is assumption-driven;
the mean can follow an implausible trend while variance is misread. **Output:**
confident-looking extrapolation. **Inspect:** held-out range and prior samples.
**Decision:** treat out-of-support predictions as a separate risk slice.

## An illustrative story

An illustrative sensor surrogate has excellent interpolation error and a narrow
uncertainty band near historical operating points. A new operating regime lies
outside that range; prior samples and a range-held-out test show the prediction
is assumption-driven. The GP is still useful as a detector of unsupported input,
not a licence to extrapolate confidently.

## Two ways to see it

### Function view

The GP is a prior over possible curves; the kernel says which curves are plausible
before data. Conditioning removes functions inconsistent with observations.

### Linear-algebra view

Inference is a covariance solve and Schur complement. Matrix conditioning and
kernel validity are first-class diagnostics.

## Hands-on

Fit a small GP to a sinusoid with noise. Compare RBF and Matérn kernels, jitter
levels, interpolation, and a range-held-out extrapolation. Plot mean, latent and
predictive intervals if both are available.

**Failure state:** use an unscaled input with an RBF length scale chosen for a
different unit, or invert `K` explicitly without jitter. **Test:** kernel matrix
must be symmetric positive semidefinite within tolerance, solve must be stable,
and the range-held-out slice must be flagged rather than merged with interpolation
error. **Reset:** scale inputs, use a linear solve and documented jitter, rerun.

## Checkpoint

- [ ] Explain what a GP places a distribution over.
- [ ] Identify the role of a kernel and noise variance in the posterior equations.
- [ ] Distinguish latent-function from future-observation uncertainty.
- [ ] Name one extrapolation and one numerical-conditioning diagnostic.

## What this does not solve

GP uncertainty is conditional on the kernel, mean, noise, and input domain. A
well-calibrated interval on interpolation data does not guarantee extrapolation
coverage, and exact inference scales poorly with dataset size without approximations.

## Continue, go deeper, apply it

- Continue: Causal graphical models and identifiability limits
- Go deeper: Variational inference and the ELBO
- Apply it: Causal questions versus predictive models
