---
title: "Quiz: Production Handling"
track: "hallucinations"
status: live
summary: "Ten scenarios testing guardrail placement, threshold calibration, risk-tiered detection under a latency budget, and incident sequencing."
duration: "10 min read"
---

This quiz doesn't test definitions — it tests whether you can make the actual call: which layer catches a given failure, where a threshold should sit, which checks a latency budget can afford, and what a monitored spike is actually telling you. If any of these feel shaky, the linked lesson is worth a re-read before you build the capstone.

## 1. The question with a bad assumption

A user asks your support bot: "Why did you discontinue the Pro plan's API access last month?" Your product never discontinued API access on the Pro plan. Which guardrail layer, correctly built, catches this before an answer ships?

- **A.** The output guardrail — it will check the drafted answer's claims against the changelog and flag the discontinuation date as unsupported.
- **B.** The input guardrail — it evaluates the question's premise before generation even runs, and flags that no such discontinuation occurred.
- **C.** The behavioral guardrail — its abstention policy will trigger once the model realizes it doesn't know the answer.
- **D.** No guardrail catches this reliably; only a human reviewing every support answer would.

<details><summary>Answer</summary>

**Correct: B.** This is a false-premise question, and per [A Taxonomy of Guardrails](/learn/hallucinations/guardrails-taxonomy), that's specifically what an input guardrail is for — it evaluates the question itself, independent of any answer, before generation runs.

**A** is the tempting answer because it's true that a diligent output check *might* catch an invented discontinuation date if the model states one — but the model could just as easily answer "we discontinued it due to security concerns" without citing any specific fact an output guard can check against, since the whole premise, not a checkable detail within an answer, is what's false. **C** conflates abstention with premise-checking — the model isn't uncertain here, it can be perfectly happy generating a plausible-sounding explanation for something that never happened, which is the entire danger of a false premise. **D** overstates the limits — this is exactly the scenario input guardrails from [Implementation: Input and Output Guardrails](/learn/hallucinations/input-output-guardrail-impl) are built to automate, not a case requiring full human review.

</details>

## 2. The citation that points nowhere

Your output guardrail confirms every claim in a draft answer has an attached citation. A later audit finds one citation points to a document that doesn't actually contain the claimed fact. What does this tell you about the guard?

- **A.** The guard is fine — citation presence is what output guardrails are supposed to check.
- **B.** The guard is checking citation *presence*, not citation *correctness* — it needs a claim-level entailment check against the cited source, not just a check that a citation field is non-empty.
- **C.** This is actually an input guardrail failure, since the citation was generated before the question was even asked.
- **D.** This is unavoidable — no automated check can verify a citation is correct.

<details><summary>Answer</summary>

**Correct: B.** A citation existing and a citation being accurate are different properties, and only the second one actually prevents a fabrication from shipping with a veneer of credibility. [Implementation: Input and Output Guardrails](/learn/hallucinations/input-output-guardrail-impl) builds the claim-check specifically as "does the cited source support this claim," not "is a citation field populated."

**A** describes a guard that provides false confidence — a populated-but-wrong citation is arguably worse than no citation, because it looks verified. **C** misassigns the layer: citation generation happens during generation, and checking it is squarely an output-guardrail job, unrelated to the input-side premise check. **D** is wrong and consequential — this is precisely what an entailment-style claim check in the [fact-checking pipeline](/learn/hallucinations/fact-checking-pipeline-impl) automates, comparing the claim text against the retrieved source text.

</details>

## 3. Reading the calibration curve

Your calibration run on a medical-adjacent Q&A feature produces this curve (uncertainty threshold below which you escalate, versus resulting answered-set accuracy and coverage):

```
threshold 0.20: accuracy 0.99, coverage 0.50
threshold 0.35: accuracy 0.96, coverage 0.70
threshold 0.50: accuracy 0.85, coverage 0.88
threshold 0.65: accuracy 0.74, coverage 0.95
```

Given that a wrong answer here is far more costly than an unnecessary escalation, which threshold is the most defensible choice?

- **A.** 0.65, because it maximizes coverage and minimizes how often a human has to get involved.
- **B.** 0.50, because accuracy and coverage are both "pretty good" there and it looks like a natural middle.
- **C.** 0.35, because it captures most of the coverage gain over 0.20 while accuracy is still barely off its peak — the point where accuracy starts falling off faster than coverage improves.
- **D.** Whichever threshold produces exactly 90% coverage, since that's an industry-standard target.

<details><summary>Answer</summary>

**Correct: C.** Per [Escalation and Human-in-the-Loop Design](/learn/hallucinations/escalation-human-in-the-loop), the right threshold sits at the curve's inflection point, not an extreme — 0.35 buys a large coverage jump (0.50 to 0.70) for a small accuracy cost (0.99 to 0.96), while pushing further to 0.50 starts trading accuracy away much faster (0.96 to 0.85) for a smaller coverage gain. In a domain where a wrong answer is expensive, that inflection point, weighted toward preserving accuracy, is the defensible choice.

**A** optimizes the wrong variable for this domain — 0.65's accuracy of 0.74 means roughly one in four answered cases could be wrong, an unacceptable rate when the premise of the question states wrong answers are costly. **B** is the "it looks fine" answer that skips actually reasoning about where the curve bends — 0.50 already gives up a meaningful chunk of accuracy versus 0.35 for a coverage gain that matters less in a cost-asymmetric domain. **D** invents a target with no basis — there's no universal coverage number; the right threshold is read from your own curve and your own cost asymmetry, not copied from an assumed industry norm.

</details>

## 4. Detection under a tight latency budget

You're building a low-stakes creative-writing assistant with a hard 2-second response budget. The full detection stack (semantic entropy at N=5, resampled sequentially, plus a claim-by-claim fact-check) would take several seconds. What's the correct move?

- **A.** Run the full stack anyway — reliability should never be compromised for latency.
- **B.** Skip detection entirely for this feature — creative writing has no facts to check, so none of this module applies.
- **C.** Match detection intensity to risk: since this is a low-risk, low-checkable-claims task, use a lightweight output guard at most, and reserve the expensive resampled/fact-check stack for higher-risk features with looser latency requirements.
- **D.** Keep semantic entropy but parallelize the resamples — this fixes the latency problem enough to also add the full fact-checking pipeline without exceeding budget.

<details><summary>Answer</summary>

**Correct: C.** This is the risk-tiering principle from [Deep Dive: Latency, Cost, and Reliability Tradeoffs](/learn/hallucinations/latency-cost-reliability-tradeoffs) applied directly: detection cost should scale with what's actually at stake, and a creative-writing task with few checkable factual claims doesn't justify the heaviest, most latency-sensitive stack.

**A** treats reliability as an all-or-nothing property rather than a budget to spend where it matters — spending it uniformly regardless of risk is precisely the [antipattern](/learn/hallucinations/production-antipatterns) of running expensive checks on every request. **B** overcorrects — even creative tasks can carry incidental factual claims (a real person's name, a real event) worth a lightweight check, so "no checking at all" throws away a nearly-free layer. **D** is half right (parallelizing resamples does cut wall-clock cost, as the tradeoffs lesson notes) but wrong on the conclusion — the sequential, per-claim fact-checking pipeline doesn't parallelize away as cleanly, and reaching for the heaviest tool for a low-risk feature is still spending the budget in the wrong place.

</details>

## 5. The suspicious drop

Your production dashboard shows escalation rate dropping from a rolling baseline of 9% to 4% overnight, while guard-block rate and average uncertainty score stayed essentially flat. What's the most likely explanation, and what should you check first?

- **A.** The model genuinely got better overnight — celebrate and move on.
- **B.** This is good news but unrelated to reliability — it's probably just a shift in what users are asking about.
- **C.** A recent deploy likely loosened the confidence-gate threshold or a related check — since the signals that should predict escalation (guard-block rate, uncertainty) didn't move, the drop is more likely coming from the routing logic itself than from genuinely better answers.
- **D.** This can't be diagnosed from dashboard data alone — you'd need to wait for user complaints to confirm anything.

<details><summary>Answer</summary>

**Correct: C.** Per [Implementation: Monitoring Hallucination in Production](/learn/hallucinations/monitoring-hallucination-in-prod), a drift in one metric with its correlated signals unchanged is the specific pattern that flags a routing or threshold regression rather than a genuine quality improvement — if answers were actually better, you'd expect guard-block rate or uncertainty scores to reflect that too, not just the downstream escalation count.

**A** takes the metric at face value without checking whether the signals that should move together actually did — exactly the mistake the monitoring lesson warns against. **B** dismisses a real, checkable signal as noise without looking at the correlated metrics that would confirm or rule it out. **D** is too pessimistic — this is exactly the kind of thing a same-day check of recent deploys and threshold configs, cross-referenced against the flat guard-block rate, can diagnose well before user complaints would ever surface it, which is the entire point of monitoring proactively instead of reactively.

</details>

## 6. Sequencing the incident

A hallucinated interaction claim reaches a user in a clinical assistant. Put these four actions in the correct order: (1) add the case to the golden eval set, (2) narrowly block the specific triggering query pattern, (3) fix the empty-retrieval check that let it through, (4) classify the failure as extrinsic hallucination plus a guard enforcement gap.

- **A.** 1, 2, 3, 4 — regression tests should be added immediately, before anything else, to stop it from ever recurring.
- **B.** 2, 4, 3, 1 — contain first, then classify, then fix the classified cause, then regress.
- **C.** 4, 2, 3, 1 — you can't safely contain anything until you know exactly what went wrong.
- **D.** 3, 2, 4, 1 — fix the obvious bug immediately, then contain, classify why it happened, and regress.

<details><summary>Answer</summary>

**Correct: B.** [Incident Response When a Hallucination Ships](/learn/hallucinations/incident-response-for-hallucination) is explicit about this order: contain first because diagnosis takes time you don't have while the failure keeps recurring live, then classify using the taxonomy before touching any code, then apply the fix targeted at the classified cause, then add the regression test.

**A** puts the regression test first, which is backwards — you can't write a meaningful regression test before you've classified what actually failed, and skipping containment leaves the live failure mode unaddressed while you write a test for it. **C** overcorrects the other direction — full classification isn't required to apply narrow, low-risk containment (blocking a specific known-bad query pattern doesn't require understanding root cause first, and containment is cheap insurance while you investigate). **D** jumps to a fix before classification confirms it's the right fix — "the obvious bug" might not be the actual root cause, and fixing it without classifying risks patching a symptom while the real enforcement gap (or a similar one) persists elsewhere.

</details>

## 7. The self-checking trap

A team builds their entire reliability layer as: generate an answer, then ask the same model "is this answer correct?" and ship if it says yes. Eval numbers look great. What's the most likely gap in this setup?

- **A.** Nothing — self-verification is a proven, sufficient technique on its own.
- **B.** The self-check shares the same knowledge gaps as the generation — if the model doesn't know a fact is wrong, asking it to verify that fact usually just produces a second confident wrong answer, so this setup catches reasoning slips but not knowledge gaps.
- **C.** The setup is fine for factual questions but fails specifically on creative tasks.
- **D.** The eval numbers looking great actually proves the setup works, regardless of the mechanism.

<details><summary>Answer</summary>

**Correct: B.** This is the first antipattern in [Common Mistakes: Production Reliability Antipatterns](/learn/hallucinations/production-antipatterns) — a single model self-check as the only guard shares every blind spot the generation had, because it's the same model, with the same knowledge, checking its own work with nothing external to contradict a confident mistake.

**A** overstates self-verification's role — it's a real, useful layer (see [Self-Verification Techniques](/learn/hallucinations/self-verification-techniques)) but explicitly not a sufficient one on its own; it needs external grounding or an independent check behind it. **C** invents a distinction not supported by the mechanism — the failure mode (no external signal to catch a knowledge gap) applies to factual tasks just as much as creative ones, arguably more, since factual claims are the ones with a checkable ground truth being skipped. **D** is the exact trap: eval numbers produced by the same self-checking loop being evaluated tell you the loop agrees with itself, not that it's accurate — this is why independent, held-out golden-set evaluation matters.

</details>

## 8. Reading the disclosure UI

Two designs for the same low-confidence answer: Design 1 appends "I might be wrong about this" to every single response the product ever generates, regardless of confidence. Design 2 only shows a caveat and a "recommend verifying" note on responses that the confidence gate actually routed to the citations-required or escalate tier. Which is the better uncertainty UX, and why?

- **A.** Design 1, because more disclosure is always safer than less.
- **B.** Design 2, because hedge language that doesn't vary with the actual signal becomes noise users learn to ignore — proportional disclosure is what keeps the caveat meaningful when it matters.
- **C.** They're equivalent — users will read carefully regardless of which design is used.
- **D.** Design 1, because it protects the product from liability regardless of user behavior.

<details><summary>Answer</summary>

**Correct: B.** [The UX of Uncertainty](/learn/hallucinations/ux-of-uncertainty) makes exactly this point: boilerplate hedging on every response trains users to stop reading it, so the one time a caveat is attached to a genuinely uncertain answer, it carries no more weight than it did on a confident one. Design 2's caveat is meaningful precisely because it's rare and tied to a real signal.

**A** treats disclosure as costless, but it isn't — over-hedging is named explicitly as a failure mode alongside false confidence, not a safe default to fall back on. **C** ignores well-established interface behavior — a disclaimer that never changes becomes exactly the kind of boilerplate users learn to skip past, which is the whole mechanism the lesson describes. **D** may be true as a legal argument but is a different question from good UX — a blanket disclaimer that provides no differentiated signal to users fails the actual reliability goal of this module even if it satisfies some other institutional purpose.

</details>

## 9. The cost multiplier mix-up

A teammate argues: "Semantic entropy needs 5 resamples, so it must always be 5x slower in wall-clock latency than a single generation, same as it's roughly 5-6x the token cost." What's wrong with this reasoning?

- **A.** Nothing — cost multiplier and latency multiplier are always the same number for any technique.
- **B.** Token cost and wall-clock latency don't have to scale together — if the 5 resamples run in parallel, wall-clock latency is closer to one generation's time plus a clustering pass, even though token cost still scales with all 5 generations.
- **C.** Semantic entropy doesn't actually cost more tokens than a single generation, only more latency.
- **D.** The resample count doesn't affect cost or latency at all — only the clustering step does.

<details><summary>Answer</summary>

**Correct: B.** [Deep Dive: Latency, Cost, and Reliability Tradeoffs](/learn/hallucinations/latency-cost-reliability-tradeoffs) draws this distinction explicitly: cost multiplies with total tokens generated across all resamples regardless of how they're scheduled, but latency depends on whether those resamples run sequentially or in parallel — parallelized, wall-clock time looks much closer to a single generation's latency plus the clustering pass, even though the token bill still reflects all 5 calls.

**A** is the exact misconception the question is testing — conflating cost and latency multipliers is a common and costly modeling mistake when budgeting a reliability stack. **C** gets it backwards — semantic entropy's token cost genuinely does scale with the resample count; what doesn't have to scale the same way is latency, if you parallelize. **D** is simply false — the resample count is the dominant driver of both token cost and (if run sequentially) latency; the clustering pass is a comparatively small additional cost on top.

</details>

## 10. Where the risk score actually belongs

In the reference architecture, risk scoring runs first, before grounding, generation, or detection. Why does the *order* matter, not just the presence of a risk score somewhere in the pipeline?

- **A.** It doesn't matter — as long as a risk score is computed at some point and logged, the pipeline is compliant.
- **B.** Risk scoring has to run first because it determines how much of the expensive downstream machinery (detection intensity, escalation threshold) even executes for this request — computing it after generation would mean you already paid for a detection pass you might not have needed, or skipped one you did.
- **C.** Risk scoring must run first purely for regulatory logging reasons, unrelated to cost or detection choices.
- **D.** Order doesn't matter, since detection and grounding always run identically regardless of risk tier.

<details><summary>Answer</summary>

**Correct: B.** [Reliability Architecture: Wiring the Pieces Together](/learn/hallucinations/reliability-architecture-overview) frames the whole pipeline as a series of increasingly expensive filters, each one gated by the one before it — risk scoring is nearly free and its entire purpose is to decide how much of the expensive stack (per-tier detection intensity, escalation threshold, as tiered in the [production reliability cheatsheet](/learn/hallucinations/production-reliability-cheatsheet)) actually runs for this specific request. Compute it after the fact and you've already spent the cost it was supposed to gate.

**A** misses that the cheatsheet and architecture both treat the risk score as an active gate, not a passive log field — logging it without using it to branch the pipeline defeats its purpose entirely, which is also the core mechanism behind the [antipattern](/learn/hallucinations/production-antipatterns) of running expensive checks on every request regardless of risk. **C** understates its role — while audit logging matters (see the [high-stakes case study](/learn/hallucinations/high-stakes-case-study)), the primary reason for running it first is architectural: it controls cost and detection choice, not just compliance record-keeping. **D** directly contradicts the entire premise of tiered detection covered across this module — detection intensity and thresholds are explicitly meant to differ by risk tier, which only works if the tier is known before those downstream choices are made.

</details>

## The pattern underneath all ten

Every question above comes back to the same idea: reliability in production isn't one technique done well, it's a set of independent decisions — which layer catches what, where a threshold sits, how much detection a given risk buys, what a metric drift actually implies, and what order a response happens in — that only work together if each one is made deliberately rather than by default. If you build the [capstone](/learn/hallucinations/capstone-trustworthy-qa-system) and can point to the specific lesson behind every one of those decisions in your own system, this module has done its job.

**Related:** [Reliability Architecture: Wiring the Pieces Together](/learn/hallucinations/reliability-architecture-overview), [Cheatsheet: Production Reliability Checklist](/learn/hallucinations/production-reliability-cheatsheet), [Common Mistakes: Production Reliability Antipatterns](/learn/hallucinations/production-antipatterns), [Capstone: Build a Reliability-Hardened QA System](/learn/hallucinations/capstone-trustworthy-qa-system), [Incident Response When a Hallucination Ships](/learn/hallucinations/incident-response-for-hallucination)
