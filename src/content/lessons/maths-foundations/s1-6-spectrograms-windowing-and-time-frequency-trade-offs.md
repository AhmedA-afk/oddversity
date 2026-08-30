---
title: "Spectrograms, windowing, and time–frequency trade-offs"
track: "maths-foundations"
status: live
summary: "A spectrogram shows how signal energy varies over time and frequency."
duration: "4 min read"
---

## The short answer

A spectrogram shows how signal energy varies over time and frequency. The short-time Fourier transform (STFT) multiplies each local window by a window function, computes a DFT, and slides to the next position. Longer windows resolve nearby frequencies but blur timing; shorter windows locate events but blur frequency. Choose the compromise from the decision you need to make.

## Why this matters

Audio classifiers often receive a spectrogram as an image-like tensor. Window
length, hop, padding, scale, and dynamic-range compression then become model
inputs, not cosmetic plotting options. A cough, phoneme, machine click, or bird
call can be made easier or impossible to distinguish by the representation.

## How it works

For window `w[m]`, hop `H`, and frame index `r`,

```text
X[r,k] = Σ_{m=0}^{L−1} x[rH+m] w[m] exp(−2π i k m/L).
```

Frequency spacing is `f_s/L`; frame spacing is `H/f_s`. Increasing `L` gives
finer frequency bins but a longer time footprint. A Hann window reduces abrupt
edge discontinuities at the cost of a wider main lobe. Overlap helps reconstruct
or represent transients; it does not create information outside the window.

## Worked examples and variations

### Example A: stationary tone

**Input:** a 440 Hz tone at `f_s=16 kHz`. **Mechanism:** each frame sees nearly
the same periodic structure. **Output:** a horizontal band near 440 Hz.
**Inspect:** convert the bin to Hz and check its width. **Decision:** use a
longer window if separating neighboring steady tones matters.

### Example B: chirp

**Input:** frequency increases from 300 to 3000 Hz. **Mechanism:** successive
frames contain changing local frequencies. **Output:** a diagonal ridge.
**Inspect:** confirm ridge slope against the known sweep. **Decision:** choose
hop size small enough to track the rate of change.

### Boundary case: a short click

**Input:** one impulse inside a long window. **Mechanism:** the event is spread
across many frequency bins and appears at one broad time region. **Output:**
poor frequency meaning but good approximate timing. **Inspect:** repeat with a
short window. **Decision:** favour time resolution when event onset is the label.

### Counterexample: “more resolution is always better”

**Input:** a phoneme classifier with `L` so long that adjacent phonemes share one
frame. **Mechanism:** fine frequency bins come with temporal averaging.
**Output:** frequency detail but blurred transitions. **Inspect:** evaluate onset
and short-event slices, not only average accuracy. **Decision:** tune the window
as a task parameter, not a display preference.

## An illustrative story

An illustrative keyword spotter is tuned on clean, sustained words and looks
better with a long window. On clipped speech, the first consonant is hidden by
the window average. A duration-stratified test explains the regression before a
larger model is tried.

## Two ways to see it

### Builder view

Treat an STFT tensor as `(frames, frequency bins, channels)` with recorded
`f_s`, window, hop, FFT length, padding, and amplitude scale. Plot axes in
seconds and hertz, not array indices.

### Measurement view

The uncertainty is structural: a window cannot be both arbitrarily short in time
and arbitrarily narrow in frequency. A spectrogram is a family of local
measurements, not a perfect map of instantaneous frequency.

## Hands-on

Generate a 440 Hz tone, a 300–3000 Hz chirp, and a one-frame click. Compute
spectrograms with a short and long Hann window. Record frequency-bin spacing,
frame spacing, and the visible ridge or onset.

**Failure state:** plot an STFT matrix with pixel indices and call its axes Hz and
seconds, or use a window longer than the clip without documenting padding.
**Test:** assert the frequency axis ends at the Nyquist rate and that a known
440 Hz tone peaks within one bin of 440 Hz. **Reset:** restore metadata-aware
axes and rerun all three fixtures.

## Checkpoint

- [ ] Write the STFT expression and identify window length and hop.
- [ ] Compute frequency spacing for `f_s=16,000` and `L=512`.
- [ ] Choose short or long windows for a transient click and justify it.
- [ ] Explain why a spectrogram plot needs labelled physical axes.

## What this does not solve

An STFT cannot resolve every time–frequency detail, identify a source by itself,
or make a nonstationary signal stationary. Mel scaling, log compression, and
learned front ends add useful invariances but can hide weak events or distort
calibration.

## Continue, go deeper, apply it

- Continue: Image transforms, interpolation, and invariance
- Go deeper: Frequency filtering and the convolution theorem
- Apply it: Vision/audio case study
