---
title: "Grounding: Anchoring Answers to Evidence"
track: "hallucinations"
status: live
summary: "Grounding means every claim traces to supplied evidence — the difference between a model reading and a model guessing."
duration: "6 min read"
---

A model answering from its own weights is taking a closed-book exam on a subject it never got to study for your specific question. Grounding is handing it the book and telling it the only acceptable answers are the ones written on the page.

## What it is

Grounding is the discipline of requiring every claim in an answer to trace back to evidence supplied at generation time, rather than recalled from training. That's a stronger claim than "the prompt includes some source text." Loosely pasting a document into context and hoping the model prefers it is not grounding — it's a suggestion the model is free to ignore, and [why RAG still hallucinates](/learn/hallucinations/why-rag-still-hallucinates) covers exactly how often it does.

True grounding is an explicit contract: the model's job for this turn is extraction and synthesis from the supplied material, not recall. [Grounding with source documents](/learn/hallucinations/grounding-with-source-documents) covers the mechanics of writing that contract into a prompt. This lesson is about the property grounding is actually trying to produce — faithfulness to the source — and why it works as a mitigation at all.

## The mental model

Closed-book versus open-book, carried all the way through:

**Closed-book (parametric) answering** means the model responds purely from what got compressed into its weights during training. It has no visibility into your specific facts, your current data, or anything private. This degrades badly on anything specific, recent, or long-tail, and [parametric versus contextual knowledge](/learn/hallucinations/parametric-vs-contextual-knowledge) is the deeper look at why that compression is lossy in exactly the ways that produce confident wrong answers.

**Open-book (grounded) answering** means the actual text is sitting in the context window, and the model is instructed to treat it as the only permissible source. The task shifts from recall — hard, unreliable, no way to check your own memory against ground truth — to reading comprehension, which is a task language models are dramatically more reliable at.

The catch: an open-book exam doesn't guarantee a right answer either. A student with the book in front of them can still misread the page, skip the relevant paragraph, or answer a question the book doesn't actually cover. That's the seed of the next lesson, [why RAG still hallucinates](/learn/hallucinations/why-rag-still-hallucinates) — grounding narrows the failure mode, it doesn't close it.

## Why it works this way

Grounding works because it changes what kind of problem the model is solving. An open-world factual claim ("what's the capital of X," "when did Y happen") has no ground truth sitting in the context window — the model either knows it or it doesn't, and there's no in-context signal to check itself against. That's the situation covered in [no ground truth signal](/learn/hallucinations/no-ground-truth-signal).

A grounded claim is different: the source text *is* the ground truth, and it's right there in the same context as the answer. This converts an open-world factual-accuracy question into a closed, checkable faithfulness question — is this claim consistent with the specific text I was given — which is exactly the axis from [factual versus faithfulness](/learn/hallucinations/factual-vs-faithfulness-distinction). Faithfulness is checkable in ways factual accuracy about the world often isn't, because you don't need external verification — you can compare the claim against the passage sitting three paragraphs above it.

## A concrete example

Question: "How many paid sick days does our policy give new hires in their first year?"

**Ungrounded.** The model has never seen this company's handbook. It produces something plausible and generic: "New hires typically get 5 paid sick days in their first year." Reasonable-sounding, industry-typical, entirely invented for this specific company.

**Grounded.** Retrieve the actual policy section and place it in context:

```text
Section 6.2 — Paid Sick Leave
Employees accrue 1 sick day per month of employment, capped at 8 days
in the first calendar year regardless of hire date.
```

Grounded answer: "New hires accrue 1 sick day per month, capped at 8 days in their first calendar year (Section 6.2)."

Notice what changed isn't just the number — it's the *shape* of the answer. The invented answer is round and generic ("5 days," a flat annual figure). The grounded answer is specific and matches the source's actual structure (accrual rate plus a cap, not a flat number) because the model is now reporting a real mechanism instead of pattern-matching to what sick-leave policies generally look like.

## Where it shows up

Grounding is the mechanism behind most of the practical mitigations in this module:

- [Retrieval-augmented mitigation](/learn/hallucinations/retrieval-augmented-mitigation) automates the step of finding which sources belong in front of the model.
- [Grounding answers with citations](/learn/rag/grounding-answers-with-citations) makes the grounding checkable by a human, not just enforced by a prompt.
- [Temporal hallucination](/learn/hallucinations/knowledge-cutoff-and-temporal-hallucination) is often solved by grounding alone — hand the model today's date and current data, and a knowledge-cutoff problem disappears.
- [Summarization hallucination](/learn/hallucinations/summarization-hallucination) is a grounding problem in miniature: the source document you're summarizing *is* the evidence, and faithfulness means the summary doesn't say anything the source doesn't support.

## Watch out for

- **Pasting source text without an explicit "only from this" instruction.** Without it, the model still blends in parametric knowledge alongside the supplied text. The exact prompt clauses that reduce this are covered in [the RAG grounding pipeline implementation](/learn/hallucinations/rag-grounding-pipeline-impl).
- **Assuming grounded means correct.** Grounding shifts the failure mode from "invented from nothing" to "misread from something real" — a real improvement, but not zero. See [why RAG still hallucinates](/learn/hallucinations/why-rag-still-hallucinates) for the specific ways this goes wrong.
- **Confusing "has a retriever" with "is grounded."** A system that fetches passages but never instructs the model to restrict itself to them isn't meaningfully more grounded than a plain chat model with extra tokens in its context window.

## Where next

[Implementation: A RAG Grounding Pipeline](/learn/hallucinations/rag-grounding-pipeline-impl) builds the retrieve-then-generate loop this lesson describes conceptually. [Why RAG still hallucinates](/learn/hallucinations/why-rag-still-hallucinates) covers the limits before you over-trust the pattern, and [enforcing citations](/learn/hallucinations/enforcing-citations-impl) makes grounding checkable rather than assumed.

**Related:** [Grounding with Source Documents](/learn/hallucinations/grounding-with-source-documents), [Retrieval-Augmented Mitigation](/learn/hallucinations/retrieval-augmented-mitigation), [Factual versus Faithfulness](/learn/hallucinations/factual-vs-faithfulness-distinction), [Parametric versus Contextual Knowledge](/learn/hallucinations/parametric-vs-contextual-knowledge)
