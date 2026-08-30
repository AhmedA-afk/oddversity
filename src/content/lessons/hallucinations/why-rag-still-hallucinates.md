---
title: "Deep Dive: Why RAG Still Hallucinates"
track: "hallucinations"
status: live
summary: "Retrieval can miss, get ignored, contradict itself, or get over-extrapolated — four ways grounded systems still fabricate."
duration: "9 min read"
---

*This is the deferred rigor behind [grounding fundamentals](/learn/hallucinations/grounding-fundamentals) and the [RAG pipeline you just built](/learn/hallucinations/rag-grounding-pipeline-impl). Read it once you have a basic retrieve-then-generate loop working and want to understand precisely why it still produces wrong answers — this is optional depth, not required to use RAG at a basic level.*

## The myth this corrects

"We added RAG, so hallucination is solved" is one of the most common false beliefs in production LLM systems, and it's listed for a reason in [myths about hallucination](/learn/hallucinations/myths-about-hallucination). RAG reduces one specific failure — fabrication from missing knowledge — and does nothing for at least four other ways a grounded answer can still be wrong. Teams that stop measuring after adding retrieval usually discover this the hard way, in production, from a user.

## Four failure modes RAG doesn't fix

### 1. Retrieval misses the answer

The generator is only as good as what it's handed. If the retriever pulls the wrong chunk, the model is now grounded in irrelevant material and — critically — still answers confidently, because nothing in the prompt told it retrieval failed.

Take a query: "What's the refund window for digital goods?" If the retriever surfaces only a general refund-policy chunk that covers physical merchandise ("returns accepted within 30 days"), the model has *a* number in front of it and a strong pull to use it, producing "digital goods can be refunded within 30 days" — a fabricated extension of a real passage to a case it never covered. This is worse than an ungrounded guess in one specific way: it now looks sourced.

### 2. The model ignores context in favor of parametric memory

Grounding doesn't force the model to use the supplied text — it raises the probability that it will. A strong parametric prior can still win. If a retrieved passage says a company's fiscal year starts in April, but the question is phrased in a way that pattern-matches strongly to "fiscal year = calendar year" (the overwhelmingly common case in training data), the model can answer from the prior and quietly ignore the one sentence that contradicts it, especially if that sentence isn't near the top of the context — see [context engineering for grounding](/learn/hallucinations/context-engineering-for-grounding) for why position matters here.

### 3. Context contradicts itself

Real corpora aren't internally consistent. An old pricing page says the plan costs $10/month; a newer page, also retrieved, says $12/month. Nothing in a standard RAG prompt tells the model what to do when two retrieved chunks disagree, so it picks one arbitrarily, or worse, blends them into something in between that matches neither source — a number invented in exactly the way grounding was supposed to prevent, except now it's dressed up with a citation to a real (but contradicted) document.

### 4. The model over-extrapolates beyond the passage

The most subtle failure: the model reasons past what the retrieved text actually says, using it as a jumping-off point instead of a hard boundary. A passage stating "the Enterprise plan includes SSO" gets extended, when asked whether Enterprise includes SCIM provisioning, into "yes, since it includes SSO it also supports SCIM provisioning" — a plausible inference, confidently stated, that the source never made. The citation is real. The claim it's attached to isn't supported by it. This exact gap — a real citation next to an unsupported claim — is what the [citation verification loop](/learn/hallucinations/citation-verification-loop) is built to catch.

## Why grounding narrows but doesn't close the space

The mechanism is the same one from [why models hallucinate](/learn/hallucinations/why-models-hallucinate): generation is next-token prediction conditioned on everything in context, including the model's parametric priors, not literal quotation from a source. Putting a passage in the context window shifts the probability distribution toward tokens consistent with that passage — it doesn't zero out every other possibility. A weak or ambiguous signal from the retrieved text (case 2), a signal that's simply absent for the specific question asked (case 1), a contradictory signal (case 3), or a signal that supports a *nearby* claim rather than the exact one asked (case 4) can all still lose to the model's prior or to plausible-sounding extrapolation.

This is also why "grounded" doesn't imply "faithful" as an automatic guarantee, even though [factual versus faithfulness](/learn/hallucinations/factual-vs-faithfulness-distinction) treats faithfulness as the easier target to hit. Easier to check, not automatic to achieve.

## What actually helps

Each failure mode has a specific answer elsewhere in this module, not a general "try harder" fix:

- Case 1 (bad retrieval) is addressed by grading retrieved chunks before generating and re-querying on a miss — [corrective and self-RAG](/learn/hallucinations/corrective-rag-pattern-impl).
- Case 2 (ignored context) and case 3 (contradictory context) are reduced by how you select, order, and deduplicate what you retrieve — [context engineering for grounding](/learn/hallucinations/context-engineering-for-grounding).
- Case 4 (over-extrapolation with a real citation) is caught by checking that cited text actually entails the claim, not just that the citation exists — [the citation verification loop](/learn/hallucinations/citation-verification-loop).

## Optional depth: measuring it

If you want to quantify how often your specific pipeline hits each of these four modes rather than reason about them in the abstract, [RAG faithfulness metrics](/learn/hallucinations/rag-faithfulness-metrics) and its companion implementation, [RAGAS faithfulness scoring](/learn/hallucinations/ragas-faithfulness-impl), give you a way to score faithfulness directly against retrieved context instead of inferring it from how confident the answer sounds.

**Related:** [Myths About Hallucination](/learn/hallucinations/myths-about-hallucination), [Grounding Fundamentals](/learn/hallucinations/grounding-fundamentals), [Corrective and Self-RAG](/learn/hallucinations/corrective-rag-pattern-impl), [Citation Verification Loop](/learn/hallucinations/citation-verification-loop)
