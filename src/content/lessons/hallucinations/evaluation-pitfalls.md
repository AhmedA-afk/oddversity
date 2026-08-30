---
title: "Common Mistakes: Evaluation Pitfalls and Benchmark Gaming"
track: "hallucinations"
status: live
summary: "How a leadership-facing hallucination rate can improve while the system gets worse, and the specific mechanics that make it possible."
duration: "8 min read"
---

Every metric in this module can be gamed, sometimes by accident. These are the ways that actually happens in practice — each with a mechanism, a symptom you can catch, and a fix.

### The mistake: train/test leakage inflating benchmark scores

A golden set built by paraphrasing the same documents a model was heavily prompted or fine-tuned against, or a public benchmark whose exact questions have been mirrored widely enough to leak into training data.

**Why it's wrong.** The score now measures memorization of the eval set itself, not generalized resistance to hallucination on new content — a model can ace a fixed question set by having absorbed its specific answers without acquiring the underlying skill at all.

**Symptom.** An eval score that's unrealistically high and doesn't move on genuinely new questions in the same domain, or a near-perfect score on an older public benchmark that's been public and widely discussed for years.

**Fix.** Hold out a private slice of your golden set that's never been referenced anywhere the model could plausibly have trained on, refresh a portion of it periodically with newly written questions, and treat a sudden near-perfect score on an old public benchmark as a reason to check for leakage, not a reason to celebrate — see [the benchmark tour](/learn/hallucinations/hallucination-benchmarks-tour) for why static, widely-mirrored question sets are especially exposed to this over time.

### The mistake: judge model sharing the generator's blind spots

Using the same model, or a model from the same family, as both generator and judge — or a judge with the same knowledge gaps as the system it's grading.

**Why it's wrong.** A judge evaluates "does this look plausible and consistent to me," and a model's own confident blind spots look exactly as plausible to itself as they did to the generator. Self-preference bias compounds this — a judge rating its own family's output style more favorably even when a blind human disagrees.

**Symptom.** A judge-measured hallucination rate that looks noticeably better than what a different-family judge, or a human, finds on the identical outputs.

**Fix.** Use a judge from a different model family than whatever's being evaluated, and spot-check regularly against the rubric-driven human process from [Human Evaluation and Annotation Protocols](/learn/hallucinations/human-annotation-protocols) — the mechanics of building that kind of judge harness in the first place get their own lesson earlier in this module.

### The mistake: ignoring abstention so refusals look like errors

Grading every "I don't know" or declined answer as simply incorrect inside an accuracy computation.

**Why it's wrong.** This conflates two very different behaviors — confidently wrong and honestly uncertain — into one bucket, punishing exactly the calibrated caution you should want, and it distorts comparisons: a well-calibrated system that abstains appropriately looks worse on this metric than an overconfident one that guesses at everything and gets partial credit for the guesses that happen to land.

**Symptom.** A change that adds proper abstention behavior makes a naive "error rate" look worse, even though it demonstrably reduced fabrications actually reaching users.

**Fix.** Score abstention as its own category, never folded into "wrong" — report accuracy-when-answered, abstention rate, and hallucination rate as three separate numbers, exactly the discipline [What to Measure](/learn/hallucinations/what-to-measure-metrics) and [Teaching a Model to Say "I Don't Know"](/learn/hallucinations/teaching-models-to-say-i-dont-know) both argue for.

### The mistake: optimizing to a benchmark that doesn't match production

Tuning prompts or thresholds specifically to move a public benchmark number, without checking whether that benchmark's question shape resembles real traffic.

**Why it's wrong.** A benchmark's distribution, length, domain, and stakes profile rarely match your actual usage — tuning for terse, closed-form benchmark answers can actively regress a product that needs long-form, sourced explanations, or vice versa.

**Symptom.** The benchmark score climbs release over release while production complaints or your own private golden-set score stay flat or get worse.

**Fix.** Treat public benchmarks as a coarse model-selection filter, not a production yardstick, and gate real ship decisions on your own domain eval set run through CI, not a leaderboard number — see [Hallucination Regression Testing in CI](/learn/hallucinations/tracking-hallucination-in-ci) for how that gate actually gets built.

### The mistake: a gamed score, worked in full

A team wants to report an improved hallucination rate for a leadership update. They quietly raise the confidence threshold so more borderline questions get declined instead of attempted, then report "hallucination rate: 3%, down from 9%" — computed per-answered-question, without mentioning that the denominator (which questions count as "answered") also shifted.

**Why it's wrong.** Fabrication per answered question genuinely dropped, but total user-visible unhelpfulness — fabrications plus unhelpful refusals combined — may be flat or worse. This is the exact denominator-flip trap from [Hallucination Rate Denominators](/learn/hallucinations/hallucination-rate-denominators), dressed up as a real improvement because only one side of the tradeoff got reported.

**Symptom.** A leadership-facing number improves while support tickets about "the assistant won't answer basic questions" rise in the same period — two numbers that should always be read together, and weren't.

**Fix.** Report the full set every time: answered-rate, accuracy-when-answered, hallucination-rate with its exact denominator stated in the same sentence, and the high-stakes-slice rate. A threshold shift can't hide inside a single improving number if the paired number is sitting right next to it.

## Pre-flight checklist

- State the exact numerator and denominator every single time you say "hallucination rate" — in the same sentence as the number, not a footnote.
- Confirm your judge or detector isn't from the same model family as what it's grading, and spot-check it against human labels on a real cadence, not once.
- Score abstentions as their own category, never folded into "wrong."
- Hold out a private, periodically refreshed slice of your golden set that nothing in your pipeline could have trained or been tuned against.
- Before celebrating an improved score, check whether abstention rate, question mix, or the denominator itself shifted underneath it.
- Gate ship decisions on your own domain eval, run in CI — never on a public leaderboard number alone.

**Related:** [Hallucination Rate Denominators](/learn/hallucinations/hallucination-rate-denominators) · [Deep Dive: A Tour of Hallucination Benchmarks](/learn/hallucinations/hallucination-benchmarks-tour) · [Human Evaluation and Annotation Protocols](/learn/hallucinations/human-annotation-protocols) · [What to Measure: Factuality, Faithfulness, and Abstention Metrics](/learn/hallucinations/what-to-measure-metrics) · [Teaching a Model to Say "I Don't Know"](/learn/hallucinations/teaching-models-to-say-i-dont-know) · [Worked Example: Hallucination Regression Testing in CI](/learn/hallucinations/tracking-hallucination-in-ci)
