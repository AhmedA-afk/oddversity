---
title: "The Master Axis: Factual vs. Faithfulness Hallucination"
track: "hallucinations"
status: live
summary: "Factual hallucination breaks with the world; faithfulness hallucination breaks with the source — they don't always point the same way."
duration: "7 min read"
---

Two summaries can both be wrong and still be wrong in completely different ways: one might be a perfectly accurate description of the world that betrays the document it was supposed to summarize, and the other might be a perfectly loyal rendering of a document that happens to be lying. Telling those apart is the single most useful skill in this entire track.

## What it is

**Factual hallucination** is a claim that contradicts reality — the actual state of the world, independent of whatever text the model was given. You check it by looking outside the conversation: does the fact hold up against a reliable external source?

**Faithfulness hallucination** is a claim that contradicts (or isn't supported by) the specific source material the model was handed — a document, a retrieved passage, a transcript. You check it by looking only at what was in front of the model: does the output actually follow from that text?

These sound similar, and most everyday hallucinations violate both at once. But they're separable, and the cases where they split are where most classification mistakes happen.

## The mental model

Picture two different exam questions. One is "is this statement true?" — you go check an encyclopedia, a database, reality itself. The other is "did this student accurately paraphrase the passage they were given?" — you go check the passage, and the passage alone. A student can paraphrase a passage perfectly while the passage itself is outdated or wrong. A student can also "correct" the passage using outside knowledge — and get graded down, because that's not what paraphrasing means. Faithfulness grading and truth grading are different rubrics applied to the same answer sheet.

## Why it works this way

A model producing grounded output — a RAG answer, a document summary, a transcript recap — is doing two things that can come apart: drawing on the source it was given, and drawing on everything else it learned in training. When those two bodies of knowledge agree, faithful and factual collapse into the same thing and nobody notices the distinction. When they disagree — because the source is stale, wrong, or simply silent on something the model "knows" from elsewhere — the model has to pick one, and whichever it picks, it fails the other rubric. There's no way to be both faithful to a wrong source and factually correct about the world at the same time; the source and the world have already disagreed before the model ever generates a token.

## A concrete example (shown)

**Example A — factually right, unfaithful.** An internal memo, written months ago and never updated, says: *"Our standard support SLA is 48 hours."* The team quietly moved to a 24-hour SLA last quarter. Asked to summarize the memo, a model answers: *"Support SLA: 24 hours."* That's the actual current policy — factually accurate. It is also not what the memo says, at all. Graded against the document it was asked to summarize, this is a hallucination.

**Example B — faithful, factually wrong.** A spec sheet, never updated after a platform upgrade, says: *"Max upload size: 10MB."* The real system limit today is 25MB. Asked what the spec sheet says the limit is, a model answers: *"10MB."* That's a perfect, faithful read of the document — and wrong about the world.

Same shape of question, same single wrong-sounding number, opposite diagnosis. Example A needs the model corrected toward the document. Example B needs the *document* corrected, not the model — the model did its job.

## Where it shows up

RAG and document-QA systems live and die by faithfulness: their entire pitch is "trust what's in the retrieved passage," so a faithful answer built on a bad passage is a data-quality problem upstream, not a model problem — see [grounding with source documents](/learn/hallucinations/grounding-with-source-documents). Open QA, where there's no source document at all, has nothing to be faithful *to* — the only axis that applies is factual, checked straight against reality, which is why [why models hallucinate](/learn/hallucinations/why-models-hallucinate) frames the open-QA case purely in terms of parametric knowledge gaps. [Summarization hallucination](/learn/hallucinations/summarization-hallucination) is almost always a faithfulness problem in disguise, which is why reviewers who fact-check summaries against the news instead of against the source article keep missing the actual errors.

## Watch out for

- **Grading faithfulness with a factual checker, or vice versa.** A fact-checking tool that queries the live world will happily "pass" Example A and "fail" Example B — exactly backwards from what a faithfulness audit should conclude.
- **Assuming a hallucination-free answer means a bug-free source.** A model can be perfectly faithful to a source that was wrong six months before the conversation happened. Faithfulness isn't a substitute for source hygiene.
- **Skipping straight to "which is worse."** Neither axis is strictly worse — a legal RAG tool that quietly "corrects" a contract using outside knowledge (unfaithful, maybe factual) can be more dangerous than one that faithfully quotes a clause verbatim (faithful, possibly stale).

## Where next

This axis is one half of the picture. The other half — whether an error is *checkable* using only the input, or requires stepping outside it — is [intrinsic vs. extrinsic hallucination](/learn/hallucinations/intrinsic-vs-extrinsic-hallucination), and the two combine into the 2×2 the rest of this module keeps returning to. [A worked example with three diagnoses for one wrong answer](/learn/hallucinations/same-output-two-failure-modes) shows why you can't tell which axis you're on from the output alone.

**Related:** [Intrinsic vs. Extrinsic Hallucination](/learn/hallucinations/intrinsic-vs-extrinsic-hallucination), [Grounding: Constraining Answers to Supplied Sources](/learn/hallucinations/grounding-with-source-documents), [Summarization Hallucination](/learn/hallucinations/summarization-hallucination), [Cheatsheet: A Decision Tree for Classifying Any Hallucination](/learn/hallucinations/taxonomy-decision-tree)
