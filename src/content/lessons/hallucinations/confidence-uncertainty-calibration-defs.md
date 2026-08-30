---
title: "Confidence, Uncertainty, and Calibration: Three Different Things"
track: "hallucinations"
status: live
summary: "Confidence, uncertainty, and calibration measure different things, and mixing them up breaks every threshold built on top of them."
duration: "6 min read"
---

People say "the model wasn't confident" and "the model isn't calibrated" like they're the same complaint. They aren't. This module is about turning a model's behavior into numbers you can threshold on, and that only works if you keep these three words apart from the start.

## What it is

Three separate, independently measurable properties:

- **Confidence** is a number attached to a single answer — how sure the model is (or appears to be) about *this* claim, right now. It can come from a self-report, a token probability, or a resampling statistic.
- **Uncertainty** is the spread of plausible answers the model's own distribution actually supports for a given input. A question with one dominant, well-supported answer has low uncertainty; a question the model could plausibly answer five different ways has high uncertainty, independent of what confidence number gets reported.
- **Calibration** is a property of a *population* of confidence scores, not any single one: across every time the model says "I'm 80% sure," is it actually right about 80% of the time? Calibration is what tells you whether a confidence number is worth trusting at all.

You cannot check calibration from one answer. You need many answers, binned by their stated confidence, compared against how often each bin was actually correct — the machinery [Calibration Error and Reliability Diagrams](/learn/hallucinations/calibration-error-reliability-diagrams) builds in full.

## The mental model

Think of a weather forecaster. "70% chance of rain tomorrow" is a **confidence** statement about one day. Whatever is physically true about tomorrow's atmosphere — genuinely borderline, or actually going to rain regardless of what anyone predicts — is the **uncertainty**. Whether that forecaster is any good is a question you can only answer by pooling every day they ever said "70%" and checking whether it rained on close to 70% of them. That pooled check is **calibration**, and it's completely invisible from a single forecast, no matter how thoughtfully it was made.

An LLM's stated or derived confidence is the "70%." The actual difficulty of the question is the uncertainty. Whether you should trust that "70%" at all is calibration — and for language models, the answer is often no, for reasons [Why Instruction-Tuning and RLHF Degrade Calibration](/learn/hallucinations/why-rlhf-hurts-calibration) covers in depth.

## Why it works this way

Confidence and uncertainty are properties you can, in principle, compute per instance — from logprobs, from how much a model's samples agree, from [semantic entropy](/learn/hallucinations/semantic-entropy-uncertainty-deep-dive). Calibration is structurally different: it's a statistical claim about a *relationship* between stated confidence and empirical accuracy, and a relationship needs more than one data point to exist. This is why "the model said 95% and was right" proves nothing about calibration — one match, or one miss, is consistent with almost any underlying calibration quality. Calibration only becomes measurable, and therefore actionable, once you have enough labeled instances to bin.

## A concrete example

Two models each answer 100 questions from the same set, and each says "90% confident" on every single one:

| Model | Stated confidence | Actual accuracy on those 100 | Calibrated? |
|---|---|---|---|
| A | 90% | 88/100 correct | Yes — close match |
| B | 90% | 45/100 correct | No — badly overconfident |

Both models produced the identical confidence number. Their uncertainty-handling and calibration are worlds apart. If you only look at one answer from Model B — "I'm 90% sure the treaty was signed in 1907" — there is no way to tell, from that instance alone, that it's the overconfident one.

## Where it shows up

Every downstream technique in this module produces a confidence-like number and needs a place to be honest about what kind of number it is: mean token logprob ([Deriving Confidence from Token Logprobs](/learn/hallucinations/token-logprob-confidence-impl)) is an uncertainty proxy, not automatically calibrated; a verbalized percentage ([Verbalized vs. Elicited Confidence](/learn/hallucinations/verbalized-vs-elicited-confidence)) is a confidence claim with famously poor calibration; semantic entropy is a direct uncertainty measurement that still needs its own calibration check before you threshold on it. See [Confidence Signals: What Model Certainty Actually Reflects](/learn/hallucinations/confidence-and-uncertainty-signals) for the signal landscape this module measures in detail.

## Watch out for

- **Treating "uncertain" and "miscalibrated" as the same complaint.** A model can be genuinely, correctly uncertain (the question is hard) while also being perfectly calibrated about it (it says so honestly) — or confidently wrong while poorly calibrated. These are two different failures with two different fixes.
- **Trusting one well-worded confidence output.** A single instance can never establish calibration, no matter how reasonable it sounds. You need a labeled sample and a bin.
- **Confusing hedging frequency with calibration.** A model that says "I'm not sure" constantly can still be poorly calibrated — if it's just as likely to hedge on things it actually knows as on things it doesn't, the hedging rate tells you nothing about whether its stated uncertainty tracks real accuracy.

## Where next

Start with why confident-sounding text is such weak evidence in the first place: [Intuition: Fluency Is Not Confidence](/learn/hallucinations/why-fluent-text-feels-confident). Then move to the two families of signal this module builds — token-level ([Deriving Confidence from Token Logprobs](/learn/hallucinations/token-logprob-confidence-impl)) and meaning-level ([Deep Dive: Semantic Entropy, Uncertainty Over Meanings](/learn/hallucinations/semantic-entropy-uncertainty-deep-dive)) — before getting to the measurement that ties them together.

**Related:** [Confidence Signals: What Model Certainty Actually Reflects](/learn/hallucinations/confidence-and-uncertainty-signals), [Intuition: Fluency Is Not Confidence](/learn/hallucinations/why-fluent-text-feels-confident), [Deep Dive: Calibration Error and Reliability Diagrams](/learn/hallucinations/calibration-error-reliability-diagrams), [Calibration: What Prompting Can't Fix and Training Has To](/learn/hallucinations/calibration-training-vs-prompting), [Deep Dive: Semantic Entropy, Uncertainty Over Meanings](/learn/hallucinations/semantic-entropy-uncertainty-deep-dive)
