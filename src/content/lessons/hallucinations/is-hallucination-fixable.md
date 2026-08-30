---
title: "Deep Dive: Is Hallucination Fixable in Principle?"
track: "hallucinations"
status: live
summary: "Weighs three theoretical limits against the engineering case for driving rates near zero, and lands on calibrated-and-bounded, not zero."
duration: "7 min read"
---

*Optional depth. This lesson steps back from any single technique and asks the question the rest of the course is implicitly answering: can this actually be solved, or only managed? Worth reading once you have the vocabulary from the rest of this module.*

"Solve hallucination" gets said in planning meetings as if it names a coherent engineering target, the same way "reduce checkout latency" does. It doesn't - not for open-ended factual generation. Three theoretical arguments explain why, and one engineering counter-argument explains why that's less discouraging than it sounds.

## Argument 1: some questions have no verification procedure at generation time

For a large class of claims, there is no finite check - available to the model or to anyone - that resolves them at the moment of generation. Genuinely unknowable-at-the-time facts, contested historical causation, and predictions about the future are all cases where "the truth" isn't a lookup away, it's a matter of evidence, judgment, or time passing. A model asked to state something confidently about an inherently uncertain question must either hedge (which the training incentives covered in [training-objective-rewards-guessing](/learn/hallucinations/training-objective-rewards-guessing) actively discourage) or produce something that reads as more certain than the underlying reality supports. No amount of training removes this gap, because it isn't a gap in the model's knowledge - it's a gap in what's knowable at all, at that moment, by anyone.

## Argument 2: the training objective's optimum includes some guessing

The expected-value argument from [training-objective-rewards-guessing](/learn/hallucinations/training-objective-rewards-guessing) showed that a binary correct/incorrect reward signal - common in pretraining-adjacent objectives, benchmarks, and a lot of RLHF setups - makes guessing strictly dominate abstention whenever there's any chance of guessing right. That's not a bug introduced by sloppy training; it's the equilibrium the optimization converges toward given that reward shape. Unless the reward signal is deliberately redesigned to credit calibrated uncertainty - which is possible, and covered later in [why-rlhf-hurts-calibration](/learn/hallucinations/why-rlhf-hurts-calibration) - some rate of confident guessing is what the objective is optimizing *for*, not an accident it's optimizing *despite*.

## Argument 3: training data has irreducible coverage limits

A model's parametric knowledge is a lossy compression of a finite corpus. There will always be a long tail of facts that appear zero or one times in that corpus - a specific person's job history, a small company's founding date, a niche technical detail - and compression error on low-redundancy facts doesn't disappear just because the model gets larger. Bigger models push more facts out of the "thin signal" zone, but they don't eliminate the zone; they shift where its edge sits. There is always a next tier of obscurity waiting past whatever tier the current model handles well.

## The engineering counter-argument

None of the three arguments above says the rate can't be driven very low *for a bounded task*. The move that actually works is changing the target from "never say anything false about the open world" - which the arguments above say is not a coherent target - to "never say anything not traceable to a document I was actually handed, and say so when nothing supports an answer." That reframe converts an open-world knowledge problem into a closed reading-comprehension problem: can the model accurately report what's in front of it, and correctly decline when nothing in front of it answers the question. That's a much more tractable problem to measure and improve, because you can build a test set where the ground truth is simply "what the source document says," rather than "what's true about the world," which nobody can fully enumerate. Grounding ([grounding-with-source-documents](/learn/hallucinations/grounding-with-source-documents)) and abstention ([teaching-models-to-say-i-dont-know](/learn/hallucinations/teaching-models-to-say-i-dont-know)) are exactly this reframe, and they can push measured error rates on a bounded, evaluated task down substantially - not because the three theoretical limits above stopped applying, but because the task got redefined to route around them.

## The precise synthesis

"Fixed to zero, globally, for open-ended factual generation" is not an achievable engineering target, for the reasons above - it would require solving unknowable questions, changing the incentive structure of how these models are trained and scored, and eliminating a long tail that shifts rather than vanishes. "Calibrated and bounded, for a defined task against a defined evidence set, continuously measured" *is* an achievable target, and it's what grounding, abstention, calibration, and evaluation - the rest of this course - are actually building toward. The honest framing to set expectations with, for yourself or a team: you are not going to eliminate hallucination. You are going to define the task narrowly enough that "hallucination" becomes measurable, and then drive that measured rate down and keep it down.

**Related:** [Why the Training Objective Rewards Guessing Over Abstention](/learn/hallucinations/training-objective-rewards-guessing), [Grounding: Constraining Answers to Supplied Sources](/learn/hallucinations/grounding-with-source-documents), [Teaching a Model to Say 'I Don't Know'](/learn/hallucinations/teaching-models-to-say-i-dont-know), [Hallucination Evaluation and Benchmarks](/learn/hallucinations/hallucination-evaluation-and-benchmarks), [Common Myths About Hallucination](/learn/hallucinations/myths-about-hallucination)
