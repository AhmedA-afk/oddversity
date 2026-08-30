---
title: "Quiz: Uncertainty and Calibration"
track: "hallucinations"
status: live
summary: "Ten questions on reading reliability diagrams, computing calibration gaps, choosing black-box signals, and RLHF's effect on confidence."
duration: "9 min read"
---

Ten questions covering the whole module. The bin-arithmetic and signal-choice questions are the ones worth slowing down for — they're the ones you'll actually use.

## 1. On a reliability diagram, a bin plotted below the diagonal line means what?

A. The model answered too few questions in that bin to matter
B. The bin's stated confidence is higher than its empirical accuracy — overconfidence
C. The bin's stated confidence is lower than its empirical accuracy — underconfidence
D. The entropy of that bin's answers is zero

<details><summary>Answer</summary>

**Correct: B.** The diagonal is `accuracy = confidence`; a point below it has accuracy lower than the confidence claimed for it, which is overconfidence — see [Deep Dive: Calibration Error and Reliability Diagrams](/learn/hallucinations/calibration-error-reliability-diagrams).

- A is wrong: bin size is shown by marker size or reported separately, not by vertical position.
- B is correct.
- C is backwards — that's a point *above* the diagonal.
- D is wrong: entropy over sampled answers is a different measurement entirely and isn't what the diagram's axes represent.

</details>

## 2. A bin contains 5 predictions, each stated at 0.8 confidence. Three of the five are correct. Is this bin over- or underconfident, and by how much?

A. Overconfident by 0.2
B. Underconfident by 0.2
C. Overconfident by 0.4
D. Perfectly calibrated

<details><summary>Answer</summary>

**Correct: A.** Accuracy = 3/5 = 0.6. Gap = |0.8 − 0.6| = 0.2, and since stated confidence (0.8) exceeds accuracy (0.6), it's overconfident — the same arithmetic as the worked bins in [Deep Dive: Calibration Error and Reliability Diagrams](/learn/hallucinations/calibration-error-reliability-diagrams).

- A is correct.
- B has the right magnitude but the wrong direction — confidence exceeds accuracy here, not the reverse.
- C miscalculates the accuracy (perhaps by using 2/5 instead of 3/5).
- D is wrong: a 0.2 gap is a real, measurable miscalibration, not a match.

</details>

## 3. You only have access to a hosted model's text output — no logprobs — but you can call it multiple times per question. What's the most direct way to get a real (non-verbalized) uncertainty signal?

A. Ask the model to state a confidence percentage and use that number
B. Resample the question and measure how much the answers agree — via self-consistency or, more precisely, semantic entropy
C. Assume all answers from this model are equally reliable since logprobs aren't available
D. Increase the temperature to 0 and trust the single deterministic output completely

<details><summary>Answer</summary>

**Correct: B.** With no logprob access but a resampling budget, agreement across independent samples — plain self-consistency or the more precise semantic-entropy clustering — is the standard black-box substitute. See [Implementation: Semantic Entropy with Meaning Clustering](/learn/hallucinations/semantic-entropy-clustering-impl).

- A is exactly the antipattern [Verbalized vs. Elicited Confidence](/learn/hallucinations/verbalized-vs-elicited-confidence) warns against — a generated number, not a measurement.
- B is correct.
- C gives up on a real signal that's fully available via resampling.
- D removes the very sampling variance the technique needs to detect disagreement — temperature 0 tells you nothing about how much the distribution actually spreads.

</details>

## 4. Why can't you trust an RLHF-tuned model's stated confidence at face value, even though the same model's base checkpoint was reasonably calibrated?

A. RLHF makes the model factually less knowledgeable
B. RLHF changes the tokenizer, which corrupts logprob values
C. Preference optimization rewards confident-sounding answers because human raters tend to prefer them, flattening the confidence-accuracy relationship regardless of underlying correctness
D. RLHF always disables logprob access entirely

<details><summary>Answer</summary>

**Correct: C.** The reward model is trained on human preference comparisons, and raters tend to favor decisive-sounding answers over honestly hedged ones — optimizing against that reward pushes verbalized and behavioral confidence toward the high end independent of actual accuracy. See [Why Instruction-Tuning and RLHF Degrade Calibration](/learn/hallucinations/why-rlhf-hurts-calibration).

- A is wrong: RLHF doesn't necessarily reduce factual knowledge — the issue is the confidence-accuracy relationship, not the knowledge itself.
- B is wrong: RLHF doesn't alter tokenization.
- C is correct.
- D is wrong: logprob availability is an API/deployment decision, unrelated to whether RLHF was applied.

</details>

## 5. Five samples come back for a factual question: "Paris is the capital of France," "France's capital is Paris," "It's Paris," "The capital city is Paris," "Paris." What does naive token-string entropy report, versus semantic entropy?

A. Both report zero entropy, since all five mean the same thing
B. Naive token-string entropy is high (five distinct strings); semantic entropy is at or near zero (one meaning cluster)
C. Naive token-string entropy is zero; semantic entropy is high
D. Both report high entropy, since the wording varies each time

<details><summary>Answer</summary>

**Correct: B.** This is the exact overcounting problem semantic entropy exists to fix — five different strings look like disagreement under naive string entropy, but bidirectional entailment groups them into one cluster with probability 1, giving `H = 0`. See [Deep Dive: Semantic Entropy, Uncertainty Over Meanings](/learn/hallucinations/semantic-entropy-uncertainty-deep-dive).

- A is wrong for naive string entropy specifically — it operates on the literal strings, which do differ, so it doesn't report zero.
- B is correct.
- C has the two entropy measures backwards.
- D is wrong for semantic entropy, which is built precisely to not be fooled by wording variation.

</details>

## 6. Bin X: confidence 0.7, accuracy 0.7, n=50. Bin Y: confidence 0.95, accuracy 0.6, n=50. What is the ECE across just these two bins?

A. 0.0
B. 0.175
C. 0.35
D. 0.025

<details><summary>Answer</summary>

**Correct: B.** Gap(X) = |0.7 − 0.7| = 0. Gap(Y) = |0.95 − 0.6| = 0.35. Equal weights (50/100 each): ECE = 0.5×0 + 0.5×0.35 = 0.175. Same formula as [Deep Dive: Calibration Error and Reliability Diagrams](/learn/hallucinations/calibration-error-reliability-diagrams).

- A ignores bin Y's large gap entirely.
- B is correct.
- C forgets to weight by the 0.5 bin proportions (that's the sum of the two gaps, not the weighted average).
- D applies the weights but miscalculates one of the gaps.

</details>

## 7. Why is a verbalized confidence score generally worse evidence than an elicited (derived) one, even when both are trying to describe the same underlying uncertainty?

A. Verbalized scores are always lower than elicited ones
B. A verbalized score is generated text from the same next-token process as the answer itself, with no privileged access to the model's actual internal state, and is additionally biased toward round, confident-sounding numbers
C. Elicited confidence requires no computation at all
D. Verbalized confidence is only available in older models

<details><summary>Answer</summary>

**Correct: B.** See [Verbalized vs. Elicited Confidence](/learn/hallucinations/verbalized-vs-elicited-confidence) and [Intuition: Fluency Is Not Confidence](/learn/hallucinations/why-fluent-text-feels-confident) — the model has no introspective channel into whether a fact was well-represented in training versus pattern-completed, so a self-report is just more generated text, with an observed bias toward round, high numbers on top.

- A is wrong: verbalized scores skew high (overconfident), not low.
- B is correct.
- C is backwards: elicited confidence (logprobs, resampling, entailment clustering) requires more computation, not less — that's part of its cost, not a reason to prefer it.
- D is wrong: verbalized confidence is available in essentially any current model with a text interface.

</details>

## 8. Raising the confidence threshold required before a system will answer directly (rather than abstain) typically does what to coverage and accuracy-on-answered?

A. Both increase
B. Both decrease
C. Coverage decreases, accuracy-on-answered increases
D. Coverage increases, accuracy-on-answered decreases

<details><summary>Answer</summary>

**Correct: C.** A stricter threshold answers fewer questions (lower coverage) but filters out the lower-confidence — and, if the signal is any good, more error-prone — cases, raising accuracy on the subset still being answered. See the tradeoff table in [Abstention as a First-Class Behavior](/learn/hallucinations/abstention-as-a-skill).

- A and B both assume the two move together; they move in opposite directions.
- C is correct.
- D has both directions backwards.

</details>

## 9. A team measures calibration and picks an escalation threshold on their billing-FAQ bot, then reuses the same numeric threshold, unchanged, on a new legal-document assistant built from the same base model. What's the risk, and what should they do?

A. No risk — calibration is a property of the model, not the question domain, so the threshold transfers safely
B. The threshold may be miscalibrated for the new domain, since accuracy-per-confidence-bin depends on the question distribution; they should remeasure calibration on the legal-document domain before trusting the threshold
C. They should lower the threshold automatically for any new domain, since legal questions are always harder
D. They should raise the temperature to compensate for the domain change

<details><summary>Answer</summary>

**Correct: B.** Calibration is measured against a specific question distribution — see [Common Mistakes: Confidence Antipatterns](/learn/hallucinations/confidence-antipatterns) and the same warning in [Worked Example: Routing by Uncertainty Score](/learn/hallucinations/uncertainty-in-practice-triage). A number that means "safe to answer" in one domain isn't guaranteed to mean the same thing in another.

- A is the exact antipattern being tested — calibration is not domain-independent.
- B is correct.
- C assumes a direction of difficulty without measurement, which is just a different unverified guess.
- D confuses a sampling parameter with a calibration fix; temperature doesn't correct for a domain-mismatched threshold.

</details>

## 10. A model assigns very high token-probability to a specific factual claim that turns out to be false — a commonly repeated misconception. What does this tell you about logprob confidence as a signal?

A. Logprob confidence is broken and should never be used
B. High logprob means the claim is almost certainly true, so this must be a measurement error
C. Logprob reflects how expected a token was under the model's training distribution, not whether the claim is factually correct — a frequently-repeated wrong claim can score just as high as a true one
D. This only happens at temperature 0

<details><summary>Answer</summary>

**Correct: C.** This is the "confident-but-wrong" limitation named explicitly in [Implementation: Deriving Confidence from Token Logprobs](/learn/hallucinations/token-logprob-confidence-impl) and reinforced in [Common Mistakes: Confidence Antipatterns](/learn/hallucinations/confidence-antipatterns): logprob confidence catches guessing, not memorized error, which is why it needs to be paired with grounding rather than trusted alone.

- A overstates the flaw — logprob confidence is still a useful, cheap signal for genuine guessing, just not a truth detector on its own.
- B is exactly the mistake the question is testing against.
- C is correct.
- D is wrong: this failure mode is about training-data frequency, not sampling temperature, and shows up regardless of temperature setting.

</details>

**Related:** [Confidence, Uncertainty, and Calibration: Three Different Things](/learn/hallucinations/confidence-uncertainty-calibration-defs), [Deep Dive: Calibration Error and Reliability Diagrams](/learn/hallucinations/calibration-error-reliability-diagrams), [Deep Dive: Semantic Entropy, Uncertainty Over Meanings](/learn/hallucinations/semantic-entropy-uncertainty-deep-dive), [Why Instruction-Tuning and RLHF Degrade Calibration](/learn/hallucinations/why-rlhf-hurts-calibration), [Cheatsheet: Confidence Signals and Calibration](/learn/hallucinations/uncertainty-cheatsheet)
