---
title: "Control grounding, citations, and context budgets"
track: "rag"
status: live
summary: "Grounding means constraining an answer to evidence that the system can identify and inspect."
duration: "3 min read"
---

## The short answer

Grounding means constraining an answer to evidence that the system can identify and inspect. A citation is useful only when it points to the evidence that supports the claim. Context budgets force selection: include the most relevant, permitted, fresh evidence and define what happens when evidence is insufficient.

## A grounding contract

Require each factual claim to map to one or more source spans, or return
`insufficient_evidence`. Track source date and access permission. Treat a citation
as a claim-to-evidence link, not a decorative URL list.

## Four examples

### Example A: direct answer

Question: “What is the return window?” Retrieve the policy paragraph and cite its
heading and revision date.

### Example B: synthesis

Two approved documents describe different regions. State the region-specific rule
and cite both; do not merge them into a universal sentence.

### Boundary case: context overflow

Adding every retrieved chunk can push the decisive exception out of attention or
increase cost. Rank, deduplicate, and reserve space for the answer and citations.

### Counterexample: citation laundering

An answer can cite a relevant page while making a claim that page does not support.
Evaluate claim-level entailment or require a quote/span check.

## An illustrative story

A user trusted a response because it had three citations. The first citation
supported the background, the second was stale, and none supported the final
eligibility claim. The review changed “has citations” into “every material claim
has inspectable support.”

## Two ways to see it

### Context view

Budget tokens like an editor budgets a briefing: relevance, diversity, freshness,
and exceptions matter.

### Trust view

The question is not “did the model cite something?” but “can a reviewer follow the
claim back to an authorized source?”

## Hands-on

Build a five-question RAG fixture. For each answer, label supported, partially
supported, contradicted, and unsupported claims. Then cut the context budget in
half and record which evidence disappears.

## Checkpoint

- [ ] Citations point to specific supporting evidence.
- [ ] Insufficient and conflicting evidence have explicit behavior.
- [ ] Context selection considers permission, freshness, and budget.

## What this does not solve

Grounding cannot repair a source that is wrong, biased, or out of date. It makes
the source visible so those problems can be governed.

## Continue, go deeper, apply it

- Continue: Datasets, rubrics, and judges
- Go deeper: Attention and transformers
- Apply it: create a claim-to-source report for a real or synthetic corpus.
