---
title: "Implementation: NLI Entailment as a Grounding Check"
track: "hallucinations"
status: live
summary: "A small NLI model scores each answer claim against a source sentence as entailed, neutral, or contradicted — cheap and fast."
duration: "8 min read"
---

An LLM judge can tell you whether a claim is supported by a source, but it costs a full model call and a few hundred tokens of reasoning to do it. A natural language inference (NLI) model does a narrower version of the same job — entailed, neutral, or contradicted — in a fraction of the time and cost, using a small model built for exactly this pairwise task.

## What we're building

A `GroundingChecker` that takes a source document and an answer, splits both into sentences and claims, matches each claim to its best candidate source sentence, and runs an NLI classification on the pair. Claims that land as "neutral" or "contradiction" get flagged — neutral means the answer said something the source never supported, contradiction means the answer said something the source actively disagrees with.

## Setup

We'll abstract the NLI model behind one function, `nli_classify(premise, hypothesis)`, standing in for an off-the-shelf cross-encoder NLI model (the kind commonly fine-tuned for entailment classification) that you'd load locally or call through a small hosted endpoint — no LLM tokens involved.

## Build it

### Step 1: Split the source into sentences

```python
import re

def split_sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]

source = ("Returns are accepted within 30 days of delivery for a full refund. "
          "Items must be unworn and in original packaging.")
source_sentences = split_sentences(source)
```

> **Why this step?** NLI models score one premise sentence against one hypothesis at a time — they weren't trained to reason over a whole paragraph as a single premise, so splitting into sentences keeps each comparison inside the model's actual competence.

### Step 2: Extract claims from the answer

```python
def extract_claims(answer: str) -> list[str]:
    # Same atomic-claim discipline as chain-of-verification and LLM-judge —
    # here, sentence-level is usually granular enough.
    return split_sentences(answer)

answer = ("You can return this item within 30 days for a full refund, "
          "and we'll cover the return shipping cost.")
claims = extract_claims(answer)
```

> **Why this step?** A claim that bundles two facts together (as this one does — the return window, and who pays shipping) needs to be checked against the source; if it fails, you want to know it failed on the *shipping* half, which is a case NLI alone won't split further without help. For the version built here, sentence-level is a reasonable granularity to start from.

### Step 3: Match each claim to its best source sentence

```python
def best_matching_source(claim: str, source_sentences: list[str]) -> str:
    # Cheap overlap-based matching, standing in for an embedding-similarity
    # lookup in a real pipeline with many source sentences.
    claim_words = set(claim.lower().split())
    scored = [(len(claim_words & set(s.lower().split())), s) for s in source_sentences]
    return max(scored, key=lambda x: x[0])[1]
```

> **Why this step?** NLI needs a specific premise to test against, not the whole source document. Picking the closest sentence by word overlap (or, better, embedding similarity in a real corpus) narrows the pair down to something the model can actually judge.

### Step 4: Run the NLI check and aggregate

```python
from dataclasses import dataclass

def nli_classify(premise: str, hypothesis: str) -> str:
    # Wire up a real NLI model here, e.g. a cross-encoder fine-tuned for
    # entailment classification. Returns one of: "entailment", "neutral",
    # "contradiction".
    raise NotImplementedError("wire up your NLI model here")

@dataclass
class GroundingResult:
    claim: str
    source_sentence: str
    label: str
    flagged: bool

def check_grounding(answer: str, source: str) -> list[GroundingResult]:
    source_sentences = split_sentences(source)
    results = []
    for claim in extract_claims(answer):
        matched = best_matching_source(claim, source_sentences)
        label = nli_classify(premise=matched, hypothesis=claim)
        results.append(GroundingResult(
            claim=claim, source_sentence=matched, label=label,
            flagged=(label != "entailment"),
        ))
    return results
```

> **Why this step?** Entailment is the only label that means "this claim is actually grounded." Both neutral and contradiction get flagged, because both mean the answer said something the source doesn't back up — the distinction between them matters for what happens next (an extrinsic addition versus an outright factual conflict), but neither one ships unflagged.

## Run it

```python
results = check_grounding(answer, source)
for r in results:
    print(r.claim, "->", r.label)

# "You can return this item within 30 days for a full refund" -> entailment
# "we'll cover the return shipping cost" -> neutral   <- flagged
```

The return-window claim matches the source directly and comes back entailed. The shipping-cost claim is an extrinsic addition — the source never mentions who pays for return shipping — and NLI correctly labels it neutral rather than entailment, catching exactly the failure [LLM-as-Judge for Faithfulness and Factuality](/learn/hallucinations/llm-as-judge-for-faithfulness) caught with a full model call, here for a fraction of the cost.

## Harden it

- **Chunk long claims and sources carefully.** Most NLI models are trained on short sentence pairs; a claim or source sentence that runs long can degrade classification quality — split further if a single sentence bundles multiple facts.
- **Don't trust "neutral" blindly when the source-matching step is weak.** If `best_matching_source` picks a poor match (a large source with no truly relevant sentence), a genuinely true claim can come back neutral just because it was tested against the wrong premise — this is a precision issue worth tracking separately from actual ungrounded claims.
- **Use an LLM judge as a tie-breaker for ambiguous neutral/contradiction calls.** NLI gives you a fast three-way label with no explanation; when a flagged claim needs a human-readable reason before someone acts on it, escalate that one claim to [LLM-as-Judge for Faithfulness and Factuality](/learn/hallucinations/llm-as-judge-for-faithfulness) rather than running every claim through the more expensive judge by default.

**Cost and precision compared to LLM-as-judge:** an NLI model is small, runs in well under a second, and costs no LLM tokens — it's the cheapest check in this module by a wide margin. What you give up is nuance: a three-way label with no reasoning, more sensitive to paraphrase distance between claim and source wording, and no ability to reason about context the way a judge prompt can. The common pattern is NLI as a cheap first-pass filter across every claim, with an LLM judge reserved for the smaller set that NLI flags.

## Extend it

This lesson assumes you already have the right source document in hand — a RAG faithfulness setup. When there's no fixed source to check against and you need to go find evidence for a claim first, that's [Retrieval-Based Fact Checking as Detection](/learn/hallucinations/retrieval-based-factuality-check). And when a flagged claim should trigger a fresh retrieval rather than just a flag, that's the [corrective RAG pattern](/learn/rag/corrective-self-rag) in the mitigation module.

**Related:** [Grounding: Constraining Answers to Supplied Sources](/learn/hallucinations/grounding-with-source-documents), [LLM-as-Judge for Faithfulness and Factuality](/learn/hallucinations/llm-as-judge-for-faithfulness), [Retrieval-Based Fact Checking as Detection](/learn/hallucinations/retrieval-based-factuality-check), [Factual vs. Faithfulness: Two Different Failures](/learn/hallucinations/factual-vs-faithfulness-distinction)
