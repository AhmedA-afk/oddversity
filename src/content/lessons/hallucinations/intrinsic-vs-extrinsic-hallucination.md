---
title: "Intrinsic vs. Extrinsic Hallucination"
track: "hallucinations"
status: live
summary: "Intrinsic errors contradict the input directly and are checkable on the spot; extrinsic errors add content the input can't confirm or deny."
duration: "6 min read"
---

Some hallucinations you can catch with nothing but the text already sitting in the context window. Others you can't catch no matter how carefully you reread that same text, because the fabricated part was never addressed by it at all. That split — checkable from the input, or not — is the intrinsic/extrinsic axis.

## What it is

**Intrinsic hallucination**: the output directly contradicts something stated in the input. The input and the output disagree, and you can prove it by pointing at both.

**Extrinsic hallucination**: the output adds content that has no counterpart in the input at all — not confirmed, not denied, just absent. You can't point at the contradiction, because there's nothing to contradict; there's only a gap the model filled in.

## A source paragraph, two divergent summaries

Source:

> Meridian Health's Q2 patient-visit volume rose 6% year-over-year to 214,000 visits, driven mainly by growth in outpatient clinics. Inpatient admissions were flat. The company did not change its pricing during the quarter.

**Summary 1 (intrinsic):**
> Meridian Health's Q2 patient-visit volume *fell* 6% year-over-year.

Read the source paragraph again. It says "rose." The summary says "fell." Both claims are sitting in front of you; one is the direct negation of the other. No outside knowledge required — a straight text comparison catches this.

**Summary 2 (extrinsic):**
> Meridian Health's Q2 patient-visit volume rose 6% year-over-year, a result the company attributed to its new telehealth partnership announced in March.

The 6% rise is correct — copied straight from the source. The telehealth partnership is not in the source anywhere. It isn't contradicted either; it's just not there. You cannot resolve this claim by rereading the paragraph one more time, because the paragraph is silent on it. Checking it requires going and finding out, separately, whether Meridian announced any such partnership.

## Why intrinsic is easier to catch

Intrinsic contradictions are a closed-book problem: the input is the entire answer key. An entailment model, a careful human, or even a diff-style comparison between claim and source can flag "rose" vs. "fell" without consulting anything else — this is exactly the mechanism behind [NLI-based grounding checks](/learn/hallucinations/grounding-with-source-documents), which score a claim against a source and nothing more.

Extrinsic additions are an open-book problem with no guaranteed book. Confirming or denying the telehealth claim means a fresh retrieval, a web search, or a human who happens to know — and if the fact is obscure enough, there may be no accessible ground truth at all. That asymmetry is why extrinsic hallucination is the harder, costlier failure to detect at scale, even though it often reads as more benign (it doesn't flatly contradict anything).

## Building the 2×2

Cross this axis with [factual vs. faithfulness](/learn/hallucinations/factual-vs-faithfulness-distinction) and most named hallucination types in this module land in a specific cell:

| | Faithfulness (vs. source) | Factual (vs. world) |
|---|---|---|
| **Intrinsic** | Direct contradiction of the source — the "rose"/"fell" flip above. Also the SLA-memo case from the master-axis lesson: unfaithful, and it happens to be factually right. | Only occurs when the source itself is accurate, so contradicting it also means contradicting the world (a stale price sheet the model gets right, but restates as wrong). |
| **Extrinsic** | Any addition ungrounded in the source, by definition — the telehealth claim above. | Whether that same addition is also *true* in the world is a separate question you'd have to check independently. |

One case sits outside this grid on purpose: a claim that's **faithful to a wrong source** — the spec-sheet example from the master-axis lesson — has no divergence from the input to classify at all. The output matches the source exactly. Intrinsic/extrinsic only describes hallucinations, and a faithful restatement of a bad source isn't the model hallucinating; it's a source-quality problem sitting one layer upstream.

## Where next

[This worked example](/learn/hallucinations/same-output-two-failure-modes) takes one wrong answer and shows it can land in three different cells of this grid depending only on what was in the context — which is the practical reason every production system needs to log retrieved context alongside outputs, not just the outputs themselves.

**Related:** [The Master Axis: Factual vs. Faithfulness Hallucination](/learn/hallucinations/factual-vs-faithfulness-distinction), [Worked Example: One Wrong Answer, Different Diagnoses](/learn/hallucinations/same-output-two-failure-modes), [Grounding: Constraining Answers to Supplied Sources](/learn/hallucinations/grounding-with-source-documents), [Cheatsheet: A Decision Tree for Classifying Any Hallucination](/learn/hallucinations/taxonomy-decision-tree)
