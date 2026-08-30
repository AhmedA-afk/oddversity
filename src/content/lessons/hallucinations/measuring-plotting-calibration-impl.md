---
title: "Implementation: Measuring and Plotting Calibration"
track: "hallucinations"
status: live
summary: "A reusable harness that bins confidence scores, computes ECE, plots a reliability diagram, and recalibrates with isotonic regression."
duration: "8 min read"
---

[Deep Dive: Calibration Error and Reliability Diagrams](/learn/hallucinations/calibration-error-reliability-diagrams) derives the maths by hand. This lesson turns it into a harness you can point at any confidence signal in this module before you trust it.

## What we're building

A small library that takes (confidence, correct) pairs, bins them, computes ECE, plots a reliability diagram, and applies a simple post-hoc recalibration — then re-measures to show the curve move toward the diagonal.

## Setup

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.isotonic import IsotonicRegression
```

Your input is a list of `(confidence: float, correct: int)` pairs from a labeled evaluation set — the output of running any of this module's signals (logprob confidence, semantic entropy converted to a confidence-like score, verbalized) against questions with known answers.

## Build it

### Step 1: Bin the data

```python
def bin_predictions(confidences: np.ndarray, corrects: np.ndarray, n_bins: int = 10) -> list[dict]:
    edges = np.linspace(0, 1, n_bins + 1)
    bins = []
    for lo, hi in zip(edges[:-1], edges[1:]):
        mask = (confidences >= lo) & (confidences < hi) if hi < 1 else (confidences >= lo) & (confidences <= hi)
        if mask.sum() == 0:
            continue
        bins.append({
            "lo": lo, "hi": hi,
            "n": int(mask.sum()),
            "conf": float(confidences[mask].mean()),
            "acc": float(corrects[mask].mean()),
        })
    return bins
```

> **Why this step?** Empty bins would otherwise corrupt the weighted ECE average and clutter the plot with meaningless zero-width points.

### Step 2: Compute ECE

```python
def expected_calibration_error(bins: list[dict], n_total: int) -> float:
    return sum((b["n"] / n_total) * abs(b["acc"] - b["conf"]) for b in bins)
```

This is the exact formula from [Deep Dive: Calibration Error and Reliability Diagrams](/learn/hallucinations/calibration-error-reliability-diagrams) — running it on that lesson's worked bins (`conf=0.9, acc=0.75, n=4` and `conf=0.6, acc=0.25, n=4`) reproduces `ECE = 0.25`.

### Step 3: Plot the reliability diagram

```python
def plot_reliability_diagram(bins: list[dict], title: str = "Reliability diagram"):
    fig, ax = plt.subplots(figsize=(5, 5))
    ax.plot([0, 1], [0, 1], linestyle="--", color="gray", label="Perfect calibration")
    xs = [b["conf"] for b in bins]
    ys = [b["acc"] for b in bins]
    sizes = [b["n"] for b in bins]
    ax.scatter(xs, ys, s=[20 + 4 * n for n in sizes], label="Measured bins")
    ax.set_xlabel("Stated confidence")
    ax.set_ylabel("Empirical accuracy")
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    ax.set_title(title)
    ax.legend()
    return fig
```

Points below the dashed diagonal are overconfident bins; above it, underconfident. Marker size scales with bin count so a reader can tell a well-supported bin from a thin one at a glance.

### Step 4: Post-hoc recalibration with isotonic regression

Isotonic regression fits a non-decreasing step function mapping raw confidence to empirical probability — it doesn't require access to logits (unlike temperature scaling), just the confidence scores you already have, which makes it the simpler fit for signals like semantic entropy or self-consistency agreement that were never logits in the first place.

```python
def fit_recalibrator(confidences: np.ndarray, corrects: np.ndarray) -> IsotonicRegression:
    ir = IsotonicRegression(out_of_bounds="clip")
    ir.fit(confidences, corrects)
    return ir

def recalibrate(ir: IsotonicRegression, confidences: np.ndarray) -> np.ndarray:
    return ir.predict(confidences)
```

## Run it

Using the same two-bin scenario as the deep dive — raw confidence 0.9 predictions that are actually right 75% of the time, and raw 0.6 predictions right 25% of the time:

```python
rng = np.random.default_rng(0)
conf_09 = np.full(200, 0.9); correct_09 = (rng.random(200) < 0.75).astype(int)
conf_06 = np.full(200, 0.6); correct_06 = (rng.random(200) < 0.25).astype(int)

confidences = np.concatenate([conf_09, conf_06])
corrects = np.concatenate([correct_09, correct_06])

bins_before = bin_predictions(confidences, corrects)
print("ECE before:", expected_calibration_error(bins_before, len(confidences)))
# ECE before: ~0.25

ir = fit_recalibrator(confidences, corrects)
recalibrated = recalibrate(ir, confidences)

bins_after = bin_predictions(recalibrated, corrects)
print("ECE after:", expected_calibration_error(bins_after, len(confidences)))
# ECE after: close to 0 on this same data
```

The recalibrator learns to map raw scores near 0.9 down toward ~0.75, and raw scores near 0.6 down toward ~0.25 — pulling the reliability diagram toward the diagonal. That "ECE after" number is measured on the *same* data the recalibrator was fit on, which brings us straight to Harden It.

## Harden it

- **Never fit and evaluate on the same set.** An isotonic regressor fit on your evaluation data will always look close to perfectly calibrated on that same data — that's overfitting the recalibration curve, not genuine improvement. Split into a calibration-fitting set and a separate held-out evaluation set, fit `IsotonicRegression` only on the first, and report ECE only on the second.
- **Watch bin sample sizes.** If a bin's `n` is small, its accuracy estimate is noisy — don't over-interpret a single sparse bin sitting far off the diagonal. Prefer equal-frequency bins ([Deep Dive: Calibration Error and Reliability Diagrams](/learn/hallucinations/calibration-error-reliability-diagrams)) when your confidence distribution is lumpy.
- **Re-run this after any change.** A model swap, a prompt edit, or a decoding-parameter change shifts the confidence-accuracy relationship — see [Why Instruction-Tuning and RLHF Degrade Calibration](/learn/hallucinations/why-rlhf-hurts-calibration). Wire this harness into your eval pipeline, not into a one-time notebook.

## Extend it

Wrap Steps 1–4 into a single `CalibrationHarness` object and point it at every signal before you trust it as a gate: raw logprob confidence ([Implementation: Deriving Confidence from Token Logprobs](/learn/hallucinations/token-logprob-confidence-impl)), semantic entropy converted to a confidence-like score ([Implementation: Semantic Entropy with Meaning Clustering](/learn/hallucinations/semantic-entropy-clustering-impl)), or a verbalized percentage ([Verbalized vs. Elicited Confidence](/learn/hallucinations/verbalized-vs-elicited-confidence)) — a signal you haven't measured this way isn't a threshold candidate yet, it's a guess. The output feeds directly into threshold-setting in [Worked Example: Routing by Uncertainty Score](/learn/hallucinations/uncertainty-in-practice-triage) and the abstention gate in [Implementation: Eliciting Abstention Without Retraining](/learn/hallucinations/teaching-abstention-via-prompting-impl).

**Related:** [Deep Dive: Calibration Error and Reliability Diagrams](/learn/hallucinations/calibration-error-reliability-diagrams), [Why Instruction-Tuning and RLHF Degrade Calibration](/learn/hallucinations/why-rlhf-hurts-calibration), [Implementation: Deriving Confidence from Token Logprobs](/learn/hallucinations/token-logprob-confidence-impl), [Cheatsheet: Confidence Signals and Calibration](/learn/hallucinations/uncertainty-cheatsheet), [Worked Example: Routing by Uncertainty Score](/learn/hallucinations/uncertainty-in-practice-triage)
