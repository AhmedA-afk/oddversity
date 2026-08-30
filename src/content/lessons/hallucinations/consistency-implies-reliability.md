---
title: "Intuition: If It Keeps Changing Its Story, Distrust It"
track: "hallucinations"
status: live
summary: "A well-known fact survives re-asking with the same core content every time; a fabrication reinvents itself on every retelling."
duration: "6 min read"
---

Picture a detective re-interviewing the same witness three times, a week apart, without telling them it's happening again. A witness recounting something they actually saw gives you the same core details each time — maybe different words, maybe a detail added or dropped, but the same shape. A witness who's making it up has to reinvent the story from scratch each time, because there's no real memory anchoring it, and the details drift, sometimes wildly.

## The core analogy

That's the entire intuition behind sampling-based hallucination detection. A model asked the same question multiple times, at a temperature high enough to actually get different completions, behaves like one of these two witnesses. If it has something real and well-represented anchoring the answer, resampling mostly changes the phrasing. If it's filling a gap with whatever's locally plausible, resampling changes the substance — different names, different numbers, different claims entirely.

## Run the simulation

Ask "What is the capital of France?" five times at temperature 0.8:

```text
1. "The capital of France is Paris."
2. "Paris."
3. "France's capital city is Paris."
4. "It's Paris."
5. "The capital is Paris, France's largest city."
```

Five different sentences, one fact. The wording drifted because temperature does inject real randomness into word choice — but the content converged, because "Paris" is about as solidly represented in the model's training data as any fact gets.

Now ask something the model has no solid basis for — say, the exact attendance figure at a minor, poorly-documented local event:

```text
1. "Attendance was approximately 1,200 people."
2. "Around 3,500 attendees were recorded."
3. "The event drew a crowd of about 800."
4. "Roughly 2,000 people attended."
5. "Attendance figures were not officially published, but estimates suggest around 1,500."
```

Five different numbers. Nothing is anchoring this answer, so each generation reaches for a different plausible-sounding figure. That scatter is the signal — not any single wrong number, but the *disagreement across resamples*. This is exactly the mechanism [Implementation: A Self-Consistency Hallucination Detector](/learn/hallucinations/self-consistency-detector-impl) turns into a runnable check, and it's the same instinct behind [semantic entropy](/learn/hallucinations/semantic-entropy-and-uncertainty-quantification), which clusters resamples by meaning rather than exact wording so that "Paris" and "It's Paris" count as agreement instead of five separate answers.

## The wrong intuition, corrected

Here's the mistake this analogy sets you up to make if you push it too fast: *"If the model gives the same answer every single time, that proves it's right."*

That's backwards, and the failure mode has a name — a systematic error. Imagine a witness who has genuinely, sincerely misremembered something, and misremembered it the same way every time because the false memory itself is stable in their head. Re-asking them ten times gets you the same wrong answer ten times, with total conviction each time. Consistency there isn't evidence of truth — it's evidence that whatever's driving the answer (real memory, or a false one) is stable.

Language models have the exact equivalent: a widely-repeated misconception in training data, or a genuinely common training-data gap, produces the same wrong answer on every resample, because that wrong answer is the dominant, stable pattern the model learned — not a one-off guess. Resampling measures whether the model has one dominant belief. It does not measure whether that belief is correct. [Worked Example: When Self-Verification Rubber-Stamps a Lie](/learn/hallucinations/self-verification-when-it-fails) walks through exactly this failure mode in detail, and [Common Mistakes: When Detectors Give False Comfort](/learn/hallucinations/detection-false-comfort) covers it as one of the classic false-negative traps a detection stage needs to guard against.

## When the analogy breaks

Push the witness picture further and it starts to mislead in a few specific ways:

- **Temperature zero isn't a real interrogation.** If you resample at temperature 0 (fully greedy decoding), you get the identical output every time — not because the fact is solid, but because there was only ever one path available. That's not corroboration, it's asking the same witness the exact same question in the exact same room with the exact same phrasing and calling it independent confirmation. Real signal requires actual randomness in the sampling, the same way [self-consistency sampling](/learn/prompt-engineering/self-consistency-sampling) does for reasoning tasks.
- **A trained-in falsehood isn't a slip.** A witness improvising a lie usually can't keep every fabricated detail straight across retellings — that's what makes fabrication detectable this way. But a witness who was *coached* to always repeat one specific false story will pass this test perfectly. A model with a strong, uniform training-data pattern behind a wrong answer is closer to the coached witness than the improvising liar, and no amount of resampling reveals the difference on its own.
- **Consistency measures variance, not bias.** The whole technique is built to catch instability. It structurally cannot catch a stable, shared error — for that you need something external to compare against, which is why [grounding with source documents](/learn/hallucinations/grounding-with-source-documents) and retrieval-based checks exist as a separate, harder line of defense.

**Related:** [Self-Consistency: Voting Across Multiple Reasoning Paths](/learn/prompt-engineering/self-consistency-sampling), [Implementation: A Self-Consistency Hallucination Detector](/learn/hallucinations/self-consistency-detector-impl), [Semantic Entropy: Measuring Uncertainty by Resampling](/learn/hallucinations/semantic-entropy-and-uncertainty-quantification), [Worked Example: When Self-Verification Rubber-Stamps a Lie](/learn/hallucinations/self-verification-when-it-fails)
