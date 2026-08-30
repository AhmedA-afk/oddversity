---
title: "Implementation: Cross-Checking Across Multiple Models"
track: "hallucinations"
status: live
summary: "A runnable checker that asks two or three model families the same question and flags disagreement as a hallucination signal."
duration: "8 min read"
---

[Ensemble Cross-Checking: Catching Hallucinations Through Disagreement](/learn/hallucinations/ensemble-cross-checking) laid out the fan-out-compare-flag pattern. This lesson builds it: a checker that queries multiple model families instead of resampling one, which turns out to correlate with actual hallucination better than same-model resampling alone.

## What we're building

A `CrossModelChecker` that sends the same prompt to two or three different model families, extracts the comparable claim from each response, and scores agreement. Where [Implementation: A Self-Consistency Hallucination Detector](/learn/hallucinations/self-consistency-detector-impl) varies the random seed on one model, this varies the *source* — which catches a different, often more diagnostic, kind of instability.

## Setup

Three pluggable call functions, one per model family, plus a simple claim-comparison step. No external libraries needed for the version built here.

## Build it

### Step 1: Fan out to independent sources

```python
def call_model_a(prompt: str) -> str: ...  # wire up model family A's SDK
def call_model_b(prompt: str) -> str: ...  # wire up model family B's SDK
def call_model_c(prompt: str) -> str: ...  # wire up model family C's SDK

def fan_out(prompt: str) -> dict[str, str]:
    return {
        "model_a": call_model_a(prompt),
        "model_b": call_model_b(prompt),
        "model_c": call_model_c(prompt),
    }
```

> **Why this step?** Three genuinely different sources, not three calls to the same model. The whole point is independence — if two of the three come from the same underlying weights or training run, they're not adding much beyond what resampling one of them would already tell you.

### Step 2: Extract the comparable claim from each answer

```python
import re

def extract_numeric_or_name_claim(answer: str) -> str:
    # For short factual answers, pull out the part that actually varies —
    # a number, a year, a proper noun — rather than diffing full sentences,
    # which can agree in substance while sharing no exact wording.
    numbers = re.findall(r"\b\d{3,4}\b", answer)
    if numbers:
        return numbers[0]
    words = [w.strip(".,") for w in answer.split() if w[:1].isupper()]
    return words[-1] if words else answer.strip()
```

> **Why this step?** Comparing full prose directly is unreliable — three correct answers can be worded completely differently. Pulling out the one fact that actually matters (a founding year, a name) turns "do these agree" into a simple, checkable comparison. For longer, multi-claim answers, split into sentences first and extract per-claim, same as the atomic-claim step in [Chain-of-Verification](/learn/hallucinations/self-verification-chain-impl).

### Step 3: Compare and flag

```python
from collections import Counter
from dataclasses import dataclass

@dataclass
class CrossCheckResult:
    claims: dict[str, str]
    agreement: bool
    majority_claim: str | None

def cross_check(prompt: str) -> CrossCheckResult:
    responses = fan_out(prompt)
    claims = {model: extract_numeric_or_name_claim(text)
              for model, text in responses.items()}
    counts = Counter(claims.values())
    top_claim, top_count = counts.most_common(1)[0]
    return CrossCheckResult(
        claims=claims,
        agreement=(top_count == len(claims)),   # all sources agree
        majority_claim=top_claim if top_count > 1 else None,
    )
```

> **Why this step?** `agreement` is strict — every source has to match. Anything short of full agreement gets surfaced rather than silently resolved by majority vote, because per [Ensemble Cross-Checking](/learn/hallucinations/ensemble-cross-checking), the right response to disagreement is to investigate, not to just outvote the odd one out.

## Run it

```python
# A fictional company for this example, standing in for real fan-out responses.
result = cross_check("What year was Verdant Robotics Inc. founded, and by whom?")

# Mocked responses:
# model_a: "Verdant Robotics Inc. was founded in 2011 by Elena Marsh."
# model_b: "Verdant Robotics Inc. was founded in 2014 by Elena Marsh and a co-founder."
# model_c: "Founded in 2014, Verdant Robotics Inc. was started by Elena Marsh."

print(result.claims)       # {'model_a': '2011', 'model_b': '2014', 'model_c': '2014'}
print(result.agreement)    # False — model_a is the outlier
print(result.majority_claim)  # '2014'
```

Model A fabricated a founding year that the other two independently agree on. A single self-consistency check on model A alone might not have caught this if model A is *internally* consistent on its wrong answer — the exact stable-but-wrong trap from [Intuition: If It Keeps Changing Its Story, Distrust It](/learn/hallucinations/consistency-implies-reliability). Cross-checking against different sources catches it because model A's error doesn't happen to be shared.

## Harden it

- **Weight by known reliability, don't just count votes.** If one source in your ensemble is known to be weaker on a domain, a raw majority vote can be misled by two weak-but-agreeing sources against one strong outlier.
- **Extract claims per-sentence for longer answers**, not just the single value shown here — reuse the atomic-claim extraction pattern from [self-verification](/learn/hallucinations/self-verification-chain-impl) rather than diffing whole paragraphs.
- **Check what each source actually has access to.** If none of your three models have live internet access, cross-checking gives you agreement among three parametric memories, not agreement with reality — it's still stronger than one model alone, but it's not the same guarantee as an external check.

## Extend it

Combine this with resampling: run each model family N times and compare *distributions* of answers across sources rather than a single call per source — more expensive, but it separates "this model is unstable" from "this model is stable but wrong" more cleanly. The deeper limitation worth sitting with is correlated error: model families trained on overlapping web-scale corpora can share the exact same gap or misconception, in which case every source in your ensemble agrees confidently on the same wrong answer, and agreement alone won't catch that — [Common Mistakes: When Detectors Give False Comfort](/learn/hallucinations/detection-false-comfort) covers this as a specific trap, and it's the same underlying failure mode worked through in [Worked Example: When Self-Verification Rubber-Stamps a Lie](/learn/hallucinations/self-verification-when-it-fails).

**Related:** [Ensemble Cross-Checking: Catching Hallucinations Through Disagreement](/learn/hallucinations/ensemble-cross-checking), [Implementation: A Self-Consistency Hallucination Detector](/learn/hallucinations/self-consistency-detector-impl), [Comparison: Choosing a Detection Method](/learn/hallucinations/detection-methods-compared), [Common Mistakes: When Detectors Give False Comfort](/learn/hallucinations/detection-false-comfort)
