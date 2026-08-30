---
title: "Quiz: judging and verifying"
track: "ai-literacy"
status: live
summary: "A six-question self-check that has learners rate the stakes, spot the one checkable claim, and pick the right verification move across four realistic AI answers — a fabricated cita."
duration: "10 min read"
---

You've got the pieces now — stakes, checkable claims, verification moves — but using all three together on a real answer, fast, is a different skill than defining them one at a time. Here are four AI answers that all sound equally confident. Only one of them is safe to paste and forget.

## The four answers you're judging

Read these the way you'd read a coworker's message you're about to act on, not as quiz material yet.

**Answer A** — asked: "Why is it harder for adults to learn a second language fluently than kids? Give me a source I can cite."

> Children have an edge because of the "critical period" for language acquisition. A well-known study — Whitcombe & Reyes, "Critical Period Effects in Adult Second-Language Acquisition," *Journal of Applied Linguistics and Cognition*, 2016 — found that learners who start before age 10 reach native-level grammar 89% of the time, compared with 15% for adults who start after 18.

**Answer B** — asked: "What's the latest stable version of Python, and is it fine to build a new project on?"

> The latest stable release is Python 3.9, which came out in October 2020. It's mature and well-supported, so it's a solid choice for a new project.

**Answer C** — asked: "A jacket is $85, marked 30% off, and there's an extra 10% off at checkout. What's the final price?"

> First discount: $85 minus 30% is $59.50. The extra 10% off at checkout is 10% of the original $85, which is $8.50. So the final price is $59.50 minus $8.50 = $51.00.

**Answer D** — asked: "Give me 5 casual icebreaker questions for a team meeting — nothing about work."

> 1. What's a small thing that made you happy this week?
> 2. If you could instantly master one hobby, what would it be?
> 3. What's your go-to comfort food?
> 4. Beach vacation or mountain cabin — pick one and defend it.
> 5. What's a show or movie you've rewatched more times than you'd admit?

## 1. Spotting the problem in Answer A

Before you use Answer A's citation anywhere, what's the actual tell that it needs checking, not just accepting because it looks academic?

- **A.** It's about language learning, which is a soft, subjective topic that AI can't really answer well.
- **B.** It pairs a fully-specified citation (named authors, journal, year) with a suspiciously precise statistic — 89% versus 15% — that you have no independent way to confirm from memory.
- **C.** It uses technical-sounding language like "critical period."
- **D.** It's stated in a confident, matter-of-fact tone.

<details><summary>Answer</summary>

**Correct: B.** That combination — a citation dressed with real-looking detail, attached to a stat too clean to be a coincidence — is exactly the shape a fabricated source takes. It's built to read as verifiable, which is not the same as being verified. The checkable claim here isn't the general idea (a critical period for language acquisition is a real, debated concept in linguistics) — it's this specific paper and this specific pair of numbers.

**A** is tempting but wrong: how soft or subjective a topic feels tells you nothing about whether a claim inside it is checkable. You can fabricate a citation about a soft topic exactly as easily as a hard one, and the fix is identical either way — check the actual paper.

**C** is wrong because jargon is neutral. Real research legitimately uses terms like "critical period," so technical vocabulary tells you nothing about whether the citation attached to it is real.

**D** is wrong because confident phrasing is the model's default setting whether it's right or wrong — see [why AI sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident). Tone doesn't distinguish which of these four answers is the one to worry about.

</details>

## 2. Choosing the right move for Answer A

You want to actually use this claim in something you're publishing under your name. What's the correct next step?

- **A.** Ask the same AI, "are you sure that citation is real?" and go with whatever it says.
- **B.** Search for "Whitcombe & Reyes" and that title directly (a search engine or a database like Google Scholar) to see if the paper exists and says what's claimed.
- **C.** Keep the citation but soften the sentence to "some research suggests..." so you're not overstating it.
- **D.** Drop the citation but keep the 89%/15% figures, since they sound plausible on their own.

<details><summary>Answer</summary>

**Correct: B.** The only way to know whether a source is real is to go find the source. Searching for the exact title and authors resolves the question in one step — it exists and says this, it exists and says something else, or it doesn't exist at all — which is the "trace it to the primary source" move from [how to verify facts and sources](/learn/ai-literacy/how-to-verify-facts-and-sources).

**A** is tempting but wrong: asking the same model to self-check rarely surfaces the problem. A model that fabricated a citation once will often reaffirm it confidently, or "helpfully" swap in an equally invented replacement — it's still generating plausible-sounding text, not running a lookup against a database of real papers.

**C** is wrong because hedging changes the tone, not the truth value. If the specific citation is fake, wrapping it in "some research suggests" still asserts something false — just more quietly, and harder for a reader to challenge.

**D** is wrong because the numbers are the fabricated part, not the packaging. Dropping the citation while keeping 89%/15% removes the one detail — an attributable source — that someone could have used to catch the problem.

</details>

## 3. Answer B — what makes this one different from Answer A

Answer B's Python-version claim was accurate the day the underlying training data was collected. What's the real risk in accepting it now, without checking anything?

- **A.** AI systems are fundamentally incapable of knowing software version numbers.
- **B.** The claim carries an unstated "as of [some earlier date]" — the model has no way to know how much time has passed since its knowledge was current, and version and tooling facts keep changing after that point regardless.
- **C.** The version number was probably invented, the same way the citation in Answer A was.
- **D.** It doesn't really matter which Python version someone starts a new project on.

<details><summary>Answer</summary>

**Correct: B.** This is a facts-go-stale problem, not a facts-were-invented problem — see [where AI knowledge comes from and stops](/learn/ai-literacy/where-ai-knowledge-comes-from-and-stops). The model isn't guessing here: Python 3.9 shipping in October 2020 is a real, correct fact. It's just answering as if no time has passed since it learned that, when newer versions have shipped since. That gap is invisible in the phrasing, which is what makes it dangerous — it reads exactly as confident as a claim that's still current.

**A** is wrong because the issue isn't a capability gap, it's a timing gap. The model can know a version number correctly; what it can't do is know how stale that number has become since training.

**C** is tempting but wrong, and it's the confusion this module keeps circling back to: "wrong" and "made up" are not the same failure, and they need different fixes. Answer A required checking whether a source exists at all. Answer B requires checking whether a true-when-learned fact is still true now. Treat every wrong answer as a hallucination and you'll reach for the wrong verification move half the time.

**D** is wrong because dismissing the stakes doesn't make them zero. Building on an old runtime affects available features, security patches, and compatibility for as long as the project lives — "it's just a version number" is exactly the kind of claim worth a thirty-second check before it becomes load-bearing.

</details>

## 4. Verifying Answer B

What's actually the fastest reliable way to check whether Answer B's recommendation still holds?

- **A.** Ask the AI what today's date is and whether its answer is still current.
- **B.** Go to the tool's own authoritative source — Python's official site or docs — and read off the current version directly.
- **C.** Trust it, since programming languages don't release new versions that often.
- **D.** Ask a second AI system the same question and go with whichever response sounds more confident.

<details><summary>Answer</summary>

**Correct: B.** For anything that changes on its own schedule — software versions, prices, staffing, live scores — the fix isn't to interrogate the model, it's to check the primary source that's actually being kept up to date. That's the move covered in [verification tactics by task type](/learn/ai-literacy/verification-tactics-by-task-type) for fast-moving facts.

**A** is tempting but wrong: a model doesn't carry a live sense of "now" layered on top of its training. Asking it to self-assess its own recency just produces another generated-sounding answer, not an actual check against reality.

**C** is wrong because it's a factual assumption doing all the work. Plenty of widely-used tools ship meaningful updates on a regular cadence, and "this category doesn't change much" is a guess, not a check.

**D** is wrong because a second model has the same structural problem — a training cutoff and no built-in "how old is this fact" flag — and you've now added "which one sounds more confident" as your deciding factor, which isn't a signal of accuracy for either one.

</details>

## 5. Where Answer C actually goes wrong

Answer C's arithmetic looks like a normal discount calculation. Where does the reasoning actually break?

- **A.** The first step — $85 minus 30% equals $59.50 — is calculated incorrectly.
- **B.** The second discount is applied to the original $85 instead of the already-discounted $59.50, so it subtracts $8.50 (10% of $85) instead of $5.95 (10% of $59.50) — undercounting the real final price.
- **C.** The final answer of $51.00 is close enough to the correct $53.55 that it isn't worth double-checking.
- **D.** You should ask the AI to redo the calculation, and trust it if it gets $51.00 both times.

<details><summary>Answer</summary>

**Correct: B.** The first step is fine: 85 x 0.70 = 59.50. The error is in what the second discount gets applied to. The right sequence stacks both discounts on the running price: 85 x 0.70 x 0.90 = 53.55. Catching this takes redoing the arithmetic yourself, step by step, or dropping it into a calculator — because an error in the middle of a calculation still produces a final number that looks perfectly plausible on its own. See [when AI gets numbers and math wrong](/learn/ai-literacy/when-ai-gets-numbers-and-math-wrong).

**A** is a distractor to check whether you actually re-derived the answer or just sensed something was off. The first step checks out; the mistake happens one step later.

**C** is wrong because "close enough" isn't a verification method, it's a feeling. A $2.55 miss on one jacket is a much bigger miss if that same discount logic runs across a whole cart or a whole catalog.

**D** is wrong because asking the model to redo the exact same problem tends to reproduce the exact same reasoning, error included. It isn't "thinking it over again" — it's regenerating from the same pattern, so a repeated answer confirms consistency, not correctness.

</details>

## 6. Matching effort to stakes across all four

Having looked at all four, which statement correctly matches how much verification effort each one deserves?

- **A.** All four deserve the same amount of scrutiny, since any AI answer could contain an error.
- **B.** Answer D needs the least checking — it has no external claim to verify and you can judge its quality yourself in a few seconds — while A, B, and C each carry one specific checkable claim (a citation, a version fact, a calculation) that's cheap to check directly and expensive to leave wrong once it's published or acted on.
- **C.** Answer B needs the least checking, since a version number is a minor detail compared to a citation or a price.
- **D.** Answer C needs no real verification, because arithmetic mistakes in AI-generated answers are rare.

<details><summary>Answer</summary>

**Correct: B.** This is the proportionality move from [the verification checklist](/learn/ai-literacy/the-verification-checklist): match effort to what's actually at stake and to whether there's a specific claim to check, instead of either skipping verification everywhere or applying the same heavy process everywhere. D is low-risk brainstorming with nothing external to confirm; the other three each hand you exactly one concrete thing to check.

**A** is wrong because treating every answer as equally risky is its own failure mode. It either burns time re-verifying harmless brainstorming, or — more likely — gets abandoned after a few rounds, and you end up verifying nothing at all.

**C** is wrong because "minor detail" is a judgment about how the fact feels, not about what happens if it's wrong. A stale version recommendation can shape a project for months, which is not a small stake just because the claim itself is one short number.

**D** is wrong because it's the exact assumption this module is pushing back on. Numeric and arithmetic reasoning is one of the more failure-prone areas for language models, precisely because a wrong intermediate step still produces a fluent, plausible-looking final number.

</details>

**Related:** [Catch a hallucination: worked example](/learn/ai-literacy/catch-a-hallucination-worked-example) · [Fact-check an AI answer, step by step](/learn/ai-literacy/fact-check-an-ai-answer-step-by-step) · [Uncertainty and verification](/learn/ai-literacy/uncertainty-and-verification) · [The single most important skill: judging output](/learn/ai-literacy/the-single-most-important-skill-judging-output) · [The verification checklist](/learn/ai-literacy/the-verification-checklist)
