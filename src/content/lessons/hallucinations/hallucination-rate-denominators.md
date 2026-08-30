---
title: "Denominators Matter: Defining Hallucination Rate Precisely"
track: "hallucinations"
status: live
summary: "The same evaluation data can produce hallucination rates from 7% to 32% depending purely on what you divide by."
duration: "7 min read"
---

Two teams both report "4% hallucination rate" for systems that behave nothing alike. One counted wrong claims over all claims made. The other counted wrong answers over the subset of questions it bothered to answer. Same phrase, different math, and the number itself is the least interesting part of either claim — [What to Measure](/learn/hallucinations/what-to-measure-metrics) named this problem; this lesson works the arithmetic until it's impossible to ignore.

## What it is

"Hallucination rate" is not one metric — it's a template with two blanks: a numerator (what counts as a hallucination — a wrong claim? a wrong final answer? a session with at least one bad claim in it?) and a denominator (over what population — every question asked, only the ones actually answered, every atomic claim made, only the high-stakes subset?). Fill in the blanks differently and you get a different, equally defensible-sounding number from the exact same underlying behavior.

## The mental model

Think of it as a funnel, and understand that you can measure a rate at any layer:

```
total questions asked
   -> minus abstentions -> questions actually answered
       -> total atomic claims made across those answers
           -> claims that turn out to be unsupported or false
```

A rate computed at the top of the funnel (all questions) answers "how often does a user encounter fabrication, period." A rate computed further down (claims within answered responses) answers a narrower, usually smaller-looking question: "given that the system attempted an answer and said something, how much of what it said was solid." Both are legitimate. They are not the same number, and neither one is more "correct" than the other — they're correct answers to different questions.

## Why it works this way

Abstentions sit in an ambiguous zone that different stakeholders want scored differently. From a fabrication-risk view, an abstention is a success — nothing false got said. From a helpfulness view, an abstention is a non-answer — nothing got resolved either. Whichever way you fold abstentions into your rate changes the number without changing the system at all, which is exactly why stating the exact definition next to the number is non-negotiable, not a nice-to-have.

## A concrete example

Take one dataset: 100 questions, 20 abstained, 80 answered. Of those 80, 68 are fully correct and 12 contain exactly one unsupported claim (each of those 12 answers has about 3 claims total, so 36 claims across them; the 68 clean answers average 2 claims each, 136 claims). Separately, 20 of the 100 questions are tagged high-stakes, of which 18 got answered and 5 of those 18 contained a hallucination. (This is the exact shape of dataset built step by step in [Building a Golden Hallucination Eval Set](/learn/hallucinations/building-golden-eval-set).)

| Definition | Numerator | Denominator | Rate |
|---|---|---|---|
| Per-question, all traffic | 12 flawed answers | 100 questions asked | **12%** |
| Per-question, answered only | 12 flawed answers | 80 answered | **15%** |
| Per-claim, all claims made | 12 hallucinated claims | 172 total claims (136+36) | **≈7%** |
| Per-question, high-stakes slice only | 5 flawed answers | 18 high-stakes answered | **≈28%** |
| Abstentions counted as failures too | 12 + 20 | 100 questions asked | **32%** |

Same dataset, same system, five numbers ranging from 7% to 32%. The claim-level number looks best because most claims in a flawed answer are still fine — one bad claim doesn't sink the other two. The high-stakes slice looks worst because that's exactly where the aggregate hides risk concentration: a system that's mostly fine on easy questions and disproportionately wrong on the questions that matter most reports a reassuring 12% headline while quietly failing more than a quarter of the traffic you can least afford to get wrong.

## Where it shows up

A vendor pitch reporting "2% hallucination rate" that turns out to be per-claim, over answered-only questions — while what you actually need to know is the per-question rate over *all* traffic, abstentions included, because your users don't experience "claims," they experience answers. Those two numbers can differ dramatically on the same system. Any regulated or safety-relevant deployment should insist on the stratified, high-stakes-slice version specifically, since that's the one an aggregate number is built to hide — the same discipline [Hallucination Evaluation and Benchmarks](/learn/hallucinations/hallucination-evaluation-and-benchmarks) argues for when comparing systems at all.

## Watch out for

- **Comparing two systems' "rates" without confirming matching denominators.** A lower reported number might just mean a stricter abstention policy quietly excluded more hard questions from the count, not that the system hallucinates less.
- **Averaging claim-level and question-level rates as if they're the same unit.** One unsupported claim barely dents a claim-level average and fully counts against a question-level one — mixing them in the same table without labels produces numbers nobody can act on.
- **Publishing only the aggregate and never the risk-tier breakdown.** The 12% headline above is true and also hides a 28% failure rate exactly where it costs the most — see [Teaching a Model to Say "I Don't Know"](/learn/hallucinations/teaching-models-to-say-i-dont-know) for why the abstention slice of this table deserves its own line, not a footnote.

## Where next

[Building a Golden Hallucination Eval Set](/learn/hallucinations/building-golden-eval-set) shows how to construct a dataset tagged well enough that you can compute several of these rates at once, rather than picking one denominator after the fact and hoping it was the right one. [Evaluation Pitfalls](/learn/hallucinations/evaluation-pitfalls) returns to this exact flip-the-number trick later in this module, named as a specific form of benchmark gaming.

**Related:** [What to Measure: Factuality, Faithfulness, and Abstention Metrics](/learn/hallucinations/what-to-measure-metrics) · [Hallucination Evaluation and Benchmarks](/learn/hallucinations/hallucination-evaluation-and-benchmarks) · [Building a Golden Hallucination Eval Set](/learn/hallucinations/building-golden-eval-set) · [Evaluation Pitfalls](/learn/hallucinations/evaluation-pitfalls) · [Teaching a Model to Say "I Don't Know"](/learn/hallucinations/teaching-models-to-say-i-dont-know)
