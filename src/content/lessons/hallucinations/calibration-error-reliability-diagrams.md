---
title: "Deep Dive: Calibration Error and Reliability Diagrams"
track: "hallucinations"
status: live
summary: "Derive expected calibration error, read a reliability diagram, and walk the arithmetic on a small labeled set."
duration: "8 min read"
---

*Optional depth. This is the measurement that makes every threshold in this module mean something — worth slowing down for.*

[Confidence, Uncertainty, and Calibration: Three Different Things](/learn/hallucinations/confidence-uncertainty-calibration-defs) established that calibration is a population-level property. This lesson builds the actual statistic and diagram that make it checkable.

## What a reliability diagram shows

Take a large set of (confidence, correct) pairs — one per answer, where confidence is whatever signal you're evaluating (verbalized, logprob-derived, semantic-entropy-derived, doesn't matter which) and "correct" is a ground-truth label. Group them into bins by confidence value. For each bin, plot the average stated confidence on the x-axis against the empirical accuracy of that bin on the y-axis. A perfectly calibrated signal produces points sitting exactly on the diagonal `y = x`: every time it says "70%," it's right 70% of the time. Points **below** the diagonal mean overconfidence — accuracy is lower than the stated confidence claims. Points **above** the diagonal mean underconfidence.

## Binning predictions

The standard approach is equal-width bins over `[0, 1]` — say, ten bins of width 0.1. For each bin `b` containing `n_b` predictions:

- **Bin confidence** `conf(b)` — the average stated confidence of predictions in that bin.
- **Bin accuracy** `acc(b)` — the fraction of predictions in that bin that were actually correct.
- **Bin weight** `n_b / N` — how much of the total data that bin represents.

## Expected Calibration Error

ECE collapses the whole diagram into one number: the weighted average gap between each bin's stated confidence and its actual accuracy.

```text
ECE = Σ_b (n_b / N) * |acc(b) - conf(b)|
```

A perfectly calibrated signal has ECE = 0. There's no universal "good" cutoff — it depends on how much gap your downstream threshold can tolerate — but ECE is the number you report and track over time, not a bin-by-bin picture.

## Worked ECE computation

Eight labeled predictions, already sorted into two confidence bins for clarity:

**Bin 1 — stated confidence ≈ 0.9, four predictions, correctness: [1, 1, 1, 0]**

```text
conf(bin1) = 0.9
acc(bin1)  = 3/4 = 0.75
gap(bin1)  = |0.9 - 0.75| = 0.15
```

**Bin 2 — stated confidence ≈ 0.6, four predictions, correctness: [1, 0, 0, 0]**

```text
conf(bin2) = 0.6
acc(bin2)  = 1/4 = 0.25
gap(bin2)  = |0.6 - 0.25| = 0.35
```

Both bins have equal weight (4 of 8 predictions each, so 0.5):

```text
ECE = 0.5 * 0.15 + 0.5 * 0.35 = 0.075 + 0.175 = 0.25
```

An ECE of 0.25 on this toy set means: on average, stated confidence overstates actual accuracy by 25 percentage points. Both bins sit below the diagonal — this signal is overconfident in both regimes, not just at the extreme end. That pattern — uniformly overconfident rather than only overconfident at the top — is exactly the shape [Why Instruction-Tuning and RLHF Degrade Calibration](/learn/hallucinations/why-rlhf-hurts-calibration) predicts for a model whose confidence signal hasn't been checked.

## Why this makes a threshold meaningful

An abstention or escalation threshold like "escalate anything below 0.7 confidence" is only a real decision rule if 0.7-confidence answers are actually right around 70% of the time. Without the ECE/reliability-diagram check, that threshold is a number that merely looks like a probability. With it, you can pick a threshold from the bin where measured accuracy actually crosses your acceptable bar — see [Worked Example: Routing by Uncertainty Score](/learn/hallucinations/uncertainty-in-practice-triage) for a threshold chosen exactly this way, and [Implementation: Measuring and Plotting Calibration](/learn/hallucinations/measuring-plotting-calibration-impl) for the code that runs this measurement.

## Limits of ECE, stated precisely

- **Bin-width sensitivity.** Too few, wide bins can average away real miscalibration inside a bin; too many, narrow bins leave some bins with only a handful of samples, and their accuracy estimate becomes noisy enough to be meaningless. Equal-frequency (adaptive-width) binning — each bin gets the same *count* of predictions rather than the same confidence range — is the standard fix when data is sparse at the extremes.
- **ECE is an average, not a worst case.** Two very different reliability diagrams — one mildly miscalibrated everywhere, one perfectly calibrated except for one badly-off bin — can produce similar ECE values. Maximum Calibration Error (`MCE = max_b |acc(b) - conf(b)|`) is the companion statistic when the worst bin matters more than the average one, such as a high-stakes bin that's rarely hit but badly wrong when it is.
- **Small labeled sets understate the problem.** With few labeled examples, bins with tiny `n_b` produce unstable accuracy estimates — a bin of two predictions can only show accuracy of 0%, 50%, or 100%, none of which meaningfully estimates a smooth underlying rate. Treat ECE from a small set as a first pass, not a final number, and grow the labeled set before locking in a production threshold.

**Related:** [Implementation: Measuring and Plotting Calibration](/learn/hallucinations/measuring-plotting-calibration-impl), [Why Instruction-Tuning and RLHF Degrade Calibration](/learn/hallucinations/why-rlhf-hurts-calibration), [Confidence, Uncertainty, and Calibration: Three Different Things](/learn/hallucinations/confidence-uncertainty-calibration-defs), [Calibration: What Prompting Can't Fix and Training Has To](/learn/hallucinations/calibration-training-vs-prompting), [Worked Example: Routing by Uncertainty Score](/learn/hallucinations/uncertainty-in-practice-triage)
