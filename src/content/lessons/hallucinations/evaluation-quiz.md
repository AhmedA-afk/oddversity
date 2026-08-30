---
title: "Quiz: Measuring Hallucination Rate"
track: "hallucinations"
status: live
summary: "Ten scenarios on picking the right metric, reading a benchmark's blind spot, computing detector recall, and spotting a gamed score."
duration: "9 min read"
---

Ten questions built from the confusions that actually trip people up once they start running hallucination evals for real — not the bare definitions. If you haven't worked through [What to Measure](/learn/hallucinations/what-to-measure-metrics) and [Hallucination Rate Denominators](/learn/hallucinations/hallucination-rate-denominators) yet, do that first.

## 1. The number that won't sit still

A system answers 100 questions, abstaining on 20. Of the 80 it answers, 12 contain a hallucinated claim. Someone computes the hallucination rate as 12/80 = 15%. A colleague computes it as 12/100 = 12%. A third person, working at the claim level, gets roughly 7%. Nobody changed the system between calculations. What's going on?

- **A.** One of the three made an arithmetic error — only one of these numbers can be correct for a given system.
- **B.** All three numbers are legitimate; they differ because they use different denominators (answered-only, all questions, all claims), and none of them is "the" hallucination rate without stating which.
- **C.** The claim-level number is always the correct one, since it's the most granular.
- **D.** The discrepancy proves the eval set is broken and needs to be rebuilt.

<details><summary>Answer</summary>

**Correct: B.** This is the exact flip worked in [Hallucination Rate Denominators](/learn/hallucinations/hallucination-rate-denominators): the same 12 flawed answers produce a different rate depending purely on whether the denominator is all questions, answered questions only, or total claims made. All three are legitimate answers to different questions — "how often does fabrication reach a user," "how often is an attempted answer flawed," and "what fraction of individual statements are wrong."

**A** assumes a single ground truth exists without anyone specifying what's being divided by — there's no arithmetic error here, just three different valid definitions. **C** privileges granularity for no real reason; claim-level rates are useful for some purposes and misleading for others (they dilute a single bad claim across a long answer's other claims), not universally "more correct." **D** is an overreaction — three coherent numbers from one dataset is expected and fine, as long as each is reported with its denominator stated.

</details>

## 2. High relevance, unhappy engineer

A RAG support bot retrieves the correct chunk about a refund window and generates a fluent, on-topic answer that states a refund window and a payout method neither of which appear in the retrieved chunk. Answer relevance scores high. Which metric catches the problem, and why did relevance miss it?

- **A.** Relevance should have caught this too, since an ungrounded answer is inherently irrelevant.
- **B.** Faithfulness catches it, because faithfulness checks the answer's claims against the retrieved context specifically; relevance only checks whether the answer addresses the question asked, with no access to the context at all.
- **C.** Neither metric can catch this; only a human reviewer can.
- **D.** Retrieval precision catches it, since the wrong chunk must have been retrieved.

<details><summary>Answer</summary>

**Correct: B.** This is the signature "high relevance, low faithfulness" case: faithfulness is scored against the retrieved context, relevance against the question — two of the distinct metric families from [What to Measure](/learn/hallucinations/what-to-measure-metrics). A confidently invented but on-topic answer sails through relevance and gets caught only by faithfulness.

**A** conflates the two axes — relevance is computed independent of grounding, by design, so an ungrounded-but-on-topic answer scores fine on it; that's not a flaw in relevance, it's a reminder that it measures something else entirely. **C** is too pessimistic — an automated claim-by-claim faithfulness check is exactly built to catch this. **D** misdiagnoses the stage: the retrieved chunk was correct here — the problem is what the generator did with it, not what was fetched.

</details>

## 3. Two benchmarks, two verdicts

A model scores well on TruthfulQA and poorly on a FActScore-style evaluation of its long-form biography writing. What's the most likely explanation?

- **A.** One of the two scores must be a measurement error, since a model's hallucination tendency is a single underlying property.
- **B.** TruthfulQA and FActScore measure genuinely different mechanisms — resisting popular imitative falsehoods on adversarial short questions versus atomic-fact precision across many stated claims in long-form text — so a model can be tuned in a way that helps one and not the other.
- **C.** FActScore is simply a harder, more rigorous benchmark, so any TruthfulQA score is automatically suspect once FActScore disagrees.
- **D.** This combination is impossible; a model that resists imitative falsehoods must also be precise in long-form generation.

<details><summary>Answer</summary>

**Correct: B.** As [the benchmark tour](/learn/hallucinations/hallucination-benchmarks-tour) lays out, TruthfulQA targets a narrow, adversarial failure mode (repeating a popular myth) on short questions, while FActScore decomposes long, detailed generation into many atomic claims and scores the fraction supported — a model that states many specifics is simply exposed to more chances for one to be wrong, independent of whether it resists myths well.

**A** wrongly assumes hallucination is one unified trait rather than several distinct, separately-measurable behaviors — that assumption is exactly what this module argues against. **C** isn't a meaningful comparison; the two benchmarks aren't ranked by rigor, they measure different things on different question shapes. **D** states a causal link between two unrelated mechanisms that has no basis — resisting a specific adversarial question style says nothing about precision across many stated claims in a different task entirely.

</details>

## 4. Reading a confusion matrix

A hallucination detector is evaluated against 300 labeled claims, 60 of which are real hallucinations. The detector flags 50 claims, 42 of which are real hallucinations. What is its recall?

- **A.** 42/50 = 84%
- **B.** 42/60 = 70%
- **C.** 42/300 = 14%
- **D.** 50/60 = 83%

<details><summary>Answer</summary>

**Correct: B.** Recall = true positives ÷ all actual positives = 42/60 = 70%. Of the 60 real hallucinations in the set, the detector caught 42 and missed 18 — that's the recall definition worked through in [Evaluating the Detector Itself](/learn/hallucinations/evaluating-your-detector).

**A** computes precision instead (true positives ÷ everything flagged, 42/50 = 84%) — a real and useful number, but not recall; confusing the two is one of the most common mistakes in reading a confusion matrix. **C** divides by the entire dataset rather than by the actual positive count, which isn't a standard metric and dramatically understates how the detector performs on the class that matters. **D** divides the wrong numerator (everything flagged, including false positives) by the actual positive count, which doesn't correspond to precision or recall — it's just an incorrect ratio.

</details>

## 5. The false comfort of 70% recall

Using the detector from the previous question (recall ≈70%, and suppose precision is around 90%), a team's process is "only human-review claims the detector flags." What's the real risk in this setup, precisely stated?

- **A.** None — 90% precision means the detector is highly trustworthy, so this process is safe.
- **B.** The 18 real hallucinations the detector missed (recall gap) ship completely unreviewed, since the workflow only checks flagged items — high precision doesn't offset a recall gap when nothing outside the flagged set gets a second look.
- **C.** The risk is that the detector produces too many false positives, wasting reviewer time.
- **D.** There's no risk as long as the detector's threshold is left unchanged over time.

<details><summary>Answer</summary>

**Correct: B.** This is exactly the false-comfort mechanism from [Evaluating the Detector Itself](/learn/hallucinations/evaluating-your-detector): a "review only what's flagged" workflow has no path for catching a false negative — the 18 missed hallucinations (30% of the real ones) ship with zero scrutiny, and a dashboard tracking only flagged-item outcomes never even sees them.

**A** conflates precision with overall safety — precision tells you flagged items are usually right, it says nothing about what's missed. **C** describes a real but much smaller cost (wasted review time on the ~10% of flags that are false alarms) and misses the far larger risk of unreviewed false negatives. **D** is a non sequitur — threshold stability has nothing to do with whether the current threshold's recall gap is already a live risk today.

</details>

## 6. Choosing where to sit on the curve

A team is deploying a hallucination detector in front of a medical-information assistant, where a missed fabrication could be actively harmful, and reviewer time is relatively available. Where should they bias the detector's threshold, and why?

- **A.** Toward high precision, to minimize wasted reviewer time — false positives are the more expensive error here.
- **B.** Toward high recall, even at the cost of more false positives — in this context, a missed hallucination (false negative) is far more costly than an extra reviewed-but-fine claim, and review capacity is available to absorb it.
- **C.** There's no meaningful choice to make — precision and recall move together, so optimizing one optimizes the other.
- **D.** Toward whichever threshold maximizes the F1 score, regardless of context.

<details><summary>Answer</summary>

**Correct: B.** As [Evaluating the Detector Itself](/learn/hallucinations/evaluating-your-detector) states precisely, the threshold choice is a product decision weighed against the cost of each error type. In a high-stakes domain with available review capacity, the cost of a false negative (an unreviewed fabrication reaching a user) dominates the cost of a false positive (a few extra minutes of review) — so recall should be prioritized.

**A** gets the cost asymmetry backwards for this specific context — it would be the right call in a low-stakes, review-constrained setting, not a high-stakes medical one. **C** is factually wrong — precision and recall trade off against each other as the threshold moves; they do not move together. **D** applies a generic, context-blind optimization target where the actual right answer depends on the specific costs of the two error types, which F1 treats as equally weighted by default when they usually aren't.

</details>

## 7. The judge that agrees with itself

A team evaluates their production model's faithfulness using the same model, from the same provider and version, as the judge. Scores come back excellent. A human review using the rubric from [Human Evaluation and Annotation Protocols](/learn/hallucinations/human-annotation-protocols) finds meaningfully more unsupported claims than the judge did. What's the most likely explanation?

- **A.** The human reviewer is being overly strict; the automated judge's score should be trusted since it's more consistent.
- **B.** The judge shares the generator's blind spots and may exhibit self-preference bias — a model tends to find its own family's confident, fluent output plausible, including the parts that are actually wrong.
- **C.** This is expected and not a problem, since a same-family judge understands the generator's style better than a human would.
- **D.** The rubric used by the human reviewer must be miscalibrated, since automated judges are generally more reliable than manual review.

<details><summary>Answer</summary>

**Correct: B.** This is the named pitfall in [Evaluation Pitfalls](/learn/hallucinations/evaluation-pitfalls): a judge from the same model family as the generator tends to under-flag the exact errors both share, and self-preference bias means it can rate the generator's own style of output more favorably than an independent reviewer would.

**A** has it backwards — consistency isn't the same as accuracy, and a judge can be consistently wrong in a way that matches the generator's own blind spots. **C** relabels a documented bias as a feature; "understanding the style" isn't the same as correctly assessing whether a claim is grounded. **D** jumps to blaming the human process with no evidence, when a specific, well-known mechanism (shared blind spots, self-preference) already explains the gap more directly.

</details>

## 8. Building the unanswerable slice

A team builds unanswerable questions for their golden eval set by writing deliberately absurd questions ("does the company provide a private jet for interns?"). Every system they test abstains correctly on all of them. What's wrong with this result?

- **A.** Nothing — a 100% correct-abstention rate is exactly what you want to see.
- **B.** Obviously absurd questions test surface-level pattern matching ("this sounds silly") rather than genuine knowledge-boundary awareness; a system could pass every one of these without ever demonstrating it knows when a plausible-sounding question is actually outside its sources.
- **C.** The problem is that abstention items shouldn't be included in a golden set at all.
- **D.** The result shows the system is well-calibrated and no further testing of abstention is needed.

<details><summary>Answer</summary>

**Correct: B.** This is the exact trap a golden hallucination eval set has to guard against: unanswerable items only test something meaningful when they're disguised in the same style and plausibility as answerable ones. An obviously silly question can be correctly declined by pattern-matching "this sounds like a joke," which says nothing about whether the system recognizes a genuine, reasonable-sounding gap in its own knowledge.

**A** takes a reassuring number at face value without asking whether the test was actually hard enough to be informative — which is precisely the failure mode this question is testing for. **C** goes too far the other direction; unanswerable items are essential for testing abstention, they just need to be constructed adversarially. **D** draws a sweeping conclusion ("no further testing needed") from a result that hasn't actually been shown to be meaningful yet.

</details>

## 9. What the CI gate should actually check

A team wires a golden set and judge harness into CI, gating only on `hallucination_rate` staying under a fixed threshold. A PR passes the gate by removing an "abstain if unsure" instruction from the system prompt, which lowers the answered-only hallucination rate by making the system attempt only the questions it already tends to get right. What should the gate have also checked to catch this?

- **A.** Nothing additional is needed; the gate did its job since the threshold wasn't breached.
- **B.** The gate should have also tracked `abstention_rate` alongside `hallucination_rate`, so a drop in abstention paired with an "improved" rate would be visible as a tradeoff, not a pure win.
- **C.** The gate should ignore hallucination rate entirely and use only test coverage as a proxy.
- **D.** The gate should require 100% code coverage on the prompt-handling logic before merging.

<details><summary>Answer</summary>

**Correct: B.** This is the gamed-score pattern from [Evaluation Pitfalls](/learn/hallucinations/evaluation-pitfalls), applied to a CI gate instead of a leadership dashboard: gating on hallucination rate alone lets a threshold shift hide inside an improving number. Tracking abstention rate in the same gate makes the tradeoff visible instead of invisible.

**A** is exactly the failure this question is pointing at — the gate technically "worked" while missing the actual regression in user-facing helpfulness. **C** discards the metric that matters most for this module's purpose in favor of one (code coverage) that has no relationship to hallucination behavior at all. **D** confuses a software-engineering practice (code coverage) with an evaluation-of-model-behavior practice — they test different things, and one doesn't substitute for the other here.

</details>

## 10. What human annotation actually validates

A team builds an LLM-as-judge harness and never compares its output to any human-labeled data, reasoning that the judge's rubric is clear enough to trust on its own. What's the risk in skipping the human comparison entirely?

- **A.** There's no real risk — a clearly written rubric is sufficient on its own, regardless of who or what applies it.
- **B.** Without a human comparison, there's no way to know whether the judge's application of the rubric actually matches a careful human's judgment on the genuinely ambiguous cases — the judge could be systematically misapplying the rubric in a way that looks internally consistent but is simply wrong.
- **C.** Human comparison is only useful for catching judge hallucinations, not for calibrating rubric application.
- **D.** This is fine as long as the judge is run at temperature 0, since determinism substitutes for accuracy.

<details><summary>Answer</summary>

**Correct: B.** [Human Evaluation and Annotation Protocols](/learn/hallucinations/human-annotation-protocols) establishes human labels as the ground truth that validates every automated metric in this module — a rubric that reads clearly on paper can still be applied inconsistently or wrongly by a judge model, and the only way to catch that is to check the judge's verdicts against independent human labels on the same items, especially the ambiguous edge cases the rubric exists to resolve.

**A** assumes clarity of writing guarantees correctness of application, which doesn't follow — a judge can misread or misapply even a well-written rubric in ways that are consistent (and therefore invisible) without ever being checked against a human. **C** understates what human comparison catches — it's about rubric-application accuracy generally, including systematic miscalibration, not just outright fabrication by the judge. **D** confuses two unrelated properties: determinism (temperature 0) means the judge gives the same answer twice, not that the answer is correct.

</details>

## The pattern underneath all ten

Every trap here traces back to the same discipline: name your denominator, don't let a single number stand in for a tradeoff, and validate your automated instruments against something more trustworthy than themselves. This module's cheatsheet is the fast-reference version of everything these ten questions just made you work through by hand.

**Related:** [What to Measure: Factuality, Faithfulness, and Abstention Metrics](/learn/hallucinations/what-to-measure-metrics) · [Hallucination Rate Denominators](/learn/hallucinations/hallucination-rate-denominators) · [Deep Dive: A Tour of Hallucination Benchmarks](/learn/hallucinations/hallucination-benchmarks-tour) · [Deep Dive: Evaluating the Detector Itself](/learn/hallucinations/evaluating-your-detector) · [Evaluation Pitfalls](/learn/hallucinations/evaluation-pitfalls) · [Human Evaluation and Annotation Protocols](/learn/hallucinations/human-annotation-protocols)
