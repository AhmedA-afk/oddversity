---
title: "Why Instruction-Tuning and RLHF Degrade Calibration"
track: "hallucinations"
status: live
summary: "Preference optimization rewards confident-sounding answers over honestly hedged ones, flattening a base model's calibration."
duration: "6 min read"
---

Base language models, trained purely to predict the next token, are often reasonably calibrated in the statistical sense — their token probabilities track real uncertainty fairly well. Put the same architecture through instruction-tuning and RLHF, and that property degrades. This isn't a bug that slipped through; it's close to a mechanical consequence of what preference optimization is actually rewarding.

## What it is

Pretraining fits a broad distribution over continuations to match corpus frequency — in a real sense, that's a calibration target built into the objective itself: predicting the next token well means the model's probabilities should track how often each continuation actually occurs. RLHF adds a second stage on top: a reward model trained on human preference comparisons, and a policy fine-tuned to score well against that reward model. The reward model's own quality — including whether *it* rewards well-calibrated hedging or confidently-worded answers — becomes the new thing the policy is optimizing toward, and it's optimizing toward that, not toward matching training-corpus frequencies anymore.

## The mental model

Picture calibration as a dial the base model came with, roughly centered from matching the statistics of huge amounts of text. RLHF doesn't remove the dial — it's a second hand reaching in and turning it, guided entirely by what a reward model (itself trained on human raters comparing answers) scores as "better." If raters systematically prefer confident, complete-sounding answers over hedged, accurate ones — a well-documented direction of bias in preference judgments — the dial gets turned toward "sound sure," independent of whether the underlying claim is actually more often true.

## Why it works this way

Human raters comparing two candidate answers tend to reward the one that reads as decisive and complete, even when the more honest answer is the hedged one. A reward model trained on those comparisons inherits that preference. Optimizing a policy against that reward model — whether via RL or a preference-based method like DPO — pushes the token distribution toward confident phrasing across the board, because that's what scores well, not because confident phrasing is more often correct. The result is a flattened confidence-accuracy relationship: whatever variation in hedge-language existed in the base model, correlated at least loosely with the model's own uncertainty, gets pushed toward "sound sure" regardless of difficulty. See [Instruction Tuning and RLHF](/learn/llm-foundations/next-token-prediction) for the mechanics of the base training objective this reshapes.

## A concrete example — before/after reliability sketch

Same underlying question set, evaluated on a base model and then on an RLHF-tuned version of it. The base model's stated or logprob-derived confidence spreads out with question difficulty, tracking accuracy reasonably well:

| Stated confidence (base model) | Empirical accuracy |
|---|---|
| ~0.3 | ~0.31 |
| ~0.5 | ~0.52 |
| ~0.7 | ~0.68 |
| ~0.9 | ~0.87 |

The RLHF-tuned model, asked the *same* questions, verbalizes confidence that clusters almost entirely into the high end — questions that were genuinely hard get answered just as assertively as questions that were easy:

| Stated confidence (RLHF-tuned model) | Empirical accuracy |
|---|---|
| ~0.9 | ~0.55 |
| ~0.9 | ~0.70 |
| ~0.95 | ~0.80 |
| ~0.95 | ~0.88 |

The spread that used to correlate with real difficulty has collapsed into one dominant confidence bin with a wide range of actual accuracy sitting underneath it — exactly the flattening this lesson is about, and exactly the pattern a reliability diagram would show as several points clustered near the top-right instead of spread along the diagonal (see [Deep Dive: Calibration Error and Reliability Diagrams](/learn/hallucinations/calibration-error-reliability-diagrams)).

## Where it shows up

Chat products where every answer, hard trivia or basic fact alike, gets delivered with the same assertive tone; models that resist hedging on genuinely obscure or ambiguous questions even when explicitly asked to; verbalized confidence scores ([Verbalized vs. Elicited Confidence](/learn/hallucinations/verbalized-vs-elicited-confidence)) that sit near ceiling almost regardless of the question.

## Watch out for

- **Assuming a "please hedge appropriately" system prompt fixes this.** It's fighting the trained reward gradient directly, and can nudge surface phrasing without restoring the underlying confidence-accuracy relationship — see [Calibration: What Prompting Can't Fix and Training Has To](/learn/hallucinations/calibration-training-vs-prompting) for exactly why prompting tops out here.
- **Treating this as an unavoidable law of RLHF itself.** It's a consequence of what a *given* reward model rewards, not a law of physics — a provider that deliberately includes calibration or honesty signals in reward modeling can partially counteract it. Check rather than assume any specific model is equally miscalibrated.
- **Confusing refusal rate with calibration.** A model tuned to refuse more often (for safety reasons) isn't thereby more calibrated — refusal rate and the confidence-accuracy relationship on the answers it *does* give are different axes entirely.

## The practical split

Prompting is a policy lever: it can shift when a model chooses to hedge or refuse, and it can surface a number when asked. It cannot manufacture calibrated introspection that wasn't trained in, because the model has no privileged access to whether an answer came from well-represented training data or from confident pattern-completion — it can only generate text that sounds like an uncertainty assessment. If you need trustworthy uncertainty from an RLHF-tuned model, don't ask it to self-report — measure an external signal instead, and check that signal's calibration directly with [Implementation: Measuring and Plotting Calibration](/learn/hallucinations/measuring-plotting-calibration-impl) before you threshold on it.

**Related:** [Calibration: What Prompting Can't Fix and Training Has To](/learn/hallucinations/calibration-training-vs-prompting), [Deep Dive: Calibration Error and Reliability Diagrams](/learn/hallucinations/calibration-error-reliability-diagrams), [Verbalized vs. Elicited Confidence](/learn/hallucinations/verbalized-vs-elicited-confidence), [Confidence, Uncertainty, and Calibration: Three Different Things](/learn/hallucinations/confidence-uncertainty-calibration-defs), [Abstention as a First-Class Behavior](/learn/hallucinations/abstention-as-a-skill)
