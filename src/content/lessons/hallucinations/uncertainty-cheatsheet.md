---
title: "Cheatsheet: Confidence Signals and Calibration"
track: "hallucinations"
status: live
summary: "One page: every confidence signal, what it needs, its typical calibration behavior, a starting threshold, and the ECE recipe."
duration: "5 min read"
---

The reference version of this module: what each signal needs, how it typically misbehaves, where to start a threshold, and the recipe for checking whether you can trust it at all.

## Signal comparison — start here, then measure

| Signal | What it needs | Typical calibration behavior | Starting threshold |
|---|---|---|---|
| Verbalized confidence | Just a prompt | Overconfident, clusters at round numbers (90%, 95%), weakly correlated with correctness | Don't threshold on it directly — see [Verbalized vs. Elicited Confidence](/learn/hallucinations/verbalized-vs-elicited-confidence) |
| Token logprob (min or mean) | API logprob access | Better than verbalized, but conflates phrasing uncertainty with fact uncertainty; confident-but-wrong on memorized misconceptions | Min-token probability < 0.15–0.3 → flag, then measure per domain ([impl](/learn/hallucinations/token-logprob-confidence-impl)) |
| Self-consistency agreement | N extra generations, string matching | Cheap; conflates paraphrase disagreement with real disagreement | Majority agreement < 60% across 5 samples → flag ([Self-Consistency](/learn/prompt-engineering/self-consistency-sampling)) |
| Semantic entropy | N extra generations + an entailment model or judge | Best black-box separation of meaning-level uncertainty from phrasing; still can't catch confident-and-consistent hallucination | Entropy > 0.7 bits (on a 1-bit max scale for two dominant clusters) → escalate, then measure ([impl](/learn/hallucinations/semantic-entropy-clustering-impl)) |

Every "starting threshold" above is exactly that — a starting point to be replaced with a measured value from [Implementation: Measuring and Plotting Calibration](/learn/hallucinations/measuring-plotting-calibration-impl), never a number to ship as-is. See [Confidence, Uncertainty, and Calibration: Three Different Things](/learn/hallucinations/confidence-uncertainty-calibration-defs) if any row of this table feels interchangeable with another — they aren't.

## The ECE / reliability-diagram recipe

1. Collect `(confidence, correct)` pairs on a labeled, held-out set.
2. Bin by confidence — start with 5–10 equal-width bins; switch to equal-frequency bins if some bins end up with very few samples.
3. Per bin, compute average confidence, empirical accuracy, and sample count.
4. `ECE = Σ (n_b / N) * |acc(b) - conf(b)|`.
5. Plot bins against the diagonal — points below it mean overconfidence, above it mean underconfidence.
6. Re-measure after any model, prompt, or decoding-parameter change — a stale calibration check is worse than none, because it looks trustworthy.

Full derivation: [Deep Dive: Calibration Error and Reliability Diagrams](/learn/hallucinations/calibration-error-reliability-diagrams). Runnable code: [Implementation: Measuring and Plotting Calibration](/learn/hallucinations/measuring-plotting-calibration-impl).

## Accuracy vs. coverage — the abstention framing

| Confidence threshold to answer | Coverage | Accuracy on answered (illustrative) |
|---|---|---|
| Low (answer almost everything) | ~100% | ~70% |
| Medium | ~70% | ~85% |
| High (answer only the surest cases) | ~30% | ~95% |

Pick the point on this curve where accuracy crosses your use case's acceptable bar — not a round number picked by feel. Full framing: [Abstention as a First-Class Behavior](/learn/hallucinations/abstention-as-a-skill); the gate that enforces it: [Implementation: Eliciting Abstention Without Retraining](/learn/hallucinations/teaching-abstention-via-prompting-impl).

## Which signal can I use? — quick decision guide

- **Only prompt access, no logprobs, no resampling budget** → verbalized confidence, but never as a gate on its own — pair it with explicit permission to abstain, not with a threshold you trust.
- **Logprob access, single generation, latency-sensitive** → token logprob confidence (mean for sequence-level, min for span-level flagging).
- **Can afford a few extra generations, need a cheap check** → self-consistency agreement.
- **Can afford extra generations plus an entailment model, need the most accurate black-box signal** → semantic entropy.
- **Any of the above, but need to catch confident-and-consistent hallucination** → none of these signals alone will — add grounding against retrieved sources ([Grounding: Constraining Answers to Supplied Sources](/learn/hallucinations/grounding-with-source-documents)), since sampling-based signals only detect uncertainty the model actually has.

## The discipline, one line

Measure before you threshold, and re-measure whenever anything upstream changes. Every antipattern in [Common Mistakes: Confidence Antipatterns](/learn/hallucinations/confidence-antipatterns) is a version of skipping that step.

**Related:** [Confidence, Uncertainty, and Calibration: Three Different Things](/learn/hallucinations/confidence-uncertainty-calibration-defs), [Deep Dive: Calibration Error and Reliability Diagrams](/learn/hallucinations/calibration-error-reliability-diagrams), [Implementation: Semantic Entropy with Meaning Clustering](/learn/hallucinations/semantic-entropy-clustering-impl), [Abstention as a First-Class Behavior](/learn/hallucinations/abstention-as-a-skill), [Common Mistakes: Confidence Antipatterns](/learn/hallucinations/confidence-antipatterns)
