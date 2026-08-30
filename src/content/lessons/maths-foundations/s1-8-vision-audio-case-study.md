---
title: "Vision/audio case study: design a signal representation"
track: "maths-foundations"
status: live
summary: "A good vision or audio pipeline makes its information budget explicit: sample or resize safely, choose a representation matched to the event, test."
duration: "4 min read"
---

## The short answer

A good vision or audio pipeline makes its information budget explicit: sample or resize safely, choose a representation matched to the event, test boundary conditions, and measure robustness under realistic shifts. For a small machine-sound detector, that might mean anti-alias resampling, a documented STFT, and a classifier evaluated by machine, speed, and background-noise slices—not a spectrogram fed to a model without a measurement argument.

## Why this matters

Representation decisions are often treated as preprocessing details even though
they determine what the model can observe. This case study combines sampling,
convolution, Fourier analysis, filtering, windows, and augmentation into one
reviewable design. The goal is not to declare one “best” pipeline; it is to make
the trade-offs inspectable.

## How it works

Suppose the task is binary detection of a short bearing click in 16 kHz audio.
Define the signal contract first: microphone rate, expected band, clip duration,
latency, and label onset. A defensible baseline is:

```text
raw audio → anti-alias resample (if needed) → frame + Hann window
           → magnitude/power STFT → log floor → small CNN → calibrated score
```

The resampler protects against aliasing; the STFT exposes local frequency; the
CNN learns local time–frequency patterns. Each step can also destroy evidence.
Keep a raw reference, transform metadata, and a no-model diagnostic report.

## Worked examples and variations

### Example A: clean click at the design rate

**Input:** a 10 ms click captured at 16 kHz with background below 6 kHz.
**Mechanism:** a 256-sample Hann window and 128-sample hop create local spectra.
**Output:** a transient band with a measurable onset. **Inspect:** plot the
waveform and spectrogram with seconds/Hz axes. **Decision:** check that the event
spans enough frames for the model to see it.

### Example B: device with 8 kHz audio

**Input:** the same event recorded at 8 kHz. **Mechanism:** frequencies above
4 kHz are unavailable; resampling to 16 kHz cannot recreate them. **Output:** a
different representation with possible lost harmonics. **Inspect:** compare
band-limited clips and detection by frequency slice. **Decision:** either accept
the device-specific limit or collect a sensor with adequate bandwidth.

### Boundary case: click on a frame edge

**Input:** event begins exactly where a frame starts or ends. **Mechanism:** the
window weights it differently than an event centred in a frame. **Output:** edge
energy and onset can vary with a one-sample shift. **Inspect:** evaluate shifted
copies and overlap choices. **Decision:** use overlap/aggregation or an invariant
architecture if onset alignment is arbitrary.

### Counterexample: “augmentation makes it robust”

**Input:** time-stretch and gain augmentation applied to every clip, including
labels defined by exact onset duration. **Mechanism:** the transform changes the
label semantics. **Output:** contradictory training examples. **Inspect:** compare
transformed durations and labels; inspect errors by device and noise. **Decision:**
keep only transforms that preserve the target and deployment distribution.

## An illustrative story

An illustrative team sees a 3-point accuracy gain after log-spectrogram
normalisation. A device-held-out split reveals the gain came from microphone
noise signatures, not clicks. The representation is not “bad” in isolation; the
evaluation was asking whether the model could identify devices rather than
generalise to a new one.

## Two ways to see it

### Builder view

Write a pipeline card containing input rate, filter, frame/window/hop, frequency
scale, normalisation statistics, model shape, latency, and test fixtures. Version
it with the model so a preprocessing change is a model change.

### Skeptic view

Ask what information the pipeline removes and what shortcut it preserves. Test
sampling shifts, timing shifts, noise, devices, and label ambiguity. A robust
score is a distribution of slice results, not just the mean.

## Hands-on

Build a tiny reproducible report from synthetic clips: clean click, noisy click,
8 kHz version, one-sample-shifted click, and a non-click periodic tone. Compare a
raw-waveform baseline with an STFT representation. Include two safe and two
rejected augmentations.

**Failure state:** use a 16 kHz model on 8 kHz input by duplicating samples, and
allow a label-changing time stretch. **Test:** the report must fail a sample-rate
contract, flag duplicated bandwidth as non-recovered information, and reject the
invalid label transform. **Reset:** keep native-rate metadata, apply documented
anti-alias resampling only, and rerun slice metrics.

## Checkpoint

- [ ] Defend a sample rate and window/hop choice for a short event.
- [ ] Trace one possible alias or boundary artefact through the pipeline.
- [ ] Show one transform that preserves the label and one that does not.
- [ ] Report at least two robustness slices and one limitation before choosing a model.

## What this does not solve

This pipeline does not identify the physical cause of a sound, guarantee domain
generalisation, or replace data collection. A strong synthetic test can still
miss microphone, placement, codec, environment, or annotation shifts.

## Continue, go deeper, apply it

- Continue: Sequential decision-making and RL
- Go deeper: Spectrograms, windowing, and time–frequency trade-offs
- Apply it: Interpretability and error analysis
