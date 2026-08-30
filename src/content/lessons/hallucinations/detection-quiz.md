---
title: "Quiz: Detecting Hallucination"
track: "hallucinations"
status: live
summary: "Ten scenario questions matching a setup to the right detector, plus predicting whether a described check would actually catch the failure."
duration: "9 min read"
---

Ten questions, all scenario-based. Each one asks you to apply a distinction from this module rather than recall a definition.

## 1. Hosted model, no logprobs exposed

Your team calls a hosted chat API. The endpoint you use doesn't expose logprobs, and you don't control the model weights. Which of these is actually available to you?

A. Token-entropy scoring over the full vocabulary distribution.
B. A linear probe trained on hidden-state activations.
C. Self-consistency, self-verification, and LLM-as-judge, since all three only need ordinary API calls.
D. None of the above — without white-box access, no detection is possible.

<details><summary>Answer</summary>

**Correct: C.** [Black-Box vs. White-Box Detection](/learn/hallucinations/black-box-vs-white-box-detection) is explicit that self-consistency, self-verification, ensemble cross-checking, and LLM-as-judge all work from ordinary black-box API calls — no logprobs or internals required.

**A** requires the full logit distribution, which is a white-box signal — a black-box API without logprobs doesn't expose this.

**B** requires hidden-state access, which needs open weights, not an API key.

**D** overstates the limitation — black-box detection is a large, genuinely useful category, not an absence of options; it's a different toolkit, not no toolkit.

</details>

## 2. RAG faithfulness, source already in hand

You're building a RAG system and already have the retrieved source document for each answer. You want a fast, cheap first-pass check for whether the answer adds anything the source doesn't support. What's the best default first step?

A. Retrieval-based fact checking, since it introduces new evidence.
B. NLI entailment classification between each answer claim and the matching source sentence.
C. Ensemble cross-checking across three different model families.
D. Self-consistency sampling, since RAG answers are still generated text.

<details><summary>Answer</summary>

**Correct: B.** [Implementation: NLI Entailment as a Grounding Check](/learn/hallucinations/nli-entailment-grounding-check-impl) is built for exactly this case — the source is already known, so a small, fast NLI model can flag neutral or contradicted claims without spending any LLM tokens.

**A** solves a different problem — retrieval-based checking is for when you don't already have the right source and need to go find evidence, which isn't the situation here.

**C** is far more expensive than the task requires — cross-checking is for open-domain factuality without a fixed source, not for checking faithfulness to one you already have.

**D** misses the point of RAG faithfulness — resampling checks whether the model's *answer* is stable, not whether that answer actually stays within what the *source* supports; a hallucinated addition can resample identically every time.

</details>

## 3. An agent's tool call returns a number

An agent calls a calculator tool, gets a result, then writes a summary sentence using that number. You want to check whether the summary correctly reflects the tool's output. What's the most direct check?

A. LLM-as-judge, asking a separate model whether the summary "sounds accurate."
B. Self-verification: have the model re-derive the number from the same inputs, independently, and compare to what the summary states.
C. Retrieval-based fact checking against a search index.
D. Ensemble cross-checking across three different model providers.

<details><summary>Answer</summary>

**Correct: B.** [Implementation: Self-Verification and Chain-of-Verification](/learn/hallucinations/self-verification-chain-impl) is exactly this shape for a checkable computation — re-derive independently and compare, which catches a misstatement of the tool's own output directly and cheaply.

**A** is weaker for a purely numeric consistency check — a judge without access to the actual inputs is guessing at plausibility, not verifying the number was transcribed correctly.

**C** is the wrong tool — there's nothing to search for here; the "evidence" is the tool call's own inputs, not something in a search index.

**D** is unnecessarily expensive for a single checkable computation — cross-checking model families is for open-domain factual claims no one model can verify alone, not for re-running arithmetic.

</details>

## 4. Predict the outcome: perfect self-consistency on a myth

A model is asked "Does cracking your knuckles cause arthritis?" ten times at temperature 0.8, and every single response confidently says yes, it does. Given what you know about self-consistency's blind spot, what does this agreement ratio of 1.0 actually tell you?

A. The answer is definitely correct, since ten independent samples all agree.
B. The model has one stable, dominant belief — which could be right or could be a widely-repeated misconception baked into training data equally consistently.
C. Temperature must have been set to 0, since real randomness would have produced some disagreement.
D. Self-consistency doesn't apply to yes/no questions, only to open-ended ones.

<details><summary>Answer</summary>

**Correct: B.** [Intuition: If It Keeps Changing Its Story, Distrust It](/learn/hallucinations/consistency-implies-reliability) draws this distinction directly — consistency reveals a stable belief, not whether that belief is true. A common misconception, if it's the dominant pattern in training data, resamples just as consistently as a correct fact.

**A** is the exact false comfort [Common Mistakes: When Detectors Give False Comfort](/learn/hallucinations/detection-false-comfort) warns about — agreement measures stability, not correctness.

**C** is a plausible-sounding but unsupported inference — genuine randomness at temperature 0.8 can still converge on one answer if that answer is overwhelmingly dominant in the model's learned distribution; convergence doesn't imply zero temperature.

**D** is false — the technique applies to any answer type where responses can be compared, yes/no included; the mechanism doesn't care about answer format.

</details>

## 5. Predict the outcome: ensemble cross-check on a shared gap

Three different model families are all asked the same obscure historical question. All three were trained on overlapping web-scale data that happens to contain the same (incorrect) claim repeated across many sources. What does the cross-check most likely show?

A. Disagreement, since the models are architecturally different.
B. Agreement on the same wrong answer — ensemble cross-checking cannot distinguish independent correctness from a shared training-data error.
C. The check will fail to run, since the models are from different providers.
D. Agreement is impossible unless the models are literally the same weights.

<details><summary>Answer</summary>

**Correct: B.** [Implementation: Cross-Checking Across Multiple Models](/learn/hallucinations/ensemble-cross-check-impl) names this directly as the method's blind spot — correlated errors from overlapping training data produce confident agreement on a shared wrong answer, which the check has no way to catch, since agreement is the pass condition.

**A** assumes architectural difference guarantees independent knowledge, which it doesn't — all three models can still have learned the same dominant, incorrect pattern from similar source data regardless of architecture.

**C** confuses infrastructure (different providers, different APIs) with informational independence (different training data) — the check runs fine technically; it's the epistemic independence that's missing.

**D** sets the bar for agreement too high — genuinely different model families can and do converge on the same answer, correct or not, without being the same weights.

</details>

## 6. Why did self-verification pass a fabrication?

A model claims a historical figure won an award they didn't actually win. Its self-verification pass generates a fresh, independent question about the claim, answers it in isolation with no view of the draft, and gets the same wrong answer — so the check passes. What's the correct explanation for why isolation didn't help here?

A. Isolation was implemented incorrectly; if done right, it always catches fabrications.
B. The draft and the fresh verification answer both drew on the same underlying parametric belief — isolation prevents the model from re-reading its own text, but it can't prevent the model from holding the same wrong belief twice.
C. Self-verification only works for numeric claims, not claims about people.
D. The verification question was too similar in wording to the original claim.

<details><summary>Answer</summary>

**Correct: B.** [Worked Example: When Self-Verification Rubber-Stamps a Lie](/learn/hallucinations/self-verification-when-it-fails) walks through exactly this mechanism — a widely-shared misconception is the model's actual best answer both times, so isolating the check from the draft removes one confound (literal re-reading) but not the deeper one (a shared source of belief).

**A** misdiagnoses a structural limitation as an implementation bug — the isolation was done correctly in this scenario; it simply doesn't address the failure mode in play here.

**C** is an invented restriction with no basis — self-verification's blind spot applies to any claim type where the same systematic error is baked uniformly into the model's training, numeric or not.

**D** identifies a real, separate concern (question phrasing affecting anchoring) but isn't the explanation for this specific failure — the questions here were genuinely independent in wording; the problem is shared belief, not leading phrasing.

</details>

## 7. Choosing between a single judge call and ChainPoll

You need to check a batch of RAG answers for faithfulness, and you want a score you can use to rank answers by how confidently hallucinated they seem, not just a yes/no per answer. What should you reach for?

A. A single LLM-as-judge call per answer, since one call is cheaper.
B. ChainPoll-style polling: ask the judge the same question multiple times with chain-of-thought and average the votes into a continuous score.
C. Self-consistency on the original generator, since that's cheaper than running a separate judge at all.
D. NLI entailment, since it directly outputs a probability.

<details><summary>Answer</summary>

**Correct: B.** [Implementation: ChainPoll-Style Ensemble Judging](/learn/hallucinations/chainpoll-detector-impl) is built precisely for this need — a graded, continuous score that supports ranking and threshold tuning, which a single binary judge call can't provide on its own.

**A** is cheaper but gives you exactly the binary output the question says isn't sufficient — one YES/NO per answer, no way to distinguish a confidently bad answer from a borderline one.

**C** checks the generator's own stability, not whether the *judge* considers the answer faithful to the source — a different question than the one asked here.

**D** is incorrect about what NLI outputs — the implementation in this module returns a three-way label (entailment/neutral/contradiction), not a continuous probability score, per [Implementation: NLI Entailment as a Grounding Check](/learn/hallucinations/nli-entailment-grounding-check-impl).

</details>

## 8. Interpreting a retrieval-based check that finds nothing

A retrieval-based fact check searches for evidence on a claim and finds nothing relevant. What's the correct interpretation?

A. The claim is definitely false.
B. The claim is definitely true, since nothing contradicts it.
C. The result is ambiguous — it could mean false, true-but-obscure, or simply outside the index's coverage, and treating it as automatically false is a common mistake.
D. The check has malfunctioned and should be retried with the same query.

<details><summary>Answer</summary>

**Correct: C.** [Retrieval-Based Fact Checking as Detection](/learn/hallucinations/retrieval-based-factuality-check) names this ambiguity explicitly, and [Common Mistakes: When Detectors Give False Comfort](/learn/hallucinations/detection-false-comfort) lists collapsing "unsupported" into "false" as a specific trap that produces false positives on true-but-obscure claims.

**A** is the exact mistake the lesson warns against — absence of evidence is not evidence of falsehood.

**B** overcorrects in the opposite direction — nothing contradicting a claim doesn't establish it's true either; it might just be unfindable.

**D** assumes malfunction without basis — an empty result from a working search is a normal, expected outcome for claims outside index coverage, not a sign of a broken pipeline.

</details>

## 9. Cost-constrained choice: consistency vs. ensemble

You have a tight per-request budget and need some hallucination signal on open factual QA, with no source document and no budget for calling a second model provider. What's the appropriate choice?

A. Ensemble cross-checking, since it's the most reliable method overall.
B. Self-consistency, since it needs only repeated calls to the one model you already have access to.
C. Retrieval-based fact checking, since it's the most rigorous.
D. Skip detection entirely, since no method fits a tight budget.

<details><summary>Answer</summary>

**Correct: B.** [Comparison: Choosing a Detection Method](/learn/hallucinations/detection-methods-compared) places self-consistency as the lower-cost option precisely because it needs only repeated calls to a model you're already paying for — no second provider, no search index.

**A** picks a method that's explicitly described as the highest-cost black-box option in the comparison, requiring multiple model provider integrations — a poor fit for a tight budget.

**C** requires a search index or trusted source infrastructure that the scenario doesn't mention having, and is also one of the higher-cost methods per claim.

**D** ignores a real, budget-appropriate option that exists specifically for this situation — self-consistency was built for exactly this constraint.

</details>

## 10. Detect-then-regenerate vs. prevent-at-source

A team ships a factual-QA feature with no grounding at all, relying entirely on a self-consistency check to catch hallucinations after generation and retry once on a flag. What does [Deep Dive: Detect-Then-Regenerate vs. Prevent-at-Source](/learn/hallucinations/detecting-vs-preventing) suggest is the structural limit of this design, no matter how the retry loop is tuned?

A. Retrying enough times will eventually drive the hallucination rate to zero.
B. The residual hallucination rate can shrink with more retries but never reaches zero, because it's bounded by the detector's own recall ceiling — and grounding the generation upfront would lower the base rate the detector has to catch in the first place.
C. Detection and prevention are interchangeable, so this design is equivalent to adding retrieval grounding instead.
D. The retry loop's cost is fixed regardless of how often the detector flags an answer.

<details><summary>Answer</summary>

**Correct: B.** The deep dive derives exactly this: retries shrink residual risk by roughly a factor of `(1 − r)` per round but can't exceed the detector's recall ceiling, while prevention (grounding) would instead lower the base rate `h₀` that the detector has to work against — the two compound rather than substitute for each other.

**A** contradicts the derivation directly — recall `r` is never 1, so some fraction of hallucinations always survives no matter how many retry rounds run, bounded retries or not.

**C** denies the real distinction the whole lesson is built on — detection catches a fraction of what generation produces; prevention changes what generation produces in the first place. They address different parts of the problem.

**D** is false — the lesson is explicit that detect-then-regenerate's cost is variable, scaling with how often the detector actually flags an answer, unlike prevention's flat, always-paid cost.

</details>

## If a question tripped you up, go here first

- **Missed Q1 or Q9** (access levels, cost-constrained choice): [Black-Box vs. White-Box Detection](/learn/hallucinations/black-box-vs-white-box-detection), [Comparison: Choosing a Detection Method](/learn/hallucinations/detection-methods-compared).
- **Missed Q2 or Q8** (NLI grounding, retrieval ambiguity): [Implementation: NLI Entailment as a Grounding Check](/learn/hallucinations/nli-entailment-grounding-check-impl), [Retrieval-Based Fact Checking as Detection](/learn/hallucinations/retrieval-based-factuality-check).
- **Missed Q3** (self-verification for checkable computation): [Implementation: Self-Verification and Chain-of-Verification](/learn/hallucinations/self-verification-chain-impl).
- **Missed Q4 or Q6** (consistency's blind spot, why verification fails): [Intuition: If It Keeps Changing Its Story, Distrust It](/learn/hallucinations/consistency-implies-reliability), [Worked Example: When Self-Verification Rubber-Stamps a Lie](/learn/hallucinations/self-verification-when-it-fails).
- **Missed Q5** (correlated errors in an ensemble): [Implementation: Cross-Checking Across Multiple Models](/learn/hallucinations/ensemble-cross-check-impl).
- **Missed Q7** (graded scores vs. binary verdicts): [Implementation: ChainPoll-Style Ensemble Judging](/learn/hallucinations/chainpoll-detector-impl).
- **Missed Q10** (the architectural tradeoff): [Deep Dive: Detect-Then-Regenerate vs. Prevent-at-Source](/learn/hallucinations/detecting-vs-preventing).

If all ten felt clear, you have the shape of this module: every detector trades a specific cost for a specific kind of evidence, none of them are sufficient alone, and knowing exactly where each one's blind spot sits is most of what it takes to combine them well.

**Related:** [Cheatsheet: Detection Methods and When to Use Them](/learn/hallucinations/detection-cheatsheet), [Comparison: Choosing a Detection Method](/learn/hallucinations/detection-methods-compared), [Common Mistakes: When Detectors Give False Comfort](/learn/hallucinations/detection-false-comfort), [The Detection Landscape: What We Can and Can't Observe](/learn/hallucinations/detection-landscape-overview)
