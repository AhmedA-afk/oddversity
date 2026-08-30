---
title: "Human Evaluation and Annotation Protocols"
track: "hallucinations"
status: live
summary: "Every automated metric here is only as trustworthy as the human labels it was calibrated against, and most teams skip building those rigorously."
duration: "7 min read"
---

An LLM judge is not ground truth. It's an instrument, and every instrument needs calibration against something more trustworthy than itself. This lesson is about building that something: a human annotation process rigorous enough to actually validate an automated metric, rather than just gesturing at "we had a person look at it."

## What it is

A real hallucination annotation task has four parts: **claim-level labels** (not whole-answer verdicts — the same decomposition discipline as the automated scorers in this module), a **written rubric** with worked examples covering the genuinely ambiguous cases, **at least two independent annotators** per item, and an **adjudication step** for disagreements — a third reviewer or a documented tie-breaking rule, not just deferring to whoever's most senior in the room. **Inter-annotator agreement (IAA)** is the health check underneath all of it: how often two independent annotators land on the same label, measured before you trust any label the process produces.

## The mental model

Annotation is a measurement instrument, and instruments get calibrated. High IAA on a rubric means the rubric successfully turned an ambiguous judgment call into something reproducible — two careful people, working independently, land in the same place most of the time. Low IAA means one of two things: the rubric is underspecified, or the underlying judgment genuinely is ambiguous and needs an explicit tie-breaking rule written down, not silence.

## Why it works this way

Hallucination judgments hinge on real edge cases — is this a fair paraphrase or a fabrication? Is this inference something the source obviously intends, or something a reader added? Two careful humans will disagree on exactly these cases without a written rubric to anchor them, and an LLM judge prompted without that same rubric will disagree with both of them in yet a third way. The rubric is what makes "hallucinated" a checkable property instead of a vibe three different reviewers each have their own version of.

## A concrete example

A rubric excerpt for Northbridge's HR-assistant eval (see [Building a Golden Hallucination Eval Set](/learn/hallucinations/building-golden-eval-set)):

- **Rule 1 — Supported.** A claim is supported only if the source states it, or a reader would call the inference obvious and clearly intended — not merely derivable with outside facts. Source: *"the office is closed Dec 24–Jan 1."* Claim: *"the office is closed for New Year's"* → supported (an obvious paraphrase). Claim: *"the office is closed for 9 days"* → not supported unless the source states the count — day-counting is exactly the kind of confident arithmetic a model fabricates around, even when the arithmetic happens to be correct.
- **Rule 2 — Unsupported vs. not-enough-info.** Not-enough-info is for a source that's silent, not one that's contradicted. Treat them as different labels, not the same bucket — see [Hallucination Rate Denominators](/learn/hallucinations/hallucination-rate-denominators) for why collapsing them distorts whatever rate you compute downstream.
- **Rule 3 — Whole-answer label.** An answer's overall label is its worst claim label — one hallucinated claim marks the whole answer as containing a hallucination, even with four other claims fine. This is the claim-vs-question-level distinction from [Hallucination Rate Denominators](/learn/hallucinations/hallucination-rate-denominators), fixed into the rubric explicitly so annotators don't average it away by feel.

**A disagreement, resolved.** Two annotators label the "9 days" claim: one marks it supported, having done the date math themselves and found it correct; the other marks it unsupported, because the source never states a count. Adjudication applies Rule 1 literally: unsupported, regardless of whether the arithmetic happens to check out — the rubric is scoring whether the *model* reliably grounds its claims, not whether it got lucky. This gets written back into the rubric as an explicit addendum, so the next annotator doesn't re-litigate it from scratch.

## Where it shows up

This is the ground truth every automated scorer in this module ultimately answers to. [An LLM-as-Judge Evaluation Harness](/learn/hallucinations/llm-judge-eval-harness-impl) spot-checks its per-claim verdicts against exactly this kind of rubric-driven label, and [Automated RAG Faithfulness Scoring](/learn/hallucinations/ragas-faithfulness-impl)'s own accuracy is only knowable by comparison to the same human process. Without it, "the judge said so" is a closed loop with nothing outside it to check against.

## Watch out for

- **Skipping the written rubric and trusting annotator "common sense."** Common sense varies annotator to annotator on exactly the cases that matter, and you get low agreement with no way to diagnose why — was the task ambiguous, or was the guidance just missing?
- **Using a single annotator per item and calling it ground truth.** One label is one person's judgment call, not the truth. Disagreement between two independent labels is the signal that a case needs adjudication — you only see that signal with at least two.
- **Measuring IAA once and never again.** Rubrics need revision as new edge cases surface, like the "9 days" case above. Re-measure agreement periodically, not as a one-time certification you never revisit.

## Where next

[Evaluating the Detector Itself](/learn/hallucinations/evaluating-your-detector) treats a hallucination detector as a classifier scored against exactly this kind of human-labeled ground truth — the labels built here are what make a detector's precision and recall meaningful numbers rather than a circular argument the detector is making about itself.

**Related:** [Building a Golden Hallucination Eval Set](/learn/hallucinations/building-golden-eval-set) · [Implementation: An LLM-as-Judge Evaluation Harness](/learn/hallucinations/llm-judge-eval-harness-impl) · [Implementation: Automated RAG Faithfulness Scoring](/learn/hallucinations/ragas-faithfulness-impl) · [Deep Dive: Evaluating the Detector Itself](/learn/hallucinations/evaluating-your-detector) · [Hallucination Rate Denominators](/learn/hallucinations/hallucination-rate-denominators)
