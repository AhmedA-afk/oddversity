---
title: "Verbalized vs. Elicited Confidence"
track: "hallucinations"
status: live
summary: "Asking a model how sure it is and measuring how sure it actually is are different operations with very different trustworthiness."
duration: "5 min read"
---

There are two ways to get a confidence number out of a model: ask it to tell you one, or compute one from what it actually does. They are not interchangeable, and treating the first like the second is one of the most common mistakes in this whole area.

## What it is

**Verbalized confidence** is asking the model directly — "how confident are you, 0 to 100?" — and taking whatever number comes back in the generated text. **Elicited confidence** (sometimes called derived confidence) is computed externally, without asking the model to introspect at all: from token logprobs ([Implementation: Deriving Confidence from Token Logprobs](/learn/hallucinations/token-logprob-confidence-impl)), from how much independent samples agree ([self-consistency](/learn/prompt-engineering/self-consistency-sampling)), or from how much they agree *in meaning* ([Deep Dive: Semantic Entropy, Uncertainty Over Meanings](/learn/hallucinations/semantic-entropy-uncertainty-deep-dive)). Both produce a number that looks like a confidence score. Only one of them reflects anything about the model's actual internal state.

## The mental model

Verbalized confidence is asking a student to grade their own exam from memory of how the test felt to take. Elicited confidence is pulling their scratch work, or having them retake equivalent versions of the exam a few times and seeing how consistent the answers are. The self-grade might occasionally be right, but it's built entirely out of impression and social calibration ("I should sound reasonably sure, but not arrogant") rather than out of anything that actually tracks the exam's content.

## Why it works this way

A verbalized number is generated text, produced by the same next-token process that produced the (possibly wrong) answer sitting right next to it — see [Intuition: Fluency Is Not Confidence](/learn/hallucinations/why-fluent-text-feels-confident) for why that process carries no built-in truth signal. Two further biases stack on top of that base problem. First, models trained with human feedback learn that round, socially comfortable numbers ("90%," "95%") are what confident-sounding answers look like, so verbalized scores cluster at those figures rather than spreading out with any fine-grained precision. Second, the same training pressure that produces generally overconfident tone (see [Why Instruction-Tuning and RLHF Degrade Calibration](/learn/hallucinations/why-rlhf-hurts-calibration)) pushes verbalized numbers toward the high end regardless of the underlying question's actual difficulty.

## A concrete example

**Q: "What's the ISBN of the first edition of [an obscure, invented example title]?"**

> "I'm 95% confident the ISBN is 978-0-XXXXX-XX-X." *(the digits are fabricated — this is illustrative of the pattern, not a real citation)*

The stated number is high and specific-sounding. Now elicit confidence instead: sample the same question five times at nonzero temperature. If the five answers give five different ISBNs, semantic entropy on that set is high — the model is clearly guessing, and the resampling exposes it in a way the single verbalized "95%" never could, because the verbalized number was generated once, from the same guess, with no opportunity to reveal disagreement with itself.

## Where it shows up

Verbalized confidence shows up in chat UIs that ask a model to self-rate an answer, in "state your confidence before answering" prompting patterns, and in agent loops that ask a model whether it's sure enough to proceed. Elicited confidence shows up wherever you're willing to pay for extra generations or have logprob access: automated gating, batch scoring of a dataset, and any pipeline where the confidence number actually drives a decision.

## Watch out for

- **Trusting a verbalized percentage as if it were measured.** It's stylistic output, not a statistic — see [Confidence, Uncertainty, and Calibration: Three Different Things](/learn/hallucinations/confidence-uncertainty-calibration-defs) for why a number needs a calibration check before it means anything.
- **Assuming more decimal places mean more rigor.** "87.3% confident" is not more trustworthy than "90% confident" — both are generated text, and false precision is easy to produce and easy to be fooled by.
- **Assuming elicited signals are automatically calibrated just because they're derived.** They're less biased than a self-report, and checkable, but "checkable" isn't the same as "already checked" — run them through [Deep Dive: Calibration Error and Reliability Diagrams](/learn/hallucinations/calibration-error-reliability-diagrams) before trusting a threshold on them either.

## When each is acceptable

Use verbalized confidence as a presentation layer at most — a human-readable hedge phrase shown to a user — only after a real elicited signal underneath has already decided whether to show the answer at all, or in genuinely low-stakes, exploratory settings where being wrong costs nothing. Reach for elicited confidence whenever the number actually drives an automated decision: abstaining, escalating, or requiring a citation. If a threshold in your system depends on a confidence value, that value needs to come from measurement, not from asking.

**Related:** [Intuition: Fluency Is Not Confidence](/learn/hallucinations/why-fluent-text-feels-confident), [Implementation: Deriving Confidence from Token Logprobs](/learn/hallucinations/token-logprob-confidence-impl), [Implementation: Semantic Entropy with Meaning Clustering](/learn/hallucinations/semantic-entropy-clustering-impl), [Why Instruction-Tuning and RLHF Degrade Calibration](/learn/hallucinations/why-rlhf-hurts-calibration), [Confidence Signals: What Model Certainty Actually Reflects](/learn/hallucinations/confidence-and-uncertainty-signals)
