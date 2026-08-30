---
title: "Context Engineering: Giving the Model the Right Evidence"
track: "hallucinations"
status: live
summary: "Chunk size, ordering, and deduplication decide whether a model actually uses the evidence you gave it — or ignores it."
duration: "7 min read"
---

Retrieval can find the right passage and still produce a hallucination, because *finding* the right passage and *getting the model to actually use it* are different problems. This lesson is about the second one.

## What it is

Context engineering, in the grounding sense, is everything that happens to retrieved evidence between "the retriever found it" and "the model reads it": how big the chunks are, what order they go in, whether duplicates and near-duplicates get collapsed, and where the single most relevant passage sits relative to everything else in the prompt. None of this changes what facts are available. All of it changes whether the model reliably notices and uses them.

## The mental model

Think of the context window as a document the model reads once, under time pressure, and has to answer from. A human skimming a badly organized packet — the key paragraph buried on page 9, the same fact repeated three times in slightly different wording, the most relevant section split awkwardly across two pages — makes exactly the mistakes you'd predict: skips the buried fact, gets confused by the repetition, misses something that got cut mid-sentence. Models make the same class of mistake, and it's been observed clearly enough to have a name: the **lost-in-the-middle effect**, where information placed in the middle of a long context is used less reliably than information at the very start or very end.

## Why it works this way

This connects directly to the mechanism from [why RAG still hallucinates](/learn/hallucinations/why-rag-still-hallucinates): grounding raises the probability of context-consistent tokens, it doesn't guarantee they win. Several context properties change how strong that signal is:

- **Chunk size.** Too small, and a chunk gets cut mid-thought — a sentence stating "the warranty does not cover accidental damage" split so the negation lands in a different chunk than the claim, weakening the signal reaching the model at generation time. Too large, and each chunk carries mostly irrelevant text diluting the one sentence that matters, which is the same dilution problem covered as an antipattern in [mitigation antipatterns](/learn/hallucinations/mitigation-antipatterns).
- **Ordering.** Position affects how strongly the model weights information, independent of relevance score. A highly relevant passage buried in the middle of five chunks competes with the lost-in-the-middle effect on top of just being one voice among several.
- **Deduplication.** Near-duplicate chunks (the same policy fact restated slightly differently across two document versions) don't reinforce each other reliably — they can look like independent corroboration when they're really one fact counted twice, or worse, look like a contradiction if the phrasing differs enough. This is the contradictory-context failure from [why RAG still hallucinates](/learn/hallucinations/why-rag-still-hallucinates) in miniature.

## A concrete example

Query: "Does the enterprise plan include a dedicated account manager?"

Five chunks come back from retrieval, ranked by similarity score, and get dropped into the prompt in that order:

```text
[1] Enterprise plan pricing tiers and annual billing options...
[2] Support ticket response time guarantees for enterprise customers...
[3] Enterprise plan includes a dedicated account manager assigned
    within 5 business days of contract signing.
[4] Enterprise onboarding checklist and typical timeline...
[5] Data residency options available on the enterprise plan...
```

The actual answer is in chunk 3, positioned third of five — squarely in the "middle" zone least reliably attended to. In one run, the model answers based on chunk 2's proximity to the word "support," conflating "response time guarantees" with account management and answering vaguely or incorrectly about assignment timelines instead of confirming the dedicated account manager directly.

Move chunk 3 to the top, ahead of the others, keeping everything else the same:

```text
[1] Enterprise plan includes a dedicated account manager assigned
    within 5 business days of contract signing.
[2] Enterprise plan pricing tiers and annual billing options...
[3] Support ticket response time guarantees for enterprise customers...
...
```

Same underlying evidence, same retrieval result set, different position. With the answer-bearing chunk now at the strongest-attention position, the model reliably reports the direct fact: "Yes — a dedicated account manager is assigned within 5 business days [chunk 1]." Nothing about the *evidence* changed. Its position did.

## Where it shows up

- [RAG faithfulness metrics](/learn/hallucinations/rag-faithfulness-metrics) measure exactly this gap — whether an answer is faithful to *retrieved* context, which context ordering directly affects.
- [Corrective and self-RAG](/learn/hallucinations/corrective-rag-pattern-impl)'s grading step can double as a reordering signal: rank retrieved chunks by grader-assigned relevance and reorder before generation, not just before deciding whether to re-query.
- [Summarization hallucination](/learn/hallucinations/summarization-hallucination) is affected by the same dynamics when summarizing long source documents — a key caveat late in a long document is exactly the case the lost-in-the-middle effect predicts will get dropped.

## Watch out for

- **Assuming a similarity-score ranking is the right presentation order.** The order that's best for retrieval scoring (most similar first) isn't automatically the order that's best for the model's attention — reordering the top result to a privileged position (start or end) is a separate decision from ranking it highest.
- **Treating "we retrieved the right chunk" as the finish line.** A correctly retrieved chunk that gets lost in the middle of a crowded prompt produces the same wrong answer as a chunk that was never retrieved at all — from the user's perspective, indistinguishable failures.
- **Deduplicating too aggressively.** Collapsing near-duplicate chunks can also collapse a real distinction (an old price and a new price look like duplicates on a naive similarity check) — pair deduplication with the contradiction-detection instinct from [why RAG still hallucinates](/learn/hallucinations/why-rag-still-hallucinates), not a blind similarity threshold.

## Where next

[The mitigation tradeoffs deep dive](/learn/hallucinations/mitigation-tradeoffs-deep-dive) covers how much context to include at all — more retrieved chunks generally means more coverage but also more dilution risk, a direct tradeoff this lesson's chunking discussion feeds into.

**Related:** [Why RAG Still Hallucinates](/learn/hallucinations/why-rag-still-hallucinates), [Implementation: A RAG Grounding Pipeline](/learn/hallucinations/rag-grounding-pipeline-impl), [RAG Faithfulness Metrics](/learn/hallucinations/rag-faithfulness-metrics), [Mitigation Antipatterns](/learn/hallucinations/mitigation-antipatterns)
