---
title: "Retrieval-Based Fact Checking as Detection"
track: "hallucinations"
status: live
summary: "Detect hallucination by finding evidence for each claim yourself, rather than checking the answer against a source you already had."
duration: "6 min read"
---

Every technique so far in this module either stays inside the model (self-consistency, self-verification) or checks against a source you already had in hand (NLI grounding, faithfulness judging). Retrieval-based fact checking does neither — it goes and finds the evidence itself, which is what makes it the closest thing in this module to actually checking a claim against the world.

## What it is

Retrieval-based fact checking is the detection-time counterpart of [RAG as hallucination mitigation](/learn/hallucinations/retrieval-augmented-mitigation). Mitigation retrieves sources *before* generation so the model has something to ground its answer in. Detection retrieves evidence *after* generation, specifically to check whether a claim the model already made is actually supported. Same retrieval machinery, opposite point in the pipeline, different question: mitigation asks "what should the model say," detection asks "was what it said true."

This is a genuinely different job from the grounding check in [Implementation: NLI Entailment as a Grounding Check](/learn/hallucinations/nli-entailment-grounding-check-impl). NLI grounding assumes you already have the one correct source document and are checking faithfulness to it — a RAG-answer-matches-its-context problem. Retrieval-based fact checking has no such fixed source; it's checking open-domain factuality, where the first job is finding *any* evidence at all before you can even ask whether the claim is supported.

## The mental model

The pipeline runs in three stages:

1. **Decompose the answer into atomic claims** — the same discipline used throughout this module (chain-of-verification, LLM-judge, NLI), because a claim has to be specific enough to search for.
2. **Query a search index or trusted source for each claim.** This could be a web search, an internal knowledge base, or a curated document store — whatever counts as ground truth for your domain.
3. **Score support**: does the retrieved evidence entail the claim, contradict it, or say nothing relevant at all? This last stage often reuses the same entailment scoring from [NLI Entailment as a Grounding Check](/learn/hallucinations/nli-entailment-grounding-check-impl) or the same claim-by-claim judge prompt from [LLM-as-Judge for Faithfulness and Factuality](/learn/hallucinations/llm-as-judge-for-faithfulness) — retrieval-based checking supplies the *evidence*, and reuses the *scoring* machinery already built elsewhere in this module.

## Why it works this way

This is the only method in this module that introduces genuinely new information the model never had access to at generation time. Self-consistency and self-verification stay entirely inside the model's own outputs. Even an LLM judge, unless it's explicitly given retrieved evidence, is drawing on the same parametric memory the generator used — which is exactly why it can share the generator's blind spots, as [Worked Example: When Self-Verification Rubber-Stamps a Lie](/learn/hallucinations/self-verification-when-it-fails) showed. A retrieval step breaks that shared-memory problem directly, at the cost of needing an actual search index or trusted source to query.

## A concrete example (shown)

Claim extracted from an answer: "The company's headquarters moved to Austin in 2021."

```text
1. Query: "[Company] headquarters Austin move date"
2. Retrieved: a press release stating the move was announced in 2022,
   completed in early 2023.
3. Score: CONTRADICTED — the retrieved evidence gives a different year
   than the claim, on the same specific fact.
```

Compare a second claim from the same answer: "The company was founded by two engineers." A search turns up nothing specific about the founders at all.

```text
1. Query: "[Company] founders"
2. Retrieved: nothing directly addressing who founded the company.
3. Score: UNVERIFIABLE — not the same as false.
```

That second outcome is the important nuance this method carries that the others don't.

## Where it shows up

This is the mechanism behind claim-level factuality benchmarks like the ones covered in [Implementation: A FActScore-Style Eval](/learn/hallucinations/factscore-eval-impl) in Module 6, and it's the core of a production [fact-checking pipeline](/learn/hallucinations/fact-checking-pipelines) that runs before high-stakes output ships.

## Watch out for

- **"Not found" is ambiguous, and treating it as "false" is a real mistake.** A claim can fail to turn up evidence because it's genuinely false, because it's true but too obscure or too recent for your index to cover, or because the search query itself was poorly formed. Collapsing "unsupported" and "contradicted" into one flag loses exactly the distinction that matters for what happens next — this ambiguity gets revisited directly in evaluation, where it complicates measuring a detector's own accuracy.
- **Index coverage and staleness are real limits**, not edge cases — a search index that hasn't been updated recently will confidently fail to verify anything that happened after its cutoff, which compounds with the issues covered in [Knowledge Cutoff and Temporal Hallucination](/learn/hallucinations/knowledge-cutoff-and-temporal-hallucination).
- **Decomposition granularity affects what's even checkable.** A claim that bundles two facts ("founded by two engineers in 2015") can retrieve evidence for one half and nothing for the other — split before you search, not after.

## Where next

[Implementation: NLI Entailment as a Grounding Check](/learn/hallucinations/nli-entailment-grounding-check-impl) covers the entailment-scoring core this method reuses once evidence is in hand. A full production version of this pipeline, including the retry and escalation logic around it, is built out in [Fact-Checking Pipelines Before Output Ships](/learn/hallucinations/fact-checking-pipelines).

**Related:** [RAG as Hallucination Mitigation](/learn/hallucinations/retrieval-augmented-mitigation), [Implementation: NLI Entailment as a Grounding Check](/learn/hallucinations/nli-entailment-grounding-check-impl), [Fact-Checking Pipelines Before Output Ships](/learn/hallucinations/fact-checking-pipelines), [Knowledge Cutoff and Temporal Hallucination](/learn/hallucinations/knowledge-cutoff-and-temporal-hallucination)
