---
title: "Discrete signals, sampling, and aliasing"
track: "maths-foundations"
status: live
summary: "A discrete signal records a continuous phenomenon at selected times or pixels."
duration: "4 min read"
---

## The short answer

A discrete signal records a continuous phenomenon at selected times or pixels. Sampling rate `f_s` limits which frequencies can be distinguished: for a band-limited signal, `f_s > 2f_max` avoids aliasing. Frequencies above that limit fold into lower, false frequencies. Choose the sampling rate and anti-alias filter before training; a model cannot recover information that sampling discarded.

## Why this matters

Audio microphones, camera sensors, telemetry streams, and image resizing all
turn a continuous field into an array. A classifier can then learn a perfectly
stable shortcut from an alias: a high-frequency texture may look like a low-
frequency stripe, or a tone may appear to change pitch. The bug is upstream of
the model, so more data and a larger network do not repair it.

## How it works

For a continuous signal `x_c(t)`, uniform sampling produces
`x[n] = x_c(nT_s)`, where `T_s = 1/f_s`. A sinusoid at frequency `f` has
samples `sin(2πfn/f_s)`. Frequencies that differ by an integer multiple of
`f_s` give the same samples because

```text
sin(2π(f + k f_s)n/f_s) = sin(2πfn/f_s + 2πkn) = sin(2πfn/f_s).
```

The unique frequencies normally represented lie in the Nyquist interval
`[-f_s/2, f_s/2]`. An analog or digital low-pass anti-alias filter removes
energy above that interval before decimation. The theorem assumes a truly
band-limited signal and ideal timing; real sensors need margin.

## Worked examples and variations

### Example A: a safely sampled tone

**Input:** `x_c(t)=sin(2π·3t)` and `f_s=20 Hz`. **Mechanism:** `3 < 20/2`, so
each cycle has enough samples and the tone remains 3 Hz. **Output:** a discrete
sequence whose DFT has energy near 3 Hz. **Inspect:** plot samples over the
continuous curve. **Decision:** this sampling rate is adequate for the stated
band limit, not necessarily for every future signal.

### Example B: an audible alias

**Input:** a 5 Hz tone sampled at 8 Hz. **Mechanism:** Nyquist is 4 Hz; the
observed alias is `|5-8|=3 Hz`. **Output:** the samples are indistinguishable
from a 3 Hz tone sampled at 8 Hz. **Inspect:** subtract both arrays; every
sample matches up to floating-point error. **Decision:** retain a higher rate or
filter before sampling if 5 Hz carries meaning.

### Boundary case: exactly Nyquist

**Input:** `sin(2π·4n/8)` at `f_s=8 Hz`. **Mechanism:** samples are all zero for
this phase; a cosine at 4 Hz alternates `1,-1,1,-1`. **Output:** phase changes
the sampled appearance dramatically. **Inspect:** test sine and cosine phases,
not only frequency. **Decision:** require a strict margin below Nyquist; the
boundary is fragile.

### Counterexample: downsampling a checkerboard

**Input:** a one-pixel alternating image row `[0,1,0,1,0,1]`, reduced by two.
**Mechanism:** selecting every other pixel yields `[0,0,0]` or `[1,1,1]`
depending on alignment. **Output:** an apparently uniform row. **Inspect:**
compare nearest-neighbour decimation with low-pass-then-decimate. **Decision:**
resize with an appropriate anti-alias filter when high-frequency texture matters.

## An illustrative story

Imagine a vibration monitor whose sampling job is set to 100 Hz while a new
machine produces a 70 Hz resonance. The dashboard shows a convincing 30 Hz
oscillation. This is an illustrative failure, not a report of a particular
incident: the plot can be reproducible and still represent the wrong physical
frequency.

## Two ways to see it

### Builder view

Sampling is an interface contract: state the physical bandwidth, sample rate,
clock, and prefilter. In a dataset, keep those fields with the signal so a
future resize or resampling step cannot silently change the meaning.

### Systems view

Aliasing is an information collision. Two distinct upstream worlds map to one
array, so no downstream deterministic model can know which world occurred.
Uncertainty or multiple sensors can express ambiguity; they cannot reconstruct
the missing phase or frequency without extra assumptions.

## Hands-on

Create a NumPy fixture with `f_s=8`, then sample `sin(2π·3t)` and
`sin(2π·5t)` at the same timestamps. Record the maximum absolute difference and
plot both sequences. Add a second fixture that downsamples an alternating image
row by two.

**Failure state:** the pipeline uses `signal[::2]` with no low-pass filter and
claims that the result preserves all visible detail. **Test:** assert that the
two tones have equal samples and that the image output changes when the source
row is shifted by one pixel; both should fail the “unique reconstruction” claim.
**Reset:** restore a higher sample rate or apply a documented low-pass filter
before decimation, then rerun the plot and assertions.

## Checkpoint

- [ ] State the sampling theorem condition for a signal whose highest frequency is `f_max`.
- [ ] Compute the alias of 13 Hz sampled at 10 Hz.
- [ ] Explain why two continuous frequencies can produce identical discrete samples.
- [ ] Identify where an anti-alias filter belongs in an image-resize pipeline.

## What this does not solve

The Nyquist condition does not fix clock jitter, sensor noise, quantisation,
poor filter design, nonstationary bandwidth, or a label that changes under
resampling. It also does not say how much margin a production sensor needs.

## Continue, go deeper, apply it

- Continue: Convolution and correlation
- Go deeper: Fourier bases and the DFT
- Apply it: Image transforms, interpolation, and invariance
