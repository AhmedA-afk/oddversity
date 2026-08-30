---
title: "Frequency filtering and the convolution theorem"
track: "maths-foundations"
status: live
summary: "Filtering keeps, attenuates, or removes selected signal frequencies."
duration: "4 min read"
---

## The short answer

Filtering keeps, attenuates, or removes selected signal frequencies. The convolution theorem says that spatial/time convolution becomes multiplication in the Fourier domain: `DFT(x*h)=DFT(x)·DFT(h)` under matching finite-length conventions. This gives two implementation routes, but neither is free: sharp frequency cutoffs can ring, boundary handling changes the result, and phase can shift edges.

## Why this matters

Smoothing sensor noise, removing camera texture, and building a preprocessor for
an ML model all involve a choice about what information to preserve. A filter
that improves a plot can erase a rare event or move a label boundary. Comparing
time-domain and frequency-domain implementations is useful only when padding,
normalisation, and alignment agree.

## How it works

Let `y=x*h`. Applying a DFT gives `Y[k]=X[k]H[k]`; applying the inverse DFT
returns the filtered signal. A low-pass filter has large `|H[k]|` near zero
frequency; a high-pass has large response at high frequencies. A finite signal
requires a boundary convention. Circular DFT multiplication wraps the signal;
linear convolution usually pads first. A discontinuity caused by a sharp cutoff
has slowly decaying sidelobes, producing Gibbs-style ringing.

## Worked examples and variations

### Example A: a moving-average low-pass

**Input:** signal `[1,3,5,7]`, kernel `[1/2,1/2]`. **Mechanism:** adjacent values
are averaged, reducing rapid changes. **Output:** interior trend is smoother.
**Inspect:** compare the frequency response of the two-tap kernel. **Decision:**
use for noise reduction only if the event bandwidth is above the cutoff gap.

### Example B: a high-pass edge filter

**Input:** image row `[0,0,1,1]`, kernel `[-1,1]`. **Mechanism:** constant regions
cancel and a step creates a response. **Output:** an edge with orientation and
alignment. **Inspect:** test a reversed step and a shifted edge. **Decision:**
preserve sign if orientation matters; use magnitude only when it does not.

### Boundary case: a sharp ideal mask

**Input:** a step signal, frequency mask that keeps exactly low bins and zeros
the rest. **Mechanism:** abrupt spectral discontinuity creates long sidelobes.
**Output:** overshoot and undershoot near the edge. **Inspect:** plot the edge
with a smooth transition mask. **Decision:** trade cutoff sharpness against
ringing rather than calling all oscillation sensor noise.

### Counterexample: phase discarded

**Input:** two signals with the same Fourier magnitudes but different phases.
**Mechanism:** magnitude-only filtering treats them as identical spectra.
**Output:** reconstructed waveforms can have different edge positions or shapes.
**Inspect:** preserve complex coefficients and compare reconstructions.
**Decision:** discard phase only after testing that the task is phase-invariant.

## An illustrative story

An illustrative audio denoiser removes every high-frequency bin and sounds clear
on speech, but deletes consonant detail and makes words less intelligible. A
held-out word-recognition slice reveals that “cleaner waveform” and “better
downstream representation” are different objectives.

## Two ways to see it

### Builder view

Design a filter as a transfer function plus a boundary and phase contract. Test
impulse, constant, step, and sinusoid inputs; these expose gain, edge response,
and frequency selectivity with little data.

### Systems view

Filtering is an information trade. It can improve signal-to-noise ratio for one
decision while reducing identifiability for another. The model, filter, and
evaluation distribution form one pipeline.

## Hands-on

Implement a moving-average filter two ways: direct convolution and DFT multiply
with zero-padding to the linear-convolution length. Test it on an impulse, a
constant signal, a step, and a two-tone signal. Plot the filter response and the
edge region separately.

**Failure state:** multiply same-length FFTs without padding and compare with
linear convolution. **Test:** the circular result must differ on the boundary;
the padded frequency-domain result must match the direct result within tolerance.
**Reset:** pad to at least `len(x)+len(h)-1`, document the crop, and rerun the
four fixtures.

## Checkpoint

- [ ] State the convolution theorem in one equation.
- [ ] Explain why linear and circular convolution differ at boundaries.
- [ ] Predict which frequencies a moving average attenuates most.
- [ ] Name one downstream failure caused by an over-aggressive low-pass filter.

## What this does not solve

Frequency filtering cannot decide which information is semantically important,
undo aliasing, or guarantee a better classifier. More sophisticated filters add
parameters and assumptions rather than eliminating the trade-off.

## Continue, go deeper, apply it

- Continue: Spectrograms, windowing, and time–frequency trade-offs
- Go deeper: Fourier bases and the DFT
- Apply it: Vision/audio case study
