---
title: "Implementation: Semantic Entropy with Meaning Clustering"
track: "hallucinations"
status: live
summary: "Build semantic entropy end to end: sample, cluster by entailment, compute entropy over clusters, and threshold for escalation."
duration: "8 min read"
---

[Deep Dive: Semantic Entropy, Uncertainty Over Meanings](/learn/hallucinations/semantic-entropy-uncertainty-deep-dive) derives why clustering by meaning fixes naive entropy. This lesson builds the pipeline that actually does it.

## What we're building

A function that takes N sampled answers to the same question, clusters them by bidirectional entailment, computes entropy over the resulting clusters, and returns a threshold decision — separating a case with one dominant meaning from one with several.

## Setup

You need three things: a way to sample N answers (any chat API at temperature > 0), a way to check whether two answers entail each other (a dedicated NLI model or an LLM-judge prompt), and the entropy function from [Entropy and Uncertainty](/learn/maths-foundations/entropy-and-uncertainty):

```python
import math

def entropy_bits(probs: list[float]) -> float:
    return -sum(p * math.log2(p) for p in probs if p > 0)
```

## Build it

### Step 1: Sample N answers

```python
def sample_answers(client, prompt: str, n: int = 8, temperature: float = 0.8) -> list[str]:
    answers = []
    for _ in range(n):
        resp = client.chat.completions.create(
            model="your-model",
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
        )
        answers.append(resp.choices[0].message.content.strip())
    return answers
```

> **Why this step?** A single generation tells you nothing about whether the model's distribution has one dominant answer or several. Resampling is what exposes the shape of that distribution.

### Step 2: Check bidirectional entailment

The production version calls a dedicated NLI model or an LLM-judge prompt ("Does statement A imply statement B, and does B imply A? Answer yes/no for each direction."). Here's a judge-prompt version, and a toy stand-in you can run without any API for testing the pipeline itself:

```python
def bidirectional_entails_llm(judge_client, a: str, b: str) -> bool:
    prompt = (
        f"Statement A: {a}\nStatement B: {b}\n"
        "Does A logically entail B, AND does B entail A "
        "(i.e., do they make the same claim)? Answer only yes or no."
    )
    resp = judge_client.chat.completions.create(
        model="your-judge-model",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
    )
    return resp.choices[0].message.content.strip().lower().startswith("yes")

def bidirectional_entails_toy(a: str, b: str) -> bool:
    """Deterministic stand-in for demos: treat as entailing if they share
    a core content word set above a crude overlap threshold. Never use
    this in production — it's here so the pipeline below is runnable
    without external calls."""
    wa, wb = set(a.lower().split()), set(b.lower().split())
    if not wa or not wb:
        return False
    overlap = len(wa & wb) / len(wa | wb)
    return overlap > 0.35
```

> **Why this step?** This is the step that turns "different wording" into "different meaning, or not" — the entire point of the technique. See [Harden It](#harden-it) for why the model you pick here matters as much as N does.

### Step 3: Cluster greedily

You don't need all O(N²) pairs — check each new answer against one representative from each existing cluster; if it entails that representative (in both directions), join the cluster, otherwise start a new one.

```python
def cluster_by_entailment(answers: list[str], entails_fn) -> list[list[str]]:
    clusters: list[list[str]] = []
    for ans in answers:
        placed = False
        for cluster in clusters:
            representative = cluster[0]
            if entails_fn(ans, representative) and entails_fn(representative, ans):
                cluster.append(ans)
                placed = True
                break
        if not placed:
            clusters.append([ans])
    return clusters
```

> **Why this step?** Greedy clustering against one representative per cluster is O(N·K) entailment checks instead of O(N²) — the difference between checking against a handful of existing clusters and checking against every prior sample individually.

### Step 4: Compute semantic entropy and threshold

```python
def semantic_entropy(answers: list[str], entails_fn) -> dict:
    clusters = cluster_by_entailment(answers, entails_fn)
    n = len(answers)
    probs = [len(c) / n for c in clusters]
    return {
        "num_clusters": len(clusters),
        "cluster_sizes": [len(c) for c in clusters],
        "entropy_bits": entropy_bits(probs),
    }

def should_escalate(result: dict, threshold_bits: float = 0.7) -> bool:
    return result["entropy_bits"] > threshold_bits
```

## Run it

```python
known_fact_samples = [
    "The capital of Australia is Canberra.",
    "Canberra is Australia's capital.",
    "Australia's capital city is Canberra.",
    "It's Canberra.",
    "Canberra, not Sydney, is the capital.",
]

hallucinated_samples = [
    "The festival was founded in 1987.",
    "It started in 2003.",
    "Founded in 1994, I believe.",
    "The exact founding year isn't well documented, but around 1990.",
    "1987 is when it began.",
]

for label, samples in [("known fact", known_fact_samples), ("hallucinated", hallucinated_samples)]:
    result = semantic_entropy(samples, bidirectional_entails_toy)
    print(label, result, "escalate:", should_escalate(result))

# known fact:    low cluster count, entropy near 0 bits      -> escalate: False
# hallucinated:  several clusters, entropy well above zero   -> escalate: True
```

The known-fact set collapses to one cluster — zero entropy, ship it. The hallucinated set fragments into several clusters because the model is guessing a different year each time — high entropy, escalate it. That's the separation this whole pipeline exists to produce.

## Harden it

- **Cache entailment calls.** Pairwise (or greedy per-representative) entailment checks are the expensive part; memoize on the `(a, b)` pair within a request so retries and logging don't re-pay the cost.
- **Pick N deliberately.** 5–10 samples is a reasonable range for most use cases — below that, cluster proportions are too noisy to trust; past roughly 15–20, added samples mostly add cost without materially sharpening the entropy estimate, since you're refining an already-visible split rather than discovering a new one.
- **Choose the entailment model on purpose.** A dedicated NLI cross-encoder is fast and cheap but coarser on subtle non-entailment (numeric near-misses, scope differences); an LLM-judge prompt catches more nuance at higher latency and cost, and inherits its own calibration problems — see [LLM-as-Judge for Faithfulness](/learn/hallucinations/llm-as-judge-for-faithfulness) for what that dependency costs you.
- **Don't flag every open-ended question.** A question that legitimately has many valid answers (opinions, brainstorm requests) will show high semantic entropy for a reason that isn't hallucination. Filter by question type before wiring this into an automatic gate — see [Worked Example: Routing by Uncertainty Score](/learn/hallucinations/uncertainty-in-practice-triage).

## Extend it

Compare cost against plain [self-consistency](/learn/prompt-engineering/self-consistency-sampling): majority-vote self-consistency needs only sampling plus exact or fuzzy string matching, no entailment model, and is far cheaper to run on every request. Start there. Reach for semantic entropy specifically when paraphrase variance is causing false uncertainty flags in a self-consistency check, or when you need the more precise meaning-level signal for a threshold that gates an expensive downstream action — like the abstention gate in [Implementation: Eliciting Abstention Without Retraining](/learn/hallucinations/teaching-abstention-via-prompting-impl), or the routing thresholds in [Worked Example: Routing by Uncertainty Score](/learn/hallucinations/uncertainty-in-practice-triage).

**Related:** [Deep Dive: Semantic Entropy, Uncertainty Over Meanings](/learn/hallucinations/semantic-entropy-uncertainty-deep-dive), [Semantic Entropy: Measuring Uncertainty by Resampling](/learn/hallucinations/semantic-entropy-and-uncertainty-quantification), [Self-Consistency: Voting Across Multiple Reasoning Paths](/learn/prompt-engineering/self-consistency-sampling), [Ensemble Cross-Checking: Catching Hallucinations Through Disagreement](/learn/hallucinations/ensemble-cross-checking), [Worked Example: Routing by Uncertainty Score](/learn/hallucinations/uncertainty-in-practice-triage)
