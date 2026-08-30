---
title: "Variants: Choosing Mitigations by Task"
track: "hallucinations"
status: live
summary: "Closed doc QA, open web QA, code generation, agent tool use, and summarization each want a different default mitigation stack."
duration: "8 min read"
---

Every lesson so far in this module gave you a technique. This one gives you a starting point: which combination of techniques to reach for first, given the shape of the task in front of you.

## Closed QA over your own documents

**How it works:** the answer, if it exists, lives entirely inside a known, bounded corpus you control — a policy handbook, a codebase's internal docs, a product knowledge base. Retrieval scope is narrow and well-defined.

**When it wins:** this is the best-case scenario for grounding, because there's no ambiguity about what "the source" even is. Strict grounding plus citation requirements — Recipes 1 and 2 from [system-prompt grounding recipes](/learn/hallucinations/system-prompt-grounding-recipes) — work close to their full potential here.

**Failure mode:** the model answers confidently from parametric memory when the closed corpus simply doesn't cover the question, because "closed" scope doesn't stop the model from reaching outside it unless the prompt says so explicitly.

**Relative cost:** low. One retrieval pass, standard grounding, no need for web fallback or heavy constraint machinery.

**Default stack:** strict-RAG grounding + cite-or-abstain (both from [system-prompt grounding recipes](/learn/hallucinations/system-prompt-grounding-recipes)) + citation verification via [the citation verification loop](/learn/hallucinations/citation-verification-loop). Add [corrective RAG](/learn/hallucinations/corrective-rag-pattern-impl) once you've measured retrieval precision is actually a problem.

## Open web QA

**How it works:** the answer may exist, but not in a corpus you control — it requires live search, and the "right" source is one of many that might disagree with each other.

**When it wins:** questions about current events, changing external facts, or anything explicitly outside your own data. This is closer to what [corrective RAG's](/learn/hallucinations/corrective-rag-pattern-impl) web-search fallback branch was designed for.

**Failure mode:** contradictory sources — two retrieved pages disagree — is far more common here than in a curated internal corpus, hitting the case-3 failure from [why RAG still hallucinates](/learn/hallucinations/why-rag-still-hallucinates) directly. Source recency also matters more: an old page ranking well for relevance can still be factually stale.

**Relative cost:** high. Live retrieval, more sources to reconcile, and a real need for the grading/re-query loop rather than trusting a single pass.

**Default stack:** [corrective RAG](/learn/hallucinations/corrective-rag-pattern-impl) with grading and re-query as a baseline, not an optional add-on, plus explicit source-date awareness for anything touching [temporal hallucination](/learn/hallucinations/knowledge-cutoff-and-temporal-hallucination). Citation is still required, but expect to surface multiple, possibly conflicting sources rather than a single clean answer.

## Code generation

**How it works:** the model produces source code, imports, and often calls out to real packages or APIs that either exist or don't.

**When it wins:** this task has unusually hard, checkable ground truth compared to prose QA — a package either exists on the real package index or it doesn't, a function either exists in the real API or it doesn't. That makes it a strong fit for automated, non-LLM verification, not just prompting.

**Failure mode:** [code hallucination and package slop](/learn/hallucinations/code-hallucination-and-package-slop) — plausible-sounding but nonexistent package names, imported with total confidence, that only fail at install time or runtime.

**Relative cost:** low to moderate — verification against a real package index is a cheap, deterministic check, not a model call.

**Default stack:** constrained decoding for syntax validity, plus a deterministic post-generation check against the real package index — see [detecting package slop](/learn/hallucinations/detecting-package-slop-impl) — rather than relying on the model to "know" which packages are real. Grounding helps less here than the other task types, because the ground truth (does this package exist) is better checked mechanically than retrieved and read.

## Agent tool use

**How it works:** the model selects tools and fills in arguments that trigger real actions — API calls, database writes, financial transactions.

**When it wins:** any task where the model needs to act on live systems rather than just describe them. The stakes of a fabricated argument are categorically different here than in QA, because a hallucinated `customer_id` doesn't just misinform a reader — it can trigger a wrong real-world action.

**Failure mode:** [tool-call hallucination](/learn/hallucinations/tool-call-hallucination) and [tool-call argument fabrication](/learn/hallucinations/tool-call-argument-fabrication) — inventing a plausible argument value, an argument name that doesn't match the real schema, or calling a tool that doesn't exist.

**Relative cost:** moderate — schema validation is cheap, but building and maintaining the real, current candidate lists (valid customer ids, valid enum values) that make constraint meaningful takes ongoing work.

**Default stack:** schema-constrained decoding is close to mandatory here, not optional — see [structured output decoding](/learn/hallucinations/structured-output-decoding-impl) — because the cost of a malformed-but-executed tool call is asymmetric with the cost of a malformed sentence in a QA answer. Pair with confidence-gated escalation ([confidence-gated escalation](/learn/hallucinations/confidence-gated-escalation-impl)) for any action with real-world consequences.

## Summarization

**How it works:** the model condenses a source document the user already has — the grounding evidence and the task input are the same object.

**When it wins:** in principle this is the easiest grounding case, because there's no retrieval step to get wrong — the entire source is already in context.

**Failure mode:** [summarization hallucination](/learn/hallucinations/summarization-hallucination) and [summarization unfaithfulness](/learn/hallucinations/summarization-unfaithfulness) — extrinsic additions (a detail not in the source) and intrinsic distortions (a detail from the source, stated wrong) both happen even with perfect "retrieval," because the failure isn't about finding the source, it's about faithfully compressing it. The [lost-in-the-middle effect](/learn/hallucinations/context-engineering-for-grounding) is a direct risk for long source documents.

**Relative cost:** low — no retrieval infrastructure needed, but faithfulness checking (does the summary say anything the source doesn't) still requires an entailment-style pass.

**Default stack:** an explicit faithfulness instruction ("do not include any claim not present in the source text") plus a post-hoc entailment check per sentence, the same mechanism as [the citation verification loop](/learn/hallucinations/citation-verification-loop) applied to summary sentences against the full source instead of individual citations.

## Decision table

| Task type | Primary risk | Default first mitigation | Verification step |
|---|---|---|---|
| Closed doc QA | Answering outside the known corpus | Strict-RAG + cite-or-abstain | Citation entailment check |
| Open web QA | Contradictory/stale sources | Corrective RAG (grade + re-query) | Cross-source agreement check |
| Code generation | Fabricated packages/APIs | Constrained syntax + index lookup | Deterministic package-index check |
| Agent tool use | Fabricated arguments triggering real actions | Schema-constrained decoding | Confidence-gated escalation |
| Summarization | Extrinsic/intrinsic distortion | Explicit faithfulness instruction | Per-sentence entailment against source |

## How to choose

Ask two questions about your task. First: **is there a bounded, known source of truth?** Closed QA and summarization have one; open web QA and (partially) agent tool use don't, which is why they need more active verification instead of passive grounding. Second: **does a wrong output take a real-world action, or just inform a reader?** Tool use and code generation both have a "wrong output executes" risk that pure QA and summarization don't, which is why they lean harder on mechanical constraint over prompting alone. Layer stacks from there using [the mitigation cheatsheet](/learn/hallucinations/mitigation-cheatsheet) as the assembled reference, and tune the coverage-faithfulness balance for your specific stakes using [the triangle](/learn/hallucinations/mitigation-tradeoffs-deep-dive).

**Related:** [The Coverage-Faithfulness-Abstention Triangle](/learn/hallucinations/mitigation-tradeoffs-deep-dive), [Mitigation Cheatsheet](/learn/hallucinations/mitigation-cheatsheet), [Corrective and Self-RAG](/learn/hallucinations/corrective-rag-pattern-impl), [Structured Output Decoding](/learn/hallucinations/structured-output-decoding-impl)
