---
title: "Fourier bases and the discrete Fourier transform"
track: "maths-foundations"
status: live
summary: "The discrete Fourier transform (DFT) rewrites N time or space samples as coefficients of N periodic complex sinusoids."
duration: "4 min read"
---

## The short answer

The discrete Fourier transform (DFT) rewrites `N` time or space samples as coefficients of `N` periodic complex sinusoids. Each coefficient says how much of one frequency basis is present. Use the DFT to inspect periodic structure, but remember that finite windows, sampling, phase, and leakage affect what you see; a large spectral peak is evidence about representation, not automatically a cause.

## Why this matters

Frequency structure helps diagnose vibration, audio, image texture, and model
filters. A learner who only sees an FFT plot can mistake a window artefact for a
real tone, compare magnitudes without normalisation, or ignore phase and shift
information. The basis view makes the transformation reversible and testable.

## How it works

For samples `x[0],…,x[N−1]`,

```text
X[k] = Σ_{n=0}^{N−1} x[n] exp(−2π i k n/N)
x[n] = (1/N) Σ_{k=0}^{N−1} X[k] exp(2π i k n/N).
```

The complex exponentials are orthogonal over the `N` sample positions. The DFT
is therefore a coordinate change in a complex vector space. For a real signal,
negative-frequency coefficients mirror positive ones, so `rfft` stores the
nonredundant half. Bin `k` corresponds to `k f_s/N` Hz. A frequency between bins
spreads energy across neighbours: spectral leakage.

## Worked examples and variations

### Example A: a constant signal

**Input:** `x=[2,2,2,2]`. **Mechanism:** the zero-frequency basis sums the samples;
oscillating bases cancel. **Output:** `X[0]=8`, other coefficients zero (under
the stated convention). **Inspect:** inverse-transform to recover all twos.
**Decision:** interpret DC as the mean level after checking normalisation.

### Example B: a bin-centred cosine

**Input:** `x[n]=cos(2π·1·n/8)`, `N=8`. **Mechanism:** the signal matches DFT bin
1 exactly. **Output:** paired peaks at bins 1 and 7. **Inspect:** use magnitude
and phase, then confirm with inverse DFT. **Decision:** report physical frequency
`f_s/8`, not raw bin number alone.

### Boundary case: alternating samples

**Input:** `[1,-1,1,-1]`. **Mechanism:** it matches the highest positive bin for
even `N`. **Output:** energy at `k=2`; this is the Nyquist boundary. **Inspect:**
remember the sign/phase convention and no distinct negative partner. **Decision:**
leave margin from Nyquist when collecting data.

### Counterexample: non-bin-centred tone

**Input:** a 1.5-bin cosine over eight samples. **Mechanism:** no basis matches
exactly, so orthogonal cancellation is incomplete. **Output:** a lobe across
several bins. **Inspect:** repeat with a Hann window and compare main-lobe width
and sidelobes. **Decision:** choose window and record length for the measurement
question, not for the prettiest plot.

## An illustrative story

An illustrative maintenance team sees a new peak after changing the recording
length. The machine did not necessarily change; the old window happened to hide
the frequency between bins. Repeating the measurement with the same sampling,
window, and duration distinguishes a physical shift from a spectral-resolution
change.

## Two ways to see it

### Coordinate view

The DFT is a basis expansion: time samples become coefficients, just as a vector
can be expressed in a different orthonormal coordinate system. Inverse DFT is the
reconstruction check.

### Diagnostic view

Magnitude answers “which periodic rates are present in this window?” Phase and
the original time alignment still matter. A spectrum is a compressed view with a
measurement design behind it.

## Hands-on

Construct four length-`N` signals: constant, bin-centred cosine, alternating, and
non-bin-centred cosine. Compute `np.fft.rfft`, plot magnitude against `k*f_s/N`,
and verify `max(abs(ifft(fft(x))-x))` is small.

**Failure state:** label the x-axis with bin index while changing `f_s`, or use
`abs(X)` without recording `N` and scaling. **Test:** the same physical tone
sampled at two rates must map to different Hz labels but the expected physical
frequency; inverse reconstruction must also pass. **Reset:** restore the rate-
aware axis and documented amplitude convention.

## Checkpoint

- [ ] Write the forward and inverse DFT equations and locate the `1/N` factor.
- [ ] Convert bin `k=6` to Hz when `N=32` and `f_s=160 Hz`.
- [ ] Explain why a real signal has mirrored complex coefficients.
- [ ] Give one reason a tone can occupy multiple DFT bins.

## What this does not solve

The DFT does not provide precise time localisation inside its window, separate
two frequencies below its resolution, or remove noise. Magnitude-only features
can discard phase and absolute alignment, which may be decisive for a task.

## Continue, go deeper, apply it

- Continue: Frequency filtering and the convolution theorem
- Go deeper: Spectrograms and time–frequency trade-offs
- Apply it: Vision/audio case study
