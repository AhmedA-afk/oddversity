---
title: "Cheatsheet: The Mitigation Stack"
track: "hallucinations"
status: live
summary: "The four levers, their techniques, what each fixes, and the default stack per task type — one page to build from."
duration: "6 min read"
---

The build reference for this module. Everything below links back to the full lesson if you need the reasoning — this page is for when you already know the reasoning and want the checklist.

## The four levers

| Lever | Techniques | Fixes | Doesn't fix |
|---|---|---|---|
| **Ground** | Retrieval + "answer only from context" instruction ([grounding fundamentals](/learn/hallucinations/grounding-fundamentals), [RAG pipeline](/learn/hallucinations/rag-grounding-pipeline-impl)) | Fabrication from missing/parametric knowledge, temporal staleness | Bad retrieval, ignored context, contradictory sources — see [why RAG still hallucinates](/learn/hallucinations/why-rag-still-hallucinates) |
| **Constrain** | JSON schema, enums, grammars, closed candidate lists ([constrained generation](/learn/hallucinations/constrained-generation-concept), [structured output decoding](/learn/hallucinations/structured-output-decoding-impl)) | Structural fabrication — invented fields, tool names, package names, plan names | Wrong-but-valid values; truth of content |
| **Prompt** | Permission to say unknown, quote-before-conclude, stated-vs-inferred split, premise check ([prompting patterns](/learn/hallucinations/prompting-patterns-to-reduce-fabrication)) | Sycophancy, leading-prompt fabrication, silent over-extrapolation | Underlying calibration; a strong enough adversarial prompt can still override it |
| **Abstain** | Named fallback string, confidence-gated refusal, escalation | Residual uncertainty after the first three levers | Coverage — every abstention is a question not answered; see [the triangle](/learn/hallucinations/mitigation-tradeoffs-deep-dive) |

**Start here, then measure:** for any new system, apply Ground first (it has the highest fix-to-effort ratio), then add Constrain wherever output feeds a downstream system, then Prompt for the remaining behavioral gaps, then tune Abstain against your actual coverage-faithfulness needs. Don't skip the "then measure" — a stack that looks complete on paper still needs the eval discipline from the next module before you trust it.

## Citation verification, not just citation

A citation instruction alone produces decorative citations — present, correctly formatted, sometimes wrong. Two checks, in order:

1. **Existence check** (cheap): does the cited id correspond to a chunk that was actually retrieved? Catches outright invented ids. See [enforcing citations](/learn/hallucinations/enforcing-citations-impl).
2. **Entailment check** (one model/classifier call per claim): does the cited text actually support the claim next to it? Catches a real citation attached to an unsupported or contradicted claim. See [the citation verification loop](/learn/hallucinations/citation-verification-loop) and [NLI entailment grounding checks](/learn/hallucinations/nli-entailment-grounding-check-impl).

Never ship (1) without (2) for anything customer-facing — see [mitigation antipatterns](/learn/hallucinations/mitigation-antipatterns).

## Three system-prompt recipes

**Strict-RAG** — forecloses parametric fallback:

```text
You must answer using ONLY the information in the documents provided
in this conversation. Do not use any knowledge from your training —
treat the documents as the complete and only source of truth for
this conversation. If a claim isn't directly supported by the
documents, do not include it.
```

**Cite-or-abstain** — closes the "strained partial answer" gap:

```text
For every factual claim, cite the specific document it came from,
like [doc1]. If you cannot find a supporting citation for a claim,
do not make the claim — instead respond: "I don't have enough
information to answer that."
```

**Premise-check** — verifies the question, not just the answer:

```text
Before answering, identify any factual claims embedded in the
question itself. Check each one against the provided documents. If
an embedded claim is false, unsupported, or contradicted by the
documents, say so explicitly before (or instead of) answering the
rest of the question.
```

Full walkthrough and worked example in [system-prompt grounding recipes](/learn/hallucinations/system-prompt-grounding-recipes).

## Default stack by task type

| Task type | Default stack | Key verification |
|---|---|---|
| Closed doc QA | Strict-RAG + cite-or-abstain | Citation entailment |
| Open web QA | Corrective RAG (grade + re-query) | Cross-source agreement |
| Code generation | Constrained syntax + package-index lookup | Deterministic index check |
| Agent tool use | Schema-constrained decoding | Confidence-gated escalation |
| Summarization | Explicit faithfulness instruction | Per-sentence entailment vs. source |

Full reasoning for each row in [mitigation by task type](/learn/hallucinations/mitigation-by-task-type).

## Quick decision rules

- **Output feeds a human?** Prioritize Ground + Prompt + citation verification.
- **Output feeds a downstream system or triggers an action?** Prioritize Constrain — a schema failure is cheaper than a wrong action.
- **No bounded source of truth exists (open-ended, creative)?** Skip Ground and Constrain almost entirely — see [when hallucination is desirable](/learn/hallucinations/when-hallucination-is-desirable) — and rely on the task simply not having a factual claim to fabricate.
- **Retrieval precision unverified?** Don't add [corrective RAG's](/learn/hallucinations/corrective-rag-pattern-impl) grading loop yet — measure precision first via [evaluating RAG quality](/learn/rag/evaluating-rag-quality); the loop adds real latency and only pays off once misses are confirmed frequent.
- **Abstention rate climbing?** Check it against usefulness, not just against hallucination rate — see [the triangle](/learn/hallucinations/mitigation-tradeoffs-deep-dive).

**Related:** [The Mitigation Landscape](/learn/hallucinations/mitigation-strategy-landscape), [Mitigation by Task Type](/learn/hallucinations/mitigation-by-task-type), [The Coverage-Faithfulness-Abstention Triangle](/learn/hallucinations/mitigation-tradeoffs-deep-dive), [Mitigation Antipatterns](/learn/hallucinations/mitigation-antipatterns)
