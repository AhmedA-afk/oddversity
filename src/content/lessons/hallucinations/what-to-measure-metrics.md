---
title: "What to Measure: Factuality, Faithfulness, and Abstention Metrics"
track: "hallucinations"
status: live
summary: "Hallucination rate means nothing until you say which of four metric families you're measuring, and over what."
duration: "7 min read"
---

Someone tells you "our hallucination rate is 4%." Four percent of what, measured how? Until you can answer that, the number is a vibe wearing a decimal point. This lesson gives you the four metric families that "hallucination rate" actually decomposes into, so you know which one you're looking at — and which ones you're not.

## What it is

Four distinct things get called "hallucination measurement," and a real evaluation needs to track all of them separately, because a system can be excellent on one and terrible on another at the same time.

1. **Factual accuracy.** Is the claim true, checked against the world or a trusted reference — independent of whatever context the model was or wasn't given. This is the metric closed-book QA and general knowledge benchmarks care about.
2. **Faithfulness / groundedness.** Is the claim supported by the specific context the model was actually handed — retrieved documents, tool output, conversation history. A claim can be faithful to its context and still false, if the context itself is wrong. It can also be unfaithful and accidentally true. Faithfulness checks agreement with the source, not agreement with reality — the same [factual-vs-faithfulness split](/learn/hallucinations/factual-vs-faithfulness-distinction) that separates intrinsic from extrinsic failure in the taxonomy.
3. **Hallucination rate.** A rate of unsupported or false output over some population — but "hallucination rate" is a *shape*, not a fixed number, until you pin down exactly what's being counted and over what. That's involved enough to earn its own lesson next.
4. **Abstention quality.** Whether the system declines to answer at the right times — split into over-refusal (declining things it could safely have answered, a coverage cost) and under-refusal (answering things it should have declined, a trust cost).

## The mental model

Picture a 2×2 grid: attempted vs. abstained, crossed with correct vs. incorrect for whatever got attempted.

| | Attempted | Abstained |
|---|---|---|
| **Would have been correct** | good outcome | over-refusal cost |
| **Would have been wrong** | hallucination — the costly cell | correct abstention |

Any single number you've heard called "hallucination rate" is almost always describing one narrow slice of this grid — usually just the top-right-to-bottom-left diagonal, ignoring the other two cells entirely. Reporting "accuracy" without also reporting how much of the grid is being excluded by abstention hides half the picture.

## Why it works this way

These four metrics trade off against each other through a single lever: the confidence threshold at which a system decides to answer versus decline. Push that threshold up and you get fewer hallucinations but more refusals; push it down and you get more coverage but more fabrication. That's the same abstention trade covered from the generation side in [Teaching a Model to Say "I Don't Know"](/learn/hallucinations/teaching-models-to-say-i-dont-know) — this lesson is that same trade viewed from the measurement side. Because the trade is real, reporting factual accuracy alone is like reporting precision without recall: technically a number, practically incomplete, and trivially gameable by moving the threshold rather than improving the system.

## A concrete example

Take a system that handled 100 questions: it abstained on 20, answered 80, got 68 of those fully correct, and produced 12 answers containing at least one unsupported claim.

- **Abstention rate:** 20/100 = 20%
- **Accuracy when answered:** 68/80 = 85%
- **A plausible hallucination rate:** 12/100 = 12% (exact definition matters — see next lesson)

Now watch the gaming move: raise the confidence threshold so the system abstains on the 12 hardest of those 80 answered questions instead of attempting them. Accuracy-when-answered climbs to 68/68 = 100%. Nothing about the model's underlying knowledge changed — you just relabeled 12 "wrong answers" as "declines." A dashboard that only shows accuracy now reads as a huge win. A dashboard that shows accuracy *and* abstention rate side by side shows exactly what happened: coverage dropped from 80% to 68%, and the "improvement" is a threshold shift, not a capability gain.

## Where it shows up

Public benchmarks each headline a different one of these four families — see [the benchmark tour](/learn/hallucinations/hallucination-benchmarks-tour) and the broader [survey of evaluation approaches](/learn/hallucinations/hallucination-evaluation-and-benchmarks) for how a factual-accuracy benchmark and a faithfulness benchmark can rank the same model in opposite orders. Which family matters most also depends on the [risk factors](/learn/hallucinations/hallucination-risk-factors) your domain actually has — a system fielding mostly long-tail factual questions needs factual-accuracy coverage; one built on retrieval needs faithfulness coverage first. In production, the healthy pattern is a dashboard that always shows at least three numbers side by side — accuracy-when-answered, abstention rate, hallucination rate — never a single blended score standing in for all of them.

## Watch out for

- **A single "accuracy" number that silently decides how to score abstentions.** Scoring an abstained question as "wrong" quietly punishes appropriate caution; excluding it from the denominator quietly rewards a refusal-happy system. Pick one, and say which, every time.
- **Treating faithfulness and factual accuracy as interchangeable.** A model can be perfectly faithful to a context document that's simply out of date, and a faithfulness-only eval will never notice — it isn't built to.
- **Optimizing one metric while a paired one drifts underneath it.** Watch abstention rate every time accuracy improves; an improving accuracy number and a rising abstention rate together usually mean the system got more cautious, not more capable.

## Where next

[Hallucination Rate Denominators](/learn/hallucinations/hallucination-rate-denominators) locks down exactly what numerator and denominator you need to state to make metric #3 meaningful, with a worked numeric example of the same headline number flipping by 4x depending purely on definition. From there, [the benchmark tour](/learn/hallucinations/hallucination-benchmarks-tour) shows how public benchmarks each pick a different one of these four families to headline — which is exactly why their numbers don't compare across benchmarks, or to yours.

**Related:** [Hallucination Rate Denominators](/learn/hallucinations/hallucination-rate-denominators) · [Factual vs. Faithfulness Distinction](/learn/hallucinations/factual-vs-faithfulness-distinction) · [Teaching a Model to Say "I Don't Know"](/learn/hallucinations/teaching-models-to-say-i-dont-know) · [Hallucination Evaluation and Benchmarks](/learn/hallucinations/hallucination-evaluation-and-benchmarks) · [Hallucination Risk Factors](/learn/hallucinations/hallucination-risk-factors) · [Deep Dive: A Tour of Hallucination Benchmarks](/learn/hallucinations/hallucination-benchmarks-tour)
