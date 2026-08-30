---
title: "Common Mistakes: Confidence Antipatterns"
track: "hallucinations"
status: live
summary: "Six ways teams misuse confidence numbers, from trusting a verbalized score to copy-pasting a threshold across domains."
duration: "6 min read"
---

Every mistake below produces a system that looks fine in a demo and fails quietly in production, because the failure is in the number itself, not in anything visibly broken.

### The mistake: trusting a verbalized confidence percentage

**Why it's wrong:** the number is generated text, produced by the same next-token process that produced the (possibly wrong) answer sitting next to it — see [Intuition: Fluency Is Not Confidence](/learn/hallucinations/why-fluent-text-feels-confident) and [Verbalized vs. Elicited Confidence](/learn/hallucinations/verbalized-vs-elicited-confidence). It reflects learned phrasing patterns, not a readout of internal state.

**Symptom:** a model says "I'm 95% confident" immediately before or after a fabricated detail, and the stated number barely moves between answers you independently know are right and ones you know are wrong.

**Fix:** derive confidence from logprobs, sampling agreement, or semantic entropy instead ([Implementation: Deriving Confidence from Token Logprobs](/learn/hallucinations/token-logprob-confidence-impl), [Implementation: Semantic Entropy with Meaning Clustering](/learn/hallucinations/semantic-entropy-clustering-impl)). If a percentage must be shown to a user, source it from one of those, not from asking the model to grade itself.

### The mistake: setting a threshold without measuring calibration first

**Why it's wrong:** a rule like "escalate below 0.7 confidence" only means something if 0.7-confidence answers are actually right about 70% of the time — otherwise it's an arbitrary number wearing a percent sign (see [Deep Dive: Calibration Error and Reliability Diagrams](/learn/hallucinations/calibration-error-reliability-diagrams)).

**Symptom:** the escalation queue fills with answers that turn out to be correct (threshold too conservative), or the system confidently ships wrong answers that scored just above the cutoff (threshold too loose), and nobody can explain why that specific number was chosen.

**Fix:** run the ECE/reliability-diagram measurement on labeled data first ([Implementation: Measuring and Plotting Calibration](/learn/hallucinations/measuring-plotting-calibration-impl)), then pick the threshold from the bin where measured accuracy actually crosses your acceptable bar.

### The mistake: reusing a threshold tuned on one domain in a different domain

**Why it's wrong:** calibration is measured against a specific question distribution. A semantic-entropy or logprob value that means "clearly uncertain" in one domain can be entirely normal variation in another, because the base rate of ambiguity and the model's training coverage differ by domain.

**Symptom:** a threshold that worked well on a general FAQ bot, copy-pasted onto a technical-support or legal-document bot, ends up escalating almost everything or almost nothing.

**Fix:** remeasure calibration per domain, or at minimum per major question category, before reusing a threshold — exactly the check applied per-question-type in [Worked Example: Routing by Uncertainty Score](/learn/hallucinations/uncertainty-in-practice-triage).

### The mistake: treating high token logprob as high truth

**Why it's wrong:** logprob measures how expected a token was under the model's training distribution, not whether the underlying claim is factually correct. A widely repeated misconception gets a high probability precisely because the model has seen it stated confidently, many times.

**Symptom:** a hallucinated but plausible-sounding claim — a common myth, a fake citation in a totally standard format — scores just as high on logprob confidence as a genuinely true claim.

**Fix:** never use logprob confidence as a standalone truth signal. Pair it with grounding or retrieval checks ([Grounding: Constraining Answers to Supplied Sources](/learn/hallucinations/grounding-with-source-documents)), or with semantic entropy, which is built to catch a different failure mode — see the confident-but-wrong limitation called out directly in [Implementation: Deriving Confidence from Token Logprobs](/learn/hallucinations/token-logprob-confidence-impl).

### The mistake: carrying a confidence threshold across a model or prompt version change

**Why it's wrong:** calibration is a property of a specific model-plus-prompt-plus-decoding combination. A model upgrade, a system-prompt edit, or even a temperature change shifts the confidence-accuracy relationship — see [Why Instruction-Tuning and RLHF Degrade Calibration](/learn/hallucinations/why-rlhf-hurts-calibration) for why this shift is often severe and one-directional (toward overconfidence).

**Symptom:** an escalation or abstention rate that quietly drifts after a routine model upgrade, with no code change to explain it, discovered only when someone audits accuracy on the answered set weeks later.

**Fix:** treat calibration measurement as part of the deploy checklist for any model, prompt, or decoding-parameter change. Rerun the harness; never assume the old threshold still holds.

### The mistake: averaging multiple uncertainty signals into one score without checking agreement

**Why it's wrong:** logprob confidence, semantic entropy, and self-consistency each catch different failure modes. Blending them into a single weighted average lets a strong signal from one method get cancelled out by a weak one from another, hiding exactly the disagreement that was the useful information.

**Symptom:** a case where semantic entropy is high (the model is genuinely torn between different claims across samples) but logprob confidence is high (each individual sample reads fluently and scores well token-by-token) averages into a middling score that clears no threshold — and the confident-sounding wrong answer ships.

**Fix:** treat disagreement between signals as its own escalation trigger rather than smoothing it away. Route to the more conservative lane when signals conflict, the way the borderline case is handled in [Worked Example: Routing by Uncertainty Score](/learn/hallucinations/uncertainty-in-practice-triage).

## Pre-flight checklist

- Every confidence number driving a decision was derived (logprob, sampling, or semantic entropy), never just asked for.
- A threshold exists only after running the ECE/reliability-diagram measurement on labeled data.
- Thresholds are scoped per domain or question category, not copy-pasted across them.
- Logprob-based confidence is paired with a grounding or entropy check, never used alone as a truth signal.
- Calibration is re-measured after any model, prompt, or decoding-parameter change.
- Multiple signals are checked for disagreement before being combined, and disagreement itself routes conservatively rather than being averaged away.

**Related:** [Confidence, Uncertainty, and Calibration: Three Different Things](/learn/hallucinations/confidence-uncertainty-calibration-defs), [Deep Dive: Calibration Error and Reliability Diagrams](/learn/hallucinations/calibration-error-reliability-diagrams), [Why Instruction-Tuning and RLHF Degrade Calibration](/learn/hallucinations/why-rlhf-hurts-calibration), [Worked Example: Routing by Uncertainty Score](/learn/hallucinations/uncertainty-in-practice-triage), [Implementation: Deriving Confidence from Token Logprobs](/learn/hallucinations/token-logprob-confidence-impl)
