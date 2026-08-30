---
title: "Faithfulness Metrics for RAG Systems"
track: "hallucinations"
status: live
summary: "A RAG answer can be exactly on-topic and still hallucinate, because relevance and faithfulness measure completely different things."
duration: "7 min read"
---

A retrieval-augmented system fetches the right document, and the model still invents a detail that isn't in it. The answer reads perfectly on-topic. That gap — right subject, wrong grounding — is the RAG-specific hallucination this lesson gives you a metric for.

## What it is

**Faithfulness** (also called groundedness) is the fraction of an answer's claims that are actually entailed by the retrieved context passed to the model *for that specific call* — not the whole corpus, not "the internet," the exact chunks the generator saw this time. A claim can be true in the world and still unfaithful, if the model never saw the passage that supports it. This is deliberately narrower than factual accuracy: faithfulness audits whether the model used its evidence correctly, which is a different, more mechanical question than whether the evidence itself was right.

**Answer relevance** is a separate axis entirely: does the answer address the question that was actually asked, scored against the *question*, with no reference to the source context at all. A fluent, on-topic, entirely invented answer scores well on relevance and terribly on faithfulness — and a system that only tracks relevance will never notice.

Both sit inside the fuller RAG metric family — retrieval precision and recall, faithfulness, and answer relevance — covered end to end in [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality); this lesson is faithfulness specifically, since it's the metric that functions as RAG's hallucination rate.

## The mental model

Three independent checks, each pointed at a different pair:

| Check | Compares | Answers |
|---|---|---|
| Retrieval precision/recall | retrieved context vs. what was needed | Did the retriever do its job? |
| **Faithfulness** | answer vs. retrieved context | Did the model use what it was given honestly? |
| Answer relevance | answer vs. question | Does the answer address what was asked? |

These three can move independently, which is the RAG-specific instance of the general rule from [What to Measure](/learn/hallucinations/what-to-measure-metrics): a single blended "RAG quality" score hides exactly which stage broke.

## Why it works this way

Retrieval can do everything right and generation can still drift. A model handed a correct, complete chunk can fall back on parametric memory instead of the text in front of it, over-elaborate past what the source actually supports, or blend a real retrieved fact with a plausible-sounding invented specific — this is a large part of why [RAG still hallucinates](/learn/hallucinations/retrieval-augmented-mitigation) even after grounding is in place. Faithfulness is the measurement built specifically to catch that drift, independent of whether retrieval succeeded.

## A concrete example

A support bot retrieves the correct chunk for a cancellation-refund question:

> *"Refund requests must be submitted within 14 days of the cancellation date and apply only to the unused portion of the current billing cycle."*

It generates:

> *"You have 30 days after cancelling to request a refund, and once approved you'll receive it to your original payment method within 5–7 business days."*

Decompose into two claims and check each against the retrieved chunk: "30-day window" is directly contradicted (the chunk says 14), and "5–7 business days to original payment method" doesn't appear anywhere in the chunk — not contradicted, just invented. Faithfulness: 0/2, or **0.0**.

Now score answer relevance: the response is unmistakably about refund timing, addresses the question asked, and reads as confident and complete. By a relevance measure alone — does this answer the question that was asked — it scores high: the response is fluent, on-topic, and reads as complete.

That's the signature case: **high relevance, low faithfulness.** Right topic, wrong grounding, and the metric that's supposed to reassure you (relevance) is the one that stays quiet.

## Where it shows up

Production RAG dashboards that report one aggregate "quality" number instead of faithfulness, relevance, and retrieval metrics side by side make this failure invisible until a user catches it. The fix that closes the loop at generation time — forcing every claim to carry a citation back to its source — is covered in [Grounding Answers with Citations](/learn/rag/grounding-answers-with-citations); this lesson is what you measure to confirm that mechanism is actually working, not just present.

## Watch out for

- **Treating "the answer is relevant" as evidence the pipeline is healthy.** Relevance has no access to the retrieved context at all — a confidently wrong, on-topic answer is the most dangerous failure precisely because it passes a relevance-only check.
- **Scoring faithfulness against the whole corpus instead of the exact chunks passed to that call.** A claim can be true and present *somewhere* in your documents and still be unfaithful, because the model never saw that chunk this time. Faithfulness is call-specific, not corpus-wide.
- **Reading a low faithfulness score as proof the model ignored good context.** It might instead mean retrieval handed the model a stale or wrong chunk that it then faithfully followed — a faithful-but-false answer. Faithfulness alone can't tell "model ignored good context" from "context was bad"; read it alongside retrieval metrics, not in isolation.

## Where next

[Automated RAG Faithfulness Scoring](/learn/hallucinations/ragas-faithfulness-impl) builds exactly the claim-extraction-and-verify scorer this lesson describes, runs it over a small eval set, and compares its output to human faithfulness labels on the same items.

**Related:** [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality) · [Grounding Answers with Citations](/learn/rag/grounding-answers-with-citations) · [Retrieval-Augmented Mitigation](/learn/hallucinations/retrieval-augmented-mitigation) · [What to Measure: Factuality, Faithfulness, and Abstention Metrics](/learn/hallucinations/what-to-measure-metrics) · [Implementation: Automated RAG Faithfulness Scoring](/learn/hallucinations/ragas-faithfulness-impl)
