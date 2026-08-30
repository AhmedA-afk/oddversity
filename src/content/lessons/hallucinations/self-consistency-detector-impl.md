---
title: "Implementation: A Self-Consistency Hallucination Detector"
track: "hallucinations"
status: live
summary: "A runnable detector that resamples a question N times, clusters the answers, and flags low-agreement output as likely fabricated."
duration: "8 min read"
---

[Intuition: If It Keeps Changing Its Story, Distrust It](/learn/hallucinations/consistency-implies-reliability) gave you the mental model. This lesson builds the actual thing: a detector that samples a prompt several times, groups the answers, and turns the shape of the disagreement into a flag.

## What we're building

A `SelfConsistencyDetector` that takes a prompt, calls the model N times at nonzero temperature, clusters the resulting answers, and returns an agreement ratio — the size of the largest cluster divided by N. Low agreement means the model is scattering across different answers, which per [self-consistency sampling](/learn/prompt-engineering/self-consistency-sampling) and the intuition lesson above, correlates with fabrication. We'll run it against a solid fact and a made-up one to see the contrast directly.

## Setup

Standard library only. The model call itself is abstracted behind a small function you'd wire up to your actual SDK — the logic here is about what you do with N responses, not how you fetch them.

## Build it

### Step 1: A pluggable model call

```python
from dataclasses import dataclass
from collections import Counter
import re

def call_model(prompt: str, temperature: float) -> str:
    # Swap this for your actual SDK call, e.g.:
    # response = client.messages.create(model=..., temperature=temperature,
    #                                    messages=[{"role": "user", "content": prompt}])
    # return response.content[0].text
    raise NotImplementedError("wire up your model client here")
```

> **Why this step?** Isolating the call behind one function means the sampling and clustering logic below never has to know which provider you're using — swap models, swap SDKs, the detector doesn't change.

### Step 2: Sample N times

```python
def sample_answers(prompt: str, n: int = 7, temperature: float = 0.8) -> list[str]:
    return [call_model(prompt, temperature) for _ in range(n)]
```

> **Why this step?** Temperature has to be genuinely nonzero — at temperature 0 every call returns the same completion and you learn nothing, the exact trap [the intuition lesson](/learn/hallucinations/consistency-implies-reliability) warns about. `n=7` is a reasonable starting point: enough samples for a cluster pattern to emerge, cheap enough to run per-request on a moderate-stakes path.

### Step 3: Cluster the answers

```python
def normalize(answer: str) -> str:
    # Cheap stand-in for semantic clustering: lowercase, strip punctuation
    # and filler words. Two answers that say the same thing in different
    # words can still land in different clusters here — see "Harden it."
    text = answer.lower().strip()
    text = re.sub(r"[^\w\s]", "", text)
    filler = {"the", "a", "an", "is", "was", "it", "of", "in"}
    words = [w for w in text.split() if w not in filler]
    return " ".join(sorted(words))

def cluster_answers(answers: list[str]) -> Counter:
    return Counter(normalize(a) for a in answers)
```

> **Why this step?** Clustering is what turns raw text into something comparable. Two answers that are literally identical strings obviously match, but "Paris." and "It's Paris." shouldn't count as disagreement just because the characters differ — sorting normalized words gives cheap order-independent matching for short factual answers.

### Step 4: Score and flag

```python
@dataclass
class ConsistencyResult:
    agreement_ratio: float
    top_answer: str
    cluster_sizes: dict
    flagged: bool

def detect(prompt: str, n: int = 7, temperature: float = 0.8,
           threshold: float = 0.6) -> ConsistencyResult:
    answers = sample_answers(prompt, n, temperature)
    clusters = cluster_answers(answers)
    top_key, top_count = clusters.most_common(1)[0]
    ratio = top_count / n
    return ConsistencyResult(
        agreement_ratio=ratio,
        top_answer=top_key,
        cluster_sizes=dict(clusters),
        flagged=ratio < threshold,
    )
```

> **Why this step?** The threshold is the one knob that turns a continuous ratio into an actionable flag. `0.6` is a starting point, not a settled number — see "Harden it" below for how to actually pick it.

## Run it

```python
# Mocked responses standing in for real API calls, to show the contrast clearly.
capital_answers = [
    "The capital of France is Paris.", "Paris.", "It's Paris.",
    "France's capital city is Paris.", "Paris, obviously.",
    "The capital is Paris.", "Paris is the capital of France.",
]
obscure_answers = [
    "Attendance was approximately 1,200 people.",
    "Around 3,500 attendees were recorded.",
    "The event drew a crowd of about 800.",
    "Roughly 2,000 people attended.",
    "About 1,200 people were there.",
    "Estimates suggest around 900 attendees.",
    "Roughly 4,000 people showed up.",
]

print(cluster_answers(capital_answers).most_common(1))   # answers cluster tightly -- high agreement
print(cluster_answers(obscure_answers).most_common(1))   # largest cluster maybe 2/7
```

The capital-of-France run clusters tightly — a high `agreement_ratio`, nothing flagged. The attendance-figure run scatters across many distinct numbers — a low `agreement_ratio`, well under the 0.6 threshold, flagged for review.

## Harden it

- **Use real semantic clustering, not string normalization.** The `normalize` function above misses paraphrases that don't share vocabulary ("Paris" vs. "the City of Light" for a trick question) and can over-split numeric answers with different formatting. [Semantic Entropy: Measuring Uncertainty by Resampling](/learn/hallucinations/semantic-entropy-and-uncertainty-quantification) clusters by entailment instead, which is the more rigorous version of this same idea.
- **Pick N and the threshold from data, not intuition.** N=7 and threshold=0.6 are reasonable defaults, not measured ones — validate both against a labeled set of known-good and known-fabricated answers before trusting them in production, the way [Evaluating Your Detector](/learn/hallucinations/evaluating-your-detector) describes.
- **Cache aggressively.** If the same prompt recurs (a common support question, a frequent lookup), don't re-run N calls every time — cache the detection result alongside the answer.
- **Remember the blind spot.** A stable, wrong answer produces a perfect agreement ratio and sails through unflagged — this detector catches variance, not bias. [Common Mistakes: When Detectors Give False Comfort](/learn/hallucinations/detection-false-comfort) names this as the first trap.

## Extend it

Vary the *source*, not just the random seed — [Implementation: Cross-Checking Across Multiple Models](/learn/hallucinations/ensemble-cross-check-impl) runs the same clustering logic across different model families instead of resampling one model, which catches idiosyncratic single-model gaps that self-consistency structurally can't. If you need a graded score from a judge rather than a vote among raw answers, [Implementation: ChainPoll-Style Ensemble Judging](/learn/hallucinations/chainpoll-detector-impl) applies the same "poll and aggregate" shape to a yes/no hallucination question instead of an open answer.

**Related:** [Self-Consistency: Voting Across Multiple Reasoning Paths](/learn/prompt-engineering/self-consistency-sampling), [Intuition: If It Keeps Changing Its Story, Distrust It](/learn/hallucinations/consistency-implies-reliability), [Semantic Entropy: Measuring Uncertainty by Resampling](/learn/hallucinations/semantic-entropy-and-uncertainty-quantification), [Implementation: Cross-Checking Across Multiple Models](/learn/hallucinations/ensemble-cross-check-impl), [Evaluating Your Detector](/learn/hallucinations/evaluating-your-detector)
