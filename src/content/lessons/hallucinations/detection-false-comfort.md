---
title: "Common Mistakes: When Detectors Give False Comfort"
track: "hallucinations"
status: live
summary: "Six ways a detector can pass a bad answer with total confidence, from shared blind spots to thresholds that don't survive contact."
duration: "7 min read"
---

A detection score that ships a wrong answer is worse than no detector at all, because it comes with false confidence attached. Every mistake below produces exactly that: a clean-looking pass on something that shouldn't have passed.

### The mistake: trusting a high self-consistency score on a stable-but-wrong answer

**Why it's wrong:** self-consistency measures whether the model has one dominant belief, not whether that belief is true. A widely-repeated misconception in training data resamples identically every time, for the same reason a correct fact does — because it's the stable, dominant pattern, right or wrong. See [Intuition: If It Keeps Changing Its Story, Distrust It](/learn/hallucinations/consistency-implies-reliability) for the full mechanism.

**Symptom:** an `agreement_ratio` of 1.0 on a confidently wrong claim, no flag raised, and the answer ships looking exactly as trustworthy as a genuinely well-grounded one.

**Fix:** never treat perfect agreement alone as proof of correctness on a high-stakes claim. Pair resampling with an external check — [retrieval-based fact checking](/learn/hallucinations/retrieval-based-factuality-check) or [NLI grounding](/learn/hallucinations/nli-entailment-grounding-check-impl) — for anything where a stable wrong answer would actually cost something.

### The mistake: using a same-family judge to check a same-family generator

**Why it's wrong:** a judge and a generator from the same model family share training data, architectural quirks, and stylistic preferences. Asking a judge to check an answer from its own family is closer to asking the model to re-confirm itself than to getting genuinely independent evidence — the same shared-belief problem [Worked Example: When Self-Verification Rubber-Stamps a Lie](/learn/hallucinations/self-verification-when-it-fails) walks through for self-verification.

**Symptom:** the judge's approval rate looks excellent in internal testing, but the exact same class of factual gap keeps slipping through to production, unflagged, every time.

**Fix:** use a different model family for judging when you can — see the independence argument in [Implementation: Cross-Checking Across Multiple Models](/learn/hallucinations/ensemble-cross-check-impl) — or supplement judge calls with a grounding check that doesn't depend on any model's parametric memory at all.

### The mistake: tuning a threshold on one distribution and shipping it everywhere

**Why it's wrong:** an agreement ratio or judge score threshold calibrated against open trivia questions doesn't transfer to a RAG faithfulness task or a coding assistant — the base rate of hallucination and the shape of typical failures are different in each, so the same cutoff means something different in each.

**Symptom:** a detector that looked sharp in a demo notebook either floods production with false positives on real traffic, or lets through failures the demo set never surfaced.

**Fix:** calibrate the threshold per task and domain against real or representative traffic, and re-validate whenever the traffic distribution shifts meaningfully — see [Evaluating Your Detector](/learn/hallucinations/evaluating-your-detector) for how to build that evaluation properly, rather than picking a number and moving on.

### The mistake: skipping isolation in a self-verification pass

**Why it's wrong:** if the verification step can see the original draft, the model tends to just re-confirm what it already wrote instead of genuinely re-deriving it — the same anchoring effect that makes leading questions so effective at extracting agreement. [Implementation: Self-Verification and Chain-of-Verification](/learn/hallucinations/self-verification-chain-impl) builds isolation in as a deliberate, separate call for exactly this reason.

**Symptom:** a verification pass that almost never flags anything, regardless of how bad the draft actually is — pass rates near 100% across the board, on drafts of clearly uneven quality.

**Fix:** run verification questions in a fresh context with no view of the original draft, and check periodically that the pass rate actually varies with draft quality — a verifier that never disagrees isn't verifying anything.

### The mistake: treating a past detection pass as a permanent guarantee

**Why it's wrong:** a detection score reflects a specific query, output, model version, and retrieval corpus at one point in time. A model update, a prompt change, or a shifted retrieval index can silently change what kinds of failures slip past a detector that was tuned against the old conditions.

**Symptom:** a detector's real-world false-negative rate creeps upward quietly after a model version bump or a retrieval index change that nobody flagged as detector-relevant.

**Fix:** monitor detector performance on an ongoing basis, not just at launch — this is exactly what production monitoring and CI-style tracking of hallucination rate exist to catch.

### The mistake: treating "no evidence found" as "the claim is false"

**Why it's wrong:** a retrieval-based check that comes back empty could mean the claim is genuinely false, or it could mean the claim is true but obscure, too recent, or simply outside your index's coverage — see [Retrieval-Based Fact Checking as Detection](/learn/hallucinations/retrieval-based-factuality-check) for why this ambiguity is structural, not a bug in a particular implementation.

**Symptom:** a detector that flags a large volume of true-but-uncommon claims as hallucinated, purely because the search index doesn't cover them — high false-positive rate that looks like caution but is actually a coverage gap.

**Fix:** keep "unsupported/unverifiable" and "contradicted" as separate outcomes and route them differently — contradicted claims are strong candidates for blocking or correction, unverifiable ones are candidates for hedging or escalation, not automatic rejection.

## Pre-flight checklist

- A high self-consistency score is never treated as sufficient proof on a claim where being wrong is costly.
- Judges are drawn from a different model family than the generator wherever practical, or paired with an external grounding check.
- Detection thresholds are calibrated against real or representative traffic for the specific task, not borrowed from a different domain.
- Self-verification questions are answered in a context that never shows the original draft.
- Detector performance is monitored continuously, with re-validation after any model, prompt, or corpus change.
- Retrieval-based checks distinguish "unsupported" from "contradicted" rather than collapsing both into one flag.

**Related:** [Intuition: If It Keeps Changing Its Story, Distrust It](/learn/hallucinations/consistency-implies-reliability), [Worked Example: When Self-Verification Rubber-Stamps a Lie](/learn/hallucinations/self-verification-when-it-fails), [Implementation: Cross-Checking Across Multiple Models](/learn/hallucinations/ensemble-cross-check-impl), [Evaluating Your Detector](/learn/hallucinations/evaluating-your-detector), [Retrieval-Based Fact Checking as Detection](/learn/hallucinations/retrieval-based-factuality-check)
