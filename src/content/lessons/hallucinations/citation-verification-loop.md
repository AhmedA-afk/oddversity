---
title: "Worked Example: Verifying That Citations Actually Support Claims"
track: "hallucinations"
status: live
summary: "A citation can point at a real, retrieved passage and still not say what the answer claims it says."
duration: "7 min read"
---

[Enforcing citations](/learn/hallucinations/enforcing-citations-impl) guarantees every sentence points at a real span. It does not guarantee the span *says what the sentence claims it says*. This worked example walks through the gap: a real citation, attached to a claim the cited text actually contradicts.

## The setup

A support bot answers questions about a product warranty from a retrieved policy document:

```text
doc1: "The warranty covers manufacturing defects for 12 months from
purchase, and does not cover accidental damage or normal wear."
```

Question: "Does the warranty cover accidental damage?"

The model, prompted per [enforcing citations](/learn/hallucinations/enforcing-citations-impl), produces:

```text
Yes, the warranty covers accidental damage for up to 12 months from
purchase [doc1].
```

Run this through the existence-only checker from the previous lesson: `doc1` is a real, retrieved document. The citation passes. The answer is exactly backwards — the source says accidental damage is *not* covered — and nothing so far has caught it.

## Step by step

### Step 1: Extract the claim-citation pair

```python
claim = "the warranty covers accidental damage for up to 12 months from purchase"
source_text = "The warranty covers manufacturing defects for 12 months from purchase, and does not cover accidental damage or normal wear."
```

> **Why this step?** Everything downstream operates on this pair, not the whole answer or the whole document — entailment checking works sentence-by-sentence against its specific citation, the same span-level narrowing from [enforcing citations](/learn/hallucinations/enforcing-citations-impl).

### Step 2: Run the existence check (and watch it pass)

```python
def citation_exists(cited_id, available_ids):
    return cited_id in available_ids

citation_exists("doc1", {"doc1"})  # True — but this is the wrong question
```

> **Why this step?** This is the check from [enforcing citations](/learn/hallucinations/enforcing-citations-impl), run here specifically to show its blind spot: it answers "is this a real source" — cheap and necessary, but it says nothing about "does this source support this claim."

### Step 3: Run an entailment check instead

A real system uses a trained NLI model or an LLM-as-judge call for this — the full version is [NLI entailment grounding checks](/learn/hallucinations/nli-entailment-grounding-check-impl) and [LLM-as-judge for faithfulness](/learn/hallucinations/llm-as-judge-for-faithfulness). To show the mechanism without external dependencies, here's a illustrative toy version that catches the specific failure in this example — direct polarity mismatch on the same subject:

```python
NEGATION_MARKERS = {"not", "no", "never", "n't", "without"}

def toy_entailment_check(claim: str, source: str) -> str:
    """Illustrative only — a real check uses a trained NLI model or
    an LLM judge. This catches direct negation mismatches, nothing
    more subtle."""
    claim_tokens = set(tokenize(claim))
    source_tokens = set(tokenize(source))
    shared_subject = claim_tokens & source_tokens - NEGATION_MARKERS

    claim_negated = bool(claim_tokens & NEGATION_MARKERS)
    source_negated = bool(source_tokens & NEGATION_MARKERS)

    if len(shared_subject) < 2:
        return "neutral"  # not clearly about the same thing
    if claim_negated != source_negated:
        return "contradicts"
    return "entails"

toy_entailment_check(claim, source_text)  # "contradicts"
```

> **Why this step?** This is a deliberately narrow stand-in — it only catches "claim says X, source says not-X" on shared vocabulary. A real NLI model or LLM judge catches far more (paraphrase, implication, scope mismatches), but the mechanism is the same: compare the claim against the *content* of its cited span, not just the span's existence.

### Step 4: Act on the result

```python
def verify_citation(claim, source_text):
    verdict = toy_entailment_check(claim, source_text)
    if verdict == "contradicts":
        return "REJECTED", "citation contradicts the claim it's attached to"
    if verdict == "neutral":
        return "FLAGGED", "citation doesn't clearly address the claim"
    return "VERIFIED", None

verify_citation(claim, source_text)
# ("REJECTED", "citation contradicts the claim it's attached to")
```

> **Why this step?** A verified pipeline needs a policy for each verdict, not just a detector. `REJECTED` should block the sentence from shipping the same way a missing citation does in [enforcing citations](/learn/hallucinations/enforcing-citations-impl); `FLAGGED` is a candidate for human review rather than an automatic pass or fail, similar to the escalation trigger in [confidence-gated escalation](/learn/hallucinations/confidence-gated-escalation-impl).

## Where it breaks (and the fix)

The toy checker here works because the failure is a blunt negation flip on shared vocabulary. It would miss:

- **Numeric drift** — a source saying "$10/month" cited next to a claim of "$12/month" shares no negation marker and no vocabulary mismatch; the toy checker calls this `entails`. Fix: add a dedicated numeric-value extraction and comparison step alongside the entailment check, not instead of it — text-level entailment and number-level agreement are different checks.
- **Subtle paraphrase and scope changes** — "covers defects reported within 12 months" cited for a claim of "covers defects for 12 months" is a scope change (reporting window versus coverage window) a keyword-overlap check can't see. This is exactly why production systems use a trained NLI model or an LLM-as-judge instead of a heuristic — see [NLI entailment grounding checks](/learn/hallucinations/nli-entailment-grounding-check-impl).

## Takeaways

- **Citations verify existence, not correctness.** A citation that passes an existence check has told you nothing about whether the cited text supports the claim — that's a separate, necessary check.
- **The check is cheap relative to the failure it prevents.** One entailment call per cited sentence is far cheaper than a user acting on a confidently wrong warranty answer.
- **Automated entailment checking still isn't perfect.** Route `FLAGGED` and low-confidence verdicts to human review rather than treating an automated pass as a final guarantee, especially for anything covered by [guardrails for high-stakes output](/learn/hallucinations/guardrails-for-high-stakes-output).

**Related:** [Fabricated Citations Deep Dive](/learn/hallucinations/fabricated-citations-deep-dive), [Enforcing Citations](/learn/hallucinations/enforcing-citations-impl), [NLI Entailment Grounding Checks](/learn/hallucinations/nli-entailment-grounding-check-impl), [LLM-as-Judge for Faithfulness](/learn/hallucinations/llm-as-judge-for-faithfulness)
